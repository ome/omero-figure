
Development and Contributing to OMERO.figure
============================================

Planning
--------

Before starting to work on a new feature, you are encouraged to create an Issue and to
add some outline of the expected work required. This is helpful to organise your
thoughts but can also allow others to contribute.

Development
-----------

See the [development](https://github.com/ome/omero-figure/blob/master/README.rst#development)
section of the home page for info on getting set up.

Code notes
----------

The JavaScript code is based on the [Backbone.js](http://backbonejs.org/) framework.
We listen for changes to the Model objects, then `render()` the View objects to update the html
using `underscore.js` templates.

All the front-end code is under `/src/` directory. The `index.html` includes the `js/main.js` as
the JavaScript entry point. This sets up all the Backbone.js objects and listens for changes to the
browser history.

`Backbone.sync()` is automatically called by Backbone when you `save()` a Model object. We override
that to set `"unsaved": true` on the `FigureModel` object which enables the `Save` button in the UI.
For this reason, you should always call `save()` when updating the `Model` objects E.g. `panel.save('x', 100)`
instead of `panel.set('x', 100)`. 

The `Undo/Redo` queue is also setup in `main.js`. The `UndoManager` listens for changes to the `FigureModel`
and to it's collection of `PanelModel` objects. When a change is detected, the `UndoManager` adds an `Undo/Redo`
action to the queue. It is therefore important to NOT update any model object (e.g. `panel.set('x': 0)`)
when rendering the UI as this will add to the Undo/Redo queue.

Testing
-------

When testing a new feature, you should check the following steps:

 - Add several panels to the figure, selecting each in turn and check the feature is working
 - For example, editing a particular property of each panel
 - Select several panels at once, each with different values of this property
 - Check it is the displayed correctly and batch-editing is enabled if appropriate
 - Test that Undo and Redo work as expected.
 - Is the Save button enabled when you make a change?
 - If you refresh the page after Saving, does the change persist?
 - When you export the figure to PDF and TIFF, is this feature handled correctly?
 - Make sure the export script can handle panels where this new property is missing: `panel.get('property', default)`

Contributing
------------

Use: `Fixes #123` to reference an issue in the PR description. This will automatically close the issue when the PR is merged.

Adding a screenshot to the PR description can be helpful, both for initial review but also for
users coming to the PR from the release Changelog.