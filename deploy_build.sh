#!/bin/bash

#copy over html,css,js and templates
echo "Deploying built resources to plugin directory..."
mkdir -p omero_figure/templates/omero_figure/
cp dist/index.html omero_figure/templates/omero_figure/
mkdir -p omero_figure/static/omero_figure/
cp -r dist/assets/* omero_figure/static/omero_figure/
