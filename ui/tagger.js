"use strict";

// FIXME: Year gets lost when choosing default!



/*
	global_tagger_todo[i] =
	{
		// is this tag for all files?
		all_files: false,
		
		// ID from global_tags_tempfolder
		temp_id: 1,
		
		// a tag from the global_tag_cfg structure
		tag: "Title",
		
		is_required: true,
		
		default: "Mechanical Animals"
	}
*/
var global_tagger_todo = [];
var global_tagger_todo_total = 0;
var global_tagger_callback = null;

function tagger_todo_fill()
{
	var temp = global_tags_tempfolder;
	var cfg  = global_tags_cfg;
	var todo = [];
	
	
	for(var i=0;i<temp.length;i++)
		for(var where in cfg)
			for(var req in cfg[where])
				for(var j=0;j<cfg[where][req].length; j++)
	{
		// for album tags, we don't need to add the tag
		// for each file to the todo list, so continue.
		var all_files = (where == "album");
		if(all_files && i) continue;
		var tag = cfg[where][req][j];
		
		todo.push
		({
			"all_files":	all_files,
			"temp_id":		all_files ? null : i,
			"tag":			tag,
			"is_required":	(req == "required"),
			"default":		(temp[i][tag] || "")
		});
	}
	
	global_tagger_todo = todo;
	global_tagger_todo_total = todo.length;
}


function tagger_status()
{
	var todo  = global_tagger_todo.length;
	var total = global_tagger_todo_total;
	
	return "(" + (total - todo) + "/" + total +")";
}

function tagger_next()
{
	var temp = global_tags_tempfolder;
	var next = global_tagger_todo.shift();
	if(!next)
	{
		line("Writing all tags...");
		meta_write(function(answer)
		{
			line("done.");
			intro_files_ready();
		});
		
		return;
	}
	
	
	var tag = global_tag_alias_cfg[next.tag] || next.tag;
	var req = next.is_required ? " (required)" : "";
	var file = next.all_files ? ""
		: ('for "' +temp[next.temp_id]["SourceFile"].substr(2)+'" ');
	var def = " ["+next["default"]+"]" || "";
	
	line(tagger_status()+" "+tag+""+req+" "+file+""+def+":");
	
	global_question_callback = function(input)
	{
		input = input || next["default"] || "";
		if(!input && next.is_required)
			return line("This field is required, please tag it correctly.");
		
		for(var i=0;i<temp.length;i++)
		{
			if(!next.all_files && next.temp_id != i)
				continue;
			
			temp[i][next.tag] = input;
		}
		
		tagger_next();
	}
}

function tagger(callback)
{
	global_tagger_callback = callback;
	tagger_todo_fill();
	line("\n");
	line("Fill out the tagging information by putting new values into the box below.");
	line("Press [RETURN] to use the default value, if there is any.");
	line("\n");
	tagger_next();
	$("commandline").focus();
}
