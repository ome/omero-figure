OMERO.figure
============

OMERO.web app for creating figures from images in OMERO.

For full details see http://figure.openmicroscopy.org


Requirements
============

* OMERO 4.4.x or OMERO 5.x

Installation
============

Please see instructions at http://figure.openmicroscopy.org


Development
===========

We use Grunt for various tools.
See http://figure.openmicroscopy.org/2014/05/01/testing-with-jshint-jasmine-grunt.html
for an introduction.

Install:

    $ npm install grunt
    $ sudo npm install -g grunt-cli
    $ npm install grunt
    $ npm install grunt-contrib-jshint
    $ npm install grunt-contrib-jasmine
    $ npm install grunt-contrib-jst
    $ npm install grunt-contrib-watch


To compile jst templates:

	$ grunt jst

And to have this run whenever templates are edited:

	$ grunt watch

To update the demo figure app at http://figure.openmicroscopy.org/demo/
we have a grunt task that concats and moves js files into demo/.
It also replaces Django template tags in index.html and various js code
fragments with static app code. This is all handled by the grunt task:

    $ grunt demo

This puts everything into the figure/demo/ directory.
This can be tested locally via:

    $ cd demo/
    $ python -m SimpleHTTPServer

Go to http://localhost:8000/ to test it.
To update the figure.openmicroscopy.org site:

    - Copy the demo directory and replace the demo directory in gh-pages-staging branch.
    - Commit changes and open PR against ome/gh-pages-staging as described https://github.com/ome/figure/tree/gh-pages-staging

It is also possible to run the demo in docker without installing anything locally:

    $ docker build -t figure-demo .
    $ docker run -ti --rm -p 8000:8000 figure-demo
