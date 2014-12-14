/*
	In this file is basically all terminal i/o that shows up before we send
	anything to beets.
	
*/

/*
	Get the free space from the server, then display the 'well known' vs.
	'exotic' music selection. On timeout, display an error.
*/
function intro()
{
	$("terminal").style.display="block";
	
	xhr("metacfg",function(answer)
	{
		global_tags_cfg = answer;
	});
	
	xhr("df",function(free)
	{
		scrollbar_init();
		
		line("").innerHTML="<h1>beetwerk 0.2</h1>";
		line("Free disk space: "+free);
		line("\n");
		line("So where can we get that true underground shit you're talking about?");
		line("\n");
		line("1. Only from my PC of course");
		line("\tYou'll be able to upload a file or album from your laptop,");
		line("\tphone, tablet, FreeBSD toaster or whatever you are using.");
		line("2. From a secret stream URL");
		line("\tChoose this option to let the server download a song from");
		line("\t").innerHTML+="a <a target='_blank' href='https://rg3.github.io/youtube-dl/supportedsites.html'>youtube-dl compatible</a> website.";
		line("\n");
		line("This page works mostly like a terminal, so you can type the number of your");
		line("selection in the box below. But you may also click it with your mouse.");
		
		global_question_callback = intro_source_selected;
	});
	
	setTimeout(2000,function()
	{
		if(!$("terminal").innerHTML)
			$("terminal").innerHTML="Can't reach the server anymore, maybe your connection is down?";
	});
	
}

function intro_source_selected(val)
{
	check_answer([1,2], val);
	
	line("\n");
	
	if(val == 1) // only from my pc
	{
		intro_upload_start(intro_files_ready);
	}
	
	if(val == 2) // stream URL
	{
		line("").innerHTML="Throw it in the box below and I'll have a look.";
		$("commandline").focus();
		global_question_callback = function(url)
		{
			global_exec_callback = intro_files_ready;
			
			line("Firing up youtube-dl...");
			xhr("ytdl?url="+encodeURIComponent(url), function(answer)
			{
				if(!answer) return line("").innerHTML= "ERROR: Something has gone wrong, please"
					+ "<a href='https://github.com/Bytewerk/beetwerk/issues'>report this.</a>";
				global_process_running = true;
				setTimeout(terminal_poll, 500);
			});
		}
	}
}

function intro_files_ready()
{
	meta_read(function()
	{
		var green = "[32;01m";
		var red = "[31;01m";
		var temp = global_tags_tempfolder;
		if(!temp.length) return line("ERROR: there are no music files in the temp folder!");
		
		
		var has_meta = meta_has_required();
		if(has_meta)
		{
			line("\n");
			line("Current metadata:");
			line("\n");
			meta_print_existing();
		}
		
		
		line("\n");
		if(has_meta) line("What do you want to do now?");
		else line("All files in the music library must be tagged. Choose a method:");
		line("\n");
		
		line("1. Tag manually");
		line("\tYou'll be able to type in all tags manually (existing tags will");
		line("\tbe suggested as default, so you just need to press the enter key).");
		line("\tWhen you're done, you'll go back to this screen and be able to");
		line("\tchoose how to import the files (option (2) or (3)).");
		line("\n");
		line("\tChoose this, if you see that there are wrong or missing tags, or");
		line("\tif you have some exotic tunes like music you made yourself, rare");
		line("\tremixes or full-length DJ sets in one file. Duplicates in the");
		line("\tlibrary will get reported to you.");
		line("\n");
		line("2. Import with semi-automatic tagging "+green+"(recommended)");
		line("\tUse this if the music isn't too exotic (it is on a record label or");
		line("\tfrom Jamendo). beets will either automatically detect the album and");
		line("\tmake sure that all tags are perfect, or present you with a list of");
		line("\talbum candidates that you can choose from.");
		line("\n");
		line("\tIf you know that some tags are wrong (they are listed above), try");
		line("\tfixing them with option (1) first.");
		line("\n");
		
		
		if(has_meta)
		{
			line("3. Just import "+red+"(avoid if possible)");
			line("\tIf you are sure that beets won't find anything (=> exotic music),");
			line("\tyou may use this option to import everything without any further");
			line("\tmodification. Please double-check that you have tagged everything");
			line("\tright (see the metadata listing above). You can fix the tags with");
			line("\toption (1). Duplicates will not get detected!");
			line("\n");
		}
		
		global_question_callback = function(val)
		{
			// verify if the answer is right
			var valid = [1,2];
			if(has_meta) valid.push(3);
			check_answer(valid, val);
			
			if(val == 1) return tagger();
			if(val == 2 || val == 3)
				xhr("import?asis="+1*(val == 3)+"&single="+1*(temp.length==1), function()
			{
				line("Import has been started. Please be patient, this will take some time.");
				
				if(val == 2) $("guide").style.display = "block";
				
				global_exec_callback = function(ret)
				{
					if(!ret) return line("Import was successful \\o/").innerHTML
						+= " (<a href='/'>refresh</a> to upload something else)";
					
					line("The import has failed :(");
					setTimeout(intro_files_ready,0); // clear up the stack
				}
				global_process_running = true;
				setTimeout(terminal_poll, 500);
			});
		};
		
	});
}

function intro_upload_start(callback)
{
	global_upload_callback = callback;
	
	line("").innerHTML="<span class='inline_button'><i>Drag a full album/track here or click the terminal for the dialog!</i></span>";
	
	$("file").style.display="block";
}



