---
layout: post
title:  "Status update: Summer 2015"
date:   2015-08-03
---

Since the 1.1.1 release in May, a couple of developments in the OMERO.figure
project are worth mentioning:

<h2>Figure moved to OME</h2>

As you may have noticed, the 'figure' repository has changed ownership from
me (Will) to the OME team at [https://github.com/ome/figure](https://github.com/ome/figure).

<blockquote class="twitter-tweet" lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/hashtag/OMERO?src=hash">#OMERO</a>.figure has moved to <a href="http://t.co/l0HsmGyfrF">http://t.co/l0HsmGyfrF</a> and <a href="https://t.co/Rhblqbc7Lv">https://t.co/Rhblqbc7Lv</a>. My &quot;baby&quot; has grown up and been adopted by <a href="https://twitter.com/openmicroscopy">@openmicroscopy</a>!</p>&mdash; Will Moore (@will_j_moore) <a href="https://twitter.com/will_j_moore/status/616373142525726721">July 1, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

This makes it easier for us to include the app in our automated deployment and
testing workflows and is recognition that development and testing of OMERO.figure is now
a team effort.

From now on, individual Pull Requests will be deployed, reviewed, tested and any issues
addressed *before* being merged, in the same way as on all the other OME projects.

The same process applies to the OMERO.figure website (including [this blog post](https://github.com/ome/figure/pull/96)) and the
site has a new, improved url: [figure.openmicroscopy.org](http://figure.openmicroscopy.org),
which you are looking at right now.


<h2>ROI support</h2>

My major focus on OMERO.figure this summer (apart from having some time off) has been
working on the much-requested [support of ROIs](https://github.com/ome/figure/issues/79).

I began by developing the tools for drawing and editing simple shapes on an image.
Lines, Arrows, Rectangles and Ellipses will cover many users' needs, with others to come later.
Surprisingly, I haven't found an existing library for this but rolling my own has the
advantage of building just what I want. I've been using ImageJ as a guide for ROI functionality
(E.g. for the way that ellipses are created) since this is clearly well aligned to
what users want.

<img src="{{ site.baseurl }}/images/simple_shapes.png" style="width:519px; height:520px"/>

However, during this time it became clear that this functionality would be useful on other apps,
such as the main OMERO webclient, which still lacks the ability to edit ROIs.
So I then started porting this code to a [standalone toolkit](https://github.com/will-moore/shape-editor-js)
that doesn't rely on the Backbone.js library on which OMERO.figure is built.
This is not quite finished, but you can [try the demo here](http://will-moore.github.io/shape-editor-js/).

Once this is ready, I will move back to OMERO.figure development.
Initially the focus will be a dialog box that shows a 'full image viewer' with the ability
to draw and edit simple shapes that are then displayed in the figure.
A crucial part of this functionality will be the ability to add shapes to exported figures, both in
the PDF and TIFF formats.
Ideally ROIs will be kept as atomic entities in the PDF figures, allowing them to be
individually edited in vector-based tools such as Adobe Illustrator. However, this may
be a little challenging, so we'll have to see.

This core functionality will be enough to justify a major release. Following minor
releases will add the ability to copy and paste ROIs between image panels and read &
write ROIs from OMERO.
The schedule will depend on how long it takes to get the basic workflow complete,
and the time available during the main [OMERO 5.1.4](https://trello.com/b/elylnkWf/omero-5-1-4)
and [5.2](https://trello.com/b/Y5vC8ceF/omero-5-2-0) releases. Hopefully we'll
have something out about the same time as OMERO 5.1.4, due in September.
Thanks for your patience!

 - Will Moore
