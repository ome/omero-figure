
// Editor Model to coordinate State of Editor (drawing mode, colour etc)

var ShapeEditor = Backbone.Model.extend({

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

});


var ShapeList = Backbone.Collection.extend({

    model: Shape,

});

