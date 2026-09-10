.. image:: https://img.shields.io/badge/dynamic/json.svg?label=forum&url=https%3A%2F%2Fforum.image.sc%2Ftags%2Fomero-figure.json&query=%24.topic_list.tags.0.topic_count&colorB=brightgreen&suffix=%20topics&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABPklEQVR42m3SyyqFURTA8Y2BER0TDyExZ+aSPIKUlPIITFzKeQWXwhBlQrmFgUzMMFLKZeguBu5y+//17dP3nc5vuPdee6299gohUYYaDGOyyACq4JmQVoFujOMR77hNfOAGM+hBOQqB9TjHD36xhAa04RCuuXeKOvwHVWIKL9jCK2bRiV284QgL8MwEjAneeo9VNOEaBhzALGtoRy02cIcWhE34jj5YxgW+E5Z4iTPkMYpPLCNY3hdOYEfNbKYdmNngZ1jyEzw7h7AIb3fRTQ95OAZ6yQpGYHMMtOTgouktYwxuXsHgWLLl+4x++Kx1FJrjLTagA77bTPvYgw1rRqY56e+w7GNYsqX6JfPwi7aR+Y5SA+BXtKIRfkfJAYgj14tpOF6+I46c4/cAM3UhM3JxyKsxiOIhH0IO6SH/A1Kb1WBeUjbkAAAAAElFTkSuQmCC
    :target: https://forum.image.sc/tag/omero-figure
    :alt: Image.sc forum

.. image:: https://github.com/ome/omero-figure/workflows/OMERO/badge.svg
    :target: https://github.com/ome/omero-figure/actions

.. image:: https://badge.fury.io/py/omero-figure.svg
    :target: https://badge.fury.io/py/omero-figure


OMERO.figure
============

An app for creating figures from images in OMERO.

OMERO.figure bundles the standalone https://ome.github.io/figure/ application into an OMERO.web app
for working with OMERO images and saving figures to the OMERO.server.

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


Optional: To change the maximum active channel count from the default of 10:

::

    $ omero config set omero.figure.max_active_channels 15  


Now restart OMERO.web as normal.


Enabling figure export from OMERO
---------------------------------

This section assumes that an OMERO.server is already installed.

Figures can be exported as PDF or TIFF files using a script that runs on the OMERO.server. This script needs to be uploaded to the OMERO.server and its dependencies
installed in the OMERO.server virtual environment.

First install the script's dependencies:

* Install `reportlab <https://bitbucket.org/rptlab/reportlab>`_ PDF python package.
  This needs to be installed in the virtual environment where the ``OMERO.server`` is installed. Depending on your install, you may need to
  call ``pip`` with, for example: ``/path/to_server_venv/venv/bin/pip install ...``. The install of `Python Markdown <https://python-markdown.github.io/>`_ is optional
  but is required to format any figure legends that use Markdown syntax.

::

    $ pip install reportlab markdown

* Optional (v8.0.2 and later): If your figure contains OME-Zarr images, you will also need to install the dependencies for rendering
  OME-Zarr images in the export script. These are `zarr`, `dask` and `fsspec[http]`:

::

    $ pip install zarr dask fsspec[http]


The script can be uploaded using various workflows, all of which require you to have the correct admin privileges.

*Option 1*: Log in to the webclient as an Admin and open the OMERO.figure app. If the OMERO script is not found or is not up to date, you will
see a warning message with a button to upload the script. Click the button to upload the script from the OMERO.figure app.

*Option 2*: Upload the script from the installation directory. To find where OMERO.figure has been installed using pip, run:

::

    $ pip show omero-figure

The command will display the absolute path to the directory where the application is installed e.g. ``~/<virtualenv_name>/lib/python3.6/site-packages``. Go to that directory.

Connect to the OMERO server and upload the script via the CLI. It is important to be in the correct directory when uploading so that the script is uploaded with the full path: ``omero/figure_scripts/Figure_To_Pdf.py``:

