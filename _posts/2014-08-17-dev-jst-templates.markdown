---
layout: post
title:  "Dev: Removing my backbone.js templates from index.html"
---

<img src="http://will-moore.github.io/figure/images/PanelSpecRunner.png" 
	style="width:600px"/>

One of the [bug fixes](https://github.com/will-moore/figure/commit/89d7340)
for the last release required me to test the image viewer in isolation (see screenshot above).
I needed to quickly test different image widths, heights, offsets and rotation.
However, the html template for the viewer was embedded with all the other templates
in <code style="display:inline">script</code> tags within the index.html page. This meant that it wasn't available
to use on a dedicated test page without copying and pasting the code elsewhere.

Googling for "backbone templates in separate files" led me to this [stack overflow answer](http://stackoverflow.com/questions/8366733/external-template-in-underscore)
which recommended the use of "a grunt task (grunt-contrib-jst) to compile all of the HTML templates into a single templates.js file".
So that's what I did. Now all the html templates live under [static/figure/templates](https://github.com/will-moore/figure/tree/develop/static/figure/templates) and are compiled into a single [templates.js file](static/figure/js/templates.js) by a grunt 'jst' task.

I also added a grunt 'watch' task to monitor changes to any of the template files and recompile
them all if any changes are saved. So if you are editing any templates you need to have '$ grunt watch'
running on the command line. All that is configured in the [Gruntfile.js ](https://github.com/will-moore/figure/blob/develop/Gruntfile.js).

Most importantly, this allowed me to create the viewer test page and to fix the bug,
but it also means that the templates are
easier to find and edit now, instead of being lost in one massive html file.
