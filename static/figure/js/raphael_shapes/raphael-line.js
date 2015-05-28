
//
// Copyright (C) 2015 University of Dundee & Open Microscopy Environment.
// All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

var LineView = Backbone.View.extend({

    handle_wh: 6,
    default_color: '4b80f9',
    default_line_attrs: {'stroke-width':2, 'cursor': 'default', 'fill-opacity':1},
    selected_line_attrs: {'stroke-width':2 },
    handle_attrs: {'stroke':'#4b80f9', 'fill':'#fff', 'cursor': 'default', 'fill-opacity':1.0},

    // make a child on click
    events: {
        //'mousedown': 'selectShape'    // we need to handle this more manually (see below)
    },
    initialize: function(options) {
        // Here we create the shape itself, the drawing handles and
        // bind drag events to all of them to drag/resize the line.

        var self = this;
        this.paper = options.paper;
        this.handle_wh = options.handle_wh || this.handle_wh;
        this.handles_toFront = options.handles_toFront || false;
        this.disable_handles = options.disable_handles || false;
        this.fixed_ratio = options.fixed_ratio || false;
        // this.manager = options.manager;

        // Set up our 'view' attributes (for rendering without updating model)
        this.x1 = this.model.get("x1");
        this.y1 = this.model.get("y1");
        this.x2 = this.model.get("x2");
        this.y2 = this.model.get("y2");

        // ---- Create Handles -----
        // map of centre-points for each handle
        this.handleIds = {'start': [this.x1, this.y1],
            'middle': [(this.x1+this.x2)/2,(this.y1+this.y2)/2],
            'end': [this.x2,this.y2]
        };
        // draw handles
        self.handles = this.paper.set();
        var _handle_drag = function() {
            return function (dx, dy, mouseX, mouseY, event) {
                if (self.disable_handles) return false;
                // on DRAG...

                var keep_ratio = event.shiftKey;

                // Use dx & dy to update the location of the handle and the corresponding point of the parent
                var new_x = this.ox + dx;
                var new_y = this.oy + dy;
                var newLine = {
                    x1: this.line.x1,
                    y1: this.line.y1,
                    x2: this.line.x2,
                    y2: this.line.y2
                };
                if (this.h_id === "start") {
                    newLine.x1 = new_x + self.handle_wh/2;
                    newLine.y1 = new_y + self.handle_wh/2;
                } else if (this.h_id === "middle") {
                    newLine.x1 = this.line.model.get('x1') + dx;
                    newLine.y1 = this.line.model.get('y1') + dy;
                    newLine.x2 = this.line.model.get('x2') + dx;
                    newLine.y2 = this.line.model.get('y2') + dy;
                } else if (this.h_id === "end") {
                    newLine.x2 = new_x + self.handle_wh/2;
                    newLine.y2 = new_y + self.handle_wh/2;
                }

                // Don't allow zero sized rect.
                // if (newLine.width < 1 || newLine.height < 1) {
                //     return false;
                // }
                this.line.x1 = newLine.x1;
                this.line.y1 = newLine.y1;
                this.line.x2 = newLine.x2;
                this.line.y2 = newLine.y2;
                this.line.model.trigger("drag_resize", [this.line.x1, this.line.y1, this.line.x2, this.line.y2]);
                this.line.updateShape();
                return false;
            };
        };
        var _handle_drag_start = function() {
            return function () {
                if (self.disable_handles) return false;
                // START drag: simply note the location we started
                this.ox = this.attr("x");
                this.oy = this.attr("y");
                // this.aspect = self.model.get('width') / self.model.get('height');
                return false;
            };
        };
        var _handle_drag_end = function() {
            return function() {
                if (self.disable_handles) return false;
                this.line.model.set({'x1': this.line.x1, 'y1': this.line.y1,
                    'x2':this.line.x2, 'y2':this.line.y2});
                return false;
            };
        };
        var _stop_event_propagation = function(e) {
            e.stopImmediatePropagation();
        }
        for (var key in this.handleIds) {
            var hx = this.handleIds[key][0];
            var hy = this.handleIds[key][1];
            var handle = this.paper.rect(hx-self.handle_wh/2, hy-self.handle_wh/2, self.handle_wh, self.handle_wh).attr(self.handle_attrs);
            handle.attr({'cursor': 'pointer'});
            handle.h_id = key;
            handle.line = self;

            handle.drag(
                _handle_drag(),
                _handle_drag_start(),
                _handle_drag_end()
            );
            handle.mousedown(_stop_event_propagation);
            self.handles.push(handle);
        }
        self.handles.hide();     // show on selection


        // ----- Create the line itself ----
        this.element = this.paper.path();
        this.element.attr( self.default_line_attrs );
        // set "element" to the raphael node (allows Backbone to handle events)
        this.setElement(this.element.node);
        this.delegateEvents(this.events);   // we need to rebind the events

        // Handle drag
        this.element.drag(
            function(dx, dy) {
                // DRAG, update location and redraw
                self.x1 = dx+this.ox1;
                self.y1 = this.oy1+dy;
                self.x2 = dx+this.ox2;
                self.y2 = this.oy2+dy;
                self.dragging = true;
                self.updateShape();
                return false;
            },
            function() {
                // START drag: note the location of points
                this.ox1 = self.model.get('x1');
                this.oy1 = self.model.get('y1');
                this.ox2 = self.model.get('x2');
                this.oy2 = self.model.get('y2');
                return false;
            },
            function() {
                // STOP: save current position to model
                self.model.set({'x1': self.x1, 'y1': self.y1, 'x2': self.x2, 'y2': self.y2});
                self.dragging = false;
                return false;
            }
        );

        // If we're starting DRAG, don't let event propogate up to dragdiv etc.
        // https://groups.google.com/forum/?fromgroups=#!topic/raphaeljs/s06GIUCUZLk
        this.element.mousedown(function(e){
             e.stopImmediatePropagation();
             self.selectShape(e);
        });

        this.updateShape();  // sync position, selection etc.

        // Finally, we need to render when model changes
        this.model.on('change', this.render, this);
        this.model.on('destroy', this.destroy, this);

    },

    // render updates our local attributes from the Model AND updates coordinates
    render: function(event) {
        if (this.dragging) return;
        this.x1 = this.model.get("x1");
        this.y1 = this.model.get("y1");
        this.x2 = this.model.get("x2");
        this.y2 = this.model.get("y2");
        this.updateShape();
    },

    getPath: function() {
        return "M" + this.x1 + " " + this.y1 + "L" + this.x2 + " " + this.y2;
    },

    // used to update during drags etc. Also called by render()
    updateShape: function() {
        // E.g. "M10 10L90 90"
        var p = this.getPath();
        this.element.attr('path', p);
 
        var lineColor = this.model.get('color') || this.default_color;
        this.element.attr({'stroke': '#' + lineColor, 'fill': '#' + lineColor});

        // if (this.manager.selected_shape_id === this.model.get("id")) {
        if (this.model.get('selected')) {
            this.element.attr( this.selected_line_attrs ).toFront();
            var self = this;
            // If several Rects get selected at the same time, one with handles_toFront will
            // end up with the handles at the top
            if (this.handles_toFront) {
                setTimeout(function(){
                    self.handles.show().toFront();
                },50);
            } else {
                this.handles.show().toFront();
            }
        } else {
            this.element.attr( this.default_line_attrs );    // this should be the shapes OWN line / fill colour etc.
            this.handles.hide();
        }
        // If model defines line width, over-ride anything we've set above
        if (this.model.get('lineWidth')) {
            this.element.attr('stroke-width', this.model.get('lineWidth'));
        }

        this.handleIds = {'start': [this.x1, this.y1],
            'middle': [(this.x1+this.x2)/2,(this.y1+this.y2)/2],
            'end': [this.x2,this.y2]
        };
        var hnd, h_id, hx, hy;
        for (var h=0, l=this.handles.length; h<l; h++) {
            hnd = this.handles[h];
            h_id = hnd.h_id;
            hx = this.handleIds[h_id][0];
            hy = this.handleIds[h_id][1];
            hnd.attr({'x':hx-this.handle_wh/2, 'y':hy-this.handle_wh/2});
        }
    },

    selectShape: function(event) {
        // pass back to model to update all selection
        this.model.trigger('clicked', [event]);
    },

    // Destroy: remove Raphael elements and event listeners
    destroy: function() {
        this.element.remove();
        this.handles.remove();
        this.model.off('change', this.render, this);
    }
});

