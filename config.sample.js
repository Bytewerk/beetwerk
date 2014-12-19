exports.port = 1234;

// put this on the same partition as the imported
// music collection to avoid unnecessary copying
exports.tempdir = "/tempdir/on/same/partition/as/music/collection";

// when beets was installed via pip, you may use
// something like this instead:
// exports.binary = "/home/beets/.local/bin/beet";
exports.binary = "beet";


// Meta tag keys, as in exiftool. The first letter must be
// uppercase.
exports.meta =
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
