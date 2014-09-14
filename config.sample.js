exports.port = 1234;

// put this on the same partition as the imported
// music collection to avoid unnecessary copying
exports.tempdir = "./tempdir";

// when beets was installed via pip, you may use
// something like this instead:
// exports.binary = "/home/beets/.local/bin/beet";
exports.binary = "beet";
