
var ShapeModel = Backbone.Model.extend({

    convertOMEROShape: function() {
        // Converts a shape json from OMERO into format taken by Shape-editor
        // if shape has Arrow head, shape.type = Arrow
        var s = this.toJSON();
        if (s.markerEnd === 'Arrow' || s.markerStart === 'Arrow') {
            s.type = 'Arrow';
            if (s.markerEnd !== 'Arrow') {
                // Only marker start is arrow - reverse direction!
                var tmp = {'x1': s.x1, 'y1': s.y1, 'x2': s.x2, 'y2': s.y2};
                s.x1 = tmp.x2;
                s.y1 = tmp.y2;
                s.x2 = tmp.x1;
                s.y2 = tmp.y1;
            }
        }
        if (s.type === 'Ellipse') {
            // If we have OMERO 5.3, Ellipse has x, y, radiusX, radiusY
            if (s.radiusX !== undefined) {
                s.cx = s.x;
                s.cy = s.y;
                s.rx = s.radiusX;
                s.ry = s.radiusY;
            }
        }
        return s;
    },
});

var ShapeList = Backbone.Collection.extend({
    model: ShapeModel
});

var RoiModel = Backbone.Model.extend({

    initialize: function(data) {
        this.shapes = new ShapeList(data.shapes);
    }
});

var RoiList = Backbone.Collection.extend({
    // url: ROIS_JSON_URL + iid + "/",
    model: RoiModel,

    deselectShapes: function(){
        this.forEach(function(roi){
            roi.shapes.forEach(function(s){
                if (s.get('selected')) {
                    s.set('selected', false)
                }
            });
        });
    },

    selectShape: function(shapeId){
        var shape,
            shapeJson;
        this.forEach(function(roi){
            roi.shapes.forEach(function(s){
                if (s.get('id') === shapeId) {
                    s.set('selected');
                }
            });
        });
        shape = this.getShape(shapeId);
        if (shape) {
            shapeJson = shape.convertOMEROShape();
        }
        this.trigger('change:selection', [shapeJson]);
    },

    getShape: function(shapeId){
        var shape;
        this.forEach(function(roi){
            var s = roi.shapes.get(shapeId);
            if (s) {
                shape = s;
            }
        });
        return shape;
    }
});
