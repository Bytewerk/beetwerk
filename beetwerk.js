"use strict";

var fs = require("fs");
process.chdir(__dirname); // cd to this file's directory

var server = require("./server/server.js");
var other = require("./server/other.js");


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
if(!config || !config.port || !config.tempdir || !config.binary)
{
	console.log("Your config is broken. THREE VARIABLES, DUDE!"
		+" FIX IT AND TRY AGAIN!");
	console.log("\t"+config_path);
	process.exit(1);
}


server.run(config);
