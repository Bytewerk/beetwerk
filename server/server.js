"use strict";

var api = require("./api");
var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");


var types =
{
	".html": "text/html",
	".ico":  "image/x-icon",
	".css":  "text/css",
	".js":   "text/javascript"
};




function static_file(response,filename)
{
	var type = types[path.extname(filename)] || "text/plain";
	
	fs.readFile(filename, "binary", function(err, file)
	{
		if(err)
		{
			response.writeHead(500, {"Content-Type": "text/plain"});
			response.write(err + "\n");
			response.end();
			return;
		}

		response.writeHead(200,{"Content-Type": type});
		response.write(file, "binary");
		response.end();
	});
}


exports.run = function(config)
{	
	// Server main function
	http.createServer(function(req, response)
	{
		var args = url.parse(req.url, true).query;
		var uri = url.parse(req.url).pathname;
		
		// api calls
		var cmd = uri.substr(5);
		if(uri.indexOf("/api/") == 0 && api[cmd])
		{
			response.writeHead(200, {"Content-Type": "application/json"});
			return api[cmd](config, req, response, args);
		}
		
		// normal files (path.basename() to avoid directory transversal)
		var filename = path.join(process.cwd(),'ui',path.basename(uri));
		fs.exists(filename, function(exists)
		{
			if(!exists)
			{
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("You r doing it rong!");
				return response.end();
			}
			if(fs.statSync(filename).isDirectory()) filename += '/index.html';
			static_file(response,filename);
		});
	}).listen(parseInt(config.port, 10));

	console.log("Temporary upload folder: "+config.tempdir);
	console.log("Server started, listening on port "+config.port);
}
