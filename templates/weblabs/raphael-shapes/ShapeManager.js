

function ShapeCreator($canvas, paper, manager, handle_shape_click) {
    
    // Mouse events on the canvas itself - used to create events (if we're in the right state)
    var newShape;       // reference to new Shape during creation
        
    var trackPointer, addPoint, handleCanvasClick, stretchLine;
    
    var self = this,
        dblClickTime;
    
    
    $canvas.click(function(event) {
        var $this = $(this),
            x = event.pageX - $this.offset().left,
            y = event.pageY - $this.offset().top,
            id = x+y; // TODO  use random number instead;

        // no shape created yet...
        if (typeof newShape === "undefined") {
            
            // we're looking to create Polyline or Polygon
            if (manager.getState() === ShapeManager.STATES.CREATE_POLYLINE || 
                    manager.getState() === ShapeManager.STATES.CREATE_POLYGON) {
                manager.clearSelection();
                var closed = (manager.getState() === ShapeManager.STATES.CREATE_POLYGON),
                    points_list = [[x,y], [x,y]];
                // create our new shape
                newShape = new Polyline(paper, id, points_list, handle_shape_click, closed, manager, {'fill':current_fillcolor});
                manager.addShape(newShape);
            }
        
        // we've got a shape under creation...
        } else {
            // and it's a Polyline or Polygon...
            if (manager.getState() === ShapeManager.STATES.CREATE_POLYLINE || 
                    manager.getState() === ShapeManager.STATES.CREATE_POLYGON) {
                
                // ignore the second of 2 clicks
                if (typeof dblClickTime !== "undefined") {
                    clearTimeout(dblClickTime);
                    dblClickTime = undefined;
                    return;
                }
                // To avoid delay in UI, need to add instantly but... (see dblclick below)
                newShape.addPoint(x, y);  // add point instantly
                dblClickTime = setTimeout(function(){
                    dblClickTime = undefined;
                }, 250);
            }
        }
    });


    $canvas.bind("mousemove", function(event) {

        var $this = $(this),
            x = event.pageX - $this.offset().left,
            y = event.pageY - $this.offset().top;

        // If we've got a shape we're creating...
        if (typeof newShape !== "undefined") {

            // and it's a Polyline or Polygon
            if (manager.getState() === ShapeManager.STATES.CREATE_POLYLINE || 
                    manager.getState() === ShapeManager.STATES.CREATE_POLYGON) {
                // update last point
                newShape.updateLastPoint(x, y);
            }
        }
    });

    $canvas.bind("dblclick", function() {
        newShape.removeLastPoint();     // ...remove point added by first click of double-click!
        self.finishLineCreation();
    });
    
    
    
    this.finishLineCreation = function() {
        if (typeof newShape === "undefined") {
            return;
        }
        manager.setSelectedShape(newShape.id);
        newShape = undefined;
    };

    
    $canvas.bind('mousedown', function(event) {
        var $this = $(this),
            x = event.pageX - $this.offset().left,
            y = event.pageY - $this.offset().top,
            id = x+y; // TODO  use random number instead;
        
        // -- Line Creation --
        if (manager.getState() === ShapeManager.STATES.CREATE_LINE) {
            manager.clearSelection();
            
            var points_list = [[x,y], [x,y]];
            newShape = new Polyline(paper, id, points_list, handle_shape_click, false, manager);
            manager.addShape(newShape);
            
            // while mouse stays down (drag), we redraw the new line...
            stretchLine = function(event){
                var x2 = event.pageX - $this.offset().left,
                    y2 = event.pageY - $this.offset().top;
                newShape.updatePoints([[x,y], [x2,y2]]);
            };
            $canvas.bind('mousemove', stretchLine);
            
            // until mouse is released
            $canvas.one('mouseup', function(){
                self.finishLineCreation();
                //newShape.ensureMinSize(); // make sure we're not zero size
            });
        }
        
        // --- Rectangle Creation ---
        else if (manager.getState() === ShapeManager.STATES.CREATE_RECT) {
            manager.clearSelection();
            if (manager.defaultSquareSize) {
                id = x+y; // TODO  use random number instead;
                size = manager.defaultSquareSize;
                var x1 = x - (size/2),
                    y1 = y - (size/2);
                newShape = new Rectangle(paper, id, x1, y1, size, size, handle_shape_click, manager, {'fill':current_fillcolor});
                manager.addShape(newShape);
                
                // while mouse stays down (drag), we recenter the new square...
                var recenter = function(event){
                    var rx = event.pageX - $this.offset().left,
                        ry = event.pageY - $this.offset().top;
                    newShape.recenter(rx,ry);
                };
                $canvas.bind('mousemove', recenter);
                
                // until mouse is released
                $canvas.one('mouseup', function(){
                    $("#holder").unbind('mousemove', recenter);
                    manager.setSelectedShape(id);
                });
            } else {
                id = x+y; // TODO  use random number instead;
                newShape = new Rectangle(paper, id, x, y, 0, 0, handle_shape_click, manager, {'fill':current_fillcolor});
                manager.addShape(newShape);
                
                // while mouse stays down (drag), we resize the new square...
                var updateCorners = function(event){
                    var x2 = event.pageX - $this.offset().left,
                        y2 = event.pageY - $this.offset().top;
                    newShape.updateCorners(x, y, x2, y2);
                };
                $canvas.bind('mousemove', updateCorners);
                
                // until mouse is released
                $(document).one('mouseup', function(){
                    $canvas.unbind('mousemove', updateCorners);
                    newShape.ensureMinSize(); // make sure we're not zero size
                    manager.setSelectedShape(id);
                });
            }
        }
    });
}


