

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
        console.log("handleSelectBtn");
        this.shapeEditor.setState("SELECT");
    },

    handleLineBtn: function() {
        console.log("handleLineBtn");
        this.shapeEditor.setState("LINE");
    },

    handleRectBtn: function() {
        console.log("handleRectBtn");
        this.shapeEditor.setState("RECT");
    },


    render: function render() {

        $("#shapes_toolbar").html(this.template({}));
    }
});
