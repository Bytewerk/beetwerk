"use strict";

// TODO: force-kill processes and buffers after
// some time without polling by the client

var cp = require('child_process');


// buffers[id] = {bin: spawn_obj, last_poll_timestamp: ,
//		strings: [], is_running: true|false, exit_code: }
var buffers = {};


exports.start = function(id, command, args)
{
	args = args || [];
		var bin = cp.spawn(command, args,
	{
		// force python to flush stdout all the time
		// http://stackoverflow.com/a/230780
		// https://github.com/sampsyo/beets/issues/923
		env:
		{
			"PYTHONUNBUFFERED": "hey ho, let's go!"
		}
	});
	if(!bin) return false;
	
	bin.stdout.setEncoding('utf8');
	bin.stderr.setEncoding('utf8');
	buffers[id] =
	{
		bin: bin,
		last_poll_timestamp: 0,
		strings: [],
		is_running: true,
		exit_code: -1
	};
	
	
	var buffer_append = function(data)
	{
		buffers[id].strings.push(new Buffer(data).toString('utf8'));
	};
	
	
	bin.stdout.on('data', buffer_append);
	bin.stderr.on('data', buffer_append);
	bin.on('exit', function (code)
	{
		buffers[id].exit_code = code;
		buffers[id].is_running = false;
		
		// push the buffer length one last time
		buffer_append("");
	});
	
	return true;
}

// version is the index in buffers[id].strings
// already seen strings get deleted
// when the program has exited, the buffer[id]
// gets deleted.
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

exports.send = function(id, string)
{
	var buffer = buffers[id];
	if(!buffer || !buffer.is_running || !string)
		return false;
	
	buffer.bin.stdin.write(string);
	return true;
}






