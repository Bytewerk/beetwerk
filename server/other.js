"use strict";

var fs = require("fs");

// Simple wrapper, that ignores existing folders
exports.mkdir = function(a)
{
	try{fs.mkdirSync(a,function(e){});}catch(e){}
};


// Simple file copy
exports.copy = function(a,b)
{
	fs.writeFileSync(b,fs.readFileSync(a));
};
