

var ShapeEditorView = Backbone.View.extend({

        el: $("#body"),


        initialize: function(options) {

            var self = this;

            // we automatically 'sort' on fetch, add etc.
            // this.model.bind("sync remove sort", this.render, this);

            // Now set up Raphael paper...
            this.paper = Raphael("shapeCanvas", 512, 512);

            this.shapeEditor = options.shapeEditor;
            this.listenTo(this.shapeEditor, 'change', this.updateState);

            this.updateState();
        },

        events: {
            "mousedown .new_shape_layer": "mousedown",
            "mousemove .new_shape_layer": "mousemove",
            "mouseup .new_shape_layer": "mouseup"
        },


        updateState: function() {

            var state = this.shapeEditor.get('state');
            if (state == "RECT" || state == "LINE") {
                $(".new_shape_layer", this.el).show();
            } else {
                $(".new_shape_layer", this.el).hide();
            }
        },


        mousedown: function(event) {
            // Create a new Rect, and start resizing it...
            this.dragging = true;
            var os = $(event.target).offset();
            var dx = event.clientX - os.left;
            var dy = event.clientY - os.top;
            this.clientX_start = dx;
            this.clientY_start = dy;

            var state = this.shapeEditor.get('state');
            if (state == "RECT") {
                this.cropModel = new Shape({
                    'type': 'rect', 'x':dx, 'y': dy, 'width': 0, 'height': 0,
                    'selected': false});
                this.rect = new RectView({'model':this.cropModel, 'paper': this.paper, 'attrs':{'stroke-width':2}});
            } else if (state == "LINE") {
                this.cropModel = new Backbone.Model({'type': 'line', 'x1': dx, 'y1': dy, 'x2': dx, 'y2': dy});
                this.line = new LineView({'model': this.cropModel, 'paper': this.paper});
            }
            // this.cropModel.set('selected', true);
            return false;
        },

        mouseup: function(event) {
            if (this.dragging) {
                this.dragging = false;

                var state = this.shapeEditor.get('state');
                // If shapes are zero-sized, destroy.
                if (state == "RECT") {
                    if (this.cropModel.get('width') === 0 || this.cropModel.get('height') === 0) {
                        this.cropModel.destroy();
                        return false;
                    }
                } else if (state == "LINE") {
                    if(this.cropModel.get('x1') === this.cropModel.get('x2') &&
                        this.cropModel.get('y1') === this.cropModel.get('y2')) {
                        this.cropModel.destroy();
                        return false;
                    }
                }
                // otherwise add to collection
                this.model.add(this.cropModel);
                return false;
            }
        },

        mousemove: function(event) {
            if (this.dragging) {
                var os = $(event.target).offset(),
                    absX = event.clientX - os.left,
                    absY = event.clientY - os.top,
                    dx = absX - this.clientX_start,
                    dy = absY - this.clientY_start;

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
                var negX = Math.min(0, dx),  // - this.clientX_start),
                    negY = Math.min(0, dy);  // - this.clientY_start);

                var state = this.shapeEditor.get('state');
                if (state == "RECT") {
                    this.cropModel.set({'x': this.clientX_start + negX,
                        'y': this.clientY_start + negY,
                        'width': Math.abs(dx), 'height': Math.abs(dy)});
                } else if (state == "LINE") {
                    this.cropModel.set({'x2': absX, 'y2': absY});
                }
                return false;
            }
        }
    });
