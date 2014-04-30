---
layout: post
title:  "Testing with grunt and node"
date:   
---


I decided it was time I learnt a bit about javascript testing and look into
a few of the tools I'd heard about but didn't know anything about. E.g. node,
grunt, jasmine, travis & jshint. Actually, I already knew a bit about jshint,
since I currently use it to check syntax of javascript files via my editor,
Sublime Text 2.

But to actually test the javascript code itself I wanted to experiment with a
js testing framework and Jasmine seems to be one that gets mentioned a lot.
Since the OME team are already using Travis to test Java, Python and other code
committed to github, I thought I'd try to get Travis to run my javascript tests.

A quick google found this blog post http://travisjeffery.com/b/2013/09/testing-javascript-projects-with-grunt-jasmine-jshint/
which was kinda concise but seemed to cover what I wanted.
I started by installing Node.js and the package manager npm using the handy 'install' button at http://nodejs.org/

Now I could use the command line to install grunt, and the grunt command-line tool
as described at http://gruntjs.com/getting-started

$ npm install grunt
$ sudo npm install -g grunt-cli     # N.B. needs sudo permissions

Continuing with the same guide, I created a package.json file for /figure/ 

$ cd figure/
$ npm init

Then I installed local copies of grunt and jshint, which are automatically
registered in the package.json we just created.

$ npm install grunt --save-dev
$ npm install grunt-contrib-jshint --save-dev

Now I created a Gruntfile.js and used the one linked from the original blog post
https://github.com/velesin/jasmine-jquery/blob/master/Gruntfile.js
as a template.
Since I wasn't ready to run any Jasmine tests just yet, I commented out the
Jasmine parts of the Gruntfile.js and updated the paths to files that I
wanted jshint to parse.

A first run of

$ grunt test

revealed that I was missing a .jshintrc file under figure/ so I also grabbed this
from https://github.com/velesin/jasmine-jquery/blob/master/.jshintrc and will
update if needed later.

Now I find that grunt test of jshint worked and found 3 errors

ls25107:figure wmoore$ grunt test
Running "jshint:all" (jshint) task

   static/figure/js/raphael-rect.js
    136 |            });
                      ^ Don't make functions within a loop.
   static/figure/js/undo.js
    147 |        if (_.size(redo_attrs) == 0) {
                                        ^ Use '===' to compare with '0'.
    163 |                if (i == 0) {
                               ^ Use '===' to compare with '0'.

>> 3 errors in 7 files
Warning: Task "jshint:all" failed. Use --force to continue.

Aborted due to warnings.


Now to set up travis. Added the 

$ gem install travis-lint
$ travis-lint
Hooray, /Users/wmoore/Desktop/figure/figure/.travis.yml seems to be solid!


I committed all the above changes to a new branch, pushed to
github and opened a new PR: https://github.com/will-moore/figure/pull/4
I found that the Travis build failed due to
version numbers in the package.json file. After these were fixed, the build
ran jshint correctly and failed as above. With those errors fixed and
pushed, the build now passes. Yey!





