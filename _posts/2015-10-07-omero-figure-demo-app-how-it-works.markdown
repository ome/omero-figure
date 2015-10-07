---
layout: post
title:  "OMERO.figure demo app: How it works and user guide"
date:   2015-10-07
---

If you want to try using OMERO.figure without installing the app or the OMERO server,
you can simply visit the demo site at http://figure.openmicroscopy.org/demo/

So how does the demo work, and what OMERO server does it use?

<h2>OMERO.figure overview</h2>

OMERO.figure is basically a bunch of html and javascript that runs in your browser, getting
data and images from an OMERO server.

It can also use the OMERO server to save the figure file and export the figure as PDF.


<div class="panel panel-default">
  <div class="panel-body" style="padding:0; text-align: center">
    <img src="{{ site.baseurl }}/images/OMERO.figure_app.png" style="width:600px"/>
  </div>
  <div class="panel-heading">
    <h3 class="panel-title">OMERO.figure reads image data from OMERO, and can save figure files and PDFs</h3>
  </div>
</div>

However, OMERO.figure doesn't **HAVE** to get data from it's "host" OMERO server. It
can get data from any OMERO server that it has access to.

The demo app doesn't have a "host" OMERO server. The html and javascript are simply come from the 
figure.openmicroscopy web site (which is hosted by github). The demo app 
typically gets it's data from the JCB dataviewer, which is a public
image repository built with OMERO.

<div class="panel panel-default">
  <div class="panel-body" style="padding:0; text-align: center">
    <img src="{{ site.baseurl }}/images/OMERO.figure_demo.png" style="width:600px"/>
  </div>
  <div class="panel-heading">
    <h3 class="panel-title">The demo app reads image data from the OMERO-based JCB dataviewer</h3>
  </div>
</div>

