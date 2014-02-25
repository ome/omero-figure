
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
            "figure/:id(/)": "loadFigure",
        },

        index: function() {
            $(".modal").modal('hide'); // hide any existing dialogs
            var cb = function() {
                $('#welcomeModal').modal();
            };
            figureModel.clearFigure(cb);
        },

        newFigure: function() {
            var cb = function() {
                $('#addImagesModal').modal();
            };
            figureModel.clearFigure(cb);
         },

        loadFigure: function(id) {
            $(".modal").modal('hide'); // hide any existing dialogs
            var fileId = parseInt(id, 10);
            var cb = function() {
                figureModel.load_from_OMERO(fileId);
            };
            figureModel.clearFigure(cb);
        }
    });

    app = new FigureRouter();
    Backbone.history.start({pushState: true, root:'/figure/'});

});
