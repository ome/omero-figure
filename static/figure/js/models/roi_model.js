var ShapeList = Backbone.Collection;

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
            shapeJson = shape.toJSON();
        }
        this.trigger('change:selection', [shapeJson]);
    },

    getShape: function(shapeId){
        var shape;
        this.forEach(function(roi){
            var s = roi.shapes.get(shapeId);
            if (s) {
                shape = $.extend({}, s);
            }
        });
        return shape;
    }
});
