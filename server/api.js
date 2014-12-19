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
	if(!dir) return console.log("error: sid_folder doesn't exist!");
	
	var parameters = [
		"import",
		1*args.asis ? "-A" : "",
		1*args.single ? "-s" : "",
		"--nocopy",
		dir
	];
	
	res.end(JSON.stringify(pipe.start(dir, config.binary,parameters)));
	console.log(config.binary+" "+parameters.join(" "));
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

// get all meta tags (that are listed in the config) for the album
exports.metaread = function(config, req, res, args)
{
	var dir = sid_folder(config,req,res,args);
	var parameters = ["-json"];
	var meta = config.meta;
	for(var where in meta)
		for(var req in meta[where])
			for(var i=0;i<meta[where][req].length;i++)
				parameters.push("-"+meta[where][req][i]);
	parameters.push("-MIMETYPE", ".");
		
	cp.execFile("exiftool", parameters,{cwd:dir},
	function(error,stdout,stderr)
	{
		res.end(stdout);
	});
}

/*
	Tagging with exiftool only works for m4a files,
	and beets can't even read them. New strategy:
	beet import in place with an extra config and database
	in the temp folder, then tag with beets and throw
	away the config and database.
*/
exports.metawrite = function(config, req, res, args)
{	
	// Whoops, the beet default config hasn't been
	// detected yet! try again in a second
	if(!config.beet_default_cfg) return setTimeout(function()
		{exports.metawrite(config, req, res, args);}, 1000);
	
	var dir  = sid_folder(config,req,res,args);
	var temp_lib = dir + "/beets_templibrary.blob";
	
	// Import everything into a temporary beets database
	cp.execFile(config.binary,
	[
		"-c", config.beet_default_cfg,
		"-d", dir,
		"-l", temp_lib, // database
		"import", "-C", // don't copy
		"-A", // don't autotag
		dir
	], null, function(error, stdout, stderr)
	{
		// tag each file with an own beets instance
		var tags = JSON.parse(args.tags); // TODO: catch this
		var todo = tags.length;
		
		for(var i=0;i<tags.length;i++)
		{
			var file = tags[i];
			var name = path.basename(file["SourceFile"]); // no directory transversal
			var parameters = [
				"-c", config.beet_default_cfg,
				"-d", dir,
				"-l", temp_lib,
				"modify",
				"-M", // don't move files
				"-y", // don't ask for confirmation
				"path:"+dir+"/"+name
			];
			
			for(var tag in file) if(is_tag_in_config(config.meta, tag))
			{
				if(tag == "Track" && file[tag].indexOf("/") > -1)
				{
					var pos = file[tag].indexOf("/");
					var track = file[tag].substr(0,pos);
					var tracktotal = file[tag].substr(pos+1);
					parameters.push("track="+track, "tracktotal="+tracktotal);
				}
				else
					parameters.push(tag.toLowerCase()+"="+file[tag]);
			}
			
			cp.execFile(config.binary, parameters, null,
				function(error, stdout, stderr)
			{
				todo--;
				if(todo) return;
				res.end("true");
			});
		}
	});
}




exports.metacfg = function(config, req, res, args)
{
	res.end(JSON.stringify(config.meta));
}

