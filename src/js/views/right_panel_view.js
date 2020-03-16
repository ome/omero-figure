
    // The 'Right Panel' is the floating Info, Preview etc display.
    // It listens to selection changes on the FigureModel and updates it's display
    // By creating new Sub-Views

    var RightPanelView = Backbone.View.extend({

        initialize: function(opts) {
            // we render on selection Changes in the model
            this.listenTo(this.model, 'change:selection', this.render);

            // this.render();
            new LabelsPanelView({model: this.model});
            new SliderButtonsView({model: this.model});
            new RoisFormView({model: this.model});
        },

        render: function() {
            var selected = this.model.getSelected();

            if (this.vp) {
                this.vp.clear().remove();
                delete this.vp;     // so we don't call clear() on it again.
            }
            if (selected.length > 0) {
                this.vp = new ImageViewerView({models: selected, figureModel: this.model}); // auto-renders on init
                $("#viewportContainer").append(this.vp.el);
            }

            if (this.ipv) {
                this.ipv.remove();
            }
            if (selected.length > 0) {
                this.ipv = new InfoPanelView({models: selected, figureModel: this.model});
                this.ipv.render();
                $("#infoTab").append(this.ipv.el);
            }

            if (this.ctv) {
                this.ctv.clear().remove();
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

        roisTemplate: JST["src/templates/rois_form_template.html"],

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
            });
        },

        events: {
            "click .edit_rois": "editRois",
            "click .copyROIs": "copyROIs",
            "click .pasteROIs": "pasteROIs",
            "click .deleteROIs": "deleteROIs",
            // triggered by select_dropdown_option below
            "change .shape-color": "changeROIColor",
            "change .line-width": "changeLineWidth",
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
                    width = $('button.line-width span:first', this.$el).attr('data-line-width'),
                    rect = roiJson.CROP;
                roiJson = [{type: "Rectangle",
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            strokeColor: "#" + color,
                            strokeWidth: width}];
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
            $("#roiModal").modal("show");
            return false;
        },

        render: function() {

            var sel = this.model.getSelected(),
                panelCount = this.model.getSelected().length,
                roiCount = 0,
                clipboard_data = this.model.get('clipboard'),
                canPaste = clipboard_data && ('SHAPES' in clipboard_data || 'CROP' in clipboard_data),
                color,
                width;

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
            });

            var json = {
                'panelCount': panelCount,
                'color': color ? color.replace('#', '') : 'FFFFFF',
                'lineWidth': width || 2,
                'roiCount': roiCount,
                'canPaste': canPaste,
            }
            $('#edit_rois_form').html(this.roisTemplate(json));
        },

    });


    var LabelsPanelView = Backbone.View.extend({

        model: FigureModel,

        template: JST["src/templates/labels_form_inner_template.html"],

        el: $("#labelsTab"),

        initialize: function(opts) {
            this.listenTo(this.model, 'change:selection', this.render);

            // one-off build 'New Label' form, with same template as used for 'Edit Label' forms
            var json = {'l': {'text':'', 'size':12, 'color':'000000'}, 'position':'top', 'edit':false};
            $('.new-label-form', this.$el).html(this.template(json));
            $('.btn-sm').tooltip({container: 'body', placement:'bottom', toggle:"tooltip"});

            this.render();
        },

        events: {
            "submit .new-label-form": "handle_new_label",
            "click .dropdown-menu a": "select_dropdown_option",
            "click .markdown-info": "markdownInfo",
        },

        markdownInfo: function(event) {
            event.preventDefault();
            $("#markdownInfoModal").modal('show');
        },

        // Handles all the various drop-down menus in the 'New' AND 'Edit Label' forms
        // AND for ROI form (since this is also under the #labelsTab)
        select_dropdown_option: function(event) {
            event.preventDefault();
            var $a = $(event.target),
                $span = $a.children('span');
            // For the Label Text, handle this differently...
            if ($a.attr('data-label')) {
                $('.new-label-form .label-text', this.$el).val( $a.attr('data-label') );
                return;
            }
            // All others, we take the <span> from the <a> and place it in the <button>
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
                $button.trigger('change');      // can listen for this if we want to 'submit' etc
            }
        },

        // submission of the New Label form
        handle_new_label: function(event) {
            var $form = $(event.target),
                label_text = $('.label-text', $form).val(),
                font_size = $('.font-size', $form).text().trim(),
                position = $('.label-position span:first', $form).attr('data-position'),
                color = $('.label-color span:first', $form).attr('data-color');

            if (label_text.length === 0) {
                alert("Please enter some text for the label");
                return false;
            }

            var selected = this.model.getSelected();

            if (label_text == '[channels]') {
                selected.forEach(function(m) {
                    m.create_labels_from_channels({position:position, size:font_size});
                });
                return false;
            }

            if (label_text.slice(0, 5) == '[time') {
                var format = label_text.slice(6, -1);   // 'secs', 'hrs:mins' etc
                selected.forEach(function(m) {
                    m.create_labels_from_time({format: format,
                            position:position,
                            size:font_size,
                            color: color
                    });
                });
                return false;
            }

            if (label_text == '[key-values]') {
                // Load Map Annotations for this image and create labels
                $("#labelsFromMapAnns").modal("show", {
                    position:position,
                    size:font_size,
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
                if (label_text === "[image-name]") {
                    var pathnames = m.get('name').split('/');
                    label.text = pathnames[pathnames.length-1];
                } else if (label_text === "[dataset-name]") {
                    label.text = m.get('datasetName') ? m.get('datasetName') : "No/Many Datasets";
                }
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
                old.remove();
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

            return this;
        }

    });


    // Created new for each selection change
    var SelectedPanelsLabelsView = Backbone.View.extend({

        template: JST["src/templates/labels_form_template.html"],
        inner_template: JST["src/templates/labels_form_inner_template.html"],

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
                position = $('.label-position span:first', $form).attr('data-position'),
                color = $('.label-color span:first', $form).attr('data-color'),
                key = $form.attr('data-key');

            // the 'key' will now be unescaped, so we need to escape it again to compare with model
            key = _.escape(key);
            var new_label = {text:label_text, size:font_size, position:position, color:color};

            // if we're editing a 'time' label, preserve the 'time' attribute
            if (label_text.slice(0, 5) == '[time') {
                new_label.text = undefined;                 // no 'text'
                new_label.time = label_text.slice(6, -1);   // 'secs', 'hrs:mins' etc
            }

            var newlbls = {};
            newlbls[key] = new_label;

            this.models.forEach(function(m){
                m.edit_labels(newlbls);
            });
            return false;
        },

        render: function() {

            var self = this,
                positions = {'top':{}, 'bottom':{}, 'left':{}, 'leftvert':{}, 'right':{},
                    'topleft':{}, 'topright':{}, 'bottomleft':{}, 'bottomright':{}};
            this.models.forEach(function(m){
                // group labels by position
                _.each(m.get('labels'), function(l) {
                    // remove duplicates by mapping to unique key
                    var key = m.get_label_key(l),
                        ljson = $.extend(true, {}, l);
                        ljson.key = key;
                    if (typeof ljson.text == 'undefined' && ljson.time) {
                        // show time labels as they are in 'new label' form
                        ljson.text = '[time-' + ljson.time + "]"
                    }
                    positions[l.position][key] = ljson;
                });
            });

            this.$el.empty();

            // Render template for each position and append to $el
            var html = "";
            _.each(positions, function(lbls, p) {

                lbls = _.map(lbls, function(label, key){ return label; });

                var json = {'position':p, 'labels':lbls};
                if (lbls.length === 0) return;
                json.inner_template = self.inner_template;
                html += self.template(json);
            });
            self.$el.append(html);

            return this;
        }
    });


    // This simply handles buttons to increment time/z
    // since other views don't have an appropriate container
    var SliderButtonsView = Backbone.View.extend({

        el: $("#viewportContainer"),

        initialize: function(opts) {
            this.model = opts.model;
        },

        events: {
            "click .z-increment": "z_increment",
            "click .z-decrement": "z_decrement",
            "click .time-increment": "time_increment",
            "click .time-decrement": "time_decrement",
        },

        z_increment: function(event) {
            this.model.getSelected().forEach(function(m){
                var newZ = {};
                if (m.get('z_projection')) {
                    newZ.z_start = m.get('z_start') + 1;
                    newZ.z_end = m.get('z_end') + 1;
                } else {
                    newZ.theZ = m.get('theZ') + 1;
                }
                m.set(newZ, {'validate': true});
            });
            return false;
        },
        z_decrement: function(event) {
            this.model.getSelected().forEach(function(m){
                var newZ = {};
                if (m.get('z_projection')) {
                    newZ.z_start = m.get('z_start') - 1;
                    newZ.z_end = m.get('z_end') - 1;
                } else {
                    newZ.theZ = m.get('theZ') - 1;
                }
                m.set(newZ, {'validate': true});
            });
            return false;
        },
        time_increment: function(event) {
            this.model.getSelected().forEach(function(m){
                m.set({'theT': m.get('theT') + 1}, {'validate': true});
            });
            return false;
        },
        time_decrement: function(event) {
            this.model.getSelected().forEach(function(m){
                m.set({'theT': m.get('theT') - 1}, {'validate': true});
            });
            return false;
        },
    });


    var ImageViewerView = Backbone.View.extend({

        template: JST["src/templates/viewport_template.html"],
        inner_template: JST["src/templates/viewport_inner_template.html"],

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
                    'change:width change:height change:rotation change:z_projection change:z_start change:z_end change:min_export_dpi',
                    self.render);
                self.listenTo(m,
                    'change:channels change:theZ change:theT',
                    self.rerender_image_change);
            });


            $("#vp_zoom_slider").slider({
                // NB: these values are updated on render()
                max: 1000,
                min: 100,
                value: self.zoom_avg,
                slide: function(event, ui) {
                    self.update_img_css(ui.value, 0, 0);
                },
                stop: function( event, ui ) {
                    self.zoom_avg = ui.value;
                    var to_save = {'zoom': ui.value};
                    if (ui.value === 100) {
                        to_save.dx = 0;
                        to_save.dy = 0;
                    }
                    self.models.forEach(function(m){
                        m.save(to_save);
                    });
                    // we don't listenTo zoom change...
                    self.rerender_image_change();
                }
            });
            this.$vp_zoom_value = $("#vp_zoom_value");

            // We nest the ZoomView so we can update it on update_img_css
            this.zmView = new ZoomView({models: this.models,
                                        figureModel: this.figureModel}); // auto-renders on init
            $("#reset-zoom-view").append(this.zmView.el);

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
            $( "#vp_zoom_slider" ).slider( "destroy" );
            $("#vp_z_slider").slider("destroy");
            $("#vp_t_slider").slider("destroy");
            this.$vp_zoom_value.text('');

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
                this.$vp_zoom_value.text(zoom + "%");

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

        formatTime: function(seconds) {

            var mins, secs, hours;
            if (typeof seconds === 'undefined') {
                return "";
            }
            else if (seconds < 60) {
                return seconds + " secs";
            } else if (seconds < 3600) {
                mins = (seconds / 60) >> 0;
                secs = (seconds % 60) >> 0;
                return mins + "min " + secs + "s";
            } else {
                hours = (seconds / 3600) >> 0;
                mins = (seconds % 3600 / 60) >> 0;
                secs = (seconds % 60) >> 0;
                return hours + "h " + mins + "min " + secs + "s";
            }
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
                var src = m.get_img_src();
                var img_css = m.get_vp_img_css(m.get('zoom'), frame_w, frame_h);
                img_css.src = src;
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

            this.render_z_t_labels();
        },

        render_z_t_labels: function() {
            // Rendering Z/T labels without rendering whole component
            // means we don't re-build z/t sliders (they don't lose focus)
            var sizeZ = this.models.getIfEqual('sizeZ');
            var sizeT = this.models.getIfEqual('sizeT');
            var theT = this.models.getAverage('theT');
            var theZ = this.models.getAverage('theZ');
            var z_projection = this.models.allTrue('z_projection');
            var deltaT = this.models.getDeltaTIfEqual();

            var z_label = theZ + 1;
            if (z_projection) {
                var z_start = Math.round(this.models.getAverage('z_start'));
                var z_end = Math.round(this.models.getAverage('z_end'));
                z_label = (z_start + 1) + "-" + (z_end + 1);
            } else if (!this.models.allEqual('theZ')) {
                z_label = "-";
            }
            $("#vp_z_slider").slider({'value': theZ + 1});
            $("#vp_z_value").text(z_label + "/" + (sizeZ || '-'));

            var t_label = theT + 1;
            var dt_label;
            if (!this.models.allEqual('theT')) {
                t_label = "-";
            }
            $("#vp_t_slider").slider({'value': theT + 1});
            $("#vp_t_value").text(t_label + "/" + (sizeT || '-'));

            if ((deltaT === 0 || deltaT) && sizeT > 1) {
                dt_label = this.formatTime(deltaT);
            } else {
                dt_label = "";
            }
            $("#vp_deltaT").text(dt_label);
        },

        render: function() {

            // render child view
            this.zmView.render();

            // only show viewport if original w / h ratio is same for all models
            var model = this.models.head(),
                self = this;
            var imgs_css;

            // get average viewport frame w/h & zoom
            var wh = this.models.getAverageWH(),
                zoom = this.models.getAverage('zoom'),
                theZ = this.models.getAverage('theZ'),
                z_start = Math.round(this.models.getAverage('z_start')),
                z_end = Math.round(this.models.getAverage('z_end')),
                theT = this.models.getAverage('theT'),
                // deltaT = sum_deltaT/this.models.length,
                sizeZ = this.models.getIfEqual('sizeZ'),
                sizeT = this.models.getIfEqual('sizeT'),
                deltaT = this.models.getDeltaTIfEqual(),
                z_projection = this.models.allTrue('z_projection');

            if (wh <= 1) {
                var frame_h = this.full_size;
                var frame_w = this.full_size * wh;
            } else {
                var frame_w = this.full_size;
                var frame_h = this.full_size / wh;
            }

            imgs_css = this.get_imgs_css();

            // update sliders
            var Z_disabled = false,
                Z_max = sizeZ;
            if (!sizeZ || sizeZ === 1) {    // undefined or 1
                Z_disabled = true;
                Z_max = 1;
            }

            // Destroy any existing slider...
            try {
                // ...but will throw if not already a slider
                $("#vp_z_slider").slider("destroy");
            } catch (e) {}

            if (z_projection) {
                $("#vp_z_slider").slider({
                    orientation: "vertical",
                    range: true,
                    max: Z_max,
                    disabled: Z_disabled,
                    min: 1,             // model is 0-based, UI is 1-based
                    values: [z_start + 1, z_end + 1],
                    slide: function(event, ui) {
                        $("#vp_z_value").text(ui.values[0] + "-" + ui.values[1] + "/" + sizeZ);
                    },
                    stop: function( event, ui ) {
                        self.models.forEach(function(m){
                            m.save({
                                'z_start': ui.values[0] - 1,
                                'z_end': ui.values[1] -1
                            });
                        });
                    }
                });
            } else {
                $("#vp_z_slider").slider({
                    orientation: "vertical",
                    max: sizeZ,
                    disabled: Z_disabled,
                    min: 1,             // model is 0-based, UI is 1-based
                    value: theZ + 1,
                    slide: function(event, ui) {
                        $("#vp_z_value").text(ui.value + "/" + sizeZ);
                    },
                    stop: function( event, ui ) {
                        self.models.forEach(function(m){
                            m.save('theZ', ui.value - 1);
                        });
                    }
                });
            }

            // T-slider should be enabled even if we have a mixture of sizeT values.
            // Slider T_max is the minimum of sizeT values
            // Slider value is average of theT values (but smaller than T_max)
            var T_disabled = false,
                T_slider_max = self.models.getMin('sizeT');
            if (T_slider_max === 1) {
                T_disabled = true;
            }
            var t_slider_value = Math.min(theT, T_slider_max);
            // in case it's already been initialised:
            try {
                $("#vp_t_slider").slider("destroy");
            } catch (e) {}

            $("#vp_t_slider").slider({
                max: T_slider_max,
                disabled: T_disabled,
                min: 1,             // model is 0-based, UI is 1-based
                value: t_slider_value + 1,
                slide: function(event, ui) {
                    var theT = ui.value;
                    $("#vp_t_value").text(theT + "/" + (sizeT || '-'));
                    var dt = self.models.head().get('deltaT')[theT-1];
                    self.models.forEach(function(m){
                        if (m.get('deltaT')[theT-1] != dt) {
                            dt = undefined;
                        }
                    });
                    $("#vp_deltaT").text(self.formatTime(dt));
                },
                stop: function( event, ui ) {
                    self.models.forEach(function(m){
                        m.save('theT', ui.value - 1);
                    });
                }
            });

            var json = {};
            json.inner_template = this.inner_template;
            json.opacity = 1 / imgs_css.length;
            json.imgs_css = imgs_css;
            json.frame_w = frame_w;
            json.frame_h = frame_h;

            // We render without z/t labels...
            var html = this.template(json);
            this.$el.html(html);
            // ...then update them dynamically 
            this.render_z_t_labels();

            this.$vp_frame = $(".vp_frame", this.$el);  // cache for later
            this.$vp_img = $(".vp_img", this.$el);
            this.zoom_avg = zoom >> 0;
            this.$vp_zoom_value.text(this.zoom_avg + "%");
            // zoom may be > 1000 if set by 'crop'

            // We want to be able to zoom Big images to 'actual size' in viewport
            // e.g. where 250 pixels of image is shown in viewport
            var max_width = this.models.getMax('orig_width');
            var max_zoom = parseInt(max_width / 250) * 100;
            max_zoom = Math.max(this.zoom_avg, max_zoom, 1000);

            // Current zoom may be larger due to small crop region
            $("#vp_zoom_slider").slider({'value': this.zoom_avg,
                                         'max': max_zoom});

            return this;
        }
    });


    var ZoomView = Backbone.View.extend({

        template: JST["src/templates/zoom_crop_template.html"],

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
                shapeJson = clipboard_data.SHAPES;
                shapeJson.forEach(function(shape) {
                    if (!rect && shape.type === "Rectangle") {
                        rect = {x: shape.x, y: shape.y, width: shape.width, height: shape.height};
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
            $("#cropModal").modal('show');
        },

        resetZoomShape: function(event) {
            event.preventDefault();
            this.models.forEach(function(m){
                m.cropToRoi({
                    'x': 0,
                    'y': 0,
                    'width': m.get('orig_width'),
                    'height': m.get('orig_height')
                });
            });
        },

        getXYWH: function(zoom, dx, dy) {

            var x, y, w, h;
            this.models.forEach(function(m, i){
                var r = m.getViewportAsRect(zoom, dx, dy);
                if (i === 0) {
                    x = r.x;
                    y = r.y;
                    w = r.width;
                    h = r.height;
                } else {
                    if (x !== r.x) x = "-";
                    if (y !== r.y) y = "-";
                    if (w !== r.width) w = "-";
                    if (h !== r.height) h = "-";
                }
            });
            var json = {
                x: (x !== "-" ? parseInt(x, 10) : x),
                y: (y !== "-" ? parseInt(y, 10) : y),
                width: (w !== "-" ? parseInt(w, 10) : w),
                height: (h !== "-" ? parseInt(h, 10) : h),
            }
            return json;
        },

        // called from the parent view during zoom slider update
        renderXYWH: function(zoom, dx, dy) {

            var json = this.getXYWH(zoom, dx, dy),
                clipboard = this.figureModel.get('clipboard');
            json.canCopyRect = true;
            json.canPasteRect = (clipboard && ('CROP' in clipboard || 'SHAPES' in clipboard));

            if ([json.x, json.y, json.w, json.h].indexOf("-") > -1) {
                json.canCopyRect = false;
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
        template: JST["src/templates/image_display_options_template.html"],

        initialize: function(opts) {
            // This View may apply to a single PanelModel or a list
            this.models = opts.models;
            var self = this;
            this.models.forEach(function(m){
                self.listenTo(m, 'change:channels change:z_projection', self.render);
            });
        },

        events: {
            "click .show-rotation": "show_rotation",
            "click .z-projection": "z_projection",
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
            var $rc = this.$el.find('.rotation-controls').toggleClass('rotation-controls-shown'),
                self = this;

            if ($rc.hasClass('rotation-controls-shown')) {
                $rc.find('.rotation-slider').slider({
                    orientation: "vertical",
                    max: 360,
                    min: 0,
                    step: 2,
                    value: self.rotation,
                    slide: function(event, ui) {
                        $(".vp_img").css({'-webkit-transform':'rotate(' + ui.value + 'deg)',
                                        'transform':'rotate(' + ui.value + 'deg)'});
                        $(".rotation_value").text(ui.value);
                    },
                    stop: function( event, ui ) {
                        self.rotation = ui.value;
                        self.models.forEach(function(m){
                            m.save('rotation', ui.value);
                        });
                    }
                });
            } else {
                $rc.find('.rotation-slider').slider("destroy");
            }
        },

        clear: function() {
            try {
                this.$el.find('.rotation-slider').slider("destroy");
            } catch (e) {}
            return this;
        },

        render: function() {
            var html,
                max_rotation = 0,
                sum_rotation = 0,
                sum_sizeZ = 0,
                rotation,
                z_projection,
                zp,
                self = this;
            if (this.models) {
                this.models.forEach(function(m, i){
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
                z_projection_disabled = ((sum_sizeZ === this.models.length) || anyBig);

                html = this.template({
                    'z_projection_disabled': z_projection_disabled,
                    'rotation': rotation,
                    'z_projection': z_projection});
                this.$el.html(html);
            }
            return this;
        }
    });
