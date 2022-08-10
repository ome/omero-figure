#!/bin/bash

#copy over html and templates
echo "Deploying built resources to plugin directory..."
mkdir -p omero_figure/templates/omero_figure/
# output dir is static dir - only need to move index.html
cp omero_figure/static/omero_figure/index.html omero_figure/templates/omero_figure/
# mkdir -p omero_figure/static/omero_figure/
# cp -r dist/assets/* omero_figure/static/omero_figure/
