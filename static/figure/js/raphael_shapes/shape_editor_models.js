
// Editor Model to coordinate State of Editor (drawing mode, colour etc)

var ShapeEditor = Backbone.Model.extend({

    defaults: {
        state: "SELECT",
    },

    setState: function setState(state) {

        var states = ["SELECT", "PAN", "RECT", "LINE"];  //etc
        if (states.indexOf(state) > -1) {
            this.set('state', state);
        } else {
            throw new Error("Not valid state: " + state);
        }
    }
});


// Shape Models & List

var Shape = Backbone.Model.extend({

    initialize: function() {
        this.listenTo(this, 'drag_xy_stop', function(args) {
            this.set({'x': args[0] + this.get('x'), 'y': args[1] + this.get('y')});
        });
        this.listenTo(this, 'drag_resize_stop', function(args) {
            this.set({'x': args[0], 'y': args[1], 'width': args[2], 'height': args[3]});
        });
    }
});


var ShapeList = Backbone.Collection.extend({

    model: Shape,

    initialize: function() {
        var self = this;
        this.listenTo(this, 'add', function(model, list, event) {
            this.listenTo(model, 'clicked', function(m){
                console.log('clicked', arguments);
                self.clearSelected();
                model.set('selected', true);
            });
        });
    },

    clearSelected: function() {
        this.forEach(function(m){
            m.set('selected', false);
        });
    }

});

