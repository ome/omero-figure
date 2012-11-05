// --------------------------------- MODELS --------------------------


// ------------------- Base Shape ------------------------
// This is purely a holder for Shape data, including 'type':'Rectangle' etc.
// All this data is handled by the View to Create correct UI.

var Shape = Backbone.Model.extend({
});

// ------------------------ Shape COLLECTION (used in ROI model)-------------------------

var ShapeList = Backbone.Collection.extend({
    model: Shape,
    url: "fake"
});


// ------------------ ROI ---------------------------

var ROI = Backbone.Model.extend({
    initialize: function() {
        this.shapes = new ShapeList;
    }
});

