#!/bin/bash

echo "Deploying built resources to plugin directory..."

# copy bootstrap-icons from node_modules to static...
mkdir -p omero_figure/static/omero_figure/fonts/
cp node_modules/bootstrap-icons/font/bootstrap-icons.css omero_figure/static/omero_figure/
cp node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2 omero_figure/static/omero_figure/fonts/

# output dir is static dir (js & css in correct place) - only need to move index.html
mkdir -p omero_figure/templates/omero_figure/
cp omero_figure/static/omero_figure/index.html omero_figure/templates/omero_figure/