var ArrowView = LineView.extend({

    getPath: function() {

        var headSize = (this.model.get('lineWidth') * 3) + 9,
            x2 = this.x2,
            y2 = this.y2,
            dx = x2 - this.x1,
            dy = y2 - this.y1;

        var linePath = "M" + this.x1 + " " + this.y1 + "L" + this.x2 + " " + this.y2;
        var lineAngle = Math.atan(dx / dy);
        var f = (dy < 0 ? 1 : -1);

        // Angle of arrow head is 1 radian (0.5 either side of lineAngle)
        var arrowPoint1x = x2 + (f * Math.sin(lineAngle - 0.5) * headSize),
            arrowPoint1y = y2 + (f * Math.cos(lineAngle - 0.5) * headSize),
            arrowPoint2x = x2 + (f * Math.sin(lineAngle + 0.5) * headSize),
            arrowPoint2y = y2 + (f * Math.cos(lineAngle + 0.5) * headSize);

        // Full path goes around the head, past the tip and back to tip so that the tip is 'pointy'  
        // and 'fill' is not from a head corner to the start of arrow.
        var arrowPath = linePath + "L" + arrowPoint1x + " " + arrowPoint1y + "L" + arrowPoint2x + " " + arrowPoint2y;
        arrowPath = arrowPath + "L" + this.x2 + " " + this.y2 + "L" + arrowPoint1x + " " + arrowPoint1y + "L" + this.x2 + " " + this.y2;
        return arrowPath;
    }

})
