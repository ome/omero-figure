.. image:: https://img.shields.io/badge/dynamic/json.svg?label=forum&url=https%3A%2F%2Fforum.image.sc%2Ftags%2Fomero-figure.json&query=%24.topic_list.tags.0.topic_count&colorB=brightgreen&suffix=%20topics&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABPklEQVR42m3SyyqFURTA8Y2BER0TDyExZ+aSPIKUlPIITFzKeQWXwhBlQrmFgUzMMFLKZeguBu5y+//17dP3nc5vuPdee6299gohUYYaDGOyyACq4JmQVoFujOMR77hNfOAGM+hBOQqB9TjHD36xhAa04RCuuXeKOvwHVWIKL9jCK2bRiV284QgL8MwEjAneeo9VNOEaBhzALGtoRy02cIcWhE34jj5YxgW+E5Z4iTPkMYpPLCNY3hdOYEfNbKYdmNngZ1jyEzw7h7AIb3fRTQ95OAZ6yQpGYHMMtOTgouktYwxuXsHgWLLl+4x++Kx1FJrjLTagA77bTPvYgw1rRqY56e+w7GNYsqX6JfPwi7aR+Y5SA+BXtKIRfkfJAYgj14tpOF6+I46c4/cAM3UhM3JxyKsxiOIhH0IO6SH/A1Kb1WBeUjbkAAAAAElFTkSuQmCC
    :target: https://forum.image.sc/tag/omero-figure
    :alt: Image.sc forum

.. image:: https://travis-ci.org/ome/omero-figure.svg?branch=master
    :target: https://travis-ci.org/ome/omero-figure

.. image:: https://badge.fury.io/py/omero-figure.svg
    :target: https://badge.fury.io/py/omero-figure


OMERO.figure
============

An OMERO.web app for creating figures from images in OMERO.

For full details see `SUPPORT.md <https://github.com/ome/omero-figure/blob/master/SUPPORT.md>`_.

Requirements
------------

* OMERO.web 5.6.0 or newer.


Installing from PyPI
--------------------

This section assumes that an OMERO.web is already installed.

Install the app using `pip <https://pip.pypa.io/en/stable/>`_:

::

    $ pip install -U omero-figure

Add figure custom app to your installed web apps:

::

    $ omero config append omero.web.apps '"omero_figure"'

Display a link to 'Figure' at the top of the webclient:

::

    $ omero config append omero.web.ui.top_links '["Figure", "figure_index",
      {"title": "Open Figure in new tab", "target": "_blank"}]' 


Add 'Figure' to the 'Open with' options, available from context menu on
the webclient tree:

::

    $ omero config append omero.web.open_with '["omero_figure", "new_figure",
      {"supported_objects":["images"], "target": "_blank", "label": "OMERO.figure"}]'

Now restart OMERO.web as normal.


Enabling figure export
----------------------

This section assumes that an OMERO.server is already installed.

Figures can be exported as PDF or TIFF files using a script that runs on the OMERO.server. This script needs to be uploaded to the OMERO.server and its dependencies
installed in the OMERO.server virtual environment.

The script can be uploaded using two alternative workflows, both of which require you to have the correct admin privileges.
To find where OMERO.figure has been installed using pip, run:

::

    $ pip show omero-figure

The command will display the absolute path to the directory where the application is installed e.g. ``~/<virtualenv_name>/lib/python3.6/site-packages``. Go to that directory.

*Option 1*: Connect to the OMERO server and upload the script via the CLI. It is important to be in the correct directory when uploading so that the script is uploaded with the full path: ``omero/figure_scripts/Figure_To_Pdf.py``:

::

    $ cd omero_figure/scripts
    $ omero script upload omero/figure_scripts/Figure_To_Pdf.py --official

*Option 2*: Alternatively, before starting the OMERO.server, copy the script from the figure install
``/omero_figure/scripts/omero/figure_scripts/Figure_To_Pdf.py`` to the OMERO.server ``path/to/OMERO.server/lib/scripts/omero/figure_scripts``. Then restart the OMERO.server.

Now install the script's dependencies:


* Install `reportlab <https://bitbucket.org/rptlab/reportlab>`_ PDF python package.
  This needs to be installed in the virtual environment where the server is run.

::

    $ pip install reportlab

* Optional: Figure legends can be formatted using Markdown syntax. To see this correctly in the exported PDF info page, we need `Python Markdown <https://python-markdown.github.io/>`_:

::

    $ pip install markdown

Upgrading OMERO.figure
----------------------

After upgrading OMERO.figure with:

::

    $ pip install -U omero-figure

You need to update the Figure export script using one of the 2 options described
above. If using *Option 1*, you need to *replace* the existing script:

::

    # Get the ID of the existing Figure_To_Pdf script:
    $ path/to/OMERO.server/bin/omero script list

    # Replace the script
    $ cd omero_figure/scripts
    $ path/to/OMERO.server/bin/omero script replace <SCRIPT_ID> omero/figure_scripts/Figure_To_Pdf.py


Development
-----------

We use Grunt for various tools.
See http://figure.openmicroscopy.org/2014/05/01/testing-with-jshint-jasmine-grunt.html
for an introduction.

Install Node from https://nodejs.org, then:

::

    $ cd omero-figure
    $ npm install

Install Grunt CLI as described on http://gruntjs.com/using-the-cli.

To build various resources into ``omero_figure/static``  run:

::

    $ grunt build

This will concatenate js files into a single figure.js file,
compile the underscore templates into templates.js and also
copy the shape-editor.js from node_modules.

During development, you will want to peform the concatenation
(``concat``) and template compilation (``jst``) tasks whenever
the JavaScript or template files change. This can be achieved
with:

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

Release process
---------------

This repository uses `bump2version <https://pypi.org/project/bump2version/>`_ to manage version numbers.
To tag a release run::

    $ bumpversion release

This will remove the ``.dev0`` suffix from the current version, commit, and tag the release.

To switch back to a development version run::

    $ bumpversion --no-tag [major|minor|patch]

specifying ``major``, ``minor`` or ``patch`` depending on whether the development branch will be a `major, minor or patch release <https://semver.org/>`_. This will also add the ``.dev0`` suffix.

Remember to ``git push`` all commits and tags.

License
-------

OMERO.figure is released under the AGPL.

Copyright
---------

2016-2020, The Open Microscopy Environment
