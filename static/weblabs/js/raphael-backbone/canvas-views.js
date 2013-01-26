// ------------------------ CANVAS VIEWS -------------------------------
// Here we handle all rendering of the Backbone Shape Models on a Raphael
// 'paper' canvas.
// We have a 'Manager' to handle creation of ROI - Views
// (based on changes in the ROI model)
// and coordinate changes in theZ, theT or selected shape_id etc
// (based on changes to the uiState model).
// ROI-Views themselves don't do any rendering, they simply manage Shape Views.
// Shape views (one for each type of Shape) render as Raphael Rect, Line, etc
// with 'handles' to allow resizing & moving.
// The Manager is passed down to each Shape View, so each Shape View can
// get and set the selected shape_id.

/*global Backbone:true */

var default_line_attrs = {'stroke-width':1, 'stroke': '#ffffff', 'cursor': 'default', 'fill-opacity':0.1, 'fill': '#000'};
var selected_line_attrs = {'stroke':'#ff0000'};
var handle_attrs = {stroke:'#fff', fill:'#000', 'cursor': 'default'};
var handle_wh = 10;


// Manage the ROI views for canvas
var RoiCanvasViewManager = Backbone.View.extend({

    // Bind creation of ROIs to new ROI-Views
    initialize: function(opts) {
        this.views = [];
        this.paper = opts.paper;
        this.uiState = opts.uiState;
        
        var self = this,
            model = this.model;

        this.model.on("sync", function() {
            model.each(function(model, i){
                var v = new RoiCanvasView({model:model, paper:opts.paper, manager:self});
                self.views.push(v);
            });
        });
        this.model.on("add", function(roi){
            var v = new RoiCanvasView({model: roi, paper:opts.paper, manager:self});
            self.views.push(v);
        });
        
        opts.uiState.on("change", function(state, attr) {
            if (attr.changes.theZ || attr.changes.theT) {
                self.setZandT( state.get('theZ'), state.get('theT') );
            }
            if (attr.changes.selectedShape) {
                self.update_shape_selection( state.get('selectedShape') );
            }
        });
        
        this.theZ = null;
        this.theT = null;
    },

    // Update the Z and T, then destroy & create new shapes
    setZandT: function(theZ, theT) {
        if (typeof theZ === "number") {
            this.theZ = theZ;
        }
        if (typeof theT === "number") {
            this.theT = theT;
        }
        this.recreate_rois();
    },

    // Destroy all shapes and create new shapes for current plane
    recreate_rois: function() {
        var roi_view;
        for (var i=0; i<this.views.length; i++) {
            roi_view = this.views[i];
            roi_view.destroyShapes();
            roi_view.showShapes(this.theZ, this.theT);
        }
    },

    // set the selected shape ID, then update visible shapes
    set_selected_shape: function(shape_id) {
        this.uiState.set("selectedShape", shape_id);
    },

    update_shape_selection: function(shape_id) {
        this.selected_shape_id = shape_id;
        this.update_rois();
    },

    // Just update selection of any visible Shapes
    update_rois: function() {
        var roi_view;
        for (var i=0; i<this.views.length; i++) {
            roi_view = this.views[i];
            roi_view.updateShapes();
        }
    }
});


// This ROI-View doesn't SHOW anything on paper:
// - Just binds creation of Shape-Views to shape creation.
var RoiCanvasView = Backbone.View.extend({

    // Bind Shape creation to New Shape-Views
    initialize: function(opts) {
        this.shapeViews = [];
        this.paper = opts.paper;    // seems we need to do this for paper but not for model
        this.manager = opts.manager;
        
        var self = this;
        
        // Don't create shape initially...(may not be on correct Z/T plane)
        // If a shape is added, Create View for that too
        this.model.shapes.on("add", function(shape) {
            self.create_shape_view(shape);
        });
    },

    // Destroy all shapes
    destroyShapes: function() {
        var svs = this.shapeViews,
            sv;
        for(var i=0; i<svs.length; i++) {
            sv = svs[i];
            sv.destroy();
        }
        svs.length = 0;     // All shapes gone
    },

    // Create shapes on specified Z and T
    showShapes: function(theZ, theT) {
        var self = this;
        this.model.shapes.each(function(shape) {
            if ((shape.get('theZ') === theZ) && (shape.get('theT') === theT)) {
                self.create_shape_view(shape);
            }
        });
    },

    // Create method called above
    create_shape_view: function(shape) {
        var view,
            type = shape.get('type');
        if (type === "Rectangle") {
            view = new RectView({model:shape, paper:this.paper, manager: this.manager});
        } else if (type === "Ellipse") {
            view = new EllipseView({model:shape, paper:this.paper, manager: this.manager});
        } else if (type === "Line") {
            view = new PolylineView({model:shape, paper:this.paper, manager: this.manager});
        } else if (type === "PolyLine") {
            view = new PolylineView({model:shape, paper:this.paper, manager: this.manager});
        } else if (type === "Polygon") {
            view = new PolylineView({model:shape, paper:this.paper, manager: this.manager});
        }
        if (view) {
            view.render();
            this.shapeViews.push(view);
        }
    },

    // Refresh the selection appearence etc of existing shapes
    updateShapes: function() {
        var shape;
        for (var i=0, l=this.shapeViews.length; i<l; i++) {
            shape = this.shapeViews[i];
            shape.updateShape();
        }
    }
});


