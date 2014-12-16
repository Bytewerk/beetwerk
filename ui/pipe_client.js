var global_poll_version = 0;
var global_process_running = false;
var global_pipe_callback = null;



// polling stops automatically, when the process isn't running anymore
// and fires the global_pipe_callback
function pipe_client_poll_start(callback)
{	
	if(global_pipe_callback)
		return bug("Previous process didn't exit yet!");
	
	global_process_running = true;
	global_poll_version = 0;
	setTimeout(pipe_client_poll, 500);
	global_pipe_callback = callback;
}


function pipe_client_poll()
{
	xhr("poll?version="+global_poll_version,function(answer)
	{
		// if we got something just now, try again without waiting
		if(answer != null)
		{
			var lines = answer.string.split('\n');
			for(var i=0;i<lines.length;i++)
			{
				// don't show notification from youtube-dl, that it has
				// just deleted the video file (after extracting the audio),
				// because that is just what we want it to do
				if(lines[i].indexOf("(pass -k to keep)") > -1)
					continue;
				line(lines[i]);
			}
			
			global_poll_version = answer.version;
			if(!answer.is_running) global_process_running = false;
		}
		if(global_process_running)
			setTimeout(pipe_client_poll, answer ? 0 : 500);
		else
		{
			var callback = global_pipe_callback;
			global_pipe_callback = null;
			callback(answer.exit_code);
		}
	});
}
