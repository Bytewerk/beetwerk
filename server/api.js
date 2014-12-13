"use strict";

var pipe = require("./pipe");
var other = require("./other");
var formidable = require("formidable"); // npm install formidable@latest
var path = require("path");
var fs = require("fs");
var cp = require("child_process");

/*
	--------------------------------------------------------------------
	OTHER FUNCTIONS
	--------------------------------------------------------------------
*/

// basically one folder per open tab, which consists of:
// client_ip/tab_open_timestamp
function sid_folder(config,req,res,args)
{
	if(!args.sid) res.end();
	
	// create temporary upload folder, if it doesn't exist yet
	var dir = path.join(config.tempdir+"/"+req.connection.remoteAddress);
	other.mkdir(config.tempdir);
	other.mkdir(dir);
	dir = path.join(dir+"/"+(args.sid*1));
	other.mkdir(dir);
	
	// Delete folder, if it still exists after 2 hours
	setTimeout(function()
	{
		cp.exec("rm -r '"+dir+"'", function(){});
	},2 * 3600 * 1000);
	
	return dir;
}

function is_tag_in_config(metacfg, tag)
{
	for(var where in metacfg)
		for(var req in metacfg[where])
			for(var i=0;i<metacfg[where][req].length; i++)
				if(tag == metacfg[where][req][i])
					return true;
	return false;
}


/*
	--------------------------------------------------------------------
	API COMMANDS
	--------------------------------------------------------------------
	
	For each possible API command, add a function below with the
	following syntax:
	
	exports.hello = function(config, req, res, args)
	{
		// do stuff here
		res.end('"Hello World!"'); // JSON string!
	};
	
	The above example would get executed, if the browser requested
	the URL /api/hello.
*/


// list free disk space in the temp folder (should be on the same
// partition as the music collection anyway)
exports.df = function(config, req, res, args)
{
	cp.execFile("df", ["-h", "--output=avail", config.tempdir],null,
		function(error,stdout,stderr)
		{
			var data = stdout.split("\n");
			if(!data[1]) return res.end('"unknown"');
			res.end(JSON.stringify(data[1].trim()));
		});
}

// single file upload
exports.upload = function(config, req, res, args)
{
	var dir = sid_folder(config,req,res,args);
	if(!dir) return;
	
	// save the uploaded file
	var form = new formidable.IncomingForm();
	form.uploadDir = dir;
	form.parse(req, function(err, fields, files)
	{
		var file = files.file;
		
		// If the upload has been aborted (eg. by closing the tab),
		// do nothing
		if(!file) return res.end("You r doing it rong!");
		
		// Formidable generates random names during upload.
		// This is good, so we can see which files are finished.
		// For better readability of the beets output, give the
		// files their original names.
		fs.rename(file.path,dir+"/"+file.name,function(e){});
		
		res.end("true");
	});
}

// start "beet import"
exports.import = function(config, req, res, args)
{
	var dir = sid_folder(config,req,res,args);
	if(!dir) return;
	
	res.end(JSON.stringify(pipe.start(dir, config.binary,
		["import","--nocopy",dir])));
}

// poll for new output of "beet import"
exports.poll = function(config, req, res, args)
{
	var buffer_id = sid_folder(config,req,res,args);
	res.end(JSON.stringify(pipe.poll(buffer_id, args.version)));
}

// send a string to the stdin of "beet import"
exports.send = function(config, req, res, args)
{
	var buffer_id = sid_folder(config,req,res,args);
	res.end(JSON.stringify(pipe.send(buffer_id, args.string)));
}

exports.ytdl = function(config, req, res, args)
{
	var dir = sid_folder(config,req,res,args);
	if(!dir) return;
	var url = args.url;
	
	res.end(JSON.stringify(pipe.start(dir, 'youtube-dl',
		["--restrict-filenames", "-x", "-f", "bestaudio/best", args.url], dir)));
}

// try to get the album tag of the files in the temp folder
exports.metaread = function(config, req, res, args)
{
	var dir = sid_folder(config,req,res,args);
	
	// todo: generate this from the new config!
	cp.execFile("exiftool", ["-json", "-Album", "-Artist",
		"-Track", "-Title","-Genre", "-Year", "-MIMEType","."],{cwd:dir},
	function(error,stdout,stderr)
	{
		res.end(stdout);
	});
}

/*
	exiftool:
		M4A : Works (TODO: reimplement, only for m4a!)
	ffmpeg:
		MP3 : Works!
		FLAC: Works!
		OGG : Fails with: Queue input is backward in time
		M4A : Claims the plugin is experimental and converts the track to 128 kbit/s
	vorbiscomment:
		OGG : Works
	
	TODO:
		WMA
*/
exports.metawrite = function(config, req, res, args)
{
	var dir = sid_folder(config,req,res,args);
	var tags = JSON.parse(args.tags);
	
	// exiftool can only write to m4a files. Well, shit...
	// Use ffmpeg instead! write to all files at the same time.
	// 'todo' holds the still-open ffmpeg instances.
	// NOTE: path.basename protects against directory transversal attacks
	var todo = tags.length;
	for(var i=0;i<tags.length;i++)
	{	
		var file = tags[i];
		var name = path.basename(file["SourceFile"]);
		var mime = file["MIMEType"];
		var binary = "";
		var parameters = [];
		var temp_out = null; // some taggers don't allow to change tags in place
		
		
		switch(mime)
		{
			case "video/mp4":
				console.log("STUB: exiftool for m4a");
				// exiftool!
				break;
				
			case "audio/x-ogg":
				binary = "vorbiscomment"
				parameters = ["-q", "-w" ];
				temp_out = "_"+name+".temp";
				for(var tag in file)
					if(is_tag_in_config(config.meta, tag))
						parameters.push("-t "+tag.toUpperCase()+"="+file[tag])
				parameters.push(name, temp_out);
				break;
				
			default: // FLAC, MP3;
				if(["audio/mpeg", "audio/flac"].indexOf(mime) == -1)
					console.log("Warning: don't really know how to handle mime type "
						+mime+" (in file "+name+"). Trying ffmpeg...");
				
				binary = "ffmpeg";
				parameters  = ["-y", "-i", name];
				
				for(var tag in file)
					if(is_tag_in_config(config.meta, tag))
						parameters.push("-metadata", tag.toLowerCase()+"="+file[tag]);
				
				parameters.push(name); // output file
				break;
		}
		
		// debug info
		// console.log("tagging file " + name + ", MIME: "+mime);
		// console.log("\t"+binary+" "+parameters.join(" "));
		
		cp.execFile(binary, parameters, {cwd:dir},
		function(error, stdout, stderr)
		{
			var done = function(error,stdout,stderr)
			{
				todo--;
				if(!todo) res.end("true");
			};
			
			// if there's a temp output file, move it over the original
			if(!temp_out) return done();
			cp.execFile("mv", [temp_out, name], {cwd:dir}, done);
		});
	}
}


exports.metacfg = function(config, req, res, args)
{
	res.end(JSON.stringify(config.meta));
}

