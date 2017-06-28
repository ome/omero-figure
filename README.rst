.. image:: https://travis-ci.org/ome/omero-figure.svg?branch=master
    :target: https://travis-ci.org/ome/omero-figure

.. image:: https://badge.fury.io/py/omero-figure.svg
    :target: https://badge.fury.io/py/omero-figure


OMERO.figure
============

An OMERO.web app for creating figures from images in OMERO.

For full details see http://figure.openmicroscopy.org


Requirements
============

* OMERO 5.3.0 or newer.

To be able to export the figure as TIFF with italic or bold label, it is necessary
to use OMERO 5.3.2 or newer.


Installing from PyPI
====================

This section assumes that an OMERO.web is already installed.

Install the app using `pip <https://pip.pypa.io/en/stable/>`_:

::

    $ pip install -U omero-figure

Add figure custom app to your installed web apps:

::

    $ bin/omero config append omero.web.apps '"omero_figure"'

Display a link to 'Figure' at the top of the webclient:

::

    $ bin/omero config append omero.web.ui.top_links '["Figure", "figure_index",
      {"title": "Open Figure in new tab", "target": "_blank"}]' 


Add 'Figure' to the 'Open with' options, available from context menu on
the webclient tree:

::

    $ bin/omero config append omero.web.open_with '["omero_figure", "new_figure",
      {"supported_objects":["images"], "target": "_blank", "label": "OMERO.figure"}]'

Now restart OMERO.web as normal.


Enabling figure export
----------------------

This section assumes that an OMERO.server is already installed.

Figures can be exported as PDF or TIFF files using a script that runs on the OMERO.server. This script needs to be uploaded to the OMERO.server and its dependencies installed on the OMERO.server machine.

The script can be uploaded using two alternative workflows, both of which require you to be an admin.

*Option 1*: Connect to the OMERO server and upload script via the CLI. It is important to be in the correct directory when uploading so that the script is uploaded with the full path: ``omero/figure_scripts/Figure_To_Pdf.py``:

::

    $ cd omero_figure/scripts
    $ path/to/OMERO.server/bin/omero script upload omero/figure_scripts/Figure_To_Pdf.py --official

*Option 2*: Alternatively, before starting the OMERO.server, copy the script from the figure install
``/omero_figure/scripts/omero/figure_scripts/Figure_To_Pdf.py`` to the OMERO.server ``path/to/OMERO.server/lib/scripts/omero/figure_scripts``. Then restart the OMERO.server.

Now install the script's dependencies:


* Install `reportlab <https://bitbucket.org/rptlab/reportlab>`_ PDF python package from distribution packages. For example, install on CentOS 7:

::

    $ yum install python-reportlab

* Optional: Figure legends can be formatted using Markdown syntax. To see this correctly in the exported PDF info page, we need `Python Markdown <https://pythonhosted.org/Markdown/index.html>`_. For example, install on CentOS 7:

::

    $ yum install python-markdown

Development
===========

We use Grunt for various tools.
See http://figure.openmicroscopy.org/2014/05/01/testing-with-jshint-jasmine-grunt.html
for an introduction.

Install Node from https://nodejs.org, then:

::

    $ cd omero-figure
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

This puts everything into the omero-figure/demo/ directory.
This can be tested locally via:

::

    $ cd demo/
    $ python -m SimpleHTTPServer

Go to http://localhost:8000/ to test it.
This will not install the script and dependencies required to export the figure
as PDF.

To update the figure.openmicroscopy.org site:

- Copy the demo directory and replace the demo directory in gh-pages-staging branch
- Commit changes and open PR against ome/gh-pages-staging as described https://github.com/ome/omero-figure/tree/gh-pages-staging

It is also possible to run the demo in docker without installing anything locally:

::

    $ docker build -t figure-demo .
    $ docker run -ti --rm -p 8000:8000 figure-demo


License
-------

OMERO.figure is released under the AGPL.

Copyright
---------

2016, The Open Microscopy Environment
