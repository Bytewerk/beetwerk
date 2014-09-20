"use strict";

var global_knob_pressed = false;

function scrollbar_draw()
{
	var term	= $("terminal");
	var scroll	= $("scrollbar");
	
	// hide the scrollbar
	if(term.clientHeight == term.scrollHeight)
		return scroll.style.display = "none";
	
	// resize the knob
	var knob_height	= term.clientHeight / term.scrollHeight * scroll.clientHeight;
	if(knob_height<20) knob_height = 20;
	$("knob").style.height = knob_height+"px";
	
	// set the knob position
	$("knob").style.top = scroll.clientHeight * term.scrollTop / term.scrollHeight + "px";
	
	// display the knob
	scroll.style.display = "block";
}

function scrollbar_click(e)
{	
	// get absolute Y-position of the scrollbar
	var scrollbar_top = 0;
	var element = $("scrollbar");
	while(element)
	{
		scrollbar_top += element.offsetTop;
		element = element.offsetParent;
	}
	
	// scroll to the right position
	var term = $("terminal");
	var relative = (e.clientY - scrollbar_top) / $("scrollbar").clientHeight;
	term.scrollTop = term.scrollHeight * relative - term.clientHeight/2;
}

function scrollbar_init()
{
	$("scrollbar").addEventListener("click", scrollbar_click);
	$("scrollbar").addEventListener("mousemove", function(e)
	{
		if(global_knob_pressed) scrollbar_click(e);
	});
	$("knob").addEventListener("mousedown",function()
	{
		global_knob_pressed = true;
	});
	$("knob").addEventListener("mouseup",function()
	{
		global_knob_pressed = false;
	});
}
