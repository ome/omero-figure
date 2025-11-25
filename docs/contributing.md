
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
The majority of the UI code is in Backbone `View` objects. These objects render html using
`underscore.js` templates and then use `jQuery` to update the DOM with the html.
The `View` objects get the data to render from a single `FigureModel` instance and its associated
collection of `PanelModel` objects.
The `View` code saves changes to the Model objects in response to user events, and the View objects
also listen for changes to these Model objects, then re-render to update the page.

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

Dev server and build
--------------------

See [development](https://github.com/ome/omero-figure?tab=readme-ov-file#development) section for
development and build commands.
You should edit the code under `src/` such as the main `index.html` page, `underscore.js` templates and `js` code. Do not modify files under `omero_figure/static` and `omero_figure/template`, as they are created during the build process.

The application can be served from the `vite.js` dev server during development at `http://localhost:8080/`.
This includes "hot module reload" of edited code without needing to refresh the page.
However, the app doesn't have any OMERO server context when it is served like this, such as the logged-in user details.
For this reason, some features won't work as expected, such as the default filtering of Files by user.
The app can `GET` data via a cross-origin request to your `omero-web` server at `http://localhost:4080/`
(this URL can be edited in `index.html`). However, cross-origin `POST` requests are not expected to work.

When the compiled html is served by the `omero-web` OMERO.figure app, we use simple `string.replace()`
to inject OMERO server information into the `index.html` page. This includes the logged-in user details,
the omero-web server address and various config values.

Figure_To_Pdf export script
---------------------------

We use an OMERO.server python script to generate `PDF` and `TIFF` figures from the figure JSON data.
This script is located under `omero_figure/scripts/omero/figure_scripts`. If modified, and to test changes, you can replace the script [as described here](https://github.com/ome/omero-figure?tab=readme-ov-file#upgrading-omerofigure).

Testing
-------

When testing a new feature, you should check the following steps:

 - Run `$ npm build` and test from your `omero-web` deployment instead of the `vite.js` dev server.
 - Check that you can open old figures (created before your feature was added).
 - Add several panels to the figure, selecting each in turn and check the feature is working (for example, editing a particular property of each panel).
 - Select several panels at once, each with different values of this property.
 - Check it is the displayed correctly and batch-editing is enabled if appropriate.
 - Test that Undo and Redo work as expected.
 - Is the Save button enabled when you make a change?
 - If you refresh the page after Saving, does the change persist?
 - When you export the figure to PDF and TIFF, is this feature handled correctly?
 - Make sure the export script can handle panels where this new property is missing: E.g. use `panel.get('property', default)`.

Contributing
------------

Use: `Fixes #123` to reference an issue in the PR description. This will automatically close the issue when the PR is merged.

Adding a screenshot to the PR description can be helpful, both for initial review but also for
users coming to the PR from the release Changelog.