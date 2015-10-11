---
layout: post
title:  "OMERO.figure demo app: How it works and how to use it"
date:   2015-10-12
---

If you want to try using OMERO.figure without installing the app or the OMERO server,
you can simply visit the demo site at [figure.openmicroscopy.org/demo/](http://figure.openmicroscopy.org/demo/)

So how does the demo work, and what OMERO server does it use?

<h2>OMERO.figure overview</h2>

OMERO.figure is basically a bunch of html and javascript that runs in your browser, getting
data and images from an OMERO server.

It can also use the OMERO server to save the figure file and export the figure as PDF or TIFF files.


<div class="panel panel-default">
  <div class="panel-body" style="padding:0; text-align: center">
    <img src="{{ site.baseurl }}/images/blog-omero-figure.png" style="width:600px"/>
  </div>
  <div class="panel-heading">
    <h3 class="panel-title">OMERO.figure reads image data from OMERO, and can save figure files and PDFs</h3>
  </div>
</div>

However, OMERO.figure doesn't **have** to get data from it's own "host" OMERO server. It
can get data from any OMERO server that is available on the internet.

<div class="panel panel-default">
  <div class="panel-body" style="padding:0; text-align: center">
    <img src="{{ site.baseurl }}/images/blog-demo-figure.png" style="width:600px"/>
  </div>
  <div class="panel-heading">
    <h3 class="panel-title">The demo app reads image data from the OMERO-based JCB dataviewer</h3>
  </div>
</div>

The demo app doesn't have it's own OMERO server. The html and javascript simply come from the 
figure.openmicroscopy web site (which is hosted by github). The demo app instead
gets it's OMERO images and metadata from the [JCB dataviewer](http://jcb-dataviewer.rupress.org/), which is a public
image repository built with OMERO.

The JCB dataviewer provides public image data and image rendering, but doesn't support saving
of figure files or export of figures to PDF / TIFF.

<h2>Using OMERO.figure demo app</h2>

The demo app works in exactly the same way as the regular OMERO.figure app, with a couple of differences:

 - You can't save or export figures (as described above).
 - File > Open uses a [small number of example figures]({{ site.baseurl }}/#demo) saved within the app itself.
 You can edit these but not save changes.
 - Images are added from JCB dataviewer or other public OMERO repositories as shown below:

<div class="panel panel-default">
  <div class="panel-body" style="padding:0; text-align: center">
  	<a href="{{ site.baseurl }}/images/demo_add_images.png">
        <img src="{{ site.baseurl }}/images/demo_add_images.png" style="width:600px"/>
	</a>
  </div>
  <div class="panel-heading">
    <h3 class="panel-title">Adding images from JCB dataviewer to OMERO.figure demo app</h3>
  </div>
</div>

In fact, it's not just the demo app that can add images from publicly available OMERO servers.
The regular OMERO.figure also has this feature (in case you want to do that?!).

Enjoy using the demo app. And watch this space for new ROI features soon, ahead of
their release in OMERO.figure 1.2.0.
