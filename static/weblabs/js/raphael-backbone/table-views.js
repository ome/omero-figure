
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
    
    tagName: "tr",

    //template: _.template($('#item-template').html()),
    
    // events: { },
    
    initialize: function() {
        this.model.on('change', this.render, this);
    },
    
    render: function() {
      this.$el.html("ROI " + this.model.get('id'));
      return this;
    },
});