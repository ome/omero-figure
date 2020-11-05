---
layout: post
title:  "Try new ROI features on the demo app"
date:   2015-11-09
redirect_to:
  - https://github.com/ome/omero-figure/blob/master/docs/_posts/2015-11-09-try-new-roi-features-on-the-demo-app.markdown
---

As you may have heard, we are currently adding ROI support to OMERO.figure, allowing
you to draw ROIs on image panels and copy & paste these between images.
This post describes the new features and invites you to try them out on the demo app
and provide feedback ahead of their inclusion in the next release.
**NB**: It should be noted that ROIs created in OMERO.figure are saved within the figure
itself in the same way as labels & scalebars. They can't yet be saved back to the
OMERO server, although we may add this functionality in due course.

<h2>Adding, editing and deleting ROIs on image panels</h2>

<img src="https://cloud.githubusercontent.com/assets/900055/9478881/5894a230-4b72-11e5-91c7-6ac2237a0a67.png" 
  style="width:600px"/>

To add ROIs to panels in the figure, select a single panel, click on the Labels tab
and then click on the Draw button under the ROIs header.
This will launch the ROI viewer, where you can draw, edit and delete a number of ROI
types; currently we support rectangles, lines, arrows and ellipses.

Drawing and editing of ROIs should "just work" as you expect it to: select the type
of ROI in the toolbar, as well as the line width and colour. Then draw the ROI on the image.
You can also use the select arrow to select and edit existing ROIs.

Selected ROIs can be copied, pasted and deleted using the Edit menu options or keyboard shortcuts.
Copying and pasting can be used to duplicate ROIs on a single image, but also to
transfer ROIs from one image panel to another.
Click OK at the bottom of the viewer to save changes to ROIs and close the viewer.


<h2>Copy, paste & edit ROIs without opening the viewer</h2>

<img src="https://cloud.githubusercontent.com/assets/900055/10795887/a4121e06-7d93-11e5-9955-97aa4adf2592.png"/>

In the Labels tab, you can copy, paste and delete all the ROIs on the selected
image panels using the relevant buttons, without having to open the ROI viewer.

You can also bulk edit the ROIs on selected images, changing the line width
or colour of all ROIs at once.
This allows you to see the effects of these changes on the whole figure as you
are editing.


<h2>Enhanced cropping features</h2>

<img src="https://cloud.githubusercontent.com/assets/900055/10805078/2d8bdec2-7dc3-11e5-9eb1-04bbef95817b.png"/>

OMERO.figure allows you to crop an image panel by zooming and panning or by using the Crop button.
You can now copy and paste the crop region from one image to another,
using the buttons at the bottom of the Preview tab.

<img src="https://cloud.githubusercontent.com/assets/900055/10986059/8bee2720-841e-11e5-8616-081cf40ad4da.png"
  style="width:600px"/>

The pop-up crop dialog has also been improved to allow you to crop an image based on
various regions. If the image in the figure has any rectangular ROIs on it then you
can pick one of these as a crop region. You can also use a region that you
have copied to the clipboard: either a crop region from another image or a rectangle ROI
that has been copied to clipboard as described above.
This makes it easy to crop an image to a chosen ROI that is also displayed
on another image in the figure.


<h2>Copy and paste ROIs to regions and vice versa</h2>

As described above, you can copy ROIs from the ROI viewer or via the ROI Copy button
in the Labels tab. If you copy a rectangle from one panel, you can paste this
as a crop region on another panel, using the Paste button on the Preview tab.

Conversely, you can also copy a crop region from one panel and paste this to create
a new rectangle ROI on another panel.


<h2>Try the ROI features on the demo app, before their release</h2>

The ROI functionality described here will be in the next release of OMERO.figure 1.2.0.
However, if you'd like to try this now you can use the demo app at
[http://figure.openmicroscopy.org/demo/](http://figure.openmicroscopy.org/demo/#file/1).

If you have any comments or suggestions, it would be great to hear from you.
This gives us a chance to fix issues before the release.

 Many thanks!

