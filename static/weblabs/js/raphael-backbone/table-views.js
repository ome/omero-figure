
// Various Backbone Views for rendering ROIs etc in a table view

/*global Backbone:true */

// Main manager of ROI views for table
var RoiTableViewManager = Backbone.View.extend({
    
    initialize: function(opts) {
        var model = this.model;
        this.model.on("sync", function() {
            model.each(function(roi, i){
                var view = new RoiTableView({model: roi});
                $("#roi_small_table").append(view.render().el);
            });
        });
        this.model.on("add", function(roi){
            var view = new RoiTableView({model: roi});
            $("#roi_small_table").append(view.render().el);
        });
    },
});

var RoiTableView = Backbone.View.extend({
    
    tagName: "tbody",

    //template: _.template($('#item-template').html()),
    
    // events: { },
    
    initialize: function() {
        this.model.on('change', this.render, this);
        
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
    
    create_shape_view: function(shape) {
        
        var view = new TableShapeView({model:shape});
        this.$el.parent().append(view.render().el);
    }
});


var TableShapeView = Backbone.View.extend({
    tagName: "tr",
    
    // For some reason, this can't find the template at this stage (OK at init)
    //template: _.template($('#table_shape-template').html()),

    initialize: function() {
        this.model.on('change', this.render, this);
        this.template = _.template($('#table_shape-template').html());
    },

    events: {
        "click .shape_cell": "select_shape",
    },
    
    select_shape: function() {
        
        var newZ = this.model.get('theZ'),
            newT = this.model.get('theT');
        $("#roi_small_table").trigger("ztChanged", [newZ, newT]);
    },
    
    render: function() {
        // Have to handle potential nulls, since the template doesn't like them!
        var json = this.model.toJSON();
        if (typeof json.theT === "undefined") {
            json.theT = "-";
        }
        if (typeof json.theZ === "undefined") {
            json.theZ = "-";
        }
        var text = this.template(json);
        this.$el.html(text);
        return this;
    }
});