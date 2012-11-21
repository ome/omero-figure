// --------------------------------- MODELS --------------------------
/*global Backbone:true */

// ------------------- Base Shape ------------------------
// This is purely a holder for Shape data, including 'type':'Rectangle' etc.
// All this data is handled by the View to Create correct UI.

var Shape = Backbone.Model.extend({
    initialize: function() {
    }
});

// ------------------------ Shape COLLECTION (used in ROI model)-------------------------

var ShapeList = Backbone.Collection.extend({
    model: Shape,
    url: "fake"
});


// ------------------ ROI ---------------------------

var ROI = Backbone.Model.extend({
    initialize: function() {
        this.shapes = new ShapeList(this.get("shapes"));
        var that = this;
        
        // we notify ROI of changes to Shapes, for Undo etc.
        this.shapes.on("change", function(shape, attr) {
            that.trigger("change", shape, attr);
        });
    }
});

// --Handy reference: http://www.deploymentzone.com/2011/08/10/backbone-js-collections-of-models-within-models/
var RoiList = Backbone.Collection.extend({
    model: ROI,
});