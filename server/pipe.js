"use strict";

var cp = require('child_process');

// buffers[id] = {bin: spawn_obj, last_poll_timestamp: ,
//		strings: [], is_running: true|false, exit_code: }
var buffers = {};

// Start a command and fill buffer[id]
exports.start = function(id, command, args /*optional */, working_dir /*optional*/)
{
	// Start the program
	args = args || [];
	
	// console.log("Running: "+command+" "+args.join(" "));
	
	var bin = cp.spawn(command, args,
	{
		// force python to flush stdout all the time
		// http://stackoverflow.com/a/230780
		// https://github.com/sampsyo/beets/issues/923
		env: {"PYTHONUNBUFFERED": true},
		cwd: working_dir || null
	});
	if(!bin) return console.log("ERROR: Running command failed: "+command+" "+args.join(" "));
	
	// Prepare the buffer
	buffers[id] =
	{
		bin: bin,
		last_poll_timestamp: 0,
		strings: [],
		is_running: true,
		exit_code: null
	};
	
	// Write new output to the buffer
	var buffer_append = function(data)
	{
		// console.log("> "+new Buffer(data).toString('utf8'));
		if(!buffers[id]) return;
		buffers[id].strings.push(new Buffer(data).toString('utf8'));
	};
	bin.stdout.setEncoding('utf8');
	bin.stderr.setEncoding('utf8');
	bin.stdout.on('data', buffer_append);
	bin.stderr.on('data', buffer_append);
	
	// Exit handler
	bin.on('exit', function (code)
	{
		// console.log("Program has quit: "+command+ " "+args.join(" "));
		// when the process gets killed via timeout,
		// the exit code is already set
		if(!buffers[id].exit_code)
			buffers[id].exit_code = code;
		buffers[id].is_running = false;
		
		// push the buffer length one last time,
		// so the client will retrieve the exit
		// status
		buffer_append("");
		
		// delete the buffer after 30 seconds,
		// if it still exists
		setTimeout(function()
		{
			delete buffers[id];
		},1000 * 30);
	});
	
	
	// Kill process and delete buffer after 60 minutes
	setTimeout(function()
	{
		if(!buffers[id]) return;
		buffer_append("[31;01m" // red font
			+ "Timeout has been reached, killing process!");
		buffers[id].exit_code = -1;
		bin.kill();
		
	},3600 * 1000);
	
	return true;
}

// Check for new content in buffer[id].
// version: index i of buffers[id].strings[i]
// already seen strings get deleted. when the program has exited,
// the buffer[id] gets deleted.
// The object gets returned only, in case there is something new.
//
// returns: null || {string: '', version: '', is_running: , exit_code: }
exports.poll = function(id, version)
{
	var buffer = buffers[id];
	version = version*1;
	
	if(!buffer || version >= buffer.strings.length || version < 0)
		return null;
	
	var ret =
	{
		string: "",
		version: buffer.strings.length,
		is_running: buffer.is_running,
		exit_code: buffer.exit_code
	};
	
	for(var i=version; i<buffer.strings.length; i++)
	{
		if(typeof buffer.strings[i] == 'undefined') continue;
		ret.string += buffer.strings[i];
		buffer.strings[i] = null; // free up some space
	}
	
	// delete the whole thing if the program has quit
	if(!buffer.is_running) delete buffers[id];
	return ret;
}

// send something to stdin
exports.send = function(id, string)
{
	var buffer = buffers[id];
	if(!buffer || !buffer.is_running || !string)
		return false;
	
	buffer.bin.stdin.write(string);
	return true;
}






