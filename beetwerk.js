"use strict";

var server = require("./server/server.js");
var fs = require("fs");


// Load the config
var config;
if(!fs.existsSync("./config.js"))
{
	console.log("Config file not found. Please copy 'config.sample.js' to 'config.js',");
	console.log("and adjust all of its two variables to your needs. Then try again.");
	process.exit(1);
}
try{config = require("./config");} catch(e){}
if(!config || !config.port || !config.tempdir)
{
	console.log("Your config is broken. TWO VARIABLES, DUDE! FIX IT AND TRY AGAIN!");
	process.exit(1);
}



server.run(config);
