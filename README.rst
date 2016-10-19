.. image:: https://travis-ci.org/ome/omero-figure.svg?branch=master
    :target: https://travis-ci.org/ome/omero-figure

.. image:: https://badge.fury.io/py/omero-figure.svg
    :target: https://badge.fury.io/py/omero-figure


OMERO.figure
============

OMERO.web app for creating figures from images in OMERO.

For full details see http://figure.openmicroscopy.org


Requirements
============

* OMERO 5.0.0 or later.

Installation
============

Install OMERO.web.

This app installs into the OMERO.web framework.

::

    $ pip install omero-figure

Add figure custom app to your installed web apps:

::

    $ bin/omero config append omero.web.apps '"omero_figure"'

Display a link to 'Figure' at the top of the webclient:

::

    $ bin/omero config append omero.web.ui.top_links '["Figure", "figure_index", {"title": "Open Figure in new tab", "target": "figure"}]' 

Now restart OMERO.web as normal.

**Warning**:

if OMERO.figure is installed with OMERO version prior to **5.2.6**,
the url will be https://your-web-server/omero_figure instead of https://your-web-server/figure as previously. This is due to a package re-organization required to distribute the application using a package manager.
If installed with OMERO **5.2.6 and older**, the url will be back to https://your-web-server/figure.


Enabling PDF generation
-----------------------

* Install `reportlab <https://bitbucket.org/rptlab/reportlab>`_ PDF python package:

::

    $ pip install reportlab

**Note**: For python 2.6, you will need Reportlab 2.7


* Install script to generate figure. To perform this task, you must be an admin.

  - Go to the directory where ``omero_figure`` has been installed.
  - Copy ``/omero_figure/scripts/omero/figure_scripts/Figure_To_Pdf.py`` to ``path/to/omero-server/lib/scripts/omero/figure_scripts``
  - Restart the OMERO.server

  Alternatively, if the OMERO.server is already running

  - Go to the directory where ``omero_figure`` has been installed.
  - Go to ``/omero_figure/scripts``
  - Upload the script as an official script:

::

        $ path/to/OMERO.server/bin/omero script upload omero/figure_scripts/Figure_To_Pdf.py --official

* Optional: Figure legends can be formatted using Markdown syntax. To see this correctly in the exported PDF info page, we need `Python Markdown <https://pythonhosted.org/Markdown/index.html>`_ installed:

::

    $ pip install markdown

Development
===========

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
