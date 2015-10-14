
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


var EllipseModel = Backbone.Model.extend({

    defaults: {
        color: '4b80f9',
        handle_wh: 6,
        'stroke-width': 2,
        cursor: 'default',
        'fill-opacity':0.01,
        'fill': '#fff',
        zoom: 100,
    }
});

var EllipseView = Backbone.View.extend({

    shapeAttrs: {'fill-opacity':0.01, 'fill': '#fff'},
    handleAttrs: {'stroke':'#4b80f9', 'fill':'#fff', 'fill-opacity':1.0},

    initialize: function(options) {
        // Here we create the shape itself, the drawing handles and
        // bind drag events to all of them to drag/resize the ellipse.

        var self = this;
        this.paper = options.paper;

        // Set up our 'view' attributes (for rendering without updating model)
        this.cx = this.model.get("cx");
        this.cy = this.model.get("cy");
        this.rx = this.model.get("rx");
        this.ry = this.model.get("ry");
        this.rotation = this.model.get("rotation");

        // ---- Create Handles -----
        // map of centre-points for each handle
        this.handleIds = this.getHandleCoords();
        // draw handles
        self.handles = this.paper.set();
        var _handle_drag = function() {
            return function (dx, dy, mouseX, mouseY, event) {
                // on DRAG...
                var absX = dx + this.ox,
                    absY = dy + this.oy;
                self.updateHandle(this.h_id, absX, absY);
                return false;
            };
        };
        var _handle_drag_start = function() {
            return function () {
                // START drag: simply note the location we started
                this.ox = this.attr("x") + this.attr('width')/2;
                this.oy = this.attr("y") + this.attr('height')/2;
                return false;
            };
        };
        var _handle_drag_end = function() {
            return function() {
                self.model.set({'cx':self.cx, 'cy': self.cy,
                    'rx': self.rx, 'ry': self.ry});
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
            handle.attr({'cursor': 'move'});     // css, E.g. ne-resize
            handle.h_id = key;

            handle.drag(
                _handle_drag(),
                _handle_drag_start(),
                _handle_drag_end()
            );
            handle.mousedown(_stop_event_propagation);
            self.handles.push(handle);
        }
        self.handles.attr(self.handleAttrs).hide();     // show on selection


        // ----- Create the ellipse itself ----
        this.element = this.paper.ellipse();
        this.element.attr( self.shapeAttrs );
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

    getHandleCoords: function() {

        var rot = Raphael.rad(this.rotation),
            startX = this.cx - (Math.cos(rot) * this.rx),
            startY = this.cy - (Math.sin(rot) * this.rx),
            endX = this.cx + (Math.cos(rot) * this.rx),
            endY = this.cy + (Math.sin(rot) * this.rx),
            leftX = this.cx + (Math.sin(rot) * this.ry),
            leftY = this.cy - (Math.cos(rot) * this.ry),
            rightX = this.cx - (Math.sin(rot) * this.ry),
            rightY = this.cy + (Math.cos(rot) * this.ry);

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
        this.updateShapeFromHandles();
    },

    updateShapeFromHandles: function() {
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

        var attrs = {'cx':this.cx,
                     'cy':this.cy,
                     'rx':this.rx,
                     'ry':this.ry,
                     'stroke': '#' +this.model.get('color'),
                     'stroke-width': this.model.get('stroke-width')};
        this.element.attr(attrs);
        this.element.transform('r'+ this.rotation);

        if (this.model.get('selected')) {
            this.element.toFront();
            this.handles.show().toFront();
        } else {
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
