

var RoiModalView = Backbone.View.extend({

        template: JST["static/figure/templates/shapes/shape_toolbar_template.html"],

        el: $("#roiModal"),

        model:FigureModel,

        initialize: function() {

            var self = this;

            // Here we handle init of the dialog when it's shown...
            $("#roiModal").bind("show.bs.modal", function(){
                // Clone the 'first' selected panel as our reference for everything
                self.m = self.model.getSelected().head().clone();
                self.listenTo(self.m, 'change:theZ change:theT', self.render);

                // TODO: load any existing shapes on selected panel
                // self.shapeManager.deleteAll();
                self.shapeManager.setState("ARROW");

                self.render();

                // disable submit until user chooses a region/ROI
                self.enableSubmit(false);
            });

            this.shapeManager = new ShapeManager("roi_paper", 1, 1);

            this.$roiImg = $('.roi_image', this.$el);
        },

        events: {
            "submit .roiModalForm": "handleRoiForm",
            "click .shape-option .btn": "selectState",
            "click .select-btn": "selectState",
            "click .dropdown-menu a": "select_dropdown_option",
            "change .line-width": "changeLineWidth",
            "change .shape-color": "changeColor",
            // shapeManager triggers on canvas element
            "change:selected .roi_paper": "shapeSelected",
        },

        shapeSelected: function() {
            // simply re-render toolbar
            this.renderToolbar();
        },

        changeLineWidth: function(event) {
            var lineWidth = $("span:first", event.target).attr('data-line-width');
            lineWidth = parseInt(lineWidth, 10);
            this.shapeManager.setLineWidth(lineWidth);
        },

        changeColor: function(event) {
            var color = $("span:first", event.target).attr('data-color');
            this.shapeManager.setColor(color);
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

        selectState: function(event) {
            var $target = $(event.target),
                newState = $target.attr('data-state');
            if (newState === undefined) {
                // in case we clicked 'span'
                newState = $target.parent().attr('data-state');
            }
            this.shapeManager.setState(newState);
            this.renderToolbar();
        },

        // we disable Submit when dialog is shown, enable when region/ROI chosen
        enableSubmit: function(enabled) {
            var $okBtn = $('button[type="submit"]', this.$el);
            if (enabled) {
                $okBtn.prop('disabled', false);
                $okBtn.prop('title', 'Crop selected images to chosen region');
            } else {
                $okBtn.prop('disabled', 'disabled');
                $okBtn.prop('title', 'No valid region selected');
            }
        },

        renderToolbar: function() {
            // render toolbar
            var state = this.shapeManager.getState(),
                lineW = this.shapeManager.getLineWidth(),
                color = this.shapeManager.getColor(),
                scale = this.zoom;
            var json = {'state': state,
                        'lineWidth': lineW,
                        'color': color,
                        'zoom': parseInt(scale * 100, 10)};
            $(".roi_toolbar", this.$el).html(this.template(json));
        },

        render: function() {

            var src = this.m.get_img_src();

            var maxSize = 450,
                frame_w = maxSize,
                frame_h = maxSize,
                wh = this.m.get('width') / this.m.get('height');
            if (wh <= 1) {
                frame_h = maxSize;
                frame_w = maxSize * wh;
            } else {
                frame_w = maxSize;
                frame_h = maxSize / wh;
            }

            var c = this.m.get_vp_img_css(this.m.get('zoom'), frame_w, frame_h, this.m.get('dx'), this.m.get('dy'));

            var w = this.m.get('orig_width'),
                h = this.m.get('orig_height');
            var scale = c.width / w;
            // TODO: add public methods to set w & h
            this.shapeManager._orig_width = w;
            this.shapeManager._orig_height = h;
            this.shapeManager.setZoom(scale * 100);

            var css = {
                "left": c.left + "px",
                "top": c.top + "px",
                "width": c.width + "px",
                "height": c.height + "px",
                "-webkit-transform-origin": c['transform-origin'],
                "transform-origin": c['transform-origin'],
                "-webkit-transform": c.transform,
                "transform": c.transform
            }
            this.$roiImg.css(css)
                .attr('src', src);

            $("#roi_paper").css(css);

            $("#roiViewer").css({'width': frame_w + 'px', 'height': frame_h + 'px'});

            this.renderToolbar();
        }
    });
