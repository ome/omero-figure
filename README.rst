.. image:: https://img.shields.io/badge/dynamic/json.svg?label=forum&url=https%3A%2F%2Fforum.image.sc%2Ftags%2Fomero-figure.json&query=%24.topic_list.tags.0.topic_count&colorB=brightgreen&suffix=%20topics&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABPklEQVR42m3SyyqFURTA8Y2BER0TDyExZ+aSPIKUlPIITFzKeQWXwhBlQrmFgUzMMFLKZeguBu5y+//17dP3nc5vuPdee6299gohUYYaDGOyyACq4JmQVoFujOMR77hNfOAGM+hBOQqB9TjHD36xhAa04RCuuXeKOvwHVWIKL9jCK2bRiV284QgL8MwEjAneeo9VNOEaBhzALGtoRy02cIcWhE34jj5YxgW+E5Z4iTPkMYpPLCNY3hdOYEfNbKYdmNngZ1jyEzw7h7AIb3fRTQ95OAZ6yQpGYHMMtOTgouktYwxuXsHgWLLl+4x++Kx1FJrjLTagA77bTPvYgw1rRqY56e+w7GNYsqX6JfPwi7aR+Y5SA+BXtKIRfkfJAYgj14tpOF6+I46c4/cAM3UhM3JxyKsxiOIhH0IO6SH/A1Kb1WBeUjbkAAAAAElFTkSuQmCC
    :target: https://forum.image.sc/tag/omero-figure
    :alt: Image.sc forum

.. image:: https://github.com/ome/omero-figure/workflows/OMERO/badge.svg
    :target: https://github.com/ome/omero-figure/actions

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

NB: You need to ensure that you are running ``pip`` from the python environment
where ``omero-web`` is installed. Depending on your install, you may need to
call ``pip`` with, for example: ``/path/to_web_venv/venv/bin/pip install ...``

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
  This needs to be installed in the virtual environment where the ``OMERO.server`` is installed. Depending on your install, you may need to
  call ``pip`` with, for example: ``/path/to_server_venv/venv/bin/pip install ...``

::

    $ pip install "reportlab<3.6"

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
    $ omero script list

    # Replace the script
    $ cd omero_figure/scripts
    $ omero script replace <SCRIPT_ID> omero/figure_scripts/Figure_To_Pdf.py


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


Local install
*************

You need an `omero-web` environment. You can either install it locally or use Docker (see below).
To install locally, we recommend that you use `conda` to install `omero-py` as described 
at https://github.com/ome/omero-py and then perform a developer install of `omero-figure`
which will include `omero-web`:

::

    $ cd omero-figure
    $ pip install -e .

You'll also need to run the `omero config` steps detailed above.
See instructions at https://omero.readthedocs.io/en/latest/developers/Web/Deployment.html
for running the development server.

Using Docker
************

It is also possible to develop figure in docker without creating a python environment locally.
The Docker image at ``omero-figure/Dockerfile`` is built on top of
`openmicroscopy/omero-web-standalone:latest <https://hub.docker.com/r/openmicroscopy/omero-web-standalone>`_,
so you will have a fully functional omero-web environment while developing ``omero-figure``.
This Docker image includes OMERO.figure. You can either replace this with a link to your local ``omero-figure`` repo
or you can use the Docker copy of OMERO.figure for development.

In either case, start by building the Docker image and specify the server you wish to connect to:

::

   $ cd omero-figure
   $ docker build -t figure-devel .
   $ export OMEROHOST=demo.openmicroscopy.org

To use your local ``omero-figure`` repo for development, you can mount this in place of the Docker ``omero-figure``.
You'll need `npm` and `grunt` installed locally and run `grunt watch` during development as described above.
You can refresh the Docker hosted page at http://localhost:4080/figure to see changes:

::

    $ cd /PATH_TO_GIT_REPO/omero-figure
    $ grunt build
    $ grunt watch   # to see updates
    $ docker run -ti -e OMEROHOST -p 4080:4080  -v /PATH_TO_GIT_REPO/omero-figure:/home/figure/src figure-devel


Alternatively, to run and develop ``omero-figure`` within the Docker container itself:
::

    $ docker run -ti -e OMEROHOST -p 4080:4080 figure-devel

After starting the container, run ``docker ps`` in another terminal to find the ID of the container. Then run:

::

   $ docker exec -u 0 -it CONTAINER_ID bash   # replace CONTAINER_ID by the correct value
   $ cd /home/figure/src
   $ vi src/js/app.js
   $ grunt build          # or run grunt watch in another terminal



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

2016-2022, The Open Microscopy Environment
