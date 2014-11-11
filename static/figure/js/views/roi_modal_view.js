

var RoiModalView = Backbone.View.extend({

        el: $("#roiModal"),

        // template: JST["static/figure/templates/paper_setup_modal_template.html"],
        template: JST["static/figure/templates/modal_dialogs/roi_modal_template.html"],
        roiTemplate: JST["static/figure/templates/modal_dialogs/roi_modal_roi.html"],

        model:FigureModel,

        initialize: function() {

            var self = this;
            $("#roiModal").bind("show.bs.modal", function(){
                self.render();
                self.loadRois();
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
            var m = this.model.getSelected().head(),
                self = this,
                iid = m.get('imageId');
            $.getJSON(ROIS_JSON_URL + iid, function(data){

                // get a representative Rect from each ROI.
                // Include a z and t index, trying to pick current z/t if ROI includes a shape there
                var currT = m.get('theT'),
                    currZ = m.get('theZ');
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

            var m = this.model.getSelected().head().clone(),
                orig_width = m.get('orig_width'),
                orig_height = m.get('orig_height');

            var html = "",
                size = 50,
                rect, src, zoom,
                top, left, div_w, div_h, img_w, img_h;
            for (var r=0; r<rects.length; r++) {
                rect = rects[r];
                if (rect.theT > -1) m.set('theT', rect.theT)
                if (rect.theZ > -1) m.set('theZ', rect.theZ)
                src = m.get_img_src();
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
            $("#roiPicker tbody").html(html);
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
            $("#roiViewer").html(html);
            // Now set up Raphael paper...

            this.cropModel = new Backbone.Model({
                'x':0, 'y': 0, 'width': 0, 'height': 0,
                'selected': false});

            // since resizes don't actually update model automatically, we do it...
            this.cropModel.bind('drag_resize_stop', function(args) {
                this.set({'x': args[0], 'y': args[1], 'width': args[2], 'height': args[3]});
            });

            this.paper = Raphael("roi_paper", w, h);
            this.rect = new RectView({'model':this.cropModel, 'paper': this.paper});
        }
    });
