
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

    shapeAttrs: {'fill-opacity':0.01, 'fill': '#fff'},
    handleAttrs: {'stroke':'#4b80f9', 'fill':'#fff', 'fill-opacity':1.0},

    initialize: function(options) {
        // Here we create the shape itself, the drawing handles and
        // bind drag events to all of them to drag/resize the line.

        var self = this;
        this.paper = options.paper;
        
        // Set up our 'view' attributes (for rendering without updating model)
        this.x1 = this.model.get("x1");
        this.y1 = this.model.get("y1");
        this.x2 = this.model.get("x2");
        this.y2 = this.model.get("y2");
        this.zoom = this.model.get("zoom");

        // ---- Create Handles -----
        // map of centre-points for each handle
        this.handleIds = this.getHandleCoords();
        // draw handles
        self.handles = this.paper.set();
        var _handle_drag = function() {
            return function (dx, dy, mouseX, mouseY, event) {
                if (self.disable_handles) return false;
                // on DRAG...

                var absX = dx + this.ox,
                    absY = dy + this.oy;
                self.updateHandle(this.h_id, absX, absY);
                return false;
            };
        };
        var _handle_drag_start = function() {
            return function () {
                if (self.disable_handles) return false;
                // START drag: simply note the location we started
                this.ox = this.attr("x") + this.attr('width')/2;
                this.oy = this.attr("y") + this.attr('width')/2;
                return false;
            };
        };
        var _handle_drag_end = function() {
            return function() {
                if (self.disable_handles) return false;
                this.line.model.set({
                    'x1': this.line.x1 * 100 / self.zoom,
                    'y1': this.line.y1 * 100 / self.zoom,
                    'x2':this.line.x2 * 100 / self.zoom,
                    'y2':this.line.y2 * 100 / self.zoom
                });
                return false;
            };
        };
        var _stop_event_propagation = function(e) {
            e.stopImmediatePropagation();
        }

        var hsize = this.model.get('handle_wh');
        for (var key in this.handleIds) {
            var hx = this.handleIds[key].x;
            var hy = this.handleIds[key].y;
            var handle = this.paper.rect(hx-hsize/2, hy-hsize/2, hsize, hsize);
            handle.attr({'cursor': 'move'});
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
        self.handles.attr(self.handleAttrs).hide();     // show on selection


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
                this.ox1 = self.model.get('x1') * self.zoom / 100;
                this.oy1 = self.model.get('y1') * self.zoom / 100;
                this.ox2 = self.model.get('x2') * self.zoom / 100;
                this.oy2 = self.model.get('y2') * self.zoom / 100;
                return false;
            },
            function() {
                // STOP: save current position to model
                self.model.set({'x1': self.x1 * 100 / self.zoom,
                                'y1': self.y1 * 100 / self.zoom,
                                'x2': self.x2 * 100 / self.zoom,
                                'y2': self.y2 * 100 / self.zoom
                                });
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

    getHandleCoords: function() {
        return {'start': {x: this.x1, y: this.y1},
            'middle': {x: (this.x1+this.x2)/2, y: (this.y1+this.y2)/2},
            'end': {x: this.x2, y: this.y2}
        };
    },

    updateHandle: function(handleId, x, y) {
        var h = this.handleIds[handleId];
        // middle handle is 'drag', so update all
        if (handleId == 'middle') {
            var dx = x - h.x;
            var dy = y - h.y;
            this.handleIds.start.x += dx;
            this.handleIds.start.y += dy;
            this.handleIds.end.x += dx;
            this.handleIds.end.y += dy;
        } else {
            h.x = x;
            h.y = y;
        }
        this.updateShapeFromHandles();
    },

    updateShapeFromHandles: function() {
        var hh = this.handleIds;
        this.x1 = hh.start.x,
        this.y1 = hh.start.y,
        this.x2 = hh.end.x,
        this.y2 = hh.end.y;
        this.updateShape();
    },

    // render updates our local attributes from the Model AND updates coordinates
    render: function(event) {
        if (this.dragging) return;
        this.zoom = this.model.get("zoom");
        this.x1 = this.zoom * this.model.get("x1") / 100;
        this.y1 = this.zoom * this.model.get("y1") / 100;
        this.x2 = this.zoom * this.model.get("x2") / 100;
        this.y2 = this.zoom * this.model.get("y2") / 100;
        this.updateShape();
    },

    getPath: function() {
        return "M" + this.x1 + " " + this.y1 + "L" + this.x2 + " " + this.y2;
    },

    // used to update during drags etc. Also called by render()
    updateShape: function() {
        // E.g. "M10 10L90 90"
        var attrs = {'path': this.getPath(),
                     'stroke': '#' +this.model.get('color'),
                     'fill': '#' +this.model.get('color'),
                     'stroke-width': this.model.get('stroke-width') * this.zoom / 100};
        this.element.attr(attrs);

        if (this.model.get('selected')) {
            this.element.attr('cursor', 'move').toFront();
            this.handles.show().toFront();
        } else {
            this.element.attr('cursor', 'default');
            this.handles.hide();
        }

        this.handleIds = this.getHandleCoords();
        var hnd, h_id, hx, hy;
        var hsize = this.model.get('handle_wh');
        for (var h=0, l=this.handles.length; h<l; h++) {
            hnd = this.handles[h];
            h_id = hnd.h_id;
            hx = this.handleIds[h_id].x;
            hy = this.handleIds[h_id].y;
            hnd.attr({'x':hx-hsize/2, 'y':hy-hsize/2});
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

        var headSize = (this.model.get('stroke-width') * 3) + 9,
            x2 = this.x2,
            y2 = this.y2,
            dx = x2 - this.x1,
            dy = y2 - this.y1;

        var linePath = "M" + this.x1 + " " + this.y1 + "L" + this.x2 + " " + this.y2;
        var lineAngle = Math.atan(dx / dy);
        var f = (dy < 0 ? 1 : -1);

        // Angle of arrow head is 0.8 radians (0.4 either side of lineAngle)
        var arrowPoint1x = x2 + (f * Math.sin(lineAngle - 0.4) * headSize),
            arrowPoint1y = y2 + (f * Math.cos(lineAngle - 0.4) * headSize),
            arrowPoint2x = x2 + (f * Math.sin(lineAngle + 0.4) * headSize),
            arrowPoint2y = y2 + (f * Math.cos(lineAngle + 0.4) * headSize);

        // Full path goes around the head, past the tip and back to tip so that the tip is 'pointy'  
        // and 'fill' is not from a head corner to the start of arrow.
        var arrowPath = linePath + "L" + arrowPoint1x + " " + arrowPoint1y + "L" + arrowPoint2x + " " + arrowPoint2y;
        arrowPath = arrowPath + "L" + this.x2 + " " + this.y2 + "L" + arrowPoint1x + " " + arrowPoint1y + "L" + this.x2 + " " + this.y2;
        return arrowPath;
    }

})
