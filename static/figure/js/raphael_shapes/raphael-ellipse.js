
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

var EllipseView = Backbone.View.extend({

    handle_wh: 6,
    default_color: '4b80f9',
    default_line_attrs: {'stroke-width':0, 'cursor': 'default', 'fill-opacity':0.01, 'fill': '#fff'},
    selected_line_attrs: {'stroke-width':2 },
    handle_attrs: {'stroke':'#4b80f9', 'fill':'#fff', 'cursor': 'default', 'fill-opacity':1.0},

    // make a child on click
    events: {
        //'mousedown': 'selectShape'    // we need to handle this more manually (see below)
    },
    initialize: function(options) {
        // Here we create the shape itself, the drawing handles and
        // bind drag events to all of them to drag/resize the rect.

        var self = this;
        this.paper = options.paper;
        this.handle_wh = options.handle_wh || this.handle_wh;
        this.handles_toFront = options.handles_toFront || false;
        this.disable_handles = options.disable_handles || false;
        this.fixed_ratio = options.fixed_ratio || false;

        this.default_line_attrs = $.extend( {}, this.default_line_attrs, options.attrs);
        // this.manager = options.manager;

        // Set up our 'view' attributes (for rendering without updating model)
        this.cx = this.model.get("cx");
        this.cy = this.model.get("cy");
        this.rx = this.model.get("rx");
        this.ry = this.model.get("ry");
        this.rotation = this.model.get("rotation");

        // ---- Create Handles -----
        // map of centre-points for each handle
        this.handleIds = this.getHandleCoords(this.cx, this.cy, this.rx, this.ry, this.rotation);
        // draw handles
        self.handles = this.paper.set();
        var _handle_drag = function() {
            return function (dx, dy, mouseX, mouseY, event) {
                if (self.disable_handles) return false;
                // on DRAG...
                var absX = dx + this.ox,
                    absY = dy + this.oy;
                this.rect.updateHandle(this.h_id, absX, absY);
                return false;
            };
        };
        var _handle_drag_start = function() {
            return function () {
                if (self.disable_handles) return false;
                // START drag: simply note the location we started
                this.ox = this.attr("x");
                this.oy = this.attr("y");
                return false;
            };
        };
        var _handle_drag_end = function() {
            return function() {
                if (self.disable_handles) return false;
                this.rect.model.set({'cx':this.rect.cx, 'cy': this.rect.cy,
                    'rx': this.rect.rx, 'ry': this.rect.ry});
                return false;
            };
        };
        var _stop_event_propagation = function(e) {
            e.stopImmediatePropagation();
        }
        for (var key in this.handleIds) {
            var hx = this.handleIds[key].x;
            var hy = this.handleIds[key].y;
            var handle = this.paper.rect(hx-self.handle_wh/2, hy-self.handle_wh/2, self.handle_wh, self.handle_wh).attr(self.handle_attrs);
            handle.attr({'cursor': 'move'});     // css, E.g. ne-resize
            handle.h_id = key;
            handle.rect = self;

            handle.drag(
                _handle_drag(),
                _handle_drag_start(),
                _handle_drag_end()
            );
            handle.mousedown(_stop_event_propagation);
            self.handles.push(handle);
        }
        self.handles.hide();     // show on selection


        // ----- Create the ellipse itself ----
        this.element = this.paper.ellipse();
        this.element.attr( self.default_line_attrs );
        // set "element" to the raphael node (allows Backbone to handle events)
        this.setElement(this.element.node);
        this.delegateEvents(this.events);   // we need to rebind the events

        // Handle drag
        this.element.drag(
            function(dx, dy) {
                // DRAG, update location and redraw
                self.cx = dx+this.ox;
                self.cy = this.oy+dy;
                self.updateShape();
                return false;
            },
            function() {
                // START drag: note the location of all points (copy list)
                this.ox = this.attr('cx');
                this.oy = this.attr('cy');
                return false;
            },
            function() {
                // STOP: save current position to model
                self.model.set({'cx': self.cx, 'cy': self.cy});
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

    getHandleCoords: function(cx, cy, rx, ry, rotation) {

        var rot = Raphael.rad(rotation),
            startX = cx - (Math.cos(rot) * rx),
            startY = cy - (Math.sin(rot) * rx),
            endX = cx + (Math.cos(rot) * rx),
            endY = cy + (Math.sin(rot) * rx),
            leftX = cx + (Math.sin(rot) * ry),
            leftY = cy - (Math.cos(rot) * ry),
            rightX = cx - (Math.sin(rot) * ry),
            rightY = cy + (Math.cos(rot) * ry);

        return {'start':{x: startX, y: startY},
                'end':{x: endX, y: endY},
                'left':{x: leftX, y: leftY},
                'right':{x: rightX, y: rightY}
                };
    },

    updateHandle: function(handleId, x, y) {
        var h = this.handleIds[handleId];
        h.x = x;
        h.y = y;
        this.updateEllipseFromHandles();
    },

    updateEllipseFromHandles: function() {
        var hh = this.handleIds,
            lengthX = hh.end.x - hh.start.x,
            lengthY = hh.end.y - hh.start.y,
            widthX = hh.left.x - hh.right.x,
            widthY = hh.left.y - hh.right.y,
            rot;
        if (lengthX === 0){
            this.rotation = 90;
        } else if (lengthX > 0) {
            rot = Math.atan(lengthY / lengthX);
            this.rotation = Raphael.deg(rot);
        } else if (lengthX < 0) {
            rot = Math.atan(lengthY / lengthX);
            this.rotation = 180 + Raphael.deg(rot);
        }
        
        this.cx = (hh.start.x + hh.end.x)/2,
        this.cy = (hh.start.y + hh.end.y)/2,
        this.rx = Math.sqrt((lengthX * lengthX) + (lengthY * lengthY)) / 2,
        this.ry = Math.sqrt((widthX * widthX) + (widthY * widthY)) / 2,

        this.updateShape();
    },

    // render updates our local attributes from the Model AND updates coordinates
    render: function(event) {
        if (this.dragging) return;
        this.cx = this.model.get("cx");
        this.cy = this.model.get("cy");
        this.rx = this.model.get("rx");
        this.ry = this.model.get("ry");
        this.updateShape();
    },

    // used to update during drags etc. Also called by render()
    updateShape: function() {
        this.element.attr({'cx':this.cx, 'cy':this.cy, 'rx':this.rx, 'ry':this.ry});
        this.element.transform('r'+ this.rotation);

        // if (this.manager.selected_shape_id === this.model.get("id")) {
        var lineColor = this.model.get('color') || this.default_color;
        this.element.attr('stroke', '#' + lineColor);
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

        this.handleIds = this.getHandleCoords(this.cx, this.cy, this.rx, this.ry, this.rotation);
        var hnd, h_id, hx, hy;
        for (var h=0, l=this.handles.length; h<l; h++) {
            hnd = this.handles[h];
            h_id = hnd.h_id;
            hx = this.handleIds[h_id].x;
            hy = this.handleIds[h_id].y;
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
