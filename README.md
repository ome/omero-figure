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

