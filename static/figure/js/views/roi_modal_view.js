

var RoiModalView = Backbone.View.extend({

        roiTemplate: JST["static/figure/templates/modal_dialogs/roi_modal_roi.html"],
        template: JST["static/figure/templates/shapes/shape_toolbar_template.html"],

        el: $("#roiModal"),

        model:FigureModel,

        initialize: function() {

            var self = this;

            // We manually bind Mousetrap keyboardEvents to body so as
            // not to clash with the global keyboardEvents in figure_view.js
            // Bind to 'body' instead of #roiModal since this didn't always work with
            // some events maybe getting lost to Raphael elements??
            var dialog = document.getElementById('body');
            Mousetrap(dialog).bind(['backspace', 'del'], function(event, combo) {
                // Need to ignore if the dialog isn't visible
                if(!self.$el.is(":visible")) return true;
                self.deleteShapes(event);
                return false;
            });
            Mousetrap(dialog).bind('mod+c', function(event, combo) {
                if(!self.$el.is(":visible")) return true;
                self.copyShapes(event);
                return false;
            });
            Mousetrap(dialog).bind('mod+v', function(event, combo) {
                if(!self.$el.is(":visible")) return true;
                self.pasteShapes(event);
                return false;
            });
            Mousetrap(dialog).bind('mod+a', function(event, combo) {
                if(!self.$el.is(":visible")) return true;
                self.selectAllShapes(event);
                return false;
            });

            // Here we handle init of the dialog when it's shown...
            $("#roiModal").bind("show.bs.modal", function(){
                // Clone the 'first' selected panel as our reference for everything
                self.m = self.model.getSelected().head().clone();

                // We don't support Shape editing when rotated!
                self.rotated = self.m.get('rotation') !== 0;
                self.m.set('rotation', 0);

                self.shapeManager.setState("SELECT");
                self.shapeManager.deleteAllShapes();

                // Load any existing shapes on panel
                var shapesJson = self.m.get('shapes');
                if (shapesJson) {
                    self.shapeManager.setShapesJson(shapesJson);
                }

                self.render();

                // Load ROIs from OMERO...
                self.loadRois();
            });

            this.shapeManager = new ShapeManager("roi_paper", 1, 1);
            // Initially start with thin white lines.
            self.shapeManager.setStrokeWidth(1);
            self.shapeManager.setStrokeColor('#FFFFFF');

            this.$roiImg = $('.roi_image', this.$el);
        },

        events: {
            "submit .roiModalForm": "handleRoiForm",
            "click .shape-option .btn": "selectState",
            "click .dropdownSelect a": "select_dropdown_option",
            "change .line-width": "changeLineWidth",
            "change .shape-color": "changeColor",
            // shapeManager triggers on canvas element
            "change:selected .roi_paper": "shapeSelected",
            "new:shape .roi_paper": "shapeSelected",
            "click .copyShape": "copyShapes",
            "click .pasteShape": "pasteShapes",
            "click .deleteShape": "deleteShapes",
            "click .selectAll": "selectAllShapes",
            "mouseover .roiModalRoiItem": "mouseoverRoiItem",
            "mouseout .roiModalRoiItem": "mouseoutRoiItem",
            "click .roiModalRoiItem": "clickRoiItem",
        },

        clickRoiItem: function(event) {
            var $tr = $(event.target);
            // $tr.parentsUntil(".roiModalRoiItem")  DIDN'T work!
            // Do it manually...
            while (!$tr.hasClass("roiModalRoiItem")) {
                $tr = $tr.parent();
            }
            var shapeId = parseInt($tr.attr('data-shapeid'), 10);
            // Shape probably already added to view
            var shape = this.shapeManager.getShape(shapeId);
            if (!shape) {
                shape = this.getOmeroShape(shapeId);
                var viewport = this.m.getViewportAsRect();
                shape = this.shapeManager.addShapeJson(shape, viewport);
            }
            console.log('CLICK', shape);
            if (!shape) {
                alert("Couldn't add shape outside of current viewport");
            } else {
                this.shapeManager.selectShapes([shape]);
            }
        },

        mouseoverRoiItem: function(event) {
            var $tr = $(event.target);
            while (!$tr.hasClass("roiModalRoiItem")) {
                $tr = $tr.parent();
            }
            var shapeId = parseInt($tr.attr('data-shapeid'), 10),
                shape = this.getOmeroShape(shapeId);
            console.log('OVER', shapeId, shape);
            if (shape) {
                var viewport = this.m.getViewportAsRect();
                var ok = this.shapeManager.addShapeJson(shape, viewport);
                console.log('ok?', ok);
            }
        },

        mouseoutRoiItem: function(event) {
            var $tr = $(event.target);
            while (!$tr.hasClass("roiModalRoiItem")) {
                $tr = $tr.parent();
            }
            var shapeId = parseInt($tr.attr('data-shapeid'), 10);
            console.log('OUT', shapeId);
            if (shapeId) {
                var shape = this.shapeManager.getShape(shapeId);
                if (!shape.isSelected()) {
                    this.shapeManager.deleteShapesByIds([shapeId]);
                }
            }
        },

        // Load Rectangles from OMERO and render them
        loadRois: function() {
            var self = this,
                iid = self.m.get('imageId');
            $.getJSON(ROIS_JSON_URL + iid + "/", function(data){
                // cache data...
                self.roiJson = data;
                // and render it...
                self.renderRois(data);
            }).error(function(){
                self.renderRois([]);
            });
        },

        getOmeroShape: function(shapeId) {
            if (!this.roiJson) return;
            var s;
            this.roiJson.forEach(function(roi){
                roi.shapes.forEach(function(shape){
                    if (shapeId === shape.id) {
                        s = shape;
                    }
                });
            });
            return s;
        },

        copyShapes: function(event) {
            event.preventDefault();
            var shapeJson = this.shapeManager.getSelectedShapesJson();
            if (shapeJson.length > 0) {
                this.model.set('clipboard', {'SHAPES': shapeJson});
            }
            this.renderToolbar();    // to enable paste
        },

        pasteShapes: function(event) {
            event.preventDefault();
            var roiJson = this.model.get('clipboard');
            if (roiJson.SHAPES) {
                roiJson = roiJson.SHAPES;
            } else if (roiJson.CROP) {
                // Need to create Rectangle with current color & line width
                var color = $(".roi_toolbar .shape-color span:first", this.$el).attr('data-color'),
                    width = $(".roi_toolbar .line-width span:first", this.$el).attr('data-line-width'),
                    rect = roiJson.CROP;
                roiJson = [{type: "Rectangle",
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            strokeColor: "#" + color,
                            lineWidth: width}];
            } else {
                return;
            }

            // paste ROIs, with offset if matching existing shape
            // Constrain pasting to within viewport
            var viewport = this.m.getViewportAsRect();
            var p = this.shapeManager.pasteShapesJson(roiJson, viewport);
            if (!p) {
                this.renderSidebarWarning("Could not paste ROI outside viewport.");
            }
        },

        deleteShapes: function(event) {
            event.preventDefault();
            this.shapeManager.deleteSelectedShapes();
        },

        handleRoiForm: function(event) {
            event.preventDefault();

            var shapesJson = this.shapeManager.getShapesJson();
            this.model.getSelected().forEach(function(panel){

                // We use save() to notify undo/redo queue. TODO - fix!
                panel.save('shapes', shapesJson);
            });

            $("#roiModal").modal("hide");
            return false;
        },

        shapeSelected: function() {
            // simply re-render toolbar
            this.renderToolbar();
        },

        changeLineWidth: function(event) {
            var lineWidth = $("span:first", event.target).attr('data-line-width');
            lineWidth = parseInt(lineWidth, 10);
            this.shapeManager.setStrokeWidth(lineWidth);
        },

        changeColor: function(event) {
            var color = $("span:first", event.target).attr('data-color');
            this.shapeManager.setStrokeColor("#" + color);
        },

        // Handles all the various drop-down menus in the toolbar
        select_dropdown_option: function(event) {
            event.preventDefault();
            var $a = $(event.target),
                $span = $a.children('span');
            // For the Label Text, handle this differently...
            if ($a.attr('data-label')) {
                $('.new-label-form .label-text', this.$el).val( $a.attr('data-label') );
            }
            // All others, we take the <span> from the <a> and place it in the <button>
            if ($span.length === 0) $span = $a;  // in case we clicked on <span>
            var $li = $span.parent().parent(),
                $button = $li.parent().prev();
            $span = $span.clone();

            if ($span.hasClass('colorpickerOption')) {
                var oldcolor = $a.attr('data-oldcolor');
                FigureColorPicker.show({
                    'color': oldcolor,
                    'success': function(newColor){
                        $span.css({'background-color': newColor, 'background-image': 'none'});
                        // remove # from E.g. #ff00ff
                        newColor = newColor.replace("#", "");
                        $span.attr('data-color', newColor);
                        $('span:first', $button).replaceWith($span);
                        // can listen for this if we want to 'submit' etc
                        $button.trigger('change');
                    }
                });
            } else {
                $('span:first', $button).replaceWith($span);
                if ($span.prop('title')) {
                    $button.prop('title', $span.prop('title'));
                }
                $button.trigger('change');      // can listen for this if we want to 'submit' etc
            }
        },

        selectAllShapes: function(event) {
            event.preventDefault();
            // manager triggers shapeSelected, which renders toolbar
            this.shapeManager.selectAllShapes();
        },

        selectState: function(event) {
            var $target = $(event.target),
                newState = $target.attr('data-state');
            if (newState === undefined) {
                // in case we clicked 'span'
                newState = $target.parent().attr('data-state');
            }
            this.shapeManager.setState(newState);
            this.renderToolbar();
        },

        // we disable Submit when dialog is shown, enable when region/ROI chosen
        enableSubmit: function(enabled) {
            var $okBtn = $('button[type="submit"]', this.$el);
            if (enabled) {
                $okBtn.prop('disabled', false);
                $okBtn.prop('title', 'Crop selected images to chosen region');
            } else {
                $okBtn.prop('disabled', 'disabled');
                $okBtn.prop('title', 'No valid region selected');
            }
        },

        renderToolbar: function() {
            // render toolbar
            var state = this.shapeManager.getState(),
                lineW = this.shapeManager.getStrokeWidth(),
                color = this.shapeManager.getStrokeColor(),
                scale = this.zoom,
                sel = this.shapeManager.getSelectedShapes().length > 0,
                toPaste = this.model.get('clipboard'),
                windows = navigator.platform.toUpperCase().indexOf('WIN') > -1;
            color = color ? color.replace("#", "") : 'FFFFFF';
            toPaste = (toPaste && (toPaste.SHAPES || toPaste.CROP));
            var json = {'state': state,
                        'lineWidth': lineW,
                        'color': color,
                        'sel': sel,
                        'cmdKey': windows ? "Ctrl+" : "⌘",
                        'toPaste': toPaste,
                        'zoom': parseInt(scale * 100, 10)};
            $(".roi_toolbar", this.$el).html(this.template(json));
        },

        renderSidebarWarning: function(text) {
            var html = "<p><span class='label label-warning'>Warning</span> " + text + "</p>";
            $("#roiModalTip").html(html).show().fadeOut(10000);
        },

        // this is called each time the ROI dialog is displayed
        renderSidebar: function() {
            var tips = [
                // "Add ROIs to the image panel by choosing Rectangle, Line, Arrow or Ellipse from the toolbar.",
                "You can copy and paste shapes to duplicate them or move them between panels.",
                "If you copy a region from the Crop dialog (under the 'Preview' tab), you can paste it here to create a new Rectangle."],
                tip;
            if (this.rotated) {
                tip = "<span class='label label-warning'>Warning</span> " +
                      "This image panel is rotated in the figure, but this ROI editor can't work with rotated images. " +
                      "The image is displayed here <b>without</b> rotation, but the ROIs you add will be applied " +
                      "correctly to the image panel in the figure.";
            } else {
                tip = "<span class='label label-primary'>Tip</span> " + tips[parseInt(Math.random() * tips.length, 10)];
            }
            $("#roiModalTip").show().html(tip);
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

        // for rendering bounding-box viewports for shapes
        getBboxJson: function(bbox, theZ, theT) {
            var size = 50;   // longest side
            var orig_width = this.m.get('orig_width'),
                orig_height = this.m.get('orig_height');
                // origT = this.m.get('theT'),
                // origZ = this.m.get('theZ');
            // theT = (theT !== undefined ? theT : this.m.get('theT'))
            var div_w, div_h;
            // get src for image by temp setting Z & T
            if (theT !== undefined) this.m.set('theT', bbox.theT, {'silent': true});
            if (theZ !== undefined) this.m.set('theZ', bbox.theZ, {'silent': true});
            var src = this.m.get_img_src();
            if (bbox.width > bbox.height) {
                div_w = size;
                div_h = (bbox.height/bbox.width) * div_w;
            } else {
                div_h = size;
                div_w = (bbox.width/bbox.height) * div_h;
            }
            var zoom = div_w/bbox.width;
            var img_w = orig_width * zoom;
            var img_h = orig_height * zoom;
            var top = -(zoom * bbox.y);
            var left = -(zoom * bbox.x);
            // bbox.theT = bbox.theT !== undefined ? bbox.theT : origT;
            // bbox.theZ = bbox.theZ !== undefined ? bbox.theZ : origZ;

            return {
                'src': src,
                'w': div_w,
                'h': div_h,
                'top': top,
                'left': left,
                'img_w': img_w,
                'img_h': img_h
            };
        },

        renderRois: function(roiData){

            // var msg = "[No ROIs found on this image in OMERO]";
            var roiIcons = {'Rectangle': 'rect-icon', 'Ellipse': 'ellipse-icon',
                            'Line': 'line-icon', 'Arrow': 'arrow-icon'};

            console.log(roiData);
            var currT = this.m.get('theT'),
                currZ = this.m.get('theZ');

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
                    roi.bbox = this.getBboxJson(roi.shapes[0], roi.shapes[0].theZ, roi.shapes[0].theT);
                }

                // return r;
                var html = this.roiTemplate({'roi': roi, 'currZ': currZ, 'currT': currT});

                $("#roiModalRoiList table").append(html);

                var panelJson = this.m.toJSON();
                panelJson.width = 50;
                panelJson.height = 50;
                panelJson.x = 0;
                panelJson.y = 0;
                panelJson.shapes = [roi.shapes[0]];
                var panelModel = new Panel(panelJson);
                panelModel.cropToRoi(roi.shapes[0]);
                var view = new PanelView({model:panelModel});
                $("#roiModalRoiList .roiViewport").last().append(view.render().el);
            }.bind(this));

            // var html = this.roiTemplate({'rois': roiData, 'currZ': currZ, 'currT': currT});

            // $("#roiModalRoiList").html(html);
        },

        render: function() {

            var src = this.m.get_img_src();

            var maxSize = 550,
                frame_w = maxSize,
                frame_h = maxSize,
                wh = this.m.get('width') / this.m.get('height');
            if (wh <= 1) {
                frame_h = maxSize;
                frame_w = maxSize * wh;
            } else {
                frame_w = maxSize;
                frame_h = maxSize / wh;
            }

            var c = this.m.get_vp_img_css(this.m.get('zoom'), frame_w, frame_h, this.m.get('dx'), this.m.get('dy'));

            var w = this.m.get('orig_width'),
                h = this.m.get('orig_height');
            var scale = c.width / w;
            // TODO: add public methods to set w & h
            this.shapeManager._orig_width = w;
            this.shapeManager._orig_height = h;
            this.shapeManager.setZoom(scale * 100);

            var css = {
                "left": c.left + "px",
                "top": c.top + "px",
                "width": c.width + "px",
                "height": c.height + "px",
                "-webkit-transform-origin": c['transform-origin'],
                "transform-origin": c['transform-origin'],
                "-webkit-transform": c.transform,
                "transform": c.transform
            }
            this.$roiImg.css(css)
                .attr('src', src);

            $("#roi_paper").css(css);

            $("#roiViewer").css({'width': frame_w + 'px', 'height': frame_h + 'px'});

            this.renderToolbar();
            this.renderSidebar();
        }
    });
