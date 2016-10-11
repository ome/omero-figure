.. image:: https://travis-ci.org/ome/omero-figure.svg?branch=master
    :target: https://travis-ci.org/ome/omero-figure

.. image:: https://badge.fury.io/py/omero-figure.svg
    :target: https://badge.fury.io/py/omero-figure


OMERO.figure
============

OMERO.web app for creating figures from images in OMERO.

For full details see http://figure.openmicroscopy.org


Requirements
------------

* OMERO 4.4.x or OMERO 5.x

Installation
------------

Please see instructions at http://figure.openmicroscopy.org


Development
-----------

We use Grunt for various tools.
See http://figure.openmicroscopy.org/2014/05/01/testing-with-jshint-jasmine-grunt.html
for an introduction.

Install Node from https://nodejs.org, then:

::

    $ cd figure
    $ npm install

Install Grunt CLI as described on http://gruntjs.com/using-the-cli.

To compile jst templates:

::

	$ grunt jst

To concatenate js files into a single figure.js file that is used in the app:

::

    $ grunt concat

During development, you'll want to have both of these run whenever the relevant files are edited.
This can be achieved with:

::

	$ grunt watch

To update the demo figure app at http://figure.openmicroscopy.org/demo/
we have a grunt task that concats and moves js files into demo/.
It also replaces Django template tags in index.html and various js code
fragments with static app code. This is all handled by the grunt task:

::

    $ grunt demo

This puts everything into the figure/demo/ directory.
This can be tested locally via:

::

    $ cd demo/
    $ python -m SimpleHTTPServer

Go to http://localhost:8000/ to test it.
To update the figure.openmicroscopy.org site:

 - Copy the demo directory and replace the demo directory in gh-pages-staging branch.
 - Commit changes and open PR against ome/gh-pages-staging as described https://github.com/ome/omero-figure/tree/gh-pages-staging

It is also possible to run the demo in docker without installing anything locally:

::

    $ docker build -t figure-demo .
    $ docker run -ti --rm -p 8000:8000 figure-demo

If you are using docker-machine (e.g. on Mac OS X or Windows), you can find the URL of your demo with:

::

    # get the ip address of your docker machine (named default)
    $ docker-machine ip default
    192.168.99.100
    # Now check the result in your browser at:
    http://192.168.99.100:8000/


License
-------

OMERO.figure is released under the AGPL.

Copyright
---------

2016, The Open Microscopy Environment
