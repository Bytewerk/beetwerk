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
		line("What kind of music do you wish to import?");
		line("\n");
		line("1. Well known:");
		line("\tA song or an album that has probably already been indexed by");
		line("\tmusic database sites, such as musicbrainz.org and discogs.com.");
		line("\tIn other words, music from a record label or from Jamendo.org.");
		line("\n");
		line("\tWe'll try to match your upload against data on these sites and");
		line("\tadd or correct the metadata (beware, this takes some time).The")
		line("\tpath for your music will be automatically choosen.");
		line("\n");
		line("2. Exotic:");
		line("\tRather unknown tracks or remixes that you have made yourself");
		line("\tor found on YouTube / similar streaming sites, as well as full");
		line("\tDJ-sets that include lots of songs in one file with sick cross-");
		line("\tfades.");
		line("\n");
		line("\tYou'll be able to give the stream URL (youtube-dl compatible) or");
		line("\tupload files. After that you can specify album, artist and path");
		line("\twhere it should be stored.");
		line("\n");
		line("This page works mostly like a terminal, so you can type the number of your");
		line("selection in the box below. But you may also click it with your mouse.");
		
		global_question_callback = intro_type_selected;
	});
	
	setTimeout(2000,function()
	{
		if(!$("terminal").innerHTML)
			$("terminal").innerHTML="Can't reach the server anymore, maybe your connection is down?";
	});
	
}

function intro_type_selected(val)
{
	check_answer([1,2], val);
	
	line("\n");
	
	if(val == 1) // well known
	{
		global_upload_callback = function()
		{
			line("Analyzing and importing music (this may take a few minutes, please be patient)...",
			"rgb(000,255,000)");
			upload_import();
		};
		return intro_upload_start();
	}
	
	if(val == 2) // exotic
	{
		line("So where's that strange unknown music you're talking about?");
		line("1. Stream URL");
		line("2. Upload");
		global_question_callback = intro_exotic_source_selected;
	}
}

function intro_upload_start()
{
	$("file").style.display="block";
	line("").innerHTML="<h2 id='dropsome'>DRAG FILE(S) HERE!</h2>";
	line("(or click to open the upload dialog)");
}

function intro_exotic_source_selected(val)
{
	line("\n");
	line("STUB: This hasn't been implemented yet.");
	check_answer([], val);
	
	//if(val == 2) // upload
	//	return intro_upload_start();
	
}
