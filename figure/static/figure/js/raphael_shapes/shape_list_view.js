
// Views 

var ShapeListView = Backbone.View.extend({

    el: $("#shapeList"),

    initialize:function () {

        this.listenTo(this.model, 'sync add remove', this.render);
    },

    events: {
        // "click .sort-created": "sort_created",
        // "click .sort-created-reverse": "sort_created_reverse",
        // "click .sort-name": "sort_name",
        // "click .sort-name-reverse": "sort_name_reverse",
        // "click .pick-owner": "pick_owner",
        // "keyup #file-filter": "filter_files",
        // "click .refresh-files": "refresh_files",
    },

    render:function () {
        var self = this;

        self.$el.empty();

        _.each(this.model.models, function (shape) {
            var e = new ShapeListItemView({model:shape}).render().el;
            self.$el.append(e);
        });
        return this;
    }
});

var ShapeListItemView = Backbone.View.extend({

    tagName:"div",

    template: JST["static/figure/templates/shapes/shape_item_template.html"],

    initialize:function () {
        this.listenTo(this.model, "change", this.render);
        // this.model.bind("destroy", this.close, this);
    },

    events: {
        // "click a": "hide_file_chooser"
    },

    render:function () {
        var json = this.model.toJSON();
        var h = this.template(json);
        $(this.el).html(h);
        return this;
    }

});