::

    $ cd omero_figure/scripts
    $ omero script upload omero/figure_scripts/Figure_To_Pdf.py --official

*Option 3*: Alternatively, before starting the OMERO.server, copy the script from the figure install
``/omero_figure/scripts/omero/figure_scripts/Figure_To_Pdf.py`` to the OMERO.server ``path/to/OMERO.server/lib/scripts/omero/figure_scripts``. Then restart the OMERO.server.


Upgrading OMERO.figure
----------------------

After upgrading OMERO.figure with:

::

    $ pip install -U omero-figure

You need to update the Figure export script using one of the 3 options described
above. If using *Option 1*, you need to *replace* the existing script:

::

    # Get the ID of the existing Figure_To_Pdf script:
    $ omero script list

    # Replace the script
    $ cd omero_figure/scripts
    $ omero script replace <SCRIPT_ID> omero/figure_scripts/Figure_To_Pdf.py


Development
-----------

See the `figure` app at `https://ome.github.io/figure/ <https://ome.github.io/figure/>`_
for development details of the standalone app.

The `figure` repo is a submodule of the `omero-figure` repository.

See `docs/contributing.md` for information on code layout and other details.

We use `vite.js <https://vitejs.dev/>`_ to build and serve the app during development.

Install Node from https://nodejs.org, then:

::

    $ cd omero-figure/figure
    $ npm install
    $ npm run start

View the app at http://localhost:8080/
(this will automatically refresh the page when changes are saved):

The app will run as a standalone app that can load OME-Zarr images.

A global variable `APP_SERVED_BY_OMERO` will be `false` and this is used
to determine the behaviour of various features such as File Open/Save
and the figure Export dialog.

If you are editing the Shape-Editor code, you can view the test page at
http://localhost:8080/shapeEditorTest.html


Deploying from OMERO.web
************************

You will need to install this repo in your `omero-web` environment 
and configure as above.

```
    $ cd omero-figure
    $ pip install -e .
```

To propagate changes from `/figure` to `omero-figure`, so we can test them
when deployed from OMERO.web, we can either:

```
    $ cd figure
    $ npm run build     # builds into figure/dist
    $ cd ../
    $ ./deploy_build.sh     # copies figure/dist/assets etc into omero-figure
```

or run the python build command:

```
    $ python -m build
```

You will need to refresh the OMERO.figure app to see changes when using this workflow.

Commiting changes
*****************

Commit changes to `figure` first, then update the submodule commit:

```
    $ cd figure
    $ git add....   # git commit etc.

    $ cd ../
    $ git add figure
    $ git commit "Update /figure to feature X"
```

Release process
---------------

This repository uses `bump2version <https://pypi.org/project/bump2version/>`_ to manage version numbers.
To create a release-candidate (RC) from a development version run::

    $ bumpversion release    # e.g. 8.0.1.dev0 -> 8.0.1.rc0
    $ bumpversion build      # e.g. 8.0.1.rc0 -> 8.0.1.rc1

This creates commits and tags by default.

To tag a stable release from RC run::

    $ bumpversion release    # e.g. 8.0.1.rc1 -> 8.0.1

To create a stable release directly from ``.dev0`` (without RC), set an explicit version and tag it, for example::

    $ bumpversion --new-version 8.0.1 release

To switch back to a development version run::

    $ bumpversion --no-tag [major|minor|patch]

specifying ``major``, ``minor`` or ``patch`` depending on whether the development branch will be a `major, minor or patch release <https://semver.org/>`_. This will also add the ``.dev0`` suffix.

Remember to ``git push`` all commits and tags.

PyPI publishing notes:

* Publishing is triggered by Git tags in the GitHub action.
* The published package version comes from ``omero_figure/utils.py`` (not from tag text alone).
* The workflow validates that the tag version and package version match before publishing.

License
-------

OMERO.figure is released under the AGPL.

Copyright
---------

2016-2026, The Open Microscopy Environment
