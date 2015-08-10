

var RoiModalView = Backbone.View.extend({

        el: $("#roiModal"),

        // template: JST["static/figure/templates/paper_setup_modal_template.html"],
        // template: JST["static/figure/templates/modal_dialogs/roi_modal_template.html"],
        // roiTemplate: JST["static/figure/templates/modal_dialogs/roi_modal_roi.html"],

        model:FigureModel,

        initialize: function() {

            var self = this;

            // Here we handle init of the dialog when it's shown...
            $("#roiModal").bind("show.bs.modal", function(){
                // Clone the 'first' selected panel as our reference for everything
                self.m = self.model.getSelected().head().clone();
                self.listenTo(self.m, 'change:theZ change:theT', self.render);

                self.zoomToFit();  // includes render()

                // disable submit until user chooses a region/ROI
                self.enableSubmit(false);
            });

            // Now set up Raphael paper...
            this.paper = Raphael("roi_paper", 500, 500);

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
            this.setZoom(scale * 100);
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

            this.paper.setSize(newW, newH);
            $("#roi_paper").css({'height': newH, 'width': newW});

            this.$roiImg.css({'height': newH, 'width': newW})
                    .attr('src', src);
        }
    });
