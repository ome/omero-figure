
var paper_width = 700;
var paper_height = 400;



window.onload = function () {
    
    var shape_objects = [];
    var self = this;
    
    var set_selected_shape = function(shape_id) {
        for (var i=0; i<shape_objects.length; i++) {
            var s = shape_objects[i];
            var sid = parseInt(s.id);
            //console.log("   ", shape_id, selected_shape_id, shape_id == selected_shape_id);
            s.setSelected(shape_id == sid);
        }
    }
    
    // called when user clicks on ROI
    var handle_shape_click = function(event) {
        // unless we're in 'select' mode, ignore click...
        if( !$('#controls input[value=select]').is(":checked") ) {
            return;
        }
        var shape = this;
        var shape_id = parseInt(shape.id);
        console.log('handle_shape_click...', shape_id);
        set_selected_shape(shape_id);
    }
    
    var paper = Raphael("holder", paper_width, paper_height);
    
    $("#holder").bind('mousedown', function(event) {
        var $this = $(this);
        var x = event.pageX - $this.offset().left,
            y = event.pageY - $this.offset().top;

        if( $('#controls input[value=create_rect]').is(":checked")){
            
            var default_square_size = $("#default_square_size").val();
            // on mouse down, we create square centered on point...
            if (default_square_size.length > 0) {
                default_square_size = parseInt(default_square_size);
                var id = x+y; // TODO  use random number instead;
                var x1 = x - (default_square_size/2),
                    y1 = y - (default_square_size/2);
                var square = new Rectangle(paper, id, x1, y1, default_square_size, default_square_size, handle_shape_click);
                shape_objects.push(square);
                
                // while mouse stays down (drag), we recenter the new square...
                var recenter = function(event){
                    var rx = event.pageX - $this.offset().left,
                        ry = event.pageY - $this.offset().top;
                    square.recenter(rx,ry);
                };
                $("#holder").bind('mousemove', recenter);
                
                // until mouse is released
                $("#holder").one('mouseup', function(){
                    $("#holder").unbind('mousemove', recenter);
                    set_selected_shape(id);
                });
            } else {
                var id = x+y; // TODO  use random number instead;
                var square = new Rectangle(paper, id, x, y, 0, 0, handle_shape_click);
                shape_objects.push(square);
                
                // while mouse stays down (drag), we resize the new square...
                var updateCorners = function(event){
                    var x2 = event.pageX - $this.offset().left,
                        y2 = event.pageY - $this.offset().top;
                    square.updateCorners(x, y, x2, y2);
                };
                $("#holder").bind('mousemove', updateCorners);
                
                // until mouse is released
                $("#holder").one('mouseup', function(){
                    $("#holder").unbind('mousemove', updateCorners);
                    square.ensureMinSize(); // make sure we're not zero size
                    set_selected_shape(id);
                });
                
            }
            
        }
    });
    
    var p1 = new Rectangle(paper, 10, 50, 50, 100, 100, handle_shape_click);
    shape_objects.push(p1);

    var p2 = new Polyline(paper, 12, [[319,327], [179,227], [459,27]], handle_shape_click, true);   // true: closed
    shape_objects.push(p2);
    
    var p3 = new Polyline(paper, 13, [[59,27], [339,217]], handle_shape_click);
    shape_objects.push(p3);
    
    var p4 = new Rectangle(paper, 15, 250, 50, 100, 100, handle_shape_click);
    shape_objects.push(p4);
    
    shape_objects.push(p1);
    var p4 = new Rectangle(paper, 14, 250, 250, 90, 110, handle_shape_click);
    shape_objects.push(p4);
    
    var p5 = new Polyline(paper, 18, [[19,327], [79,227], [159,27], [59,27]], handle_shape_click);
    shape_objects.push(p5);
};

