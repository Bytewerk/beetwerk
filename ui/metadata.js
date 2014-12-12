"use strict";

var global_tags_tempfolder = null;

// move this to the config file, make it accessible by
// the server!

var global_tag_cfg =
{
	optional:
	{
		album: ["Year"],
		file:  ["Track"]
	},
	required:
	{
		album: ["Artist", "Album", "Genre"],
		file:  ["Title"]
	}
	
};


function meta_longest_tag()
{
	var cfg = global_tag_cfg;
	var max = 0;
	
	for(var i in cfg) for(var j in cfg[i])
		for(var k=0;k<cfg[i][j].length;k++)
			if(cfg[i][j][k].length > max)
				max = cfg[i][j][k].length;
	
	return max;
}

function meta_tag_stretch(tag, len)
{
	while(tag.length < len) tag+=" ";
	return tag;
}

function meta_read(callback)
{
	xhr("metaread", function(answer)
	{
		// filter for audio files
		var temp = [];
		for(var i=0;i<answer.length;i++)
			if(answer[i]["MIMEType"].indexOf("audio") > -1
				|| answer[i]["MIMEType"] == "video/mp4") // m4a
				temp.push(answer[i]);
		
		// sort by filename
		global_tags_tempfolder = temp.sort(function(a,b)
		{
			return a["SourceFile"].localeCompare(b["SourceFile"]);
		});
		callback();
	});
}

// make sure that tags.length>0 before calling this!
function meta_has_required()
{
	var temp		= global_tags_tempfolder;
	var cfg			= global_tag_cfg;
	var per_album	= cfg.required.album;
	var per_file	= cfg.required.file;
	
	// album data
	for(var i=0; i<per_album.length;i++)
		if(!temp[0][per_album[i]])
			return false;
	
	// file data
	for(var i=0;i<per_file.length;i++)
		for(var j=0;j<temp.length;j++)
			if(!temp[j][per_file[i]])
				return false;
	
	return true;
}



function meta_print_existing()
{			
	var temp = global_tags_tempfolder;
	var cfg  = global_tag_cfg;
	var long = meta_longest_tag();
	var info = function(tag, file)
	{
		file = file || temp[0];
		
		line("  "+meta_tag_stretch(tag, long)
			+": "+file[tag]);
	};
	
	// album data
	line("> Album Information:");
	for(var i=0; i<cfg.required.album.length; i++)
		info(cfg.required.album[i]);
	for(var i=0; i<cfg.optional.album.length; i++)
		info(cfg.optional.album[i]);

	// file data
	for(var i=0; i<temp.length;i++)
	{
		var file = temp[i];
		var name = file["SourceFile"].substr(2);
		line("> "+name+":");
		
		for(var j=0;j<cfg.required.file.length;j++)
			info(cfg.required.file[j], file);
		
		for(var j=0;j<cfg.optional.file.length;j++)
			info(cfg.optional.file[j], file);
	}
}


