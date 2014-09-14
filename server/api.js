"use strict";

var pipe = require("./pipe");
var formidable = require("formidable"); // npm install formidable@latest
var path = require("path");
var fs = require("fs");
var cp = require("child_process");

// simple wrapper, that ignores existing folders
function mkdir(a){try{fs.mkdirSync(a,function(e){});}catch(e){}}


// basically one folder per open tab, which consists of:
// client_ip/tab_open_timestamp
function sid_folder(config,req,res,args)
{
	if(!args.sid) res.end();
	
	// create temporary upload folder, if it doesn't exist yet
	var dir = path.join(config.tempdir+"/"+req.connection.remoteAddress);
	mkdir(config.tempdir);
	mkdir(dir);
	dir = path.join(dir+"/"+(args.sid*1));
	mkdir(dir);
	
	// Delete folder, if it still exists after 2 hours
	setTimeout(function()
	{
		cp.exec("rm -r '"+dir+"'", function(){});
	},2 * 3600 * 1000);
	
	return dir;
}


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
		
		// Formidable generates random names during upload.
		// This is good, so we can see which files are finished.
		// For better readability of the beets output, give the
		// files its original names.
		fs.rename(file.path,dir+"/"+file.name,function(e){});
		
		res.end("true");
	});
}

exports.import = function(config, req, res, args)
{
	var dir = sid_folder(config,req,res,args);
	if(!dir) return;
	
	res.end(JSON.stringify(pipe.start(dir, config.binary, ["import","--nocopy",dir])));
}

exports.poll = function(config, req, res, args)
{
	var buffer_id = sid_folder(config,req,res,args);
	res.end(JSON.stringify(pipe.poll(buffer_id, args.version)));
}
exports.send = function(config, req, res, args)
{
	var buffer_id = sid_folder(config,req,res,args);
	res.end(JSON.stringify(pipe.send(buffer_id, args.string)));
}




