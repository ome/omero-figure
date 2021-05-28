

var RoiModalView = Backbone.View.extend({

        template: JST["src/templates/shapes/shape_toolbar_template.html"],

        roi_zt_buttons_template: JST["src/templates/modal_dialogs/roi_zt_buttons.html"],

        el: $("#roiModal"),

        model:FigureModel,

        // ID for temp shape that we add & remove from shapeManager
        TEMP_SHAPE_ID: -1234,

        // This gets populated when dialog loads
        omeroRoiCount: 0,
        roisLoaded: false,
        roisPageSize: 200,
        roisPage: 0,

        initialize: function() {

            var self = this;

            // We create a new Model and RoiLoaderView.
            // Then listen for selection events etc coming from RoiLoaderView
            this.Rois = new RoiList();
            this.listenTo(this.Rois, "change:selection", this.showTempShape);  // mouseover shape
            this.listenTo(this.Rois, "addShapesFromOmero", this.addShapesFromOmero);
            this.listenTo(this.Rois, "shape_click", this.showShapePlane);

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

                // Default line width
                self.shapeManager.setStrokeWidth(1);

                // remove any previous OMERO ROIs
                $("#roiModalRoiList table").empty();
                self.roisLoaded = false;

                self.render();
                self.checkForRois();
                self.renderPagination();
            });

            this.shapeManager = new ShapeManager("roi_paper", 1, 1);
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
            "click .loadRois": "loadRoisFirstPage",
            "click .roisPrevPage": "roisPrevPage",
            "click .roisNextPage": "roisNextPage",
            "click .roisJumpPage": "roisJumpPage",
            "click .revert_theZ": "revertTheZ",
            "click .revert_theT": "revertTheT",
            "click .addAllShapesToView": "addAllShapesToView",
        },

        addAllShapesToView: function() {
            var $btn = $("button.addAllShapesToView");
            var btnText = $btn.text();
            var $spinner = $("#add-all-shapes-spinner").show();
            $btn.prop('disabled', true).text("Adding...");
            // Need setTimeout to allow $btn to update first
            setTimeout(()=> {
                var currZ = this.m.get("theZ");
                var currT = this.m.get("theT");
                // collection
                var self = this;
                var to_add = [];
                this.Rois.forEach(function(roi) {
                    roi.shapes.forEach(function(shape) {
                        var z = shape.get("theZ");
                        var t = shape.get("theT");
                        var p = shape.get("points");
                        var id = shape.get("id");
                        if ((z === undefined || z == currZ) && (t === undefined || t == currT)) {
                            to_add.push(shape.toJSON());
                        }
                    });
                });
                var displayMessage = true;
                self.Rois.trigger('addShapesFromOmero', to_add, displayMessage);
                $btn.removeProp('disabled').text(btnText);
                $spinner.hide();
            }, 10);
        },

        revertTheZ: function() {
            var orig_model = this.model.getSelected().head();
            this.m.set('theZ', orig_model.get('theZ'));
            this.renderImagePlane();
        },

        revertTheT: function() {
            var orig_model = this.model.getSelected().head();
            this.m.set('theT', orig_model.get('theT'));
            this.renderImagePlane();
        },

        checkForRois: function() {
            var url = BASE_WEBFIGURE_URL + 'roiCount/' + this.m.get('imageId') + '/';

            var $btn = $(".loadRois", this.$el)
                .attr({'disabled': 'disabled'});
            $btn.parent().attr('title', 'Checking for ROIs...');  // title on parent div - still works if btn disabled
            $.getJSON(url, function(data){
                this.omeroRoiCount = data.roi;
                this.renderToolbar();
            }.bind(this));
        },

        loadRoisFirstPage: function (event) {
            event.preventDefault();
            // hide button and tip
            $(".loadRois", this.$el).prop('disabled', true);
            $("#roiModalTip").hide();
            this.roisPage = 0;
            this.loadRois();
        },

        roisPrevPage: function (event) {
            event.preventDefault();
            this.roisPage -= 1;
            this.loadRois();
        },

        roisNextPage: function (event) {
            event.preventDefault();
            this.roisPage += 1;
            this.loadRois();
        },

        roisJumpPage: function (event) {
            event.preventDefault();
            var page = $(event.target).data('page');
            if (!isNaN(page)) {
                this.roisPage = parseInt(page);
                this.loadRois();
            }
        },

        // Load Shapes from OMERO and render them
        loadRois: function() {
            var iid = this.m.get('imageId');
            var roiUrl = ROIS_JSON_URL + '?image=' + iid + '&limit=' + this.roisPageSize + '&offset=' + (this.roisPageSize * this.roisPage);
            $.getJSON(roiUrl, function(data){
                this.Rois.set(data.data);
                $(".loadRois", this.$el).prop('disabled', false);
                $("#roiModalRoiList table").empty();
                this.roisLoaded = true;
                this.renderToolbar();
                var roiLoaderView = new RoiLoaderView({ collection: this.Rois, panel: this.m, totalCount: this.omeroRoiCount});
                $("#roiModalRoiList table").append(roiLoaderView.el);
                roiLoaderView.render();
                this.renderPagination();
            }.bind(this))
            .fail(function(jqxhr, textStatus, error){
                console.log("fail", arguments);
                alert("Failed to load ROIS: " + textStatus + ", " + error);
            });
        },

        showShapePlane: function(args) {
            var shapeJson = args[0];
            if (shapeJson) {
                var newPlane = {};
                if (shapeJson.theZ !== undefined) {
                    newPlane.theZ = shapeJson.theZ;
                }
                if (shapeJson.theT !== undefined) {
                    newPlane.theT = shapeJson.theT;
                }
                this.m.set(newPlane);
                this.renderImagePlane();
            }
        },

        addShapesFromOmero: function(shapes, displayMessage) {
            var active_chs = this.m.get("channels").map((ch, index) => ch.active ? index : "");
            // Remove the temp shape
            this.shapeManager.deleteShapesByIds([this.TEMP_SHAPE_ID]);

            // Paste (will offset if shape exists)
            var viewport = this.m.getViewportAsRect();
            var pastedCount = 0;
            var shapeChannelsInactive = new Set();
            // Paste 1 at a time, so we know if ANY were successful
            shapes.forEach((shape) => {
                var success = this.shapeManager.pasteShapesJson([shape], viewport);
                if (success) {
                    pastedCount += 1;
                    if (shape.theC != undefined && (!active_chs.includes(shape.theC))) {
                        shapeChannelsInactive.add(shape.theC);
                    }
                }
            });
            // If we've added any Shapes linked to an inactive channel, turn channels on, rerender and message
            shapeChannelsInactive = [...shapeChannelsInactive];
            shapeChannelsInactive.forEach(index => {
                this.m.save_channel(index, 'active', true);
            });
            if (shapeChannelsInactive.length > 0) {this.renderImagePlane()}
            shapeChannelsInactive.sort();
            if (shapes.length == 0) {
                figureConfirmDialog("No Shapes found", "No Shapes found on the current Z/T plane", ["OK"]);
            } else if (displayMessage) {
                // When using "Add All" ROIs, we give the user a message...
                var pageCount = Math.ceil(this.omeroRoiCount / this.roisPageSize);
                var message = `Found ${shapes.length} Shapes on the current Z/T plane`
                message += (pageCount > 1) ? ` from page ${ this.roisPage + 1} of ROIs.`: '.';
                var title = "Added ROIs"
                if (pastedCount == 0) {
                    title = "No ROIs added"
                    message += ` None of these Shapes were within the image viewport. Try zooming out in the Preview panel.`
                } else {
                    if (pastedCount === shapes.length) {
                        message += ` Added all Shapes to the Image.`;
                    } else {
                        message += ` Added ${ pastedCount } Shapes that lie within the image viewport.`;
                    }
                    if (shapeChannelsInactive.length > 0) {
                        message += ` <br>As shapes linked to ${shapeChannelsInactive.length === 1 ? 'an inactive channel' : 'inactive channels'}
                            (${shapeChannelsInactive.map(i => i + 1).join(", ")}) were added, so ${shapeChannelsInactive.length === 1 ? 'this channel has' : 'these channels have'} been turned ON.`
                    }
                }
                figureConfirmDialog(title, message, ["OK"]);
            } else if (pastedCount === 0) {
                // Always show this message if nothing got added
                figureConfirmDialog("No ROIs added",
                "Could not add a Shape outside of the image viewport. Try zooming out in the Preview panel.", ["OK"]);
            }
        },

        showTempShape: function(args) {
            shape = args[0];
            this.shapeManager.deleteShapesByIds([this.TEMP_SHAPE_ID]);
            if (shape) {
                var viewport = this.m.getViewportAsRect();
                shape.id = this.TEMP_SHAPE_ID;
                var ok = this.shapeManager.addShapeJson(shape, viewport);
            }
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
            shapesJson = shapesJson.filter(function(s){
                // Remove any temporary shapes (from hovering over OMERO shapes)
                return (s.id !== this.TEMP_SHAPE_ID);
            }.bind(this));

            var theZ = this.m.get('theZ'),
                theT = this.m.get('theT');
            this.model.getSelected().forEach(panel => {
                // In case adding Shapes has activated any channels
                this.m.get("channels").forEach((ch, index) => {
                    if (ch.active) {panel.save_channel(index, 'active', true);}
                });
                // We use save() to notify undo/redo queue. TODO - fix!
                panel.save({'shapes': shapesJson, 'theZ': theZ, 'theT': theT});
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
            lineWidth = parseFloat(lineWidth, 10);
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
            // Take the <span> from the <a> and place it in the <button>
            if ($span.length === 0) $span = $a;  // in case we clicked on <span>
            var $li = $span.parent().parent();
            // Don't use $li.parent().prev() since bootstrap inserts a div.dropdown-backdrop on Windows
            var $button = $("button.dropdown-toggle", $li.parent().parent());
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
                windows = navigator.platform.toUpperCase().indexOf('WIN') > -1,
                lineWidths = [0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30];
            color = color ? color.replace("#", "") : 'FFFFFF';
            toPaste = (toPaste && (toPaste.SHAPES || toPaste.CROP));

            var json = {'state': state,
                        'lineWidths': lineWidths,
                        'lineWidth': lineW,
                        'color': color,
                        'sel': sel,
                        'cmdKey': windows ? "Ctrl+" : "⌘",
                        'toPaste': toPaste,
                        'zoom': parseInt(scale * 100, 10),
                        'omeroRoiCount': this.omeroRoiCount,
                        'roisLoaded': this.roisLoaded};
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

        renderImagePlane: function() {
            var src = this.m.get_img_src();
            this.$roiImg.attr('src', src);

            var orig_model = this.model.getSelected().head();
            var json = {'theZ': this.m.get('theZ'),
                        'theT': this.m.get('theT'),
                        'origZ': orig_model.get('theZ'),
                        'origT': orig_model.get('theT')}
            var html = this.roi_zt_buttons_template(json);
            $("#roi_zt_buttons").html(html);
        },

        renderPagination: function() {
            if (!this.roisLoaded) {
                $("#roiPageControls").html("").hide();
                return;
            }
            var pageCount = Math.ceil(this.omeroRoiCount / this.roisPageSize);
            var html = `<span>${ this.omeroRoiCount} ROIs`
            // Only show pagination controls if needed
            if (pageCount > 1) {
                html += `: page ${ this.roisPage + 1}/${pageCount}</span>
                <div class="btn-group" style="float:right">
                    <button title="Load previous page of ROIs" ${this.roisPage === 0 ? "disabled='disabled'":'' }
                        type="button" class="btn btn-default btn-sm roisPrevPage">
                        Prev
                    </button>
                    <button title="Load next page of ROIs" ${(this.roisPage + 1) >= pageCount ? "disabled='disabled'" : '' }
                        type="button" class="btn btn-default btn-sm roisNextPage">
                        Next
                    </button>
                    <button type="button" class="btn btn-default btn-sm dropdown-toggle" title="Select page" data-toggle="dropdown">
                        <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" role="menu">
                    ${
                        _.range(pageCount).map(p => `<li>
                        <a class="roisJumpPage" href="#" data-page="${p}">
                            <span class="glyphicon glyphicon-ok" ${ this.roisPage !== p ? "style='visibility:hidden'" : ""}></span>
                            Page ${p + 1}
                        </a>
                        </li>`).join(`\n`)
                    }
                    </ul>
                </div>`
            } else {
                html += `</span>`;
            }
            $("#roiPageControls").html(html).show();
        },

        render: function() {

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

            // Get css for the image plane
            var css = this.m.get_vp_img_css(this.m.get('zoom'), frame_w, frame_h);
            this.$roiImg.css(css);

            // Get css for the SVG (full plane)
            var svg_css = this.m.get_vp_full_plane_css(this.m.get('zoom'), frame_w, frame_h);
            var w = this.m.get('orig_width'),
                h = this.m.get('orig_height');
            var scale = svg_css.width / w;
            // TODO: add public methods to set w & h
            this.shapeManager._orig_width = w;
            this.shapeManager._orig_height = h;
            this.shapeManager.setZoom(scale * 100);
            $("#roi_paper").css(svg_css);

            $("#roiViewer").css({'width': frame_w + 'px', 'height': frame_h + 'px'});

            this.renderImagePlane();
            this.renderToolbar();
            this.renderSidebar();
        }
    });
