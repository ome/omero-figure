// --------------------------------- MODELS --------------------------


// ------------------- Base Shape ------------------------

var Shape = Backbone.Model.extend({
    initialize: function() {
        //console.log("Shape initialize");
        //if (!this.get("title")) {
        //this.set({"title": this.defaults().title});
        //}
    },
    
    show: function() {
        //console.log("Shape show");
        //this.save({active: !this.get("active")});
        //this.set({active: !this.get("active")});
    },
});

// ------------------------ Shape COLLECTION (used in ROI model)-------------------------

var ShapeList = Backbone.Collection.extend({
    model: Shape,
    url: "fake"
});

// ---------------------- Shape Instances -----------------------

var Rect = Shape.extend({

    // Default attributes for Rect
    defaults: function() {
        return {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        };
    },

    // Ensure that each rect created has....
    initialize: function() {
        //console.log("Rect initialize");
        //if (!this.get("title")) {
        //this.set({"title": this.defaults().title});
        //}
    },

});

var Ellipse = Shape.extend({

    // Default attributes for Rect
    defaults: function() {
        return {
            x: 100,
            y: 100,
            rx: 50,
            ry: 75
        };
    },

    // Ensure that each rect created has....
    initialize: function() {
        //console.log("Ellipse initialize");
        //if (!this.get("title")) {
        //this.set({"title": this.defaults().title});
        //}
    },

});


// ------------------ ROI ---------------------------

var ROI = Backbone.Model.extend({
    initialize: function() {
        this.shapes = new ShapeList;
    },
    addRect: function(attrs) {
        var r = new Rect(attrs);
        this.shapes.add(r);
    },
    addEllipse: function(attrs) {
        var e = new Ellipse(attrs);
        this.shapes.add(e);
    }
});

