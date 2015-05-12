var ShapeListView = Backbone.View.extend({

    el: $("#shapeList"),

    initialize:function () {
        // we automatically 'sort' on fetch, add etc.
        this.model.bind("sync add remove", this.render, this);
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
        console.log("ShapeListView.render()");
        var self = this;

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
        this.model.bind("change", this.render, this);
        // this.model.bind("destroy", this.close, this);
    },

    events: {
        // "click a": "hide_file_chooser"
    },

    render:function () {
        var json = this.model.toJSON();
        console.log(json);
        var h = this.template(json);
        $(this.el).html(h);
        return this;
    }

});