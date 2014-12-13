"use strict";

// Contains all tags of files in the temp folder,
// as spit out by exiftool.
var global_tags_tempfolder = null;

// TODO: move this to the config file, make it accessible by
// the server!

var global_tags_cfg =
{
	album:
	{
		required: ["Artist", "Genre"],
		optional: ["Album", "Year"]
	},
	file:
	{
		required: ["Title"],
		optional: ["Track"]
	}
};

var global_tag_alias_cfg =
{
	"Track" : "Track No. (DON'T CONFUSE WITH TITLE)",
}


function meta_longest_tag()
{
	var cfg = global_tags_cfg;
	var max = 0;
	
	for(var where in cfg)
		for(var req in cfg[where])
			for(var i=0;i<cfg[where][req].length;i++)
				if(cfg[where][req][i].length > max)
					max = cfg[where][req][i].length;
	
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

function meta_write(callback)
{
	xhr("metawrite?tags=" + encodeURIComponent(JSON.stringify(global_tags_tempfolder)), callback);
}

// make sure that tags.length>0 before calling this!
function meta_has_required()
{
	var temp		= global_tags_tempfolder;
	var cfg			= global_tags_cfg;
	
	// iterate over all required fields (album, file)
	// in all temp files and check if one is missing.
	for(var i=0;i<temp.length;i++)
		for(var where in cfg)
			for(var j=0;j<cfg[where]["required"].length;j++)
				if(!temp[i][ cfg[where]["required"][j] ])
					return false;
	
	return true;
}



function meta_print_existing()
{			
	var temp = global_tags_tempfolder;
	var cfg  = global_tags_cfg;
	var long = meta_longest_tag();
	var info = function(tag, file)
	{
		file = file || temp[0];
		
		line("  "+meta_tag_stretch(tag, long)
			+": "+file[tag]);
	};
	
	// album data
	line("> Album Information:");
	for(var req in cfg.album)
		for(var i=0; i<cfg["album"][req].length; i++)
			info(cfg["album"][req][i]);

	// file data
	for(var i=0; i<temp.length;i++)
	{
		var file = temp[i];
		var name = file["SourceFile"].substr(2);
		line("> "+name+":");
		
		for(var req in cfg.file)
			for(var j=0;j<cfg["file"][req].length; j++)
				info(cfg["file"][req][j], file);
	}
}


