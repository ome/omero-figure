var handle_wh = 10;

var handle_attrs = {stroke:'#fff', fill:'#000', 'cursor': 'default'};
var default_line_attrs = {'stroke-width':1, 'stroke': '#ffffff', 'cursor': 'default', 'fill-opacity':0.1, 'fill': '#000'};
var selected_line_attrs = {'stroke': '#00a8ff', 'fill-opacity':0.3};


// ------- Base Shape -------------
function BaseShape() {
}

BaseShape.prototype.getFillColor = function() {
    return this.shape.attr('fill');
};
BaseShape.prototype.setFillColor = function(color) {
    this.line_attrs.fill = color;
    this.shape.attr('fill', color);
};

BaseShape.prototype.setSelected = function(selected) {
    if (selected) {
        this.shape.attr(this.selected_line_attrs);
        this.shape.toFront();
        this.handles.show();
        this.handles.toFront();
    } else {
        this.shape.attr(this.line_attrs);
        this.handles.hide();
    }
};

BaseShape.prototype.getAttrs = function() {
    return this.line_attrs;
};


// Rectangle shape
function Rectangle(paper, id, x, y, width, height, handle_shape_click, manager, options) {

    this.MINSIZE = 20;
    this.paper = paper;
    this.id = id;
    this.x = x; this.y = y; this.width = width; this.height = height;
    this.handle_shape_click = handle_shape_click;
    if (typeof options === "undefined") {
        options = {};
    }
    this.line_attrs = $.extend({}, default_line_attrs, options);
    this.selected_line_attrs = $.extend({}, selected_line_attrs);
    var self = this;

    // draw rectangle
    self.shape = self.paper.rect(self.x, self.y, self.width, self.height).attr(this.line_attrs);
    self.shape.rect_obj = self;
    
    self.shape.drag(
        function(dx, dy) {
            if (manager.getState() !== ShapeManager.STATES.SELECT) {
                return;
            }
            //return;
            this.rect_obj.x = dx+this.ox;
            this.rect_obj.y = this.oy+dy;
            this.rect_obj.updateShape();
        },
        function() {
            // START drag: note the location of all points (copy list)
            this.ox = this.attr('x');
            this.oy = this.attr('y');
        }
    );
    
    // map of centre-points for each handle
    this.handleIds = {'nw': [this.x, this.y],
        'n': [this.x+this.width/2,this.y],
        'ne': [this.x+this.width,this.y],
        'w': [this.x, this.y+this.height/2],
        'e': [this.x+this.width, this.y+this.height/2],
        'sw': [this.x, this.y+this.height],
        's': [this.x+this.width/2, this.y+this.height],
        'se': [this.x+this.width, this.y+this.height]};
    
    // draw handles
    self.handles = paper.set();
    var _handle_drag = function() {
        return function (dx, dy) {
            // on DRAG: update the location of the handle and the corresponding point of the parent
            if (manager.getState() !== ShapeManager.STATES.SELECT) {
                return;
            }
            var new_x = this.ox + dx;
            var new_y = this.oy + dy;
            if (this.id.indexOf('e') > -1) {    // if we're dragging an 'EAST' handle, update width
                this.rect.width = new_x - self.x + handle_wh/2;
            }
            if (this.id.indexOf('s') > -1) {    // if we're dragging an 'SOUTH' handle, update height
                this.rect.height = new_y - self.y + handle_wh/2;
            }
            if (this.id.indexOf('n') > -1) {    // if we're dragging an 'NORTH' handle, update y and height
                this.rect.y = new_y + handle_wh/2;
                this.rect.height = this.obottom - new_y;
            }
            if (this.id.indexOf('w') > -1) {    // if we're dragging an 'WEST' handle, update x and width
                this.rect.x = new_x + handle_wh/2;
                this.rect.width = this.oright - new_x;
            }
            this.rect.updateShape();
        };
    };
    var _handle_drag_start = function() {
        return function () {
            // START drag: simply note the location we started
            this.ox = this.attr("x");
            this.oy = this.attr("y");
            this.oright = self.width + this.ox;
            this.obottom = self.height + this.oy;
        };
    };
    for (var key in this.handleIds) {
        var hx = this.handleIds[key][0];
        var hy = this.handleIds[key][1];
        var handle = self.paper.rect(hx-handle_wh/2, hy-handle_wh/2, handle_wh, handle_wh).attr(handle_attrs);
        handle.attr({'cursor': key + '-resize'});     // css, E.g. ne-resize
        handle.id = key;
        handle.rect = self;

        handle.drag(
            _handle_drag(),
            _handle_drag_start()
        );
        self.handles.push(handle);
    }

    self.handles.hide();     // show on selection

    // selection happens on mouse-down. E.g. start drag.
    self.shape.mousedown(function() {
        self.handle_shape_click();
    });

}

// Basic prototype inheritance!
Rectangle.prototype = new BaseShape();

// NB: x1 and x2, y1 and y2 order unimportant
Rectangle.prototype.updateCorners = function(x1, y1, x2, y2) {
    this.x = Math.min(x1, x2);
    this.y = Math.min(y1, y2);
    this.width = Math.max(x1, x2) - this.x;
    this.height = Math.max(y1, y2) - this.y;
    this.updateShape();
};

