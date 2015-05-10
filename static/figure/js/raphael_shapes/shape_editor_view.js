

var ShapeEditorView = Backbone.View.extend({

        el: $("#body"),


        initialize: function() {

            var self = this;

            // Now set up Raphael paper...
            this.paper = Raphael("shapeCanvas", 512, 512);
        },

        events: {
            "mousedown svg": "mousedown",
            "mousemove svg": "mousemove",
            "mouseup svg": "mouseup"
        },


        mousedown: function(event) {
            this.dragging = true;
            var os = $(event.target).offset();
            var dx = event.clientX - os.left;
            var dy = event.clientY - os.top;
            this.clientX_start = dx;
            this.clientY_start = dy;
            console.log(dx, dy);
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
                console.log("drag", dx, dy);
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
                // this.cropModel.set({'x': this.imageX_start + negX,
                //     'y': this.imageY_start + negY,
                //     'width': Math.abs(dx), 'height': Math.abs(dy)});
                return false;
            }
        }
    });
