---
layout: post
title:  "Testing with jshint, jasmine and grunt"
---


I decided it was time I learnt a bit about javascript testing and look into
a few of the tools I'd heard of but didn't know anything about. E.g. node,
grunt, jasmine, travis & jshint. Actually, I already knew a bit about jshint,
since I currently use it to check syntax of javascript files via my editor,
Sublime Text 2.

But to actually test the javascript code itself I wanted to experiment with a
js testing framework and Jasmine seems to be one that gets mentioned a lot.
Since the OME team are already using Travis to test Java, Python and other code
committed to github, I thought I'd try to get Travis to run my javascript tests.


Node, Grunt and jshint
----------------------

A quick google found [this blog post](http://travisjeffery.com/b/2013/09/testing-javascript-projects-with-grunt-jasmine-jshint/)
which was kinda concise but seemed to cover what I wanted.
I started by installing Node.js and the package manager npm using the handy 'install' button at [nodejs.org](http://nodejs.org/)

Now I could use the command line to install grunt, and the grunt command-line tool
as described at [gruntjs.com/getting-started](http://gruntjs.com/getting-started)

    $ npm install grunt
    $ sudo npm install -g grunt-cli     # N.B. needs sudo permissions

Continuing with the same guide, I created a package.json file for /figure/ 

    $ cd figure/
    $ npm init

Then I installed local copies of grunt and jshint, which are automatically
registered in the package.json we just created.

    $ npm install grunt --save-dev
    $ npm install grunt-contrib-jshint --save-dev

Now I created a Gruntfile.js and used the [Gruntfile.js linked from the original blog post](
https://github.com/velesin/jasmine-jquery/blob/master/Gruntfile.js)
as a template.
Since I wasn't ready to run any Jasmine tests just yet, I commented out the
Jasmine parts of the Gruntfile.js and updated the paths to files that I
wanted jshint to parse.

A first run of

    $ grunt test

revealed that I was missing a .jshintrc file under figure/ so I also grabbed this
from [https://github.com/velesin/jasmine-jquery/blob/master/.jshintrc](
https://github.com/velesin/jasmine-jquery/blob/master/.jshintrc) and will
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


Now to set up travis, I added the simple .travis.yml file from the blog above.
Then followed instructions at [docs.travis-ci.com/user/getting-started/](http://docs.travis-ci.com/user/getting-started/)

    $ gem install travis-lint
    $ travis-lint
    Hooray, /Users/wmoore/Desktop/figure/figure/.travis.yml seems to be solid!


I committed all the above changes to a new branch, pushed to
github and opened a new PR: [https://github.com/will-moore/figure/pull/4](https://github.com/will-moore/figure/pull/4).
I found that the Travis build failed due to
version numbers in the package.json file. After these were fixed, the build
ran jshint correctly and failed as above. With those errors fixed and
pushed, the build now passes. Yey!


Jasmine
-------

Now to get started with Jasmine testing. I began by installing the jasmine module for grunt:

    $ npm install grunt-contrib-jasmine

    ...
    Done. Phantomjs binary available at /Users/wmoore/Desktop/figure/figure/node_modules/grunt-contrib-jasmine/node_modules/grunt-lib-phantomjs/node_modules/phantomjs/lib/phantom/bin/phantomjs
    grunt-contrib-jasmine@0.6.4 node_modules/grunt-contrib-jasmine
    ├── es5-shim@2.3.0
    ├── lodash@2.4.1
    ├── rimraf@2.1.4 (graceful-fs@1.2.3)
    ├── chalk@0.4.0 (has-color@0.1.7, ansi-styles@1.0.0, strip-ansi@0.1.1)
    └── grunt-lib-phantomjs@0.4.0 (eventemitter2@0.4.13, semver@1.0.14, temporary@0.0.8, phantomjs@1.9.7-5)


Then I created my first jasmine spec file 'PanelSpec.js' under a new /spec directory.
Initially I created a test that would fail so I could see this locally and on the travis build after pushing.

Now I returned to the /Gruntfile.js that we edited above and uncommented the jasmine lines,
pointing the src list to various js files.
On first running '$ grunt test' I found that I don't have a local copy of jQuery, since the OMERO.figure
app simply loads the copy of jQuery provided by webgateway. With this added, I also found that
I couldn't simply add 'static/figure/3rdparty/*.js' to my src list because various libs here
had dependencies on each other and had to be loaded in a particular order.

After adding jquery, underscore and backbone, in that order, I was still getting warnings on running
the test locally, but the test seemed to work and get the expected error.


    ls25107:figure wmoore$ grunt test
    Running "jshint:all" (jshint) task
    >> 7 files lint free.

    Running "jasmine:src" (jasmine) task
    Testing jasmine specs via PhantomJS

    >> TypeError: 'null' is not an object (evaluating 'text
    >>       .replace') at
    >> static/figure/3rdparty/underscore.js:960 
    >> static/figure/js/figure.js:1433 
    ...
     Panel
       X should have default zoom of 100%
         Expected 100 to be 0. (1)

    1 spec in 0.004s.
    >> 1 failures
    Warning: Task "jasmine:src" failed. Use --force to continue.

    Aborted due to warnings.


At this point I pushed to github to see if I got the same result via Travis, but had
forgotton to use the '--save-dev' flag when doing npm install of jasmine.
After manually updating package.json I pushed again and this time got the [failing
test on Travis as expected](https://travis-ci.org/will-moore/figure/builds/24222023).

Finally I fixed the failing test and now Travis passes.
At this point the PR [https://github.com/will-moore/figure/pull/4](https://github.com/will-moore/figure/pull/4)
 is good to merge!

Now I just have to learn Jasmine testing, so I have started to read this book:
[Jasmine Javascript Testing](http://www.amazon.co.uk/Jasmine-JavaScript-Testing-Paulo-Ragonha-ebook/dp/B00ESX15MW/)
and will hopefully have a good suite of Jasmine tests soon!



