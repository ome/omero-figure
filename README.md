OMERO.figure
============

OMERO.web app for creating figures from images in OMERO.

For full details see http://will-moore.github.io/figure/


Requirements
============

* OMERO 4.4.x or OMERO 5.x

Development Installation
========================

Clone the repository in to your OMERO.web installation.
NB: From OMERO 4.4.10 or later, this can be anywhere on your PYTHONPATH:

    cd components/tools/OmeroWeb/omeroweb/
    git clone git://github.com/will-moore/figure.git
    path/to/bin/omero config set omero.web.apps '["figure"]'

Now start up (or restart) OMERO.web as normal in your development environment.

Production Installation
=======================

See instructions at http://will-moore.github.io/figure/


Pdf-generation script
=====================

In order to export figures as pdf documents, you also need to upload the Figure_To_Pdf.py script.
This script requires the reportlab python libraray: http://www.reportlab.com/software/opensource/

    # important to upload from this directory to ensure relative path is correct
    cd figure/scripts
    path/to/bin/omero script upload omero/figure_scripts/Figure_To_Pdf.py --official

    pip install reportlab    # or easy_install reportlab

