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

There is no need to save data as 8-bit images before assembling your
figure since this automatically happens when you view your figure in the browser.







Here, I'll explain how data is stored, manipulated and exported in OMERO.figre,
in a similar 


produce accurate, high-quality figures.



Journals have specific requirements for "publication quality" figures,
particularly in terms of pixel resolution.
Resolution is the density of pixels or 'dots' when the figure is
printed, usually measured in 'dots per inch' (dpi).

In order to avoid a pixelated appearance when figures are displayed
at their published size, images must have sufficiently high resolution,
usually 300 dpi or above.


OMERO.figure dpi
================

The concept of "dots per inch" only has a meaning once you know the physical size
of your figure. In OMERO.figure, the default page size is A4 (210 x 297 mm) but 
you can specify the size of your page under Menu: File > Paper Setup... 
We can then use this size to calculate dpi for all images in the figure.

The resolution of image panels depends on the number of pixels in the image
and the size it appears on the page. This can be different for each
image in the figure, meaning each image has an independent dpi.

To see the dpi for an image panel, select it and look under the 'Info' tab
to the right. You can see that the dpi changes when you resize the panel
on the page or zoom in to a region in the image.

The resolution of images in OMERO.figure will be preserved when you
export the figure as a PDF, since a PDF document is a posts


Setting the dpi
===============

If you need to increase the resolution of images in your exported figure,



When the figure is exported as a PDF, each image 


http://cellbio.emory.edu/bnanes/figures/
