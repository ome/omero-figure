

function ShapeManager(canvasId, width, height) {
    
    // private variables
    var self = this,
        paper = Raphael(canvasId, width, height),
        shape_objects = [],
        state = ShapeManager.STATES.SELECT,
        current_color,
        selected_shape_id,
        $canvas = $("#"+canvasId),
        handle_shape_click = function(attrs) {
            if (self.getState() !== ShapeManager.STATES.SELECT) {
                return;
            }
            // TODO - Don't blindly pass attrs to $.publish.
            //console.log(attrs);
            $.publish("selection_change", attrs);
            self.setSelectedShape(this.id);
        };
    self.defaultSquareSize = null;  // 'public' variable

    // Mouse events on the canvas itself - used to create events (if we're in the right state)
    var trackPointer;
    var handleCanvasClick = function(event) {
        if (self.getState() === ShapeManager.STATES.CREATE_POLYLINE || 
                self.getState() === ShapeManager.STATES.CREATE_POLYGON) {
            self.clearSelection();
            var $this = $(this),
                closed = (self.getState() === ShapeManager.STATES.CREATE_POLYGON);
            var x = event.pageX - $this.offset().left,
                y = event.pageY - $this.offset().top;
            var id = x+y, // TODO  use random number instead;
                points_list = [[x,y], [x,y]];
            var line = new Polyline(paper, id, points_list, handle_shape_click, closed, self, {'fill':current_fillcolor});
            shape_objects.push(line);
        
            trackPointer = function(event) {
                var x2 = event.pageX - $this.offset().left,
                    y2 = event.pageY - $this.offset().top;
                line.updateLastPoint(x2, y2);
            };
            $canvas.bind('mousemove', trackPointer);
        
            var wait;
            var addPoint = function(event) {
                // only add point if this is single click (cancel if double-click)
                // if this is the second of a double-click, ignore!
                if (typeof wait !== "undefined") {
                    clearTimeout(wait);
                    wait = undefined;
                    return;
                }
                // To avoid delay in UI, need to add instantly but... (see dblclick below)
                var x2 = event.pageX - $this.offset().left,
                    y2 = event.pageY - $this.offset().top;
                line.addPoint(x2, y2);  // add point instantly
                wait = setTimeout(function(){
                    wait = undefined;
                }, 250);
            };
            $canvas.click(addPoint);
        
            // On Double-Click we don't add ANY points. We simply stop the creating process.
            $canvas.one('dblclick', function() {
                line.removeLastPoint();     // ...remove point added by first click of double-click!
                $canvas.unbind('mousemove', trackPointer);
                $canvas.unbind('click', addPoint);
                $canvas.one('click', handleCanvasClick);
                self.setSelectedShape(id);
            });
        } else {
            // if we haven't 'used' our one click - need to add it again
            $canvas.one('click', handleCanvasClick);
        }
    };
    
    $canvas.one('click', handleCanvasClick);
    
    
    $canvas.bind('mousedown', function(event) {
        var $this = $(this);
        var x = event.pageX - $this.offset().left,
            y = event.pageY - $this.offset().top;
        
        // -- Line Creation --
        if (self.getState() === ShapeManager.STATES.CREATE_LINE) {
            self.clearSelection();
            
            var id = x+y, // TODO  use random number instead;
                points_list = [[x,y], [x,y]];
            var line = new Polyline(paper, id, points_list, handle_shape_click, false, self);
            shape_objects.push(line);
            
            // while mouse stays down (drag), we redraw the new line...
            var stretchLine = function(event){
                var x2 = event.pageX - $this.offset().left,
                    y2 = event.pageY - $this.offset().top;
                line.updatePoints([[x,y], [x2,y2]]);
            };
            $canvas.bind('mousemove', stretchLine);
            
            // until mouse is released
            $canvas.one('mouseup', function(){
                $canvas.unbind('mousemove', stretchLine);
                //line.ensureMinSize(); // make sure we're not zero size
                self.setSelectedShape(id);
            });
        }
        
        // --- Rectangle Creation ---
        else if (self.getState() === ShapeManager.STATES.CREATE_RECT) {
            self.clearSelection();
            var square,
                id;
            if (self.defaultSquareSize) {
                id = x+y; // TODO  use random number instead;
                size = self.defaultSquareSize;
                var x1 = x - (size/2),
                    y1 = y - (size/2);
                square = new Rectangle(paper, id, x1, y1, size, size, handle_shape_click, self, {'fill':current_fillcolor});
                shape_objects.push(square);
                
                // while mouse stays down (drag), we recenter the new square...
                var recenter = function(event){
                    var rx = event.pageX - $this.offset().left,
                        ry = event.pageY - $this.offset().top;
                    square.recenter(rx,ry);
                };
                $canvas.bind('mousemove', recenter);
                
                // until mouse is released
                $canvas.one('mouseup', function(){
                    $("#holder").unbind('mousemove', recenter);
                    self.setSelectedShape(id);
                });
            } else {
                id = x+y; // TODO  use random number instead;
                square = new Rectangle(paper, id, x, y, 0, 0, handle_shape_click, self, {'fill':current_fillcolor});
                shape_objects.push(square);
                
                // while mouse stays down (drag), we resize the new square...
                var updateCorners = function(event){
                    var x2 = event.pageX - $this.offset().left,
                        y2 = event.pageY - $this.offset().top;
                    square.updateCorners(x, y, x2, y2);
                };
                $canvas.bind('mousemove', updateCorners);
                
                // until mouse is released
                $canvas.one('mouseup', function(){
                    $canvas.unbind('mousemove', updateCorners);
                    square.ensureMinSize(); // make sure we're not zero size
                    self.setSelectedShape(id);
                });
            }
        }
    });

    // E.g. shape_params = {"strokeWidth": 1, "fillAlpha": 0.25, "strokeAlpha": 0.765625, "height": 106.0, "width": 135.0,  
    // "theZ": 14, "y": 89.0, "x": 157.0, "strokeColor": "#c4c4c4", "theT": 0, "type": "Rectangle", "id": 334, "fillColor": "#000000"},
    this.addShape = function(shape_params) {
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


    // A bunch of functions that use closure to access private variables
    this.setState = function(new_state) {
        state = new_state;
    };

    this.getState = function(new_state) {
        return state;
    };

    this.setSelectedShape = function(shape_id) {
        console.log( "SET SelectedShape:", shape_id );
        selected_shape_id = shape_id;
        for (var i=0; i<shape_objects.length; i++) {
            var s = shape_objects[i];
            s.setSelected(shape_id == s.id);
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
            selshpe.line_attrs.fill = color;
            selshpe.shape.attr('fill', color);
        }
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
        console.log("shape_objects.length", shape_objects.length);
    };
}


ShapeManager.prototype.clearSelection = function() {
    this.setSelectedShape(null);
};

ShapeManager.STATES = {'SELECT':0, 'CREATE_RECT':1, 'CREATE_LINE':2, 'CREATE_POLYLINE':3,
        'CREATE_POLYGON':4};