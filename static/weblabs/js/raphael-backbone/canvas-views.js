// ------------------------ VIEWS -------------------------------
/*global Backbone:true */

var default_line_attrs = {'stroke-width':1, 'stroke': '#ffffff', 'cursor': 'default', 'fill-opacity':0.1, 'fill': '#000'};
var handle_attrs = {stroke:'#fff', fill:'#000', 'cursor': 'default'};
var handle_wh = 10;


// Manage the ROI views for canvas
var RoiCanvasViewManager = Backbone.View.extend({
    
    initialize: function(opts) {
        this.views = [];
        this.paper = opts.paper;
        
        var self = this,
            model = this.model;

        this.model.on("sync", function() {
            model.each(function(model, i){
                var v = new RoiCanvasView({model:model, paper:opts.paper});
                self.views.push(v);
            });
        });
        this.model.on("add", function(roi){
            var v = new RoiCanvasView({model: roi, paper:opts.paper});
            self.views.push(v);
        });
        
        this.theZ = null;
        this.theT = null;
    },

    setZandT: function(theZ, theT) {
        if (typeof theZ === "number") {
            this.theZ = theZ;
        }
        if (typeof theT === "number") {
            this.theT = theT;
        }
        this.refresh_rois();
    },
    
    refresh_rois: function() {
        // need to clear existing shapes
        var roi_view;
        for (var i=0; i<this.views.length; i++) {
            roi_view = this.views[i];
            roi_view.destroyShapes();
            roi_view.showShapes(this.theZ, this.theT);
        }
        
        // show shapes on current plane
    }
    
});


// This ROI-View doesn't SHOW anything on paper:
// - Just binds creation of Shape-Views to shape creation.
var RoiCanvasView = Backbone.View.extend({
    
    initialize: function(opts) {
        this.shapeViews = [];
        this.paper = opts.paper;    // seems we need to do this for paper but not for model
        
        var self = this;
        // Add Views for any existing shapes models
        this.model.shapes.each(function(shape) {
            self.create_shape_view(shape);
        });
        
        // If a shape is added, Create View for that too
        this.model.shapes.on("add", this.create_shape_view);
    },
    
    destroyShapes: function() {
        
        var svs = this.shapeViews,
            sv;
        for(var i=0; i<svs.length; i++) {
            sv = svs[i];
            sv.destroy();
        }
        svs.length = 0;     // All shapes gone
    },
    
    showShapes: function(theZ, theT) {
        var self = this;
        this.model.shapes.each(function(shape) {
            if ((shape.get('theZ') === theZ) && (shape.get('theT') === theT)) {
                self.create_shape_view(shape);
            }
        });
    },
    
    create_shape_view: function(shape) {
        var view,
            type = shape.get('type');
        if (type === "Rectangle") {
            view = new RectView({model:shape, paper:this.paper});
        } else if (type === "Ellipse") {
            view = new EllipseView({model:shape, paper:this.paper});
        }
        if (view) {
            view.render();
            this.shapeViews.push(view);
        }
    }
});


