OMERO.figure
============

OMERO.web app for creating figures from images in OMERO.


Requirements
============

* OMERO 4.4.0 or later

Development Installation
========================

Clone the repository in to your OMERO.web installation:

    cd components/tools/OmeroWeb/omeroweb/
    git clone git://github.com/will-moore/figure.git
    path/to/bin/omero config set omero.web.apps '["figure"]'

Now start up (or restart) OMERO.web as normal in your development environment.

Production Installation
=======================

Install the latest version of OMERO.server and OMERO.web and then:

    cd $OMERO_HOME/lib/python/omeroweb
    wget -O master.zip https://github.com/will-moore/figure/zipball/master
    unzip master.zip
    mv openmicroscopy-figure-* figure
    path/to/bin/omero config set omero.web.apps '["figure"]'

Restart your web server


Pdf-generation script
=====================

In order to export figures as pdf documents, you also need to upload the Figure_To_Pdf.py script.
This script requires the reportlab python libraray: http://www.reportlab.com/software/opensource/

    cd figure
    path/to/bin/omero script upload figure_scripts/Figure_To_Pdf.py --official

    pip install reportlab    # or easy_install reportlab

