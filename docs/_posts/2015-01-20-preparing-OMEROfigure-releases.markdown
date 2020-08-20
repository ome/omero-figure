---
layout: post
title:  "Preparing for OMERO.figure releases"
date:   2015-01-20
redirect_to:
  - https://github.com/ome/omero-figure/blob/master/docs/_posts/2015-01-20-preparing-OMEROfigure-releases.markdown
---

I don't have a fixed release timetable for OMERO.figure, but I try to
work on it when I can and release as soon as there's enough features to
justify it. Since I've recently added functionality for cropping panels
to ROIs, multi-page figures, scalebar labels and resize by magnification,
it's time to start preparing for the next release, which I expect will be 1.1.

Release candidate build
-----------------------

We can build and deploy the current 'develop' branch to a testing server
using a continuous integration job at [ci.openmicroscopy.org](https://ci.openmicroscopy.org/view/Experimental/job/OMERO-5.0-webfigure/) to allow all team members to test the release candidate.

Testing scenarios
-----------------

The OMERO project has an extensive series of testing scenarios that describe
how each feature of the application can be manually tested.
These have been extended with a comprehensive set of tests for OMERO.figure.
Testing scenarios for the new features will need to be added to the suite
and then the complete release testing can begin.
This disciplined approach ensures that there are no gaps in the testing
and allows the testing to be split up among multiple team members if needed.

Youtube videos
--------------

Preparing video demonstrations is a good way to document
new features. Even though the youtube viewing figures for existing videos have
been a little disappointing, I'm still going to continue the
exercise for future releases because it helps me find bugs.
When developing the application, you tend to simply test the funtionality of
a single button or edit at a time. It's only when you try to demonstrate
the finished feature as part of a realistic scenario that you find
flaws or bugs in the workflow.

Bug fixing
----------

Both of the above exercises will likely find a number of bugs or issues that
need addressing and retesting. Hopefully the whole process will proceed
smoothly and you can look forward to another OMERO.figure release in the near future.