var RectView = Backbone.View.extend({
    // make a child on click
    events: {
        'mousedown': 'selectShape'
    },
    initialize: function(options) {
        // Here we create the shape itself, the drawing handles and
        // bind drag events to all of them to drag/resize the rect.

        var self = this;
        this.paper = options.paper;

        // Set up our 'view' attributes (for rendering without updating model)
        this.x = this.model.get("x");
        this.y = this.model.get("y");
        this.width = this.model.get("width");
        this.height = this.model.get("height");

        // ---- Create Handles -----
        // map of centre-points for each handle
        this.handleIds = {'nw': [this.x, this.y],
            'n': [this.x+this.width/2,this.y],
            'ne': [this.x+this.width,this.y],
            'w': [this.x, this.y+this.height/2],
            'e': [this.x+this.width, this.y+this.height/2],
            'sw': [this.x, this.y+this.height],
            's': [this.x+this.width/2, this.y+this.height],
            'se': [this.x+this.width, this.y+this.height]
        };
        // draw handles
        self.handles = this.paper.set();
        var _handle_drag = function() {
            return function (dx, dy) {
                // on DRAG: update the location of the handle and the corresponding point of the parent
                //if (manager.getState() !== ShapeManager.STATES.SELECT) {
                //    return;
                //}
                var new_x = this.ox + dx;
                var new_y = this.oy + dy;
                if (this.h_id.indexOf('e') > -1) {    // if we're dragging an 'EAST' handle, update width
                    this.rect.width = new_x - self.x + handle_wh/2;
                }
                if (this.h_id.indexOf('s') > -1) {    // if we're dragging an 'SOUTH' handle, update height
                    this.rect.height = new_y - self.y + handle_wh/2;
                }
                if (this.h_id.indexOf('n') > -1) {    // if we're dragging an 'NORTH' handle, update y and height
                    this.rect.y = new_y + handle_wh/2;
                    this.rect.height = this.obottom - new_y;
                }
                if (this.h_id.indexOf('w') > -1) {    // if we're dragging an 'WEST' handle, update x and width
                    this.rect.x = new_x + handle_wh/2;
                    this.rect.width = this.oright - new_x;
                }
                this.rect.updateShape();
                return false;
            };
        };
        var _handle_drag_start = function() {
            return function () {
                // START drag: simply note the location we started
                this.ox = this.attr("x");
                this.oy = this.attr("y");
                this.oright = self.width + this.ox;
                this.obottom = self.height + this.oy;
                return false;
            };
        };
        var _handle_drag_end = function() {
            return function() {
                this.rect.model.set({'x': this.rect.x, 'y': this.rect.y,
                    'width':this.rect.width, 'height':this.rect.height});
                return false;
            };
        };
        for (var key in this.handleIds) {
            var hx = this.handleIds[key][0];
            var hy = this.handleIds[key][1];
            var handle = this.paper.rect(hx-handle_wh/2, hy-handle_wh/2, handle_wh, handle_wh).attr(handle_attrs);
            handle.attr({'cursor': key + '-resize'});     // css, E.g. ne-resize
            handle.h_id = key;
            handle.rect = self;

            handle.drag(
                _handle_drag(),
                _handle_drag_start(),
                _handle_drag_end()
            );
            self.handles.push(handle);
        }
        //self.handles.hide();     // show on selection


        // ----- Create the rect itself ----
        this.element = this.paper.rect();
        this.element.attr( default_line_attrs );
        // set "element" to the raphael node (allows Backbone to handle events)
        this.setElement(this.element.node);
        this.delegateEvents(this.events);   // we need to rebind the events

        // Handle drag
        this.element.drag(
            function(dx, dy) {
                // DRAG, update location and redraw
                // TODO - need some way to disable drag if we're not in select state
                //if (manager.getState() !== ShapeManager.STATES.SELECT) {
                //    return;
                //}
                self.x = dx+this.ox;
                self.y = this.oy+dy;
                self.updateShape();
                return false;
            },
            function() {
                // START drag: note the location of all points (copy list)
                this.ox = this.attr('x');
                this.oy = this.attr('y');
                return false;
            },
            function() {
                // STOP: save current position to model
                self.model.set({'x': self.x, 'y': self.y});
                return false;
            }
        );

        // If we're starting DRAG, don't let event propogate up to dragdiv etc.
        // https://groups.google.com/forum/?fromgroups=#!topic/raphaeljs/s06GIUCUZLk
        this.element.mousedown(function(e){
             e.stopImmediatePropagation();
        });

        // Finally, we need to render when model changes
        this.model.on('change', this.render, this);
    },

    // render updates our local attributes from the Model AND updates coordinates
    render: function() {
        this.x = this.model.get("x");
        this.y = this.model.get("y");
        this.width = this.model.get("width");
        this.height = this.model.get("height");
        this.updateShape();
    },

    // used to update during drags etc. Also called by render()
    updateShape: function() {
        this.element.attr({'x':this.x, 'y':this.y, 'width':this.width, 'height':this.height});

        this.handleIds = {'nw': [this.x, this.y],
        'n': [this.x+this.width/2,this.y],
        'ne': [this.x+this.width,this.y],
        'w': [this.x, this.y+this.height/2],
        'e': [this.x+this.width, this.y+this.height/2],
        'sw': [this.x, this.y+this.height],
        's': [this.x+this.width/2, this.y+this.height],
        'se': [this.x+this.width, this.y+this.height]};
        var hnd, h_id, hx, hy;
        for (var h=0, l=this.handles.length; h<l; h++) {
            hnd = this.handles[h];
            h_id = hnd.h_id;
            hx = this.handleIds[h_id][0];
            hy = this.handleIds[h_id][1];
            hnd.attr({'x':hx-handle_wh/2, 'y':hy-handle_wh/2});
        }
    },
    // Create a new model and a view for it
    selectShape: function() {
    },
    
    destroy: function() {
        this.element.remove();
        this.handles.remove();
        this.model.off('change', this.render, this);
    }
});


