---
layout: post
title:  "Release: 1.1.0"
date:   2014-10-06
---

I am pleased to announce release of OMERO.figure 1.1.0.
This release adds a number of features and bug fixes.

Multiple page figures:

  - Under File > Page Setup you can choose up to 10 pages for the figure.
  - Pages are laid out in a grid on the canvas and image panels can be dragged across the canvas onto chosen page.
  - Export will generate multi-page PDF documents.

Crop to Region / ROI:

  - A crop button beside the panel zoom slider launches a crop dialog.
  - The crop region can be manually chosen by dragging to select an area of the displayed image.
  - Alternatively, existing Rectangular ROIs on the image will be loaded from OMERO and can be picked as a crop region.

Export of TIFFs with PDF:

  - A new export option allows the constituant images within a figure to be exported alongside the PDF file as TIFFs.
  - For each image panel, the full sized TIFF of the image is exported, as well as the cropped and rotated TIFF
    that is embedded within the PDF file.
  - This provides greater clarity as to the processing steps used in creating the figure and the TIFF images
    could also be used in a manual figure creation.

Other Features:

  - When multiple panels are selected, they can be automatically resized to "Align their Magnification" such
    that features appear the same size in all panels.
  - Labels can be added to Scalebars to indicate their length.
  - A color picker allows any color to be chosen for image channels and labels.
  - Units support: If used with OMERO 5.1, the pixel size units in imported images will be used for scale bar labels.
  - Unicode support: Figures can now contain special characters.
  - Figure export errors are now handled with an error button which displays the error in a new browser tab. 

Bug Fixes:

  - Fix label & scalebar colors in PDF




<iframe width="640" height="360" src="//www.youtube.com/embed/P0MMKtIKdFY?rel=0" frameborder="0" allowfullscreen></iframe>

Grab the release from the OMERO.figure [1.1.0 download page](http://downloads.openmicroscopy.org/figure/1.1.0/).
