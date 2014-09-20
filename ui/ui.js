"use strict";

var global_sid = +new Date();
var global_no_polling = true;
var global_poll_version = 0;

function $(a) {return document.getElementById(a);}

function init()
{
	$("terminal").style.display="block";
	$("file").style.display="block";
	
	scrollbar_init();
}

function xhr(url,callback)
{
	var xhr = new XMLHttpRequest();
	url = "/api/"+url+(url.indexOf("?")>-1?"&":"?")+"sid="+global_sid;
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function()
	{
		if(xhr.readyState != 4) return;
		if(callback) return callback(JSON.parse(xhr.responseText));
	}
	xhr.send();
}


// lazy color replacement for just the colors we need
function colorize(text)
{
	var codes = 
	{
		"[39;49;00m"	: "white",
		"[31;01m"		: "red",
		"[33;01m"		: "yellow",
		"[37m"			: "gray",
		"[36;01m"		: "cyan",
		"[34;01m"		: "rgb(030,107,223)", // blue
		"[32;01m"		: "rgb(000,255,000)", // green
	};
	
	for(var code in codes)
	{
		var color = codes[code];
		
		// all codes are prefixed with the
		// escape character
		while(text.indexOf(""+code)>-1)
		{
			text = text.replace(""+code,
				"<font style='color:"+color+"'>");
			text+= "</font>";
		}
	}
	return text;
}


function line(text, color)
{
	var term = $("terminal");
	
	// only scroll, if the terminal is already scrolled to the bottom!
	// FIXME: doesn't always work
	var dont_scroll =
		term.scrollHeight > term.scrollTop + term.offsetHeight + 15;
	
	var pre = document.createElement("pre");
	pre.appendChild(document.createTextNode(text));
	term.appendChild(pre);
	
	pre.innerHTML = colorize(pre.innerHTML);
	if(color) pre.style.color = color;
	
	// lazy clickable links, should be enough for beet import
	// source: http://stackoverflow.com/a/1500501
	pre.innerHTML = pre.innerHTML.replace(/(https?:\/\/[^\s]+)/g,
		'<a href="$1" target="_blank">$1</a>')
	
	if(!dont_scroll) term.scrollTop = term.scrollHeight
		- term.offsetHeight - 5;
	
	scrollbar_draw();
	return pre;
}

function terminal_poll()
{
	xhr("poll?version="+global_poll_version,function(answer)
	{
		// if we got something just now, try again without waiting
		if(answer != null)
		{
			var lines = answer.string.split('\n');
			for(var i=0;i<lines.length;i++)
				line(lines[i]);
			
			global_poll_version = answer.version;
			if(!answer.is_running) global_no_polling = true;
		}
		if(!global_no_polling)
			setTimeout(terminal_poll, answer ? 0 : 500);
		else
			line("Beet import has finished with status "
				+answer.exit_code+". That's "
				+(answer.exit_code?"bad":"good")+". "
				+ "To import another album, refresh this page!","gray");
	});
}

function terminal_send()
{
	var val = $("commandline").value;
	if(!val) return;
	
	xhr("send?string="+encodeURIComponent(val+'\n'),
		function(answer)
	{
		if(answer) line(val, "purple");
	});
	
	$("commandline").value = "";
}
