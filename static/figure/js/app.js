
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
            "new": "newFigure",
            "figure/:id": "loadFigure"
        },

        clearFigure: function(callback) {

            var doClear = function() {
                figureModel.unset('fileId');
                figureModel.delete_all();
                figureModel.unset("figureName");
                figureModel.trigger('reset_undo_redo');
                if (callback) {
                    callback();
                }
            };

            $(".modal").modal('hide'); // hide any existing dialogs

            // Arrive at 'home' page, either starting here OR we hit 'new' figure...
            // ...so start by clearing any existing Figure (save first if needed)
            var self = this;
            if (figureModel.get("unsaved")) {

                // show the confirm dialog...
                $("#confirmModal").modal();

                // default handler for 'cancel' or 'close'
                $('#confirmModal').one('hide.bs.modal', function() {
                    // remove the other 'one' handler below
                    $("#confirmModal [type='submit']").off('click');
                    doClear();  // carry-on with clearing
                });

                // handle 'Save' btn click.
                $("#confirmModal [type='submit']").one('click', function() {
                    // remove the default 'one' handler above
                    $('#confirmModal').off('hide.bs.modal');
                    var options = {};
                    // Save current figure or New figure...
                    var fileId = figureModel.get('fileId');
                    if (fileId) {
                        options.fileId = fileId;
                    } else {
                        var figureName = prompt("Enter Figure Name", "unsaved");
                        options.figureName = figureName || "unsaved";
                    }
                    figureModel.save_to_OMERO(options, doClear);
                });
            } else {
                doClear();
            }

            return true;
        },

        index: function() {
            var cb = function() {
                $('#welcomeModal').modal();
            };
            this.clearFigure(cb);
        },

        newFigure: function() {
            var cb = function() {
                $('#addImagesModal').modal();
            };
            this.clearFigure(cb);
        },

        loadFigure: function(id) {

            var fileId = parseInt(id, 10);
            var cb = function() {
                figureModel.load_from_OMERO(fileId);
            };
            this.clearFigure(cb);
        }
    });

    app = new FigureRouter();
    Backbone.history.start();

});
