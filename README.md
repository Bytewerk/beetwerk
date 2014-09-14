beetwerk
========
drag 'n' drop music import webinterface for hackerspaces based on beets


Screenshot
=======
![2014-09-11-003823_1366x768_scrot](https://cloud.githubusercontent.com/assets/7833187/4255265/2c8f1178-3ab3-11e4-8916-6d474f11e357.png)



Features
========
* designed for hackerspaces
* terminal-like webinterface
* force everyone to use the awesome [beets](https://github.com/sampsyo/beets) music tagger and get a well organized collection
* no need to share FTP/SSH access for uploading and importing music
* works with pc, phone and tablet browsers
* lightweight code with almost no dependencies
* [simple config](https://github.com/Bytewerk/beetwerk/blob/master/config.sample.js)



Status
========
This is barely tested alpha software. Don't leave the server running for too long, because it does not clean up sessions and processes (!) yet. It may also crash (please open bug reports then).


Requirements
========
* beets with a working configuration (test this!)
* nodejs
* formidable (install with: ```npm install formidable@latest```)
* currently has some hard dependencies on UNIX (rm, mkdir etc. get called). It shouldn't be a problem to port it though, so if anyone needs this on another OS, feel free to fork it and send a pull request.
