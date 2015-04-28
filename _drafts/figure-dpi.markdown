---
layout: post
title:  "What does figure dpi mean?"
date:   
---


I recently read an excellent guide by Benjamin Names on
[How to Create Publication-Quality Figures](http://cellbio.emory.edu/bnanes/figures/).

It describes the goals of scientific figure creation (accuracy, quality, transparency)
and a very thorough workflow to achieve these goals. The key is to understand your
data and how it is stored, manipulated and displayed. In particular, it is important
to minimise the number of steps where data is transformed and perform lossy steps
as late as possible in the figure creation process.

Benjamin documents specific tools that he uses for his workflow such as ImageJ for images and
Inkscape for figure layout. But much of his workflow can also be applied to
OMERO.figure since it was designed with the same principals in mind. 

I highly reccomend you read the guide above, since it provides a lot of background
information on how computers handle vector and raster data.
The steps of Benjamin's guide that can be replicated in OMERO.figure are
described below.


Preparing figure components (High-bit-depth images)
===================================================

The OMERO server stores your original microscope files and can
render them as 8-bit images using your chosen rendering settings.
Single-color LUTs can be applied to each channel over a specified
intensity range and channels can be toggled on and off. None of these
changes will alter the original microscope data.


Figure layout
=============

OMERO.figure is similar to Inkscape and Adobe Illustrator in that it
defines figures as vector-based format that contain raster images.
This means that moving and resizing images within a figure does not
require resampling of pixel data so there is no loss of image
quality.


Importing images
----------------

To add images to OMERO.figure, you simply specify the OMERO image ID.
The necessary data such as image size, number of channels, pixel bit-depth etc
is retrieved from the server.
You can then edit the image rendering settings while working on the figure layout
and these changes are stored in the OMERO.figure file. The file format is
a Javascript object (saved as json data) and contains no pixel data.
OMERO.figure retrieves rendered 8-bit images from the OMERO.server and assembles them
into a figure in the browser as needed.

The resolution (dpi) of images in OMERO.figure is calculated from their
size on the page and the size of the page itself (which can be edited under File > Paper Setup...).
The dpi of each image can be seen under the 'Info' tab and will change
as the image is resized and zoomed.

Journals usually require all images to be at 300 dpi or above
in order to avoid a pixelated appearance when figures are displayed
at their published size.
If you need to increase the dpi for an image, you can set an export dpi and
the panel will be resampled as necessary in the exported PDF.


Clipping masks
--------------

OMERO.figure allows you to crop images. It uses a 'clipping mask' to produce
the cropping effect which means you can undo or edit the crop at any time.
You can crop by using the zoom slider to zoom the image, then pan to the
desired spot, or you can use a standard 'crop' tool to draw a crop region
on an image.


Calculating scale bars
----------------------

Scale bars can be easily added to images in OMERO.figure and the known
pixel size will be used to calculate the correct length.
Scale bars are vector objects overlaid on the image and will be
automatically resized if you resize or zoom the image.