Rectangle.prototype.ensureMinSize = function() {
    var redraw = false;
    if (this.width < this.MINSIZE) {
        this.width = this.MINSIZE;
        redraw = true;
    }
    if (this.height < this.MINSIZE) {
        this.height = this.MINSIZE;
        redraw = true;
    }
    if (redraw) {
        this.updateShape();
    }
};

Rectangle.prototype.recenter = function(cx, cy) {
    
    this.x = cx - this.width/2;
    this.y = cy - this.height/2;
    this.updateShape();
};

Rectangle.prototype.updateShape = function() {
    // need to update the location of all handles and rectangle
    this.shape.attr({'x':this.x, 'y':this.y, 'width':this.width, 'height':this.height});
    
    this.handleIds = {'nw': [this.x, this.y],
        'n': [this.x+this.width/2,this.y],
        'ne': [this.x+this.width,this.y],
        'w': [this.x, this.y+this.height/2],
        'e': [this.x+this.width, this.y+this.height/2],
        'sw': [this.x, this.y+this.height],
        's': [this.x+this.width/2, this.y+this.height],
        'se': [this.x+this.width, this.y+this.height]};
    for (var h=0; h<this.handles.length; h++) {
        var hnd = this.handles[h];
        var h_id = hnd.id;
        var hx = this.handleIds[h_id][0];
        var hy = this.handleIds[h_id][1];
        hnd.attr({'x':hx-handle_wh/2, 'y':hy-handle_wh/2});
        
    }
};


// Polyline shape
function Polyline(paper, id, points_list, handle_shape_click, closed, manager, options) {

    this.paper = paper;
    this.id = id;
    this.closed = closed;
    this.points_list = points_list;
    this.handle_shape_click = handle_shape_click;
    if (typeof options === "undefined") {
        options = {};
    }
    var sel_opts = {};
    if (!closed) {
        options['fill-opacity'] = 0.001;
        sel_opts['fill-opacity'] = 0.001;
    }
    this.line_attrs = $.extend({}, default_line_attrs, options);
    this.selected_line_attrs = $.extend({}, selected_line_attrs, sel_opts);
    this.manager = manager;
    var self = this;

    var path_string = "M" + this.points_list.join("L");   //M209,227L266,303L190,391
    if (this.closed) {
        path_string += " z";
    }

    // init handles & line
    self.handles = paper.set();
    self.createHandles();
    self.handles.hide();     // show on selection
    
    
    self.shape = self.paper.path(path_string).attr(this.line_attrs);
    self.shape.pl = this;
    
    self.shape.drag(
        function (dx, dy) {
            // on DRAG: update the location of the handles and the line
            if (manager.getState() !== ShapeManager.STATES.SELECT) {
                return;
            }
            for (var p=0; p < self.points_list.length; p++) {
                var ox = this.pl.orig_points[p][0];
                var oy = this.pl.orig_points[p][1];
                this.pl.points_list[p] = [(ox + dx), (oy + dy)];
            }
            this.pl.redrawShape();
        },
        function () {
            // START drag: note the location of all points (copy list)
            this.pl.orig_points = [];
            for (var i=0; i < this.pl.points_list.length; i++) {
                this.pl.orig_points.push(this.pl.points_list[i]);
            }
        }
    );
    
    // selection happens on mouse-down. E.g. start drag.
    self.shape.mousedown(function() {
        self.handle_shape_click(self.line_attrs);
    });

}

// Basic prototype inheritance!
Polyline.prototype = new BaseShape();


Polyline.prototype.createHandles = function() {
    // init handles & line
    var self = this;
    self.handles.remove();
    self.handles = self.paper.set();
    
    var _handle_drag = function() {
        return function (dx, dy) {
            // on DRAG: update the corresponding point of the parent and redraw
            if (self.manager.getState() !== ShapeManager.STATES.SELECT) {
                return;
            }
            this.polyline.points_list[this.i] = [(this.ox + dx + handle_wh/2),(this.oy + dy + handle_wh/2)];
            this.polyline.redrawShape();
        };
    };
    var _handle_drag_start = function() {
        return function () {
            // START drag: simply note the location we started
            this.ox = this.attr("x");
            this.oy = this.attr("y");
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
            _handle_drag_start()
        );
        self.handles.push(handle);
    }
};

Polyline.prototype.updatePoints = function(points) {
    this.points_list = points;
    this.redrawShape();
};

Polyline.prototype.updateLastPoint = function(px, py) {
    var last_index = this.points_list.length - 1;
    if (last_index < 0) {
        return;
    }
    var last_point = [px, py];
    this.points_list[last_index] = last_point;
    this.redrawShape();
};

Polyline.prototype.removeLastPoint = function(px, py) {
    this.points_list.pop();
    this.createHandles();
    this.redrawShape();
};


Polyline.prototype.addPoint = function(px, py) {
    //console.log("addPoint", px, py);
    var pl_length = this.points_list.length;
    this.points_list[pl_length-1] = [px,py];
    this.points_list.push([px,py]);
    this.createHandles();
    this.redrawShape();
};

Polyline.prototype.redrawShape = function() {
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
    this.shape.attr({path: path_string});
};
