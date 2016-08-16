
var RoiLoaderView = Backbone.View.extend({

    tagName: 'tbody',

    template: JST["static/figure/templates/modal_dialogs/roi_modal_roi.html"],
    shapeTemplate: JST["static/figure/templates/modal_dialogs/roi_modal_shape.html"],

    initialize: function(options) {
        this.panel = options.panel;
    },

    events: {
        "mouseover .roiModalRoiItem": "mouseoverRoiItem",
        // "mouseout .roiModalRoiItem": "mouseoutRoiItem",
        "click .roiModalRoiItem": "clickRoiItem",
        // "click .toggleRoi": "toggleRoi",
    },

    toggleRoi: function(event) {
        var roiId = event.target.getAttribute('data-RoiId');
        var $span = $(event.target).toggleClass('rotate90');
        if ($span.hasClass('.rotate90')) {
            this.renderShapes(roiId);
        }
        return false;
    },

    renderShapes: function(roiId) {

        var roiData = this.collection.get(roiId).toJSON();
        console.log(roiData);

        var html = this.shapeTemplate({'shapes': roiData.shapes});
        console.log(html, $(".roiModalRoiItem[data-roiId='" + roiId + "']", this.$el).length);
        $(".roiModalRoiItem[data-roiId='" + roiId + "']", this.$el).after(html);
    },

    clickRoiItem: function(event) {
        var $tr = $(event.target);
        // $tr.parentsUntil(".roiModalRoiItem")  DIDN'T work!
        // Do it manually...
        while (!$tr.hasClass("roiModalRoiItem")) {
            $tr = $tr.parent();
        }
        // If ROI has a single shape, add it
        // debugger;
        if ($tr.attr('data-shapeId')) {
            var shapeId = parseInt($tr.attr('data-shapeId'), 10);
            var shape = this.collection.getShape(shapeId);
            var shapeJson = shape.toJSON();
            this.collection.trigger('shape_click', [shapeJson]);
        } else {
            // Otherwise toggle ROI (show/hide shapes)
            var roiId = parseInt($tr.attr('data-roiId'), 10);
            var $span = $('.toggleRoi', $tr).toggleClass('rotate90');
            if ($span.hasClass('rotate90')) {
                this.renderShapes(roiId);
            }
        }
    },

    mouseoverRoiItem: function(event) {
        var $tr = $(event.target);
        while (!$tr.hasClass("roiModalRoiItem")) {
            $tr = $tr.parent();
        }
        var shapeId = parseInt($tr.attr('data-shapeid'), 10);
        this.collection.selectShape(shapeId);
    },

    convertOMEROShape: function(s) {
        // Converts a shape json from OMERO into format taken by Shape-editor
        // if shape has Arrow head, shape.type = Arrow
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

    // We display a shape on an image Panel using the Panel model and PanelView.
    appendShape: function($element, shape) {

        var panelJson = this.panel.toJSON();
        panelJson.width = 50;
        panelJson.height = 50;
        panelJson.x = 0;
        panelJson.y = 0;
        panelJson.shapes = [shape];
        var panelModel = new Panel(panelJson);
        if (shape.theT !== undefined) {
            panelModel.set('theT', shape.theT);
        }
        if (shape.theZ !== undefined) {
            panelModel.set('theZ', shape.theZ);
        }
        panelModel.cropToRoi(shape);
        var view = new PanelView({model:panelModel});
        var el = view.render().el;
        $element.append(el);
    },

    render: function() {

        var roiData = this.collection.toJSON();

        // var msg = "[No ROIs found on this image in OMERO]";
        var roiIcons = {'Rectangle': 'rect-icon', 'Ellipse': 'ellipse-icon',
                        'Line': 'line-icon', 'Arrow': 'arrow-icon'};

        var json = roiData.forEach(function(roi){
            // var r = {'id': roi.id, 'type': '-'}
            var minT, maxT = 0,
                minZ, maxZ = 0;
            if (roi.shapes) {
                // r.shapes = roi.shapes;
                roi.shapes = roi.shapes.map(function(s){
                    s = this.convertOMEROShape(s);
                    s.icon = roiIcons[s.type];
                    if (s.theZ !== undefined) {
                        if (minZ === undefined) {
                            minZ = s.theZ
                        } else {
                            minZ = Math.min(minZ, s.theZ);
                        }
                        maxZ = Math.max(maxZ, s.theZ);
                    }
                    if (s.theT !== undefined) {
                        if (minT === undefined) {
                            minT = s.theT
                        } else {
                            minT = Math.min(minT, s.theT);
                        }
                        maxT = Math.max(maxT, s.theT);
                    }
                    return s;
                }.bind(this));

                roi.type = roi.shapes[0].type;
                roi.icon = roi.shapes[0].icon;
                roi.minZ = minZ;
                roi.maxZ = maxZ;
                roi.minT = minT;
                roi.maxT = maxT;
            }

            // return r;
            var html = this.template({'roi': roi});

            this.$el.append(html);

            var $element = $("#roiModalRoiList .roiViewport").last();
            this.appendShape($element, roi.shapes[0]);

        }.bind(this));

        return this;
    }
});
