#!/bin/bash

echo "Deploying built resources to plugin directory..."

# copy bootstrap-icons from node_modules to static...
mkdir -p omero_figure/static/omero_figure/fonts/
cp figure/node_modules/bootstrap-icons/font/bootstrap-icons.css omero_figure/static/omero_figure/
cp figure/node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2 omero_figure/static/omero_figure/fonts/

# output dir is figure/dist/* - Need to copy into omero_figure...
mkdir -p omero_figure/templates/omero_figure/

# First copy index.html to templates...
echo "copying index.html to templates..."
cp figure/dist/index.html omero_figure/templates/omero_figure/

# Then copy static assets (js & css)
echo "copying static assets (js & css) to static directory..."
cp figure/dist/assets/* omero_figure/static/omero_figure/

# Also copy the Figure_To_Pdf.py script to omero-figure...
mkdir -p omero_figure/scripts/omero/figure_scripts/
cp figure/ome_figure/Figure_To_Pdf.py omero_figure/scripts/omero/figure_scripts/Figure_To_Pdf.py
echo "Figure_To_Pdf.py script copied to omero_figure/scripts/omero/figure_scripts/"
