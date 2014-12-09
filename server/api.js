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
	
	cp.execFile("exiftool", ["-json", "-Album", "-Artist",
		"-Track", "-Title","-Genre", "-MIMEType","."],{cwd:dir},
	function(error,stdout,stderr)
	{
		res.end(stdout);
	});
}


