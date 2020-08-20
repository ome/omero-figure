---
layout: post
title:  "Key features of OMERO.figure"
redirect_to:
  - https://github.com/ome/omero-figure/blob/master/docs/_posts/2014-04-05-key-features-of-omero-figure.markdown
---

The two main goals of OMERO.figure were to make it
quick to get the layout of images right AND
easy to adjust the settings of multiple panels at once.

Layout
------

Dragging and dropping of images is the most intuitive
way of creating a particular layout. But aligning
them all into a grid that is typical in most figures
takes time. 
OMERO.figure has a "grid" button that will attempt
to snap all the selected images into a grid with 
thin spaces between them.
Also, when you copy and paste a row of images, OMERO.figure
will position them directly below the original row with
appropriate spacing. If you copy a column, it will be
pasted as a new column to the right.

Settings
--------

In a traditional figure creation workflow, you need to
choose the settings of each panel at the time you
export it from your imaging software. By 'settings' I
mean:

 - Channels on / off
 - Rendering settings / levels
 - Z section & Timepoint
 - Zoom and pan
 - Rotation

However, if you wish to change these once
you have started to assemble your figure in
Photoshop or Illustrator, you often have to go
back and re-export the image.

With OMERO.figure, the *first* step is to bring your
chosen images from OMERO into your figure. Then you
can adjust all the settings of each panel as you
construct the figure. If you want to change the
Z-section or timepoint of a multi-dimensional image,
you simply select the panel and drag the sliders in the
viewer on the right.


In many figures it's common to compare images with different
experimental treatments by applying the same settings
to each one. For example, turning the same channels on / off
or selecting the same time points in multiple movies.

In OMERO.figure, you can syncronise the settings across
multiple images by selecting the appropriate panels, then 
adjusting the settings in the 'Preview' viewer to the right.

This is easier to demonstrate than to explain, so please
checkout one of the demo movies on youtube: [Introducing OMERO.figure](https://www.youtube.com/watch?v=anJPPx7uoUM) | [OMERO.figure Demo 2](https://www.youtube.com/watch?v=JNFvT8JwY7E)
