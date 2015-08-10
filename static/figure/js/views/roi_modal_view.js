

var RoiModalView = Backbone.View.extend({

        el: $("#roiModal"),

        model:FigureModel,

        initialize: function() {

            var self = this;

            // Here we handle init of the dialog when it's shown...
            $("#roiModal").bind("show.bs.modal", function(){
                // Clone the 'first' selected panel as our reference for everything
                self.m = self.model.getSelected().head().clone();
                self.listenTo(self.m, 'change:theZ change:theT', self.render);

                self.zoomToFit();  // includes render()

                // TODO: load any existing shapes on selected panel
                // self.shapeManager.deleteAll();
                self.shapeManager.setState("ELLIPSE");

                // disable submit until user chooses a region/ROI
                self.enableSubmit(false);
            });

            this.shapeManager = new ShapeManager("roi_paper", 1, 1);

            this.$roiImg = $('.roi_image', this.$el);
        },

        events: {
            "submit .roiModalForm": "handleRoiForm"
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

        zoomToFit: function() {
            var $roiViewer = $("#roiViewer"),
                viewer_w = $roiViewer.width(),
                viewer_h = $roiViewer.height(),
                w = this.m.get('orig_width'),
                h = this.m.get('orig_height');
                scale = Math.min(viewer_w/w, viewer_h/h);
            // TODO: add public methods to set w & h
            this.shapeManager._orig_width = w;
            this.shapeManager._orig_height = h;
            this.setZoom(scale * 100);
            this.shapeManager.setZoom(scale * 100);
        },

        setZoom: function(percent) {
            this.zoom = percent;
            this.render();
        },

        render: function() {
            var scale = this.zoom / 100,
                w = this.m.get('orig_width'),
                h = this.m.get('orig_height');
            var newW = w * scale,
                newH = h * scale;
            var src = this.m.get_img_src();

            this.$roiImg.css({'height': newH, 'width': newW})
                    .attr('src', src);
        }
    });
