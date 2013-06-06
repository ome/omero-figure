
var handle_wh = 20;
var default_line_attrs = {'stroke-width':1, 'stroke': '#4b80f9', 'cursor': 'default', 'fill-opacity':0.1, 'fill': '#000'};
var selected_line_attrs = {'stroke':'#4b80f9'};
var handle_attrs = {stroke:'#fff', fill:'#000', 'cursor': 'default'};

var RectModel = Backbone.Model.extend({


});












var RectView = Backbone.View.extend({
    // make a child on click
    events: {
        //'mousedown': 'selectShape'    // we need to handle this more manually (see below)
    },
    initialize: function(options) {
        // Here we create the shape itself, the drawing handles and
        // bind drag events to all of them to drag/resize the rect.

        var self = this;
        this.paper = options.paper;
        // this.manager = options.manager;

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
            handle.mousedown(function(e){
                e.stopImmediatePropagation();
            });
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
        this.model.trigger("drag", [this.x, this.y, this.width, this.height]);
        this.element.attr({'x':this.x, 'y':this.y, 'width':this.width, 'height':this.height});

        // if (this.manager.selected_shape_id === this.model.get("id")) {
        if (this.selected) {
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
    },

    selectShape: function() {
        console.log("TODO selectShape");
        this.selected = true;
        this.updateShape();
        // this.manager.set_selected_shape( this.model.get('id') );
    },

    // Destroy: remove Raphael elements and event listeners
    destroy: function() {
        this.element.remove();
        this.handles.remove();
        this.model.off('change', this.render, this);
    }
});
