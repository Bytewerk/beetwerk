"use strict";

/*
	TODO: check for required programs:
		exiftool
		youtube-dl (or don't provide the option!)
		ffmpeg
*/


var fs = require("fs");
process.chdir(__dirname); // cd to this file's directory

var server = require("./server/server.js");
var other = require("./server/other.js");
var cp = require("child_process");


// create a default config
var home = process.env.HOME;
var config_path = home+"/.config/beetwerk/config.js";
if(!fs.existsSync(config_path))
{
	other.mkdir(home+"/.config");
	other.mkdir(home+"/.config/beetwerk");
	other.copy("./config.sample.js", config_path);
	console.log("Created the default config!");
}


// Load the config
var config;
try {config = require(config_path);} catch(e){}


// Check if it still has the default settings
if(config && config.tempdir == require("./config.sample").tempdir)
{
	console.log("Please configure your beetwerk installation:");
	console.log("\t"+config_path);
	process.exit(1);
}


// Check if it has been loaded properly
try
{
	config.port;
	config.tempdir;
	config.binary;
	config.meta.album.required;
	config.meta.album.optional;
	config.meta.file.required;
	config.meta.file.optional;
}
catch(e)
{
	console.log("You fucked up the config, dude. Fix it and try again.");
	console.log("\t"+config_path);
	process.exit(1);
}


// In case an exception gets thrown, keep the server running
// and print an error message on the terminal. This probably
// happens, when the network connection goes down.
// Related bug: https://github.com/Bytewerk/beetwerk/issues/4
process.on("uncaughtException", function (e)
{
	console.error("----------------------------------------------");
	console.error(new Date());
	console.error("Unhandled exception, did the network go down?");
	console.error("This is probably related to this bug:")
	console.error("=> http://tinyurl.com/bw-netcrash");
	console.error("Please leave a comment there with the output below.");
	console.error("");
	console.error("Type: " + e.type);
	console.error(e.stack);
	console.error("----------------------------------------------");
});


server.run(config);


// get the default beets config path and add it to the beets config

cp.execFile(config.binary, ["config", "--default", "--path"], null, function(error,stdout,stderr)
{
	config.beet_default_cfg = stdout.split("\n")[1];
	
	if(!config.beet_default_cfg)
	{
		console.error("ERROR: Couldn't find beets default config!");
		console.error("Please report this bug!");
		process.exit();
	}
});