var BaseShapeView = Backbone.View.extend({

    selectShape: function() {
        this.manager.set_selected_shape( this.model.get('id') );
    },

    // Destroy: remove Raphael elements and event listeners
    destroy: function() {
        this.element.remove();
        this.handles.remove();
        this.model.off('change', this.render, this);
    }
});


var PolylineView = BaseShapeView.extend({

    initialize: function(options) {
        var self = this;
        this.paper = options.paper;
        this.manager = options.manager;

        // Set up our 'view' attributes (for rendering without updating model)
        this.loadPointsList();      // loads this.points_list and this.closed

        // ---- Create Handles ----
        self.handles = this.paper.set();
        self.createHandles();
        self.handles.hide();     // show on selection

        // Create the Polyline itself...
        self.element = this.paper.path("").attr(default_line_attrs);
        // set "element" to the raphael node (allows Backbone to handle events)
        this.setElement(this.element.node);
        this.delegateEvents(this.events);   // we need to rebind the events
        self.element.pl = this;

        self.element.drag(
            function (dx, dy) {
                // on DRAG: update the location of the handles and the line
                //if (manager.getState() !== ShapeManager.STATES.SELECT) {
                //    return;
                //}
                for (var p=0; p < self.points_list.length; p++) {
                    var ox = this.pl.orig_points[p][0];
                    var oy = this.pl.orig_points[p][1];
                    this.pl.points_list[p] = [(ox + dx), (oy + dy)];
                }
                this.pl.updateShape();
            },
            function () {
                // START drag: note the location of all points (copy list)
                this.pl.orig_points = [];
                for (var i=0; i < this.pl.points_list.length; i++) {
                    this.pl.orig_points.push(this.pl.points_list[i]);
                }
            },
            function() {
                // STOP: save current position to model
                self.savePointsList();
                return false;
            }
        );

        // If we're starting DRAG, don't let event propogate up to dragdiv etc.
        // https://groups.google.com/forum/?fromgroups=#!topic/raphaeljs/s06GIUCUZLk
        this.element.mousedown(function(e){
             e.stopImmediatePropagation();
             self.selectShape();
        });

        self.updateShape();

        // Finally, we need to render when model changes
        this.model.on('change', this.render, this);
    },

    // The Model uses a 'points' string but we want to work with a list of [x,y] points
    loadPointsList: function() {
        var points,
            pl, i,
            rv = [];
        if (this.model.get('type') === 'Line') {
            var x1 = this.model.get('x1'),
                x2 = this.model.get('x2'),
                y1 = this.model.get('y1'),
                y2 = this.model.get('y2');
            this.points_list = [ [x1,y1], [x2,y2]];
        } else {
            points = this.model.get('points');      // E.g. "M 370 147 L 309 208 L 372 291 L 418 253 L 424 199 z"
            points = points.replace("M ", "");
            if (points.slice(-1) === "z") {
                this.closed = true;
            }
            points = points.replace(" z", "");
            points = points.split(" L ");
            for (i=0; i<points.length; i++) {
                pl = points[i].split(" ");
                rv.push( [parseInt(pl[0], 10), parseInt(pl[1], 10)] );
            }
            this.points_list = rv;
        }
    },

    // Saves the current this.points_list back to the model 'points' string
    savePointsList: function() {
        if (this.model.get('type') === 'Line') {
            var x1 = this.points_list[0][0],
                y1 = this.points_list[0][1],
                x2 = this.points_list[1][0],
                y2 = this.points_list[1][1];
            this.model.set('x1', x1);
            this.model.set('y1', y1);
            this.model.set('x2', x2);
            this.model.set('y2', y2);
        } else {
            var points = "M " + this.points_list[0].join(" ");
            for (var i=1; i<this.points_list.length; i++) {
                points += " L " + this.points_list[i].join(" ");
            }
            if (this.closed) {
                points += " z";
            }
            this.model.set("points", points);
        }
    },

    createHandles: function() {
        // init handles & line
        var self = this;
        self.handles.remove();
        self.handles = self.paper.set();

        var _handle_drag = function() {
            return function (dx, dy) {
                // on DRAG: update the corresponding point of the parent and redraw
                //if (self.manager.getState() !== ShapeManager.STATES.SELECT) {
                //    return;
                //}
                this.polyline.points_list[this.i] = [(this.ox + dx + handle_wh/2),(this.oy + dy + handle_wh/2)];
                this.polyline.updateShape();
            };
        };
        var _handle_drag_start = function() {
            return function () {
                // START drag: simply note the location we started
                this.ox = this.attr("x");
                this.oy = this.attr("y");
            };
        };
        var _handle_drag_stop = function() {
            return function () {
                // STOP drag: save points to model
                this.polyline.savePointsList();
            };
        };
        var handle;
        for (var i=0; i < self.points_list.length; i++) {
            var hx = self.points_list[i][0];
            var hy = self.points_list[i][1];
            handle = self.paper.rect(hx-handle_wh/2, hy-handle_wh/2, handle_wh, handle_wh).attr(handle_attrs);
            handle.attr( {fill: Raphael.getColor() });
            handle.i = i;
            handle.polyline = self;
            handle.drag(
                _handle_drag(),
                _handle_drag_start(),
                _handle_drag_stop()
            );
            self.handles.push(handle);
        }
    },

    // render updates our local attributes from the Model AND updates coordinates
    render: function() {
        this.loadPointsList();
        this.updateShape();
    },

    // used to update during drags etc. Also called by render()
    updateShape: function() {

        if (this.manager.selected_shape_id === this.model.get("id")) {
            this.element.attr( selected_line_attrs );
            this.handles.show();
        } else {
            this.element.attr( default_line_attrs );    // this should be the shapes OWN line / fill colour etc.
            this.handles.hide();
        }

        // set position of each handle
        var px, py;
        for (var p=0; p < this.points_list.length; p++) {
            px = this.points_list[p][0];
            py = this.points_list[p][1];
            this.handles[p].attr({x: (px - handle_wh/2), y: (py - handle_wh/2)});
        }
        // redraw line
        var path_string = "M" + this.points_list.join("L");
        if (this.closed) {
            path_string += " z";
        }

        this.element.attr({path: path_string});
    }
});


