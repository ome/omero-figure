

var RoiModalView = Backbone.View.extend({

        el: $("#roiModal"),

        // template: JST["static/figure/templates/paper_setup_modal_template.html"],
        template: JST["static/figure/templates/modal_dialogs/roi_modal_template.html"],
        roiTemplate: JST["static/figure/templates/modal_dialogs/roi_modal_roi.html"],

        model:FigureModel,

        initialize: function() {

            var self = this;
            $("#roiModal").bind("show.bs.modal", function(){
                self.m = self.model.getSelected().head().clone();
                self.listenTo(self.m, 'change:theZ change:theT', self.render);
                self.cropModel.set({'selected': false, 'width': 0, 'height': 0});    // hide crop roi
                self.zoomToFit();   // includes render()
                self.loadRois();
            });

            // keep track of currently selected ROI
            this.currentROI = {'x':0, 'y': 0, 'width': 0, 'height': 0}

            // used by model underlying Rect.
            // NB: values in cropModel are scaled by zoom percent
            this.cropModel = new Backbone.Model({
                'x':0, 'y': 0, 'width': 0, 'height': 0,
                'selected': false});
            // since resizes & drags don't actually update cropModel automatically, we do it...
            this.cropModel.bind('drag_resize_stop', function(args) {
                this.set({'x': args[0], 'y': args[1], 'width': args[2], 'height': args[3]});
            });
            this.cropModel.bind('drag_xy_stop', function(args) {
                this.set({'x': args[0] + this.get('x'), 'y': args[1] + this.get('y')});
            });

            // we also need to update the scaled ROI coords...
            this.listenTo(this.cropModel, 'change:x change:y change:width change:height', function(m){
                var scale = self.zoom / 100;
                self.currentROI = {
                    'x': m.get('x') / scale,
                    'y': m.get('y') / scale,
                    'width': m.get('width') / scale,
                    'height': m.get('height') / scale
                }
            });

            // Now set up Raphael paper...
            this.paper = Raphael("roi_paper", 500, 500);
            this.rect = new RectView({'model':this.cropModel, 'paper': this.paper});
            this.$roiImg = $('.roi_image', this.$el);
        },

        events: {
            "click .roi_content": "roiPicked",
            "mousedown svg": "mousedown",
            "mousemove svg": "mousemove",
            "mouseup svg": "mouseup",
            "submit .roiModalForm": "handleRoiForm"
        },

        roiPicked: function(event) {

            var $roi = $(event.target),
                x = parseInt($roi.attr('data-x'), 10),
                y = parseInt($roi.attr('data-y'), 10),
                width = parseInt($roi.attr('data-width'), 10),
                height = parseInt($roi.attr('data-height'), 10),
                theT = parseInt($roi.attr('data-theT'), 10),
                theZ = parseInt($roi.attr('data-theZ'), 10);

            this.m.set({'theT': theT, 'theZ': theZ});

            this.currentROI = {
                'x':x, 'y':y, 'width':width, 'height':height
            }

            this.render();

            this.cropModel.set({
                'selected': true
            });
        },

        handleRoiForm: function(event) {
            event.preventDefault();
            // var json = this.processForm();
            var r = this.currentROI,
                roiX = r.x,
                roiY = r.y,
                roiW = r.width,
                roiH = r.height,
                theZ = this.m.get('theZ'),
                theT = this.m.get('theT');
            this.model.getSelected().each(function(m){
                m.cropToRoi({'x': roiX, 'y': roiY, 'width': roiW, 'height': roiH});
                m.set({'theZ': theZ, 'theT': theT});
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
            this.cropModel.set({'x': this.imageX_start, 'y': this.imageY_start, 'width': 0, 'height': 0, 'selected': true})
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
                if (event.shiftKey) {
                    // make region square!
                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (dy > 0) dy = Math.abs(dx);
                        else dy = -1 * Math.abs(dx);
                    } else {
                        if (dx > 0) dx = Math.abs(dy);
                        else dx = -1 * Math.abs(dy);
                    }
                }
                var negX = Math.min(0, dx),
                    negY = Math.min(0, dy);
                this.cropModel.set({'x': this.imageX_start + negX,
                    'y': this.imageY_start + negY,
                    'width': Math.abs(dx), 'height': Math.abs(dy)});
                return false;
            }
        },

        loadRois: function() {
            var self = this,
                iid = self.m.get('imageId');
            $.getJSON(ROIS_JSON_URL + iid, function(data){

                // get a representative Rect from each ROI.
                // Include a z and t index, trying to pick current z/t if ROI includes a shape there
                var currT = self.m.get('theT'),
                    currZ = self.m.get('theZ');
                var rects = [],
                    roi, shape, theT, theZ, z, t, rect, tkeys, zkeys,
                    shapes; // dict of all shapes by z & t index
                for (var r=0; r<data.length; r++) {
                    roi = data[r];
                    shapes = {};
                    for (var s=0; s<roi.shapes.length; s++) {
                        shape = roi.shapes[s];
                        if (shape.type !== "Rectangle") continue;
                        theT = shape.theT;
                        if (theT === undefined) theT = -1;
                        theZ = shape.theZ;
                        if (theZ === undefined) theZ = -1;
                        if (shapes[theZ] === undefined) {
                            shapes[theZ] = {};
                        }
                        shapes[theZ][theT] = shape;
                    }
                    // get shape on current plane or...?
                    zkeys = _.keys(shapes);
                    if (zkeys.length === 0) continue;   // no Rectangles
                    if (shapes[currZ]) {
                        z = currZ;
                    } else {
                        z = zkeys.sort()[(zkeys.length/2)>>0]
                    }
                    tkeys = _.keys(shapes[z]);
                    if (shapes[z][currT]) {
                        t = currT;
                    } else {
                        t = tkeys.sort()[(tkeys.length/2)>>0]
                    }
                    rects.push(shapes[z][t])
                }
                // Show ROIS...
                self.renderRois(rects);
            });
        },

        renderRois: function(rects) {

            var orig_width = this.m.get('orig_width'),
                orig_height = this.m.get('orig_height');

            var html = "",
                size = 50,
                rect, src, zoom,
                top, left, div_w, div_h, img_w, img_h;

            // loop through ROIs, using our cloned model to generate src urls
            // first, get the current Z and T of cloned model...
            var origT = this.m.get('theT'),
                origZ = this.m.get('theZ');
            for (var r=0; r<rects.length; r++) {
                rect = rects[r];
                if (rect.theT > -1) this.m.set('theT', rect.theT, {'silent': true});
                if (rect.theZ > -1) this.m.set('theZ', rect.theZ, {'silent': true});
                src = this.m.get_img_src();
                if (rect.width > rect.height) {
                    div_w = size;
                    div_h = (rect.height/rect.width) * div_w;
                } else {
                    div_h = size;
                    div_w = (rect.width/rect.height) * div_h;
                }
                zoom = div_w/rect.width;
                img_w = orig_width * zoom;
                img_h = orig_height * zoom;
                top = -(zoom * rect.y);
                left = -(zoom * rect.x);

                var json = {
                    'src': src,
                    'rect': rect,
                    'w': div_w,
                    'h': div_h,
                    'top': top,
                    'left': left,
                    'img_w': img_w,
                    'img_h': img_h,
                    'theZ': rect.theZ + 1,
                    'theT': rect.theT + 1
                }
                html += this.roiTemplate(json);
            }
            $(".roiPicker tbody").html(html);

            // reset Z/T as before
            this.m.set({'theT': origT, 'theZ': origZ});
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
                roi = this.currentROI,
                w = this.m.get('orig_width'),
                h = this.m.get('orig_height');
            var newW = w * scale,
                newH = h * scale;
            var src = this.m.get_img_src()

            this.paper.setSize(newW, newH);
            $("#roi_paper").css({'height': newH, 'width': newW});

            this.$roiImg.css({'height': newH, 'width': newW})
                    .attr('src', src);

            var roiX = this.currentROI.x * scale,
                roiY = this.currentROI.y * scale,
                roiW = this.currentROI.width * scale,
                roiH = this.currentROI.height * scale;
            this.cropModel.set({
                'x': roiX, 'y': roiY, 'width': roiW, 'height': roiH
            });
        }
    });
