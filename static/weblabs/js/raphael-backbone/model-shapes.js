// --------------------------------- MODELS --------------------------


// ------------------- Base Shape ------------------------
// This is purely a holder for Shape data, including 'type':'Rectangle' etc.
// All this data is handled by the View to Create correct UI.

var Shape = Backbone.Model.extend({
    initialize: function() {
        console.log("Shape initialize");
    }
});

// ------------------------ Shape COLLECTION (used in ROI model)-------------------------

var ShapeList = Backbone.Collection.extend({
    model: Shape
});


// ------------------ ROI ---------------------------

var ROI = Backbone.Model.extend({
    initialize: function() {
        console.log("ROI initialize");
        this.shapes = new ShapeList(this.get("shapes"));
    }
});

// --Handy reference: http://www.deploymentzone.com/2011/08/10/backbone-js-collections-of-models-within-models/
var RoiList = Backbone.Collection.extend({
    model: ROI,
});