var RectView = BaseShapeView.extend({
    // make a child on click
    events: {
        //'mousedown': 'selectShape'    // we need to handle this more manually (see below)
    },
    initialize: function(options) {
        // Here we create the shape itself, the drawing handles and
        // bind drag events to all of them to drag/resize the rect.

        var self = this;
        this.paper = options.paper;
        this.manager = options.manager;

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
        self.handles.hide();     // show on selection


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
             self.selectShape();
        });

        this.updateShape();  // sync position, selection etc.

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

        if (this.manager.selected_shape_id === this.model.get("id")) {
            this.element.attr( selected_line_attrs );
            this.handles.show();
        } else {
            this.element.attr( default_line_attrs );    // this should be the shapes OWN line / fill colour etc.
            this.handles.hide();
        }

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
    }
});


// ----------------- Ellipse --------------------

var EllipseView = BaseShapeView.extend({
    // make a child on click
    events: {
        //'mousedown': 'selectShape'    // need to handle manually
    },
    initialize: function(options) {

        var self = this;
        this.paper = options.paper;
        this.manager = options.manager;

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
        self.handles.hide();     // show on selection


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
             self.selectShape();
        });

        this.updateShape();     // sync selection etc

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
        this.element.attr({'cx':this.cx, 'cy':this.cy, 'rx':this.rx, 'ry':this.ry});

        // NB: this is identical in Other shapes - TODO: refactor into BaseShape
        if (this.manager.selected_shape_id === this.model.get("id")) {
            this.element.attr( selected_line_attrs );
            this.handles.show();
        } else {
            this.element.attr( default_line_attrs );    // this should be the shapes OWN line / fill colour etc.
            this.handles.hide();
        }

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
    }
});