// ----------------- Ellipse --------------------

var EllipseView = Backbone.View.extend({
    // make a child on click
    events: {
        'mousedown': 'selectShape'
    },
    initialize: function(options) {

        var self = this;
        this.paper = options.paper;

        // Set up our 'view' attributes (for rendering without updating model)
        this.cx = this.model.get("cx");
        this.cy = this.model.get("cy");
        this.rx = this.model.get("rx");
        this.ry = this.model.get("ry");

        // ---- Create Handles -----
        // map of centre-points for each handle
        this.handleIds = {'nw': [this.cx-this.rx, this.cy-this.ry],
            'n': [this.cx, this.cy-this.ry],
            'ne': [this.cx+this.rx, this.cy-this.ry],
            'w': [this.cx-this.rx, this.cy],
            'e': [this.cx+this.rx, this.cy],
            'sw': [this.cx-this.rx, this.cy+this.ry],
            's': [this.cx, this.cy+this.ry],
            'se': [this.cx+this.rx, this.cy+this.ry]
        };
        // draw handles...
        self.handles = this.paper.set();
        // first define drag event handlers
        var _handle_drag = function() {
            return function (dx, dy) {
                // on DRAG: update the location of the handle and the corresponding point of the parent
                //if (manager.getState() !== ShapeManager.STATES.SELECT) {
                //    return;
                //}
                var new_x = this.ox + dx;
                var new_y = this.oy + dy;
                if (this.id.indexOf('e') > -1) {    // if we're dragging an 'EAST' handle, update width
                    self.cx = (new_x-this.oleft)/2 + this.oleft;
                    self.rx = (new_x-this.oleft)/2;
                }
                if (this.id.indexOf('s') > -1) {    // if we're dragging an 'SOUTH' handle, update height
                    self.cy = (new_y-this.otop)/2 + this.otop;
                    self.ry = (new_y-this.otop)/2;
                }
                if (this.id.indexOf('n') > -1) {    // if we're dragging an 'NORTH' handle, update y and height
                    self.cy = (this.obottom-new_y)/2 + new_y;
                    self.ry = (this.obottom-new_y)/2;
                }
                if (this.id.indexOf('w') > -1) {    // if we're dragging an 'WEST' handle, update x and width
                    self.cx = (this.oright-new_x)/2 + new_x;
                    self.rx = (this.oright-new_x)/2;
                }
                self.updateShape();
            };
        };
        var _handle_drag_start = function() {
            return function () {
                // START drag: simply note the location we started
                this.ox = this.attr("x") + handle_wh/2;
                this.oy = this.attr("y") + handle_wh/2;
                // and the bounds of the ellipse
                this.oleft = self.cx - self.rx;
                this.otop = self.cy - self.ry;
                this.oright = self.cx + self.rx;
                this.obottom = self.cy + self.ry;
            };
        };
        var _handle_drag_stop = function() {
            return function() {
                self.model.set({'rx':self.rx, 'ry':self.ry, 'cx':self.cx, 'cy':self.cy});
            };
        };
        for (var key in this.handleIds) {
            var hx = this.handleIds[key][0];
            var hy = this.handleIds[key][1];
            var handle = this.paper.rect(hx-handle_wh/2, hy-handle_wh/2, handle_wh, handle_wh).attr(handle_attrs);
            handle.attr({'cursor': key + '-resize'});     // css, E.g. ne-resize
            handle.id = key;
            handle.rect = self;

            handle.drag(
                _handle_drag(),
                _handle_drag_start(),
                _handle_drag_stop()
            );
            self.handles.push(handle);
        }
        //self.handles.hide();     // show on selection


        // ----- Create the rect itself ----
        this.element = this.paper.ellipse();
        this.element.attr( default_line_attrs );
        // set "element" to the raphael node (allows Backbone to handle events)
        this.setElement(this.element.node);
        this.delegateEvents(this.events);   // we need to rebind the events

        // Handle drag
        this.element.drag(
            function(dx, dy) {
                // DRAG, update location and redraw
                // TODO - need some way to disable drag if we're not in select state
                //if (manager.getState() !== ShapeManager.STATES.SELECT) {
                //    return;
                //}
                self.cx = dx+this.ox;
                self.cy = this.oy+dy;
                self.updateShape();
            },
            function() {
                // START drag: note the location of all points (copy list)
                this.ox = this.attr('cx');
                this.oy = this.attr('cy');
            },
            function() {
                // STOP: save current position to model
                self.model.set({'cx':self.cx, 'cy':self.cy});
            }
        );

        // If we're starting DRAG, don't let event propogate up to dragdiv etc.
        // https://groups.google.com/forum/?fromgroups=#!topic/raphaeljs/s06GIUCUZLk
        this.element.mousedown(function(e){
             e.stopImmediatePropagation();
        });

        // Finally, we need to render when model changes
        this.model.on('change', this.render, this);
    },

    // render updates our local attributes from the Model AND updates coordinates
    render: function() {
        this.cx = this.model.get("cx");
        this.cy = this.model.get("cy");
        this.rx = this.model.get("rx");
        this.ry = this.model.get("ry");
        this.updateShape();
    },

    // used to update during drags etc. Also called by render()
    updateShape: function() {
        //console.log("updateShape", "cx:", this.cx, "cy:", this.cy, "rx:", this.rx, "ry:", this.ry);
        this.element.attr({'cx':this.cx, 'cy':this.cy, 'rx':this.rx, 'ry':this.ry});

        this.handleIds = {'nw': [this.cx-this.rx, this.cy-this.ry],
            'n': [this.cx, this.cy-this.ry],
            'ne': [this.cx+this.rx, this.cy-this.ry],
            'w': [this.cx-this.rx, this.cy],
            'e': [this.cx+this.rx, this.cy],
            'sw': [this.cx-this.rx, this.cy+this.ry],
            's': [this.cx, this.cy+this.ry],
            'se': [this.cx+this.rx, this.cy+this.ry]
        };
        var hnd, h_id, hx, hy;
        for (var h=0, l=this.handles.length; h<l; h++) {
            hnd = this.handles[h];
            h_id = hnd.id;
            hx = this.handleIds[h_id][0];
            hy = this.handleIds[h_id][1];
            hnd.attr({'x':hx-handle_wh/2, 'y':hy-handle_wh/2});
        }
    },
    // Create a new model and a view for it
    selectShape: function() {
        //console.log("selectShape");
    },
    
    
    destroy: function() {
        this.element.remove();
        this.handles.remove();
        this.model.off('change', this.render, this);
    }
});

