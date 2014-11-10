

var RoiModalView = Backbone.View.extend({

        el: $("#roiModal"),

        // template: JST["static/figure/templates/paper_setup_modal_template.html"],
        template: JST["static/figure/templates/roi_modal_template.html"],

        model:FigureModel,

        initialize: function() {

            var self = this;
            $("#roiModal").bind("show.bs.modal", function(){
                self.render();
            });

        },

        events: {
            "mousedown svg": "mousedown",
            "mousemove svg": "mousemove",
            "mouseup svg": "mouseup",
            "submit .roiModalForm": "handleRoiForm"
        },

        handleRoiForm: function(event) {
            event.preventDefault();
            // var json = this.processForm();
            var c = this.cropModel,
                roiX = c.get('x'),
                roiY = c.get('y'),
                roiW = c.get('width'),
                roiH = c.get('height');
            this.model.getSelected().each(function(m){
                m.cropToRoi({'x': roiX, 'y': roiY, 'width': roiW, 'height': roiH});
            });
            $("#roiModal").modal('hide');
        },

        mousedown: function(event) {
            this.dragging = true;
            var os = $(event.target).offset();
            this.clientX_start = event.clientX;
            this.clientY_start = event.clientY;
            this.imageX_start = this.clientX_start - os.left;
            this.imageY_start = this.clientY_start - os.top;
            this.cropModel.set({'x': this.imageX_start, 'y': this.imageY_start, 'width': 0, 'height': 0})
            return false;
        },

        mouseup: function(event) {
            if (this.dragging) {
                this.dragging = false;
                return false;
            }
        },

        mousemove: function(event) {
            if (this.dragging) {
                var dx = event.clientX - this.clientX_start,
                    dy = event.clientY - this.clientY_start;
                var negX = Math.min(0, dx),
                    negY = Math.min(0, dy);
                this.cropModel.set({'x': this.imageX_start + negX,
                    'y': this.imageY_start + negY,
                    'width': Math.abs(dx), 'height': Math.abs(dy)});
                return false;
            }
        },

        render: function() {

            if (this.paper) {
                // TODO: cleanup refs to other objects previously created below!
                this.paper.remove();     // destroy any previous paper
            }

            var m = this.model.getSelected().head();

            var w = m.get('orig_width'),
                h = m.get('orig_height');
            var json = {'src': m.get_img_src(), 'w': w, 'h': h};

            var html = this.template(json);
            this.$el.find(".modal-body").html(html);
            // Now set up Raphael paper...

            this.cropModel = new Backbone.Model({
                'x':10, 'y': 20, 'width': 100, 'height': 200,
                'selected': true});

            // since resizes don't actually update model automatically, we do it...
            this.cropModel.bind('drag_resize_stop', function(args) {
                this.set({'x': args[0], 'y': args[1], 'width': args[2], 'height': args[3]});
            });

            this.paper = Raphael("roi_paper", w, h);
            this.rect = new RectView({'model':this.cropModel, 'paper': this.paper});
        }
    });
