#!/bin/bash

# Note for package maintainers:
# This file should be symlinked to your bin directory, eg:
# /usr/bin/beetwerk

# Get the directory of the script file, even if it was symlinked by npm
# Source: http://stackoverflow.com/a/246128
# resolve $src until the file is no longer a symlink
src="${BASH_SOURCE[0]}"
while [ -h "$src" ]; do
	dir="$( cd -P "$( dirname "$src" )" && pwd )"
	src="$(readlink "$src")"

	# if $src was a relative symlink, we need to resolve it relative
	# to the path where the symlink file was located
	[[ $src != /* ]] && src="$dir/$src"
done
dir="$( cd -P "$( dirname "$src" )" && pwd )"


# Find the nodejs binary. It is usually called 'node', except on Debian,
# where it is called 'nodejs'.
node=nodejs
command -v nodejs >/dev/null 2>&1 || node=node


# Start beetwerk
cd "$dir"
$node beetwerk.js
