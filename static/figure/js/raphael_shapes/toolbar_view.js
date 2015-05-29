

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
        "click .rect-btn": "handleRectBtn",
        "click .arrow-btn": "handleArrowBtn",
        "click .ellipse-btn": "handleEllipseBtn",
        "click .dropdown-menu a": "select_dropdown_option",
        "change .shape-color": "colorChange",
        "change .line-width": "lineWidthChange",
    },

    lineWidthChange: function(event) {
        var lineWidth = $("span:first", event.target).attr('data-line-width');
        this.shapeEditor.setLineWidth(lineWidth);
    },

    colorChange: function(event) {
        var color = $("span:first", event.target).attr('data-color');
        this.shapeEditor.setColor(color);
    },

    // Handles all the various drop-down menus in the toolbar
    select_dropdown_option: function(event) {
        event.preventDefault();
        var $a = $(event.target),
            $span = $a.children('span');
        // For the Label Text, handle this differently...
        if ($a.attr('data-label')) {
            $('.new-label-form .label-text', this.$el).val( $a.attr('data-label') );
        }
        // All others, we take the <span> from the <a> and place it in the <button>
        if ($span.length === 0) $span = $a;  // in case we clicked on <span>
        var $li = $span.parent().parent(),
            $button = $li.parent().prev();
        $span = $span.clone();

        if ($span.hasClass('colorpickerOption')) {
            var oldcolor = $a.attr('data-oldcolor');
            FigureColorPicker.show({
                'color': oldcolor,
                'success': function(newColor){
                    $span.css({'background-color': newColor, 'background-image': 'none'});
                    // remove # from E.g. #ff00ff
                    newColor = newColor.replace("#", "");
                    $span.attr('data-color', newColor);
                    $('span:first', $button).replaceWith($span);
                    // can listen for this if we want to 'submit' etc
                    $button.trigger('change');
                }
            });
        } else {
            $('span:first', $button).replaceWith($span);
            if ($span.prop('title')) {
                $button.prop('title', $span.prop('title'));
            }
            $button.trigger('change');      // can listen for this if we want to 'submit' etc
        }
    },

    handleSelectBtn: function() {
        this.shapeEditor.setState("SELECT");
    },

    handleLineBtn: function() {
        // maybe the shapeEditor should know about the shapesList model
        // then it could handle the clearSelected() itself?
        this.shapeEditor.setState("LINE");
    },

    handleRectBtn: function() {
        this.shapeEditor.setState("RECT");
    },

    handleArrowBtn: function() {
        this.shapeEditor.setState("ARROW");
    },

    handleEllipseBtn: function() {
        this.shapeEditor.setState("ELLIPSE");
    },

    render: function render() {

        var json = this.shapeEditor.toJSON();
        $("#shapes_toolbar").html(this.template(json));
    }
});
