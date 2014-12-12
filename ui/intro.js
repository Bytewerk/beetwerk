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
		var temp = global_tags_tempfolder;
		if(!temp.length) return line("ERROR: there are no music files in the temp folder!");
		
		
		var has_meta = meta_has_required();
		if(has_meta)
		{
			line("\n");
			line("Existing metadata:");
			line("\n");
			meta_print_existing();
		}
		
		
		// How should we tag this?
		line("\n");
		if(has_meta) line("How do you want to modify the tags listed above?");
		else line("How do you want to tag this?");
		line("\n");
		
		line("1. First manually, then via beets");
		line("\tYou'll be able to type in all tags manually (existing tags will");
		line("\tbe suggested as default, so you just need to press the enter key).");
		line("\tAfter that, the automagic beets tagger will try its best to find");
		line("\ttags in a music database such as musicbrainz or discogs.");
		line("\n");
		line("\tChoose this, if you see that there are wrong or missing tags");
		line("\t(manually add/edit them) and your music isn't too exotic (it");
		line("\tis owned by a record label or is from Jamendo).");
		line("\n");
		line("2. Via beets only");
		line("\tUse this if it is already tagged pretty well and the music isn't");
		line("\ttoo exotic. beets will either automatically detect the album and");
		line("\tmake sure that all tags are perfect, or present you with a list");
		line("\tof album candidates that you can choose from.");
		line("\n");
		line("3. Manually only");
		line("\tFull length DJ-sets in one file, very rare tracks, music you made");
		line("\tyourself and remixes that your cat made go here!");
		line("\n");
		
		if(has_meta)
		{
			line("4. Just import");
			line("\tOnly use this option, if you are one hundred percent sure that");
			line("\teverything was tagged right, possibly because you have produced");
			line("\tthe music yourself.");
			line("\n");
		}
		
		global_question_callback = function(val)
		{
			// verify if the answer is right
			var valid = [1,2,3];
			if(has_meta) valid.push(4);
			check_answer(valid, val);
			
			if(val == 1) tagger(function(){ /* -> beets */});
			if(val == 2) line("todo");
			if(val == 3) tagger(function(){ /* -> beets "use as is" */});
		};
		
	});
}

function intro_upload_start(callback)
{
	global_upload_callback = callback;
	
	line("").innerHTML="<span class='inline_button'><i>Drag a full album/track here or click the terminal for the dialog!</i></span>";
	
	$("file").style.display="block";
}



