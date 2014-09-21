beetwerk
========
drag 'n' drop music import webinterface for hackerspaces based on [beets](https://github.com/sampsyo/beets)


Screenshot
=======
![beetwerk-2014-09-22-disk-space-bold-links](https://cloud.githubusercontent.com/assets/7833187/4350235/3ed5613e-41de-11e4-92c8-0145e2926996.png)

Click [here](https://github.com/Bytewerk/beetwerk/issues/1) for more screenshots.


Features
========
* designed for hackerspaces
* force everyone to use the awesome [beets](https://github.com/sampsyo/beets) music tagger and get a well organized collection
* terminal-like webinterface with clickable links and multiple-choice answers
* no need to share FTP/SSH access for uploading and importing music
* works with pc, phone and tablet browsers
* lightweight code with almost no dependencies
* [simple config](https://github.com/Bytewerk/beetwerk/blob/master/config.sample.js)



Status
========
Beta software. Please make bug reports, in case it crashes.


Requirements
========
* beets with a working configuration (test this!)
* nodejs
* formidable (install with: ```npm install formidable@latest```)
* currently has some hard dependencies on UNIX (rm, df get called). It shouldn't be a problem to port it though, so if anyone needs this on another OS, feel free to fork it and send a pull request.
