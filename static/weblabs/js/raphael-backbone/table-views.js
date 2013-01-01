
// Various Backbone Views for rendering ROI and Shapes in a table view
// NB: we have a uiState object passed all the way down to Shape Views,
// so that when a shape 'row' is clicked, it can set theZ and theT etc.

/*global Backbone:true */
/*global _:true */

// Main manager of ROI views for table.
// Simply creates new RoiTableView objects for the ROI model.
var RoiTableViewManager = Backbone.View.extend({

    initialize: function(opts) {
        var model = this.model;
        // coordinate theZ, theT, selectedShape etc.
        this.uiState = opts.uiState;

        this.model.on("sync", function() {
            model.each(function(roi, i){
                var view = new RoiTableView({model: roi, uiState:opts.uiState});
                $("#roi_small_table").append(view.render().el);
            });
        });
        this.model.on("add", function(roi){
            var view = new RoiTableView({model: roi, uiState:opts.uiState});
            $("#roi_small_table").append(view.render().el);
        });
    }
});


// We have a <tbody> for each ROI, with a <tr> for the ROI details.
// Shapes are added as sibling <tr> elements.
var RoiTableView = Backbone.View.extend({

    tagName: "tbody",

    initialize: function(opts) {
        this.uiState = opts.uiState;
        this.model.on('change', this.render, this);

        // The element that is 'rendered' for the ROI is the <tr>
        this.$el = $("<tr></tr>").appendTo(this.$el);

        var self = this;
        // Add Views for any existing shapes models
        this.model.shapes.each(function(shape) {
            self.create_shape_view(shape);
        });

        // If a shape is added, Create View for that too
        this.model.shapes.on("add", function(shape) {
            self.create_shape_view(shape);
        });
    },

    render: function() {
      this.$el.html("<td>ROI " + this.model.get('id') + "</td>");
      return this;
    },

    // When we create a Shape View, we add it's 'tr' element to the 'tbody'
    create_shape_view: function(shape) {
        var view = new TableShapeView({model:shape, uiState:this.uiState});
        this.$el.parent().append(view.render().el);
    }
});


// A Shape is a <tr>, added to the <tbody> by the ROI view above.
var TableShapeView = Backbone.View.extend({
    tagName: "tr",

    // For some reason, this can't find the template at this stage (OK at init)
    //template: _.template($('#table_shape-template').html()),

    initialize: function(opts) {
        this.uiState = opts.uiState;
        // we render on Changes in the model OR selected shape etc.
        this.model.on('change', this.render, this);
        this.uiState.on('change', this.render, this);
        this.template = _.template($('#table_shape-template').html());
    },

    events: {
        "click .shape_cell": "select_shape"
    },


    // When we select a shape, we need to update Z, T and shape_id
    select_shape: function() {
        var newZ = this.model.get('theZ'),
            newT = this.model.get('theT'),
            selId = this.model.get('id');

        // The uiState is a Backbone Model that is never saved to server
        this.uiState.set('theZ', newZ);
        this.uiState.set('theT', newT);
        this.uiState.set('selectedShape', selId);
    },

    render: function() {
        // Have to handle potential nulls, since the template doesn't like them!
        var json = this.model.toJSON();
        if (typeof json.theT === "undefined") {
            json.theT = "-";
        } else {
            json.theT += 1;     // For display, we need 1-based Z & T indices
        }
        if (typeof json.theZ === "undefined") {
            json.theZ = "-";
        } else {
            json.theZ += 1;
        }
        var text = this.template(json);
        this.$el.html(text);
        if (this.uiState.get('selectedShape') === this.model.get('id')) {
            this.$el.addClass('selected');
        } else {
            this.$el.removeClass('selected');
        }
        return this;
    }
});