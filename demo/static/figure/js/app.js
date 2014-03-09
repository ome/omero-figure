
$(function(){

    var figureModel = new FigureModel();

    // var figureFiles = new FileList();
    // figureFiles.fetch();

    // Backbone.unsaveSync = function(method, model, options, error) {
    //     figureModel.set("unsaved", true);
    // };

    // Override 'Backbone.sync'...
    Backbone.ajaxSync = Backbone.sync;

    Backbone.getSyncMethod = function(model) {
        if(model.syncOverride || (model.collection && model.collection.syncOverride))
        {
            return function(method, model, options, error) {
                figureModel.set("unsaved", true);
            };
        }
        return Backbone.ajaxSync;
    };

    // Override 'Backbone.sync' to default to localSync,
    // the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
    Backbone.sync = function(method, model, options, error) {
        return Backbone.getSyncMethod(model).apply(this, [method, model, options, error]);
    };


    var view = new FigureView( {model: figureModel});   // uiState: uiState
    var svgView = new SvgView( {model: figureModel});
    new RightPanelView({model: figureModel});


    // Undo Model and View
    var undoManager = new UndoManager({'figureModel':figureModel}),
    undoView = new UndoView({model:undoManager});
    // Finally, start listening for changes to panels
    undoManager.listenToCollection(figureModel.panels);


    var FigureRouter = Backbone.Router.extend({

        routes: {
            "": "index",
            "new(/)": "newFigure",
            "file/:id(/)": "loadFigure",
        },

        checkSaveAndClear: function(callback) {

            var doClear = function() {
                figureModel.clearFigure();
                if (callback) {
                    callback();
                }
            };
            if (figureModel.get("unsaved")) {

                // show the confirm dialog...
                figureConfirmDialog("Save Changes to Figure?",
                    "Your changes will be lost if you don't save them",
                    ["Don't Save", "Save"],
                    function(btnTxt){
                        if (btnTxt === "Save") {
                             var options = {};
                            // Save current figure or New figure...
                            var fileId = figureModel.get('fileId');
                            if (fileId) {
                                options.fileId = fileId;
                            } else {
                                var figureName = prompt("Enter Figure Name", "unsaved");
                                options.figureName = figureName || "unsaved";
                            }
                            options.success = doClear;
                            figureModel.save_to_OMERO(options);
                        } else if (btnTxt === "Don't Save") {
                            figureModel.set("unsaved", false);
                            doClear();
                        } else {
                            doClear();
                        }
                    });
            } else {
                doClear();
            }
        },

        index: function() {
            $(".modal").modal('hide'); // hide any existing dialogs
            var cb = function() {
                $('#welcomeModal').modal();
            };
            this.checkSaveAndClear(cb);
        },

        newFigure: function() {
            var cb = function() {
                $('#addImagesModal').modal();
            };
            this.checkSaveAndClear(cb);
         },

        loadFigure: function(id) {
            $(".modal").modal('hide'); // hide any existing dialogs
            var fileId = parseInt(id, 10);
            var cb = function() {
                figureModel.load_from_OMERO(fileId);
            };
            this.checkSaveAndClear(cb);
        }
    });

    app = new FigureRouter();
    Backbone.history.start();

    // We want 'a' links (E.g. to open_figure) to use app.navigate
    $(document).on('click', 'a', function (ev) {
        var href = $(this).attr('href');
        // check that links are 'internal' to this app
        if (href.substring(0, 8) === '/figure/') {
            ev.preventDefault();
            href = href.replace('/figure', "");
            app.navigate(href, {trigger: true});
        }
    });

});