function ShapeManager(canvasId, width, height) {
    
    // private variables
    var self = this,
        paper = Raphael(canvasId, width, height),
        shape_objects = [],
        state = ShapeManager.STATES.SELECT,
        selected_shape_id,
        $canvas = $("#"+canvasId),
        handle_shape_click = function() {
            if (self.getState() !== ShapeManager.STATES.SELECT) {
                return;
            }
            self.setSelectedShape(this.id);
        };
    self.defaultSquareSize = null;  // 'public' variable

    self.shapeCreator = new ShapeCreator($canvas, paper, self, handle_shape_click);

    // E.g. shape_params = {"strokeWidth": 1, "fillAlpha": 0.25, "strokeAlpha": 0.765625, "height": 106.0, "width": 135.0,  
    // "theZ": 14, "y": 89.0, "x": 157.0, "strokeColor": "#c4c4c4", "theT": 0, "type": "Rectangle", "id": 334, "fillColor": "#000000"},
    this.newShape = function(shape_params) {
        if (shape_params.type === "Rectangle") {
            var r = new Rectangle(paper, shape_params.id, shape_params.x, shape_params.y, 
                    shape_params.width, shape_params.height, handle_shape_click, this, {'fill':current_fillcolor});
            shape_objects.push(r);
        } else if (shape_params.type === "Polygon") {
            var p = new Polyline(paper, shape_params.id, shape_params.points, 
                    handle_shape_click, true, this, {'fill':current_fillcolor});   // true: closed handle_shape_click, this);
            shape_objects.push(p);
        }

        return this;
    };

    this.addShape = function(shape) {
        shape_objects.push(shape);
    };


    // A bunch of functions that use closure to access private variables
    this.setState = function(new_state) {
        self.shapeCreator.finishLineCreation();
        state = new_state;
    };

    this.getState = function(new_state) {
        return state;
    };

    this.setSelectedShape = function(shape_id) {
        selected_shape_id = shape_id;
        var sel_shape;
        for (var i=0; i<shape_objects.length; i++) {
            var s = shape_objects[i];
            s.setSelected(shape_id == s.id);
            if (shape_id == s.id) {
                sel_shape = s;
            }
        }
        console.log("setSelected", sel_shape);
        if (typeof sel_shape !== "undefined") {
            var fc = sel_shape.getFillColor();
            this.setFillColor(fc);
        }
    };
    this.getSelectedShape = function() {
        for (var i=0; i<shape_objects.length; i++) {
            var s = shape_objects[i];
            if (selected_shape_id == s.id) {
                return s;
            }
        }
    };

    // Set the current color in our pallette, E.g. "#ff0000"
    this.setFillColor = function(color) {
        current_fillcolor = color;
        var selshpe = this.getSelectedShape();
        if (selshpe) {
            selshpe.setFillColor(color);
        }
        console.log("publish");
        $.publish("fillColor", color);
    };

    // If a shape is currently selected, delete it
    this.deleteCurrentShape = function() {
        var idx,
            shape_obj;
        for (var i=0; i<shape_objects.length; i++) {
            var s = shape_objects[i];
            if (selected_shape_id == s.id) {
                idx = i;
                shape_obj = s;
                break;
            }
        }
        if (typeof idx !== "undefined") {
            shape_obj.shape.remove();
            shape_obj.handles.remove();
            shape_objects.splice(idx,1);
        }
    };
}


ShapeManager.prototype.clearSelection = function() {
    this.setSelectedShape(null);
};

ShapeManager.STATES = {'SELECT':0, 'CREATE_RECT':1, 'CREATE_LINE':2, 'CREATE_POLYLINE':3,
        'CREATE_POLYGON':4};