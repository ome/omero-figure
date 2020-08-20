---
layout: post
title:  "Why I created OMERO.figure"
redirect_to:
  - https://github.com/ome/omero-figure/blob/master/docs/_posts/2014-03-26-why-I-created-omero-figure.markdown
---

I used to be a biologist in the lab a (good) few years ago now,
and I remember the time it took to create figures from my
microscope images. I had to open each Deltavision image in the SoftWoRx
application, copy and paste rendering settings from one image to another,
then save each one as a tiff for each channel I wanted to show.
I also had to write the rendering settings in my lab notebook in case I
wanted to come back and export more images with the same settings later.
Then I'd go to Photoshop, copy and paste each tiff into a single
figure and carefully arrange them in appropriate rows and columns.

That was before we had OMERO available. One of the first useful
pieces of functionality I contributed to OMERO was the "Figure scripts",
as part of the OMERO 4.2 release in the summer of 2010.
These are Python scripts that constructed various standard types
of figure, such as a Split-view figure or ROI figure. See a 
[Figure scripts Demo Movie][demo].

These scripts proved quite popular, but are very inflexible and
are mostly used as a quick export for a lab meeting or
print out. It was still necessary to create most figures manually,
requiring individual export of all the necessary panels.
So we added the 'Batch Image Export' script that would
create a zip with all the separate planes and channels for your
chosen images, along with a log of their rendering settings.

However, there was clearly a need for a tool that would
give users the flexibility they required, but still provide
the rapid layout of panels with coordinated rendering settings,
regions of interest, labels and other common features.

I wanted to create something halfway in-between the "Figure scripts"
and Adobe Illustrator.

[demo]:    http://downloads.openmicroscopy.org/movies/omero-4-2/mov/FigureExport.mov
