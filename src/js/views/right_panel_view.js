
    // The 'Right Panel' is the floating Info, Preview etc display.
    // It listens to selection changes on the FigureModel and updates it's display
    // By creating new Sub-Views

    import Backbone from "backbone";
    import _ from "underscore";
    import $ from "jquery";
    import Sortable from 'sortablejs';

    import {figureConfirmDialog, showModal, rotatePoint, getRandomId} from "./util";
    import FigureColorPicker from "../views/colorpicker";

    import FigureModel from "../models/figure_model";
    import InfoPanelView from "./info_panel_view";
    import ChannelSliderView from "./channel_slider_view";
    import ScalebarFormView from "./scalebar_form_view";
    import ColorbarFormView from "./colorbar_form_view";
    import ZtSlidersView from "./zt_sliders_view";

    import image_display_options_template from '../../templates/image_display_options.template.html?raw';
    import rois_form_template from '../../templates/rois_form.template.html?raw';
    import labels_form_inner_template from '../../templates/labels_form_inner.template.html?raw';
    import labels_form_template from '../../templates/labels_form.template.html?raw';
    import viewport_template from '../../templates/viewport.template.html?raw';
    import viewport_inner_template from '../../templates/viewport_inner.template.html?raw';
    import zoom_crop_template from '../../templates/zoom_crop.template.html?raw';

    import projectionIconUrl from '../../images/projection20.png';


    var RightPanelView = Backbone.View.extend({

        initialize: function(opts) {
            // we render on selection Changes in the model
            this.listenTo(this.model, 'change:selection', this.render);

            // this.render();
            new LabelsPanelView({model: this.model});
            new RoisFormView({model: this.model});
        },

        render: function() {
            var selected = this.model.getSelected();

            if (this.vp) {
                this.vp.clear().remove();
                delete this.vp;     // so we don't call clear() on it again.
            }
            if (this.ztsliders) {
                this.ztsliders.remove();
                delete this.ztsliders;
            }
            if (selected.length > 0) {
                this.vp = new ImageViewerView({models: selected, figureModel: this.model}); // auto-renders on init
                $("#viewportContainer").append(this.vp.el);
                this.ztsliders = new ZtSlidersView({models: selected});
                $("#viewportContainer").append(this.ztsliders.el);
            }

            if (this.ipv) {
                this.ipv.remove();
            }
            if (selected.length > 0) {
                this.ipv = new InfoPanelView({models: selected, figureModel: this.model});
                this.ipv.render();
                $("#info-tab-pane").append(this.ipv.el);
            }

            if (this.ctv) {
                this.ctv.remove();
            }
            if (selected.length > 0) {
                this.ctv = new ImageDisplayOptionsView({models: selected});
                $("#channelToggle").empty().append(this.ctv.render().el);
            }
            if (this.csv) {
                this.csv.clear().remove();
            }
            if (selected.length > 0) {
                this.csv = new ChannelSliderView({models: selected});
                $("#channel_sliders").empty().append(this.csv.render().el);
            }
        }
    });


    var RoisFormView = Backbone.View.extend({

        model: FigureModel,

        roisTemplate: _.template(rois_form_template),

        el: $("#labelsTab"),

        initialize: function(opts) {
            this.listenTo(this.model, 'change:selection', this.render);
            this.listenTo(this.model, 'change:selection', this.addListeners);
            this.render();
        },

        addListeners: function() {
            // when selection changes, we need to listen to selected panels
            var self = this;
            this.model.getSelected().forEach(function(m){
                self.listenTo(m, 'change:shapes', self.render);
                self.listenTo(m, 'change:border', self.render);
            });
        },

        events: {
            "click .edit_rois": "editRois",
            "click .show_border": "showBorder",
            "click .remove_border": "removeBorder",
            "change .border-color": "changeBorderColor",
            "change .border-width": "changeBorderStrokeWidth",
            "click .copyROIs": "copyROIs",
            "click .pasteROIs": "pasteROIs",
            "click .deleteROIs": "deleteROIs",
            "click .create_inset": "createInset",
            // triggered by select_dropdown_option below
            "change .shape-color": "changeROIColor",
            "change .line-width": "changeLineWidth",
        },

        createInset: function() {
            let selected = this.model.getSelected();

            selected.forEach(panel => {
                let randomId = getRandomId();
                // Add Rectangle (square) in centre of viewport
                let vp = panel.getViewportAsRect();
                let minSide = Math.min(vp.width, vp.height);
                // Square is 1/3 size of the viewport
                let rectSize = minSide / 3;
                var color = $('.inset-color span:first', this.$el).attr('data-color');
                var position = $('.label-position i:first', this.$el).attr('data-position');
                var strokeWidth = parseFloat($('button.inset-width span:first', this.$el).attr('data-line-width'));
                let rect = {
                    type: "Rectangle",
                    strokeWidth,
                    strokeColor: "#" + color,
                    x: vp.x + ((vp.width - rectSize) / 2),
                    y: vp.y + ((vp.height - rectSize) / 2),
                    width: rectSize,
                    height: rectSize,
                    id: randomId,
                    rotation: vp.rotation || 0,
                }
                panel.add_shapes([rect]);

                // Create duplicate panels
                let panelJson = panel.toJSON();

                // want to make sure new panel is square
                let maxSide = Math.min(panelJson.width, panelJson.height);
                panelJson.width = maxSide;
                panelJson.height = maxSide;

                if (position == "bottom") {
                    panelJson.y = panelJson.y + 1.1 * panel.get("height");
                } else if (position == "left") {
                    panelJson.x = panelJson.x - (1.1 * panelJson.width);
                } else if (position == "top") {
                    panelJson.y = panelJson.y - (1.1 * panelJson.height);
                } else {
                    panelJson.x = panelJson.x + 1.1 * panel.get("width");
                }
                // cropped to match new Rectangle
                let orig_width = panelJson.orig_width;
                let orig_height = panelJson.orig_height;
                let targetCx = Math.round(rect.x + (rect.width/2));
                let targetCy = Math.round(rect.y + (rect.height/2));

                panelJson.dx = (orig_width/2) - targetCx;
                panelJson.dy = (orig_height/2) - targetCy;
                // zoom to correct percentage
                var xPercent = orig_width / rect.width;
                var yPercent = orig_height / rect.height;
                panelJson.zoom = Math.min(xPercent, yPercent) * 100;
                panelJson.selected = false;
                panelJson.shapes = [];
                panelJson.insetRoiId = randomId;

                this.model.panels.create(panelJson);
            });
        },

        changeLineWidth: function() {
            var width = $('button.line-width span:first', this.$el).attr('data-line-width'),
                sel = this.model.getSelected();
            width = parseFloat(width, 10);

            sel.forEach(function(panel){
                panel.setROIStrokeWidth(width);
            });
        },

        changeROIColor: function() {
            var color = $('button.shape-color span:first', this.$el).attr('data-color'),
                sel = this.model.getSelected();

            sel.forEach(function(panel){
                panel.setROIColor(color);
            });
        },

        changeBorderColor: function() {
            var color = $('button.border-color span:first', this.$el).attr('data-color'),
                sel = this.model.getSelected();

            sel.forEach(function(panel){
                panel.setBorderColor(color);
            });
        },

        changeBorderStrokeWidth: function() {
            var width = $('button.border-width span:first', this.$el).attr('data-line-width'),
                sel = this.model.getSelected();
            width = parseFloat(width, 10);

            sel.forEach(function(panel){
                panel.setBorderStrokeWidth(width);
            });
        },

        copyROIs: function(event) {
            event.preventDefault();
            var sel = this.model.getSelected(),
                roiJson = [];

            sel.forEach(function(s){
                var rois = s.get('shapes');
                if (rois) {
                    rois.forEach(function(r){
                        roiJson.push($.extend(true, {}, r));
                    });
                }
            });
            if (roiJson.length > 0) {
                this.model.set('clipboard', {'SHAPES': roiJson});
            }
            this.render();
        },

        showBorder: function(event){
            var width = $('button.border-width span:first', this.$el).attr('data-line-width');
            var color = $('button.border-color span:first', this.$el).attr('data-color');
            width = parseFloat(width, 10);

            this.model.getSelected().forEach(panel => {
                panel.show_border(color, width)
            })
            event.preventDefault();
        },

        removeBorder: function(event){
            this.model.getSelected().forEach(panel => {
                panel.remove_border()
            })
            event.preventDefault();
        },

        rectToPolygon: function(rect, rotation) {
            // rotate Rect around centre point - return points "x,y, x,y, x,y, x,y"
            let cx = rect.x + (rect.width / 2);
            let cy = rect.y + (rect.height / 2);
            // topleft
            let tl = rotatePoint(rect.x, rect.y, cx, cy, rotation);
            // topright
            let tr = rotatePoint(rect.x + rect.width, rect.y, cx, cy, rotation);
            // bottomright
            let br = rotatePoint(rect.x + rect.width, rect.y + rect.height, cx, cy, rotation);
            // bottomleft
            let bl = rotatePoint(rect.x, rect.y + rect.height, cx, cy, rotation);
            return [tl, tr, br, bl].map(point => point.x + ',' + point.y).join(', ');
        },

        pasteROIs: function(event) {
            event.preventDefault();
            var sel = this.model.getSelected(),
                roiJson = this.model.get('clipboard'),
                allOK = true;
            if (!roiJson) {
                return;
            }
            // Paste ROIs onto each selected panel...
            if (roiJson.SHAPES) {
                roiJson = roiJson.SHAPES;
            } else if (roiJson.CROP) {
                // Need to create Rectangle with current color & line width
                var color = $('button.shape-color span:first', this.$el).attr('data-color'),
                    width = parseFloat($('button.line-width span:first', this.$el).attr('data-line-width')),
                    rect = roiJson.CROP;
                // If rotated, need to create a Polygon since Rectangle doesn't support rotation
                if (rect.rotation && !isNaN(rect.rotation)) {
                    // rotate around centre point
                    var points = this.rectToPolygon(rect, -rect.rotation);
                    roiJson = [{
                        type: "Polygon",
                        strokeColor: "#" + color,
                        points: points,
                        strokeWidth: width
                    }]
                } else {
                    roiJson = [{type: "Rectangle",
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            strokeColor: "#" + color,
                            strokeWidth: width}];
                }
            } else {
                return;
            }
            sel.forEach(function(p){
                var ok = p.add_shapes(roiJson);
                if (!ok) {allOK = false;}
            });
            // If any shapes were outside viewport, show message
            var plural = sel.length > 1 ? "s" : "";
            if (!allOK) {
                figureConfirmDialog("Paste Failure",
                    "Some shapes may be outside the visible 'viewport' of panel" + plural + ". " +
                    "Target image" + plural + " may be too small or zoomed in too much. " +
                    "Try zooming out before pasting again, or paste to a bigger image.",
                    ["OK"]);
            }
            this.render();
        },

        deleteROIs: function(event) {
            event.preventDefault();
            var sel = this.model.getSelected();
            sel.forEach(function(p){
                var ok = p.unset('shapes');
            });
            this.render();
        },

        editRois: function(event) {
            showModal("roiModal");
            return false;
        },

        render: function() {

            var sel = this.model.getSelected(),
                panelCount = this.model.getSelected().length,
                roiCount = 0,
                clipboard_data = this.model.get('clipboard'),
                canPaste = clipboard_data && ('SHAPES' in clipboard_data || 'CROP' in clipboard_data),
                color,
                width,
                border,
                show_btn_state = false;

            sel.forEach(function(panel){
                var rois = panel.get('shapes');
                if (rois) {
                    roiCount += rois.length;
                    // color & width are false unless all rois are same
                    rois.forEach(function(r){
                        if (color === undefined) {
                            color = r.strokeColor;
                        } else {
                            if (color != r.strokeColor) {
                                color = false;
                            }
                        }
                        if (width === undefined) {
                            width = r.strokeWidth;
                        } else {
                            if (width != r.strokeWidth) {
                                width = false;
                            }
                        }
                    });
                }

                border = panel.get("border")
                if(border?.showBorder){
                    panel.show_border(border.color.replace('#',''), parseFloat(border.strokeWidth, 10))
                }else{
                    show_btn_state = true;
                }
            });

            var json = {
                'panelCount': panelCount,
                'color': color ? color.replace('#', '') : 'FFFFFF',
                'lineWidth': width || 2,
                'roiCount': roiCount,
                'canPaste': canPaste,
                'borderWidth': border ? border.strokeWidth : 2,
                'borderColor': border ? border.color.replace('#', '') : 'FFFFFF',
                'showState': show_btn_state,
            }
            $('#edit_rois_form').html(this.roisTemplate(json));
        },

    });

    const LABEL_POSITION_ICONS = {
        "topleft": "bi-box-arrow-in-up-left",
        "topright": "bi-box-arrow-in-up-right",
        "bottomleft": "bi-box-arrow-in-down-left",
        "bottomright": "bi-box-arrow-in-down-right",
        "left": "bi-box-arrow-left",
        "leftvert": "bi-box-arrow-left",
        "top": "bi-box-arrow-up",
        "right": "bi-box-arrow-right",
        "rightvert": "bi-box-arrow-right",
        "bottom": "bi-box-arrow-down"
    }


    var LabelsPanelView = Backbone.View.extend({

        model: FigureModel,

        template: _.template(labels_form_inner_template),

        el: $("#labelsTab"),

        initialize: function(opts) {
            this.listenTo(this.model, 'change:selection', this.render);

            // one-off build 'New Label' form, with same template as used for 'Edit Label' forms
            var json = {'l': {'text':'', 'size':12, 'color':'000000'}, 'position':'top',
                'edit':false, 'position_icon_cls': LABEL_POSITION_ICONS['top']};
            $('.new-label-form', this.$el).html(this.template(json));
            // $('.btn-sm').tooltip({container: 'body', placement:'bottom', toggle:"tooltip"});

            this.render();
        },

        events: {
            "submit .new-label-form": "handle_new_label",
            "click .dropdown-menu a": "select_dropdown_option",
            "click .markdown-info": "markdownInfo",
        },

        markdownInfo: function(event) {
            event.preventDefault();
            showModal("markdownInfoModal");
        },

        // Handles all the various drop-down menus in the 'New' AND 'Edit Label' forms
        // AND for ROI form (since this is also under the #labelsTab)
        select_dropdown_option: function(event) {
            event.preventDefault();
            var $a = $(event.target),
                $target = $a.children('.dropdown_icon');
            // For the Label Text, handle this differently...
            if ($a.attr('data-label')) {
                $('.new-label-form .label-text', this.$el).val( $a.attr('data-label') );
                return;
            }
            // All others, we take the .dropdown_icon from the <a> and place it in the <button>
            if ($target.length === 0) $target = $a;  // in case we clicked on icon itself
            var $li = $target.closest("li");
            // Don't use $li.parent().prev() since bootstrap inserts a div.dropdown-backdrop on Windows
            var $button = $("button.dropdown-toggle", $li.parent().parent());
            $target = $target.clone();

            if ($target.hasClass('colorpickerOption')) {
                var oldcolor = $a.attr('data-oldcolor');
                FigureColorPicker.show({
                    'color': oldcolor,
                    'success': function(newColor){
                        $target.css({'background-color': newColor, 'background-image': 'none'});
                        // remove # from E.g. #ff00ff
                        newColor = newColor.replace("#", "");
                        $target.attr('data-color', newColor);
                        $('span:first', $button).replaceWith($target);
                        // can listen for this if we want to 'submit' etc
                        $button.trigger('change');
                    }
                });
            } else {
                $('.dropdown_icon', $button).replaceWith($target);
                $button.trigger('change');      // can listen for this if we want to 'submit' etc
            }
        },

        // submission of the New Label form
        handle_new_label: function(event) {
            event.preventDefault();
            var $form = $(event.target),
                label_text = $('.label-text', $form).val(),
                font_size = $('.font-size', $form).text().trim(),
                position = $('.label-position i:first', $form).attr('data-position'),
                color = $('.label-color span:first', $form).attr('data-color');

            if (label_text.length === 0) {
                alert("Please enter some text for the label");
                return false;
            }

            var selected = this.model.getSelected();

            if (label_text == '[channels labels]') {
                selected.forEach(function(m) {
                    m.create_labels_from_channels({position:position, size:font_size});
                });
                return false;
            }

            if (label_text == '[key-values]') {
                // Load Map Annotations for this image and create labels
                showModal("labelsFromMapAnns", {
                    position: position,
                    size: font_size,
                    color: color});
                return false;
            }

            if (label_text == '[tags]') {
                // Load Tags for this image and create labels

                selected.createLabelsFromTags({
                            position:position,
                            size:font_size,
                            color: color});
                return false;
            }

            var label = {
                text: label_text,
                size: parseInt(font_size, 10),
                position: position,
                color: color
            };

            selected.forEach(function(m) {
                m.add_labels([label]);
            });
            return false;
        },

        render: function() {

            var selected = this.model.getSelected();

            // html is already in place for 'New Label' form - simply show/hide
            if (selected.length === 0) {
                $(".new-label-form", this.$el).hide();
            } else {
                $(".new-label-form", this.$el).show();
                // if none of the selected panels have time data, disable 'add_time_label's
                var have_time = false, dTs;
                selected.forEach(function(p){
                    dTs = p.get('deltaT');
                    if (dTs && dTs.length > 0) {
                        have_time = true;
                    }
                });
                if (have_time) {
                    $(".add_time_label", this.$el).removeClass('disabled');
                } else {
                    $(".add_time_label", this.$el).addClass('disabled');
                }
            }

            // show selected panels labels below
            var old = this.sel_labels_panel;

            if (selected.length > 0) {
                this.sel_labels_panel = new SelectedPanelsLabelsView({models: selected});
                this.sel_labels_panel.render();
                $("#selected_panels_labels").empty().append(this.sel_labels_panel.$el);
            }
            if (old) {
                old.clear().remove();
            }

            // show scalebar form for selected panels
            var old_sb = this.scalebar_form;
            // if (old_sb) {
            //     old_sb.remove();
            // }
            var $scalebar_form = $("#scalebar_form");

            if (selected.length > 0) {
                this.scalebar_form = new ScalebarFormView({models: selected});
                this.scalebar_form.render();
                $scalebar_form.empty().append(this.scalebar_form.$el);
            }
            if (old_sb) {
                old_sb.remove();
            }
            // show colorbar form for selected panels
            var old_cb = this.colorbar_form;
            var $colorbar_form = $("#colorbar_form");

            if (selected.length > 0) {
                this.colorbar_form = new ColorbarFormView({models: selected});
                this.colorbar_form.render();
                $colorbar_form.empty().append(this.colorbar_form.$el);
            }
            if (old_cb) {
                old_cb.remove();
            }

            return this;
        }

    });


    // Created new for each selection change
    var SelectedPanelsLabelsView = Backbone.View.extend({

        template: _.template(labels_form_template),
        inner_template: _.template(labels_form_inner_template),

        initialize: function(opts) {

            // prevent rapid repetative rendering, when listening to multiple panels
            this.render = _.debounce(this.render);

            this.models = opts.models;
            var self = this;

            this.models.forEach(function(m){
                self.listenTo(m, 'change:labels change:theT', self.render);
            });
        },

        events: {
            "submit .edit-label-form": "handle_label_edit",
            "change .btn": "form_field_changed",
            "blur .label-text": "form_field_changed",
            "click .delete-label": "handle_label_delete",
        },

        handle_label_delete: function(event) {

            var $form = $(event.target).parent(),
                key = $form.attr('data-key'),
                deleteMap = {};

            // escape the key to handle 'single' and "double" quotes
            key = _.escape(key);
            deleteMap[key] = false;

            this.models.forEach(function(m){
                m.edit_labels(deleteMap);
            });
            return false;
        },

        // Automatically submit the form when a field is changed
        form_field_changed: function(event) {
            $(event.target).closest('form').submit();
        },

        // Use the label 'key' to specify which labels to update
        handle_label_edit: function(event) {

            var $form = $(event.target),
                label_text = $('.label-text', $form).val(),
                font_size = $('.font-size', $form).text().trim(),
                position = $('.label-position i:first', $form).attr('data-position'),
                color = $('.label-color span:first', $form).attr('data-color'),
                key = $form.attr('data-key');

            // the 'key' will now be unescaped, so we need to escape it again to compare with model
            key = _.escape(key);
            var new_label = {text:label_text, size:font_size, position:position, color:color};

            var newlbls = {};
            newlbls[key] = new_label;

            this.models.forEach(function(m){
                m.edit_labels(newlbls);
            });
            return false;
        },

        initialize_sortable: function() {
            var self = this;
            var containers = self.$el.find('.labels-container');

            // Check if there are any elements
            if (containers.length === 0) {
                return;
            }

            // Destroy existing Sortable instances if any
            if (self.sortables) {
                self.sortables.forEach(function(sortable) {
                    sortable.destroy();
                });
            }
            self.sortables = [];

            // Initialize Sortable for each container
            containers.each(function(index, el) {
                var sortable = new Sortable(el, {
                    animation: 150,
                    fallbackOnBody: true,
                    onMove: function(evt) {
                        // Allow dragging outside the container
                        return evt.related === null || evt.related !== evt.from;
                    },
                    onEnd: function(evt) {
                        self.handle_sort(evt);
                    },
                    filter: 'input',       // Required to to select text in the label input
                    preventOnFilter: false // Required to to select text in the label input
                });

                // Store the sortable instance
                self.sortables.push(sortable);
            });
        },

        clear: function() {
            // clean up the sortable
            if (this.sortables) {
                this.sortables.forEach(function(sortable) {
                    sortable.destroy();
                });
            }
            this.sortables = [];
            return this;
        },

        handle_sort: function(evt) {
            var container = evt.srcElement; // Get the object that triggered the event   

            // Extract label keys in the new order of that position set
            var forms = container.querySelectorAll('.edit-label-form');
            var reordered_keys = Array.from(forms).map(form => form.getAttribute('data-key'));
            var position = reordered_keys[0].split("_").pop();

            // Update the order of labels in each panel
            this.models.forEach(function(panelModel) {
                var labels = panelModel.get('labels');
                var labels_dict = {};  // Labels for the current position set
                var leftover_labels = [];  // The labels at other positions
                for (let i = 0; i < labels.length; i++) {
                    // Generate a list of labels matching reordered_keys format
                    var l = labels[i];
                    if (l["position"] == position) {
                        var key = [l["text"], l["size"], l["color"], l["position"]].join("_");
                        labels_dict[key] = l;
                    } else {
                        leftover_labels.push(l);
                    }
                }

                var reordered_labels = [];
                for (let i = 0; i < reordered_keys.length; i++) {
                    // For each key in result after sorting, check if exist for the panel
                    if(reordered_keys[i] in labels_dict) {
                        reordered_labels.push(labels_dict[reordered_keys[i]]);
                        delete labels_dict[reordered_keys[i]];
                    }
                }
                reordered_labels.push(...leftover_labels);
                panelModel.set('labels', reordered_labels);
            });
        },

        render: function() {

            var self = this,
                positions = {'top':{}, 'bottom':{}, 'left':{}, 'leftvert':{}, 'right':{},'rightvert':{},
                    'topleft':{}, 'topright':{}, 'bottomleft':{}, 'bottomright':{}};
            this.models.forEach(function(m){
                // group labels by position
                _.each(m.get('labels'), function(l) {
                    // remove duplicates by mapping to unique key
                    var key = m.get_label_key(l),
                        ljson = $.extend(true, {}, l);
                        ljson.key = key;
                    positions[l.position][key] = ljson;
                });
            });

            this.$el.empty();

            // Render template for each position and append to $el
            var html = "";
            _.each(positions, function(lbls, p) {

                let position_icon_cls = LABEL_POSITION_ICONS[p];
                lbls = _.map(lbls, function(label, key){
                    return {...label, position_icon_cls};
                });

                var json = {'position':p, 'labels':lbls, 'position_icon_cls': position_icon_cls};
                if (lbls.length === 0) return;
                json.inner_template = self.inner_template;
                html += self.template(json);
            });
            self.$el.append(html);
            this.initialize_sortable();
            return this;
        }
    });


    var ImageViewerView = Backbone.View.extend({

        template: _.template(viewport_template),
        inner_template: _.template(viewport_inner_template),

        className: "imageViewer",

        initialize: function(opts) {

            // prevent rapid repetative rendering, when listening to multiple panels
            this.render = _.debounce(this.render);
            this.figureModel = opts.figureModel;

            this.full_size = 250;

            this.models = opts.models;
            var self = this;

            this.models.forEach(function(m){
                self.listenTo(m,
                    'change:width change:height change:rotation change:z_projection change:z_start change:z_end change:min_export_dpi change:vertical_flip change:horizontal_flip',
                    self.render);
                self.listenTo(m,
                    'change:channels change:theZ change:theT',
                    self.rerender_image_change);
            });

            $("#vp_zoom_slider")
                .attr({"max": 1000})
                .on("input", (event) => {
                    let val = Math.round(parseFloat(event.target.value));
                    this.update_img_css(val, 0, 0);
                    $('#vp_zoom_value').val(val);
                })
                .on("change", (event) => {
                    let val = Math.round(parseFloat(event.target.value));
                    this.zoom_avg = val;
                    var to_save = {'zoom': val};
                    if (val === 100) {
                        to_save.dx = 0;
                        to_save.dy = 0;
                    }
                    this.models.forEach(function(m){
                        m.save(to_save);
                    });
                    // we don't listenTo zoom change...
                    this.rerender_image_change();
                });

            this.$vp_zoom_value = $("#vp_zoom_value");

            // We nest the ZoomView so we can update it on update_img_css
            this.zmView = new ZoomView({models: this.models,
                                        figureModel: this.figureModel}); // auto-renders on init
            $("#reset-zoom-view").append(this.zmView.el);

            // Listen for events on zoom input field
            $("#vp_zoom_value").on("keyup", function(event){
                this.handle_user_zoom(event);
            }.bind(this));

            this.render();
        },

        events: {
            "mousedown .vp_img": "mousedown",
            "mousemove .vp_img": "mousemove",
            "mouseup .vp_img": "mouseup",
        },

        mousedown: function(event) {
            this.dragging = true;
            this.dragstart_x = event.clientX;
            this.dragstart_y = event.clientY;
            this.r = this.models.head().get('rotation');
            return false;
        },

        mouseup: function(event) {
            var dx = event.clientX - this.dragstart_x,
                dy = event.clientY - this.dragstart_y;
            if (this.r !== 0) {
                var xy = this.correct_rotation(dx, dy);
                dx = xy.dx;
                dy = xy.dy;
            }
            // Save then re-render
            this.update_img_css(this.zoom_avg, dx, dy, true);
            // Need to re-render for BIG images
            this.rerender_image_change();
            this.dragging = false;
            return false;
        },

        mousemove: function(event) {
            if (this.dragging) {
                var dx = event.clientX - this.dragstart_x,
                    dy = event.clientY - this.dragstart_y;
                if (this.r !== 0) {
                    var xy = this.correct_rotation(dx, dy);
                    dx = xy.dx;
                    dy = xy.dy;
                }
                this.update_img_css(this.zoom_avg, dx, dy);
            }
            return false;
        },

        handle_user_zoom: function(event){
            if (event.type === "keyup" && event.which !== 13) {
                return;     // Ignore keyups except 'Enter'
            }

            // get the current entered value
            var value = Math.round(parseFloat(event.target.value));
            if (isNaN(value)) {
                return;
            }

            // get min/max and restrict the user input between min/max
            const zmslider = document.getElementById("vp_zoom_slider");
            var minVal = parseFloat(zmslider.min);
            var maxVal = parseFloat(zmslider.max);

            if (value < minVal) value = minVal;
            if (value > maxVal) value = maxVal;

            // update the slider position
            zmslider.value = value;

            // update the preview image
            this.update_img_css(value, 0, 0);

            // update the figure image
            this.zoom_avg = value;
            var to_save = {'zoom': value};
            if (value == 100) {
                to_save.dx = 0;
                to_save.dy = 0;
            }
            this.models.forEach(function(m){
                m.save(to_save);
            });

            this.rerender_image_change();
        },

        // if the panel is rotated by css, drag events need to be corrected
        correct_rotation: function(dx, dy) {
            if (dx === 0 && dy === 0) {
                return {'dx': dx, 'dy': dy};
            }
            var length = Math.sqrt(dx * dx + dy * dy),
                ang1 = Math.atan(dy/dx);
            if (dx < 0) {
                ang1 = Math.PI + ang1;
            }
            var angr = this.r * (Math.PI/180),  // deg -> rad
                ang2 = ang1 - angr;
            dx = Math.cos(ang2) * length;
            dy = Math.sin(ang2) * length;
            return {'dx': dx, 'dy': dy};
        },

        // called by the parent View before .remove()
        clear: function() {
            // clean up zoom slider etc
            $("#vp_zoom_slider").off();
            $("#vp_zoom_value").off();
            this.$vp_zoom_value.val();

            if (this.zmView) {
                this.zmView.remove();
                delete this.zmView;
            }
            return this;
        },

        // This forces All panels in viewport to have SAME css
        // while zooming / dragging.
        // TODO: Update each panel separately.
        update_img_css: function(zoom, dx, dy, save) {

            const vertical_flip = this.models.some(m => m.get('vertical_flip'));
            const horizontal_flip = this.models.some(m => m.get('horizontal_flip'));
            // Check if vertical rotation is enabled, then invert dy
            if (vertical_flip) {
                dy = -dy;
            }

            // Check if horizontal rotation is enabled, then invert dx
            if (horizontal_flip){
                dx = -dx;
            }

            var scaled_dx = dx / (zoom/100);
            var scaled_dy = dy / (zoom/100);

            var big_image = this.models.reduce(function(prev, m){
                return prev || m.is_big_image();
            }, false);

            var avg_dx = this.models.getAverage('dx'),
                avg_dy = this.models.getAverage('dy');

            if (this.$vp_img) {
                var frame_w = this.$vp_frame.width() + 2,
                    frame_h = this.$vp_frame.height() + 2,
                    zm_w = this.models.head().get('orig_width') / frame_w,
                    zm_h = this.models.head().get('orig_height') / frame_h,
                    scale = Math.min(zm_w, zm_h);
                scaled_dx = scaled_dx * scale;
                scaled_dy = scaled_dy * scale;
                scaled_dx += avg_dx;
                scaled_dy += avg_dy;

                var offset_x = scaled_dx;
                var offset_y = scaled_dy;
                if (big_image) {
                    // For big images, we simply offset the image that fills the viewport
                    offset_x = dx;
                    offset_y = dy;
                }
                this.$vp_img.css( this.models.head().get_vp_img_css(zoom, frame_w, frame_h, offset_x, offset_y) );
                this.$vp_zoom_value.val(zoom);

                if (save) {
                    if (typeof dx === "undefined") dx = 0;  // rare crazy-dragging case!
                    if (typeof dy === "undefined") dy = 0;
                    this.models.forEach(function(m){
                        m.save({'dx': scaled_dx,
                                'dy': scaled_dy});
                    });
                }
            }

            this.zmView.renderXYWH(zoom, scaled_dx, scaled_dy);
        },

        get_imgs_css: function() {
            // Get img src & positioning css for each panel,
            var imgs_css = [];
            var wh = this.models.getAverageWH();
            if (wh <= 1) {
                var frame_h = this.full_size;
                var frame_w = this.full_size * wh;
            } else {
                var frame_w = this.full_size;
                var frame_h = this.full_size / wh;
            }
            this.models.forEach(function(m){
                var img_id = "image_" + Math.random();
                // src is async, so we set an id instead. When src returns we
                // use the ID to find the element and set the src.
                m.get_img_src().then(src => {
                    document.getElementById(img_id).src = src;
                });
                var img_css = m.get_vp_img_css(m.get('zoom'), frame_w, frame_h);
                img_css.id = img_id;
                // if a 'reasonable' dpi is set, we don't pixelate
                var dpiSet = m.get('min_export_dpi') > 100;
                img_css.pixelated = !dpiSet;
                imgs_css.push(img_css);
            });
            return imgs_css;
        },

        rerender_image_change: function() {
            // Render a change to image without removing old image
            // by adding new image over top!
            var json = {};
            json.imgs_css = this.get_imgs_css();
            json.opacity = 1/json.imgs_css.length;
            var html = this.inner_template(json);
            // We add this over the top of existing images
            // So they remain visible while new image is loading
            // If we're viewing multiple images (with opacity) we
            // don't want to see through to old images
            if (json.imgs_css.length > 1) {
                this.$vp_img.remove();
            }
            this.$vp_frame.append(html);
            // update this to include new images
            this.$vp_img = $(".vp_img", this.$el);
        },

        render: function() {

            // render child view
            this.zmView.render();

            // only show viewport if original w / h ratio is same for all models
            // get average viewport frame w/h & zoom
            var wh = this.models.getAverageWH(),
                zoom = Math.round(this.models.getAverage('zoom'));

            if (wh <= 1) {
                var frame_h = this.full_size;
                var frame_w = this.full_size * wh;
            } else {
                var frame_w = this.full_size;
                var frame_h = this.full_size / wh;
            }

            var imgs_css = this.get_imgs_css();

            var json = {};
            json.inner_template = this.inner_template;
            json.opacity = 1 / imgs_css.length;
            json.imgs_css = imgs_css;
            json.frame_w = frame_w;
            json.frame_h = frame_h;

            var html = this.template(json);
            this.$el.html(html);

            this.$vp_frame = $(".vp_frame", this.$el);  // cache for later
            this.$vp_img = $(".vp_img", this.$el);
            this.zoom_avg = zoom >> 0;
            this.$vp_zoom_value.val(this.zoom_avg);
            // zoom may be > 1000 if set by 'crop'

            // We want to be able to zoom Big images to 'actual size' in viewport
            // e.g. where 250 pixels of image is shown in viewport
            var max_width = this.models.getMax('orig_width');
            var max_zoom = parseInt(max_width / 250) * 100;
            max_zoom = Math.max(this.zoom_avg, max_zoom, 1000);

            // Current zoom may be larger due to small crop region
            $("#vp_zoom_slider").attr({'max': max_zoom}).val(this.zoom_avg);

            return this;
        }
    });


    var ZoomView = Backbone.View.extend({

        template: _.template(zoom_crop_template),

        initialize: function(opts) {

            this.models = opts.models;
            this.figureModel = opts.figureModel;
            this.render();
        },

        events: {
            "click .reset-zoom-shape": "resetZoomShape",
            "click .crop-btn": "show_crop_dialog",
            "click .copyCropRegion": "copyCropRegion",
            "click .pasteCropRegion": "pasteCropRegion",
        },

        copyCropRegion: function(event) {
            event.preventDefault();
            var rect = this.getXYWH();
            // Shouldn't happen, but just in case...
            if ([rect.x, rect.y, rect.width, rect.height].indexOf("-") > -1) {
                alert("Failed to copy region");
                return;
            }
            this.figureModel.set('clipboard', {'CROP': rect});
        },

        pasteCropRegion: function(event) {
            event.preventDefault();
            var clipboard_data = this.figureModel.get('clipboard'),
                rect;
            if (!clipboard_data) return;

            // First check clipboard for CROP
            if ('CROP' in clipboard_data){
                rect = clipboard_data.CROP;
            } else if ('SHAPES' in clipboard_data){
                // Look for first Rectangle in SHAPES
                var shapeJson = clipboard_data.SHAPES;
                shapeJson.forEach(function(shape) {
                    if (!rect && shape.type === "Rectangle") {
                        rect = {
                            x: shape.x, y: shape.y,
                            width: shape.width, height: shape.height,
                            rotation: shape.rotation
                        };
                    }
                });
                if (!rect) {
                    alert("No Rectangle found in shapes copied to clipboard");
                    return;
                }
            }

            this.models.forEach(function(m){
                m.cropToRoi(rect);
            });
        },

        show_crop_dialog: function(event) {
            event.preventDefault();
            // Simply show dialog - Everything else handled by that
            showModal("cropModal");
        },

        resetZoomShape: function(event) {
            event.preventDefault();
            this.models.forEach(function(m){
                m.set('vertical_flip', false);
                m.set('horizontal_flip', false);
                m.cropToRoi({
                    'x': 0,
                    'y': 0,
                    'width': m.get('orig_width'),
                    'height': m.get('orig_height'),
                });
            });
        },

        getXYWH: function(zoom, dx, dy) {

            var x, y, w, h, rotation;
            this.models.forEach(function(m, i){
                var r = m.getViewportAsRect(zoom, dx, dy);
                if (i === 0) {
                    x = r.x;
                    y = r.y;
                    w = r.width;
                    h = r.height;
                    rotation = r.rotation;
                } else {
                    // if any models have different values, return '-'
                    if (x !== r.x) x = "-";
                    if (y !== r.y) y = "-";
                    if (w !== r.width) w = "-";
                    if (h !== r.height) h = "-";
                    if (rotation !== r.rotation) rotation = "-";
                }
            });
            var json = {
                x: (x !== "-" ? parseFloat(x, 10) : x),
                y: (y !== "-" ? parseFloat(y, 10) : y),
                width: (w !== "-" ? parseFloat(w, 10) : w),
                height: (h !== "-" ? parseFloat(h, 10) : h),
                rotation: (rotation !== "-" ? parseFloat(rotation, 10) : "-"),
            }
            return json;
        },

        // called from the parent view during zoom slider update
        renderXYWH: function(zoom, dx, dy) {

            var json = this.getXYWH(zoom, dx, dy),
                clipboard = this.figureModel.get('clipboard');
            json.canCopyRect = true;
            json.canPasteRect = (clipboard && ('CROP' in clipboard || 'SHAPES' in clipboard));

            if ([json.x, json.y, json.width, json.height].indexOf("-") > -1) {
                json.canCopyRect = false;
            }else{
                json.x = Math.round(json.x)
                json.y = Math.round(json.y)
                json.width = Math.round(json.width)
                json.height = Math.round(json.height)
                json.rotation = Math.round(json.rotation)
            }
            this.$el.html(this.template(json));
        },

        render: function() {
            this.renderXYWH();
        }
    });

    // Options such as Rotation, Z-Projection etc.
    var ImageDisplayOptionsView = Backbone.View.extend({
        tagName: "div",
        template: _.template(image_display_options_template),

        initialize: function(opts) {
            // This View may apply to a single PanelModel or a list
            this.models = opts.models;
            var self = this;
            this.models.forEach(function(m){
                self.listenTo(m, 'change:channels change:z_projection', self.render);
                self.listenTo(m, 'change:vertical_flip change:horizontal_flip', self.loadButtonState);
            });
        },

        events: {
            "click .show-rotation": "show_rotation",
            "click .z-projection": "z_projection",
            "click .flipping_vertical": "flipping_vertical",
            "click .flipping_horizontal": "flipping_horizontal",
            "input .rotation-slider": "rotation_input",
            "change .rotation-slider": "rotation_change",
            "click .panel-rotation": "rotate_panel",
        },

        rotation_input: function(event) {
            let val = parseInt(event.target.value);
            this.models.forEach(function(m) {
                const verticalFlip = m.get('vertical_flip') ? -1 : 1;
                const horizontalFlip = m.get('horizontal_flip') ? -1 : 1;
                // Update the CSS transform property for each image
                $(".vp_img").css({
                    'transform': 'scaleX(' + horizontalFlip + ') scaleY(' + verticalFlip + ') rotate(' + val + 'deg)'
                });
            });
            $(".rotation_value").text(val);
        },

        rotation_change: function(event) {
            let val = parseInt(event.target.value);
            this.rotation = val;
            this.models.forEach(function(m){
                m.save('rotation', val);
            });
        },

        flipping_vertical: function(event) {
            const $button = $(event.currentTarget);
            $button.toggleClass('active');

            const isVerticalFlipped = $button.hasClass('active');

            this.models.forEach(function(m) {
                m.save('vertical_flip', isVerticalFlipped);
            });
        },

        flipping_horizontal: function(event) {
            const $button = $(event.currentTarget);
            $button.toggleClass('active');

            const ishorizontalFlipped = $button.hasClass('active');

            this.models.forEach(function(m) {
                m.save('horizontal_flip', ishorizontalFlipped);
            });
        },

        loadButtonState: function() {
            const $verticalButton = this.$(".flipping_vertical");
            const $horizontalButton = this.$(".flipping_horizontal");

            // Ensure the buttons reflect the model state
            this.models.forEach(function(m) {
                // Set vertical button state
                if (m.get('vertical_flip')) {
                    $verticalButton.addClass('active');
                } else {
                    $verticalButton.removeClass('active');
                }

                // Set horizontal button state
                if (m.get('horizontal_flip')) {
                    $horizontalButton.addClass('active');
                } else {
                    $horizontalButton.removeClass('active');
                }
            });
        },

        rotate_panel: function(event){
            event.preventDefault()
            this.models.forEach(function(m){
                var rotation = m.setPanelRotation()
                console.log(rotation)
                $(".vp_img").css({'transform':'rotate(' + rotation + 'deg)'});
                $(".rotation_value").text(rotation);
                $(".rotation-slider").val(rotation);
            });
        },

        z_projection:function(e) {
            // 'flat' means that some panels have z_projection on, some off
            var flat = $(e.currentTarget).hasClass('ch-btn-flat');
            this.models.forEach(function(m){
                var p;
                if (flat) {
                    p = true;
                } else {
                    p = !m.get('z_projection');
                }
                m.set_z_projection(p);
            });
        },

        show_rotation: function(e) {
            this.$el.find('.rotation-controls').toggleClass('rotation-controls-shown');
        },

        render: function() {
            var html,
                max_rotation = 0,
                sum_rotation = 0,
                sum_sizeZ = 0,
                rotation,
                z_projection,
                projection_bytes_exceeded = [],
                zp;
            if (this.models) {
                this.models.forEach(function(m, i){
                    projection_bytes_exceeded.push(m.isMaxProjectionBytesExceeded())
                    rotation = m.get('rotation');
                    max_rotation = Math.max(max_rotation, rotation);
                    sum_rotation += rotation;
                    sum_sizeZ += m.get('sizeZ');
                    // start with a copy of the first image channels
                    if (i === 0) {
                        z_projection = !!m.get('z_projection');
                    } else{
                        zp = !!m.get('z_projection');
                        if (zp !== z_projection) {
                            z_projection = undefined;
                        }
                    }
                });
                let proj_bytes_exceeded = projection_bytes_exceeded.some(b => b);
                var avg_rotation = sum_rotation / this.models.length;
                if (avg_rotation === max_rotation) {
                    rotation = avg_rotation;
                } else {
                    rotation = "-";
                }
                // save this value to init rotation slider etc
                this.rotation = avg_rotation;

                var anyBig = this.models.any(function(m){return m.is_big_image()});
                // if all panels have sizeZ == 1, don't allow z_projection
                // Don't currently support Z_projection on Big images.
                const z_projection_disabled = ((sum_sizeZ === this.models.length) || anyBig);

                html = this.template({
                    max_projection_bytes: MAX_PROJECTION_BYTES,
                    proj_bytes_exceeded: proj_bytes_exceeded,
                    projectionIconUrl,
                    'z_projection_disabled': z_projection_disabled,
                    'rotation': rotation,
                    'z_projection': z_projection});
                this.$el.html(html);
            }
            this.loadButtonState();
            return this;
        }
    });

    export default RightPanelView;
