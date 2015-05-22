

var ShapeToolbarView = Backbone.View.extend({

    el: $("#shapes_toolbar"),

    template: JST["static/figure/templates/shapes/shape_toolbar_template.html"],

    initialize: function(options) {

        var self = this;

        this.shapeEditor = options.shapeEditor;
        this.listenTo(this.shapeEditor, 'change', this.render);

        this.render();
    },

    events: {
        "click .select-btn": "handleSelectBtn",
        "click .line-btn": "handleLineBtn",
        "click .rect-btn": "handleRectBtn"
    },

    handleSelectBtn: function() {
        this.shapeEditor.setState("SELECT");
    },

    handleLineBtn: function() {
        // maybe the shapeEditor should know about the shapesList model
        // then it could handle the clearSelected() itself?
        this.model.clearSelected();
        this.shapeEditor.setState("LINE");
    },

    handleRectBtn: function() {
        this.model.clearSelected();
        this.shapeEditor.setState("RECT");
    },


    render: function render() {

        var json = this.shapeEditor.toJSON();
        $("#shapes_toolbar").html(this.template(json));
    }
});
