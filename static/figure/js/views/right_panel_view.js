
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
        },

        render: function() {
            var selected = this.model.getSelected();

            if (this.vp) {
                this.vp.clear().remove();
                delete this.vp;     // so we don't call clear() on it again.
            }
            if (selected.length > 0) {
                this.vp = new ImageViewerView({models: selected}); // auto-renders on init
                $("#viewportContainer").append(this.vp.el);
            }
            if (this.zmp) {
                this.zmp.remove();
                delete this.zmp;
            }
            if (selected.length > 0) {
                this.zmp = new ZoomView({models: selected}); // auto-renders on init
                $("#reset-zoom-view").append(this.zmp.el);
            }

            if (this.ipv) {
                this.ipv.remove();
            }
            if (selected.length > 0) {
                this.ipv = new InfoPanelView({models: selected});
                this.ipv.render();
                $("#infoTab").append(this.ipv.el);
            }

            if (this.ctv) {
                this.ctv.clear().remove();
            }
            if (selected.length > 0) {
                this.ctv = new ChannelToggleView({models: selected});
                $("#channelToggle").empty().append(this.ctv.render().el);
            }

        }
    });


    var LabelsPanelView = Backbone.View.extend({

        model: FigureModel,

        template: JST["static/figure/templates/labels_form_inner_template.html"],

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
        },

        // Handles all the various drop-down menus in the 'New' AND 'Edit Label' forms
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

        template: JST["static/figure/templates/labels_form_template.html"],
        inner_template: JST["static/figure/templates/labels_form_inner_template.html"],

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


    // Created new for each selection change
    var ScalebarFormView = Backbone.View.extend({

        template: JST["static/figure/templates/scalebar_form_template.html"],

        initialize: function(opts) {

            // prevent rapid repetative rendering, when listening to multiple panels
            this.render = _.debounce(this.render);

            this.models = opts.models;
            var self = this;

            this.models.forEach(function(m){
                self.listenTo(m, 'change:scalebar change:pixel_size_x change:scalebar_label', self.render);
            });

            // this.$el = $("#scalebar_form");
        },

        events: {
            "submit .scalebar_form": "update_scalebar",
            "click .scalebar_label": "update_scalebar",
            "change .btn": "dropdown_btn_changed",
            "click .hide_scalebar": "hide_scalebar",
            "click .pixel_size_display": "edit_pixel_size",
            "keypress .pixel_size_input"  : "enter_pixel_size",
            "blur .pixel_size_input"  : "save_pixel_size",
        },

        // simply show / hide editing field
        edit_pixel_size: function() {
            $('.pixel_size_display', this.$el).hide();
            $(".pixel_size_input", this.$el).css('display','inline-block').focus();
        },
        done_pixel_size: function() {
            $('.pixel_size_display', this.$el).show();
            $(".pixel_size_input", this.$el).css('display','none').focus();
        },

        // If you hit `enter`, set pixel_size
        enter_pixel_size: function(e) {
            if (e.keyCode == 13) {
                this.save_pixel_size(e);
            }
        },

        // on 'blur' or 'enter' we save...
        save_pixel_size: function(e) {
            // save will re-render, but only if number has changed - in case not...
            this.done_pixel_size();

            var val = $(e.target).val();
            if (val.length === 0) return;
            var pixel_size = parseFloat(val);
            if (isNaN(pixel_size)) return;
            this.models.forEach(function(m){
                m.save('pixel_size_x', pixel_size);
            });
        },

        // Automatically submit the form when a dropdown is changed
        dropdown_btn_changed: function(event) {
            $(event.target).closest('form').submit();
        },

        hide_scalebar: function() {
            this.models.forEach(function(m){
                m.hide_scalebar();
            });
        },

        // called when form changes
        update_scalebar: function(event) {

            var $form = $('#scalebar_form form');

            var length = $('.scalebar-length', $form).val(),
                position = $('.label-position span:first', $form).attr('data-position'),
                color = $('.label-color span:first', $form).attr('data-color'),
                show_label = $('.scalebar_label', $form).prop('checked'),
                font_size = $('.scalebar_font_size span:first', $form).text().trim();

            this.models.forEach(function(m){
                var sb = {show: true};
                if (length != '-') sb.length = parseInt(length, 10);
                if (position != '-') sb.position = position;
                if (color != '-') sb.color = color;
                sb.show_label = show_label;
                if (font_size != '-') sb.font_size = font_size;

                m.save_scalebar(sb);
            });
            return false;
        },

        render: function() {

            var json = {show: false, show_label: false},
                hidden = false,
                sb;

            this.models.forEach(function(m){
                // start with json data from first Panel
                if (!json.pixel_size_x) {
                    json.pixel_size_x = m.get('pixel_size_x');
                    json.symbol = m.get('pixel_size_x_symbol');
                } else {
                    pix_sze = m.get('pixel_size_x');
                    // account for floating point imprecision when comparing
                    if (json.pixel_size_x != '-' &&
                        json.pixel_size_x.toFixed(10) != pix_sze.toFixed(10)) {
                            json.pixel_size_x = '-';
                    }
                    if (json.symbol != m.get('pixel_size_x_symbol')) {
                        json.symbol = '-';
                    }
                }
                sb = m.get('scalebar');
                // ignore scalebars if not visible
                if (sb) {
                    if (!json.length) {
                        json.length = sb.length;
                        json.units = sb.units;
                        json.position = sb.position;
                        json.color = sb.color;
                        json.show_label = sb.show_label;
                        json.font_size = sb.font_size;
                    }
                    else {
                        if (json.length != sb.length) json.length = '-';
                        if (json.units != sb.units) json.units = '-';
                        if (json.position != sb.position) json.position = '-';
                        if (json.color != sb.color) json.color = '-';
                        if (!sb.show_label) json.show_label = false;
                        if (json.font_size != sb.font_size) json.font_size = '-';
                    }
                }
                // if any panels don't have scalebar - we allow to add
                if(!sb || !sb.show) hidden = true;
            });

            if (this.models.length === 0 || hidden) {
                json.show = true;
            }
            json.length = json.length || 10;
            json.units = json.units || 'um';
            json.position = json.position || 'bottomright';
            json.color = json.color || 'FFFFFF';
            json.font_size = json.font_size || 10;
            json.symbol = json.symbol || '-';

            var html = this.template(json);
            this.$el.html(html);

            return this;
        }
    });


    var InfoPanelView = Backbone.View.extend({

        template: JST["static/figure/templates/info_panel_template.html"],
        xywh_template: JST["static/figure/templates/xywh_panel_template.html"],

        initialize: function(opts) {
            // if (opts.models) {
            this.render = _.debounce(this.render);

            this.models = opts.models;
            if (opts.models.length > 1) {
                var self = this;
                this.models.forEach(function(m){
                    self.listenTo(m, 'change:x change:y change:width change:height change:imageId change:zoom', self.render);
                });
            } else if (opts.models.length == 1) {
                this.model = opts.models.head();
                this.listenTo(this.model, 'change:x change:y change:width change:height change:zoom', this.render);
                this.listenTo(this.model, 'drag_resize', this.drag_resize);
            }
        },

        events: {
            "click .setId": "setImageId",
        },

        setImageId: function(event) {
            event.preventDefault();
            // Simply show dialog - Everything else handled by SetIdModalView
            $("#setIdModal").modal('show');
            $("#setIdModal .imgIds").val("").focus();
        },

        // just update x,y,w,h by rendering ONE template
        drag_resize: function(xywh) {
            $("#xywh_table").remove();
            var json = {'x': xywh[0] >> 0,
                        'y': xywh[1] >> 0,
                        'width': xywh[2] >> 0,
                        'height': xywh[3] >> 0};
            json.dpi = this.model.getPanelDpi(json.width, json.height);
            this.$el.append(this.xywh_template(json));
        },

        // render BOTH templates
        render: function() {
            var json,
                title = this.models.length + " Panels Selected...",
                remoteUrl,
                imageIds = [];
            this.models.forEach(function(m) {
                imageIds.push(m.get('imageId'));
                if (m.get('baseUrl')) {
                    remoteUrl = m.get('baseUrl') + "/img_detail/" + m.get('imageId') + "/";
                }
                // start with json data from first Panel
                if (!json) {
                    json = m.toJSON();
                    json.dpi = m.getPanelDpi();
                    json.channel_labels = [];
                    _.each(json.channels, function(c){ json.channel_labels.push(c.label);});
                } else {
                    json.name = title;
                    // compare json summary so far with this Panel
                    var this_json = m.toJSON(),
                        attrs = ["imageId", "orig_width", "orig_height", "sizeT", "sizeZ", "x", "y", "width", "height", "dpi"];
                    this_json.dpi = m.getPanelDpi();
                    _.each(attrs, function(a){
                        if (json[a] != this_json[a]) {
                            json[a] = "-";
                        }
                    });
                    // handle channel names
                    if (this_json.channels.length != json.channel_labels.length) {
                        json.channel_labels = ["-"];
                    } else {
                        _.each(this_json.channels, function(c, idx){
                            if (json.channel_labels[idx] != c.label) {
                                json.channel_labels[idx] = '-';
                            }
                        });
                    }

                }
            });

            // Format floating point values
            _.each(["x", "y", "width", "height"], function(a){
                if (json[a] != "-") {
                    json[a] = json[a].toFixed(0);
                }
            });

            // Link IF we have a single remote image, E.g. http://jcb-dataviewer.rupress.org/jcb/img_detail/625679/
            json.imageLink = false;
            if (remoteUrl) {
                if (imageIds.length == 1) {
                    json.imageLink = remoteUrl;
                }
            // OR all the images are local
            } else {
                json.imageLink = WEBINDEX_URL + "?show=image-" + imageIds.join('|image-');
            }

            // all setId if we have a single Id
            json.setImageId = _.uniq(imageIds).length == 1;

            if (json) {
                var html = this.template(json),
                    xywh_html = this.xywh_template(json);
                this.$el.html(html + xywh_html);
            }
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

        template: JST["static/figure/templates/viewport_template.html"],

        className: "imageViewer",

        initialize: function(opts) {

            // prevent rapid repetative rendering, when listening to multiple panels
            this.render = _.debounce(this.render);

            this.full_size = 250;

            this.models = opts.models;
            var self = this,
                zoom_sum = 0;

            this.models.forEach(function(m){
                self.listenTo(m,
                    'change:width change:height change:channels change:zoom change:theZ change:theT change:rotation change:z_projection change:z_start change:z_end',
                    self.render);
                zoom_sum += m.get('zoom');

            });

            this.zoom_avg = parseInt(zoom_sum/ this.models.length, 10);

            $("#vp_zoom_slider").slider({
                max: 800,
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
                }
            });
            this.$vp_zoom_value = $("#vp_zoom_value");

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
                var xy = this.correct_rotation(dx, dy, this.r);
                dx = xy.dx;
                dy = xy.dy;
            }
            this.update_img_css(this.zoom_avg, dx, dy, true);
            this.dragging = false;
            return false;
        },

        mousemove: function(event) {
            if (this.dragging) {
                var dx = event.clientX - this.dragstart_x,
                    dy = event.clientY - this.dragstart_y;
                if (this.r !== 0) {
                    var xy = this.correct_rotation(dx, dy, this.r);
                    dx = xy.dx;
                    dy = xy.dy;
                }
                this.update_img_css(this.zoom_avg, dx, dy);
            }
            return false;
        },

        // if the panel is rotated by css, drag events need to be corrected
        correct_rotation: function(dx, dy, rotation) {
            if (dx === 0 && dy === 0) {
                return {'dx': dx, 'dy': dy};
            }
            var length = Math.sqrt(dx * dx + dy * dy),
                ang1 = Math.atan(dy/dx),
                deg1 = ang1/(Math.PI/180);  // rad -> deg
            if (dx < 0) {
                deg1 = 180 + deg1;
            }
            var deg2 = deg1 - this.r,
                ang2 = deg2 * (Math.PI/180);  // deg -> rad
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
            return this;
        },

        // This forces All panels in viewport to have SAME css
        // while zooming / dragging.
        // TODO: Update each panel separately.
        update_img_css: function(zoom, dx, dy, save) {

            dx = dx / (zoom/100);
            dy = dy / (zoom/100);

            var avg_dx = this.models.getAverage('dx'),
                avg_dy = this.models.getAverage('dy');

            if (this.$vp_img) {
                var frame_w = this.$vp_frame.width() + 2,
                    frame_h = this.$vp_frame.height() + 2,
                    zm_w = this.models.head().get('orig_width') / frame_w,
                    zm_h = this.models.head().get('orig_height') / frame_h,
                    scale = Math.min(zm_w, zm_h);
                dx = dx * scale;
                dy = dy * scale;
                dx += avg_dx;
                dy += avg_dy;
                this.$vp_img.css( this.models.head().get_vp_img_css(zoom, frame_w, frame_h, dx, dy) );
                this.$vp_zoom_value.text(zoom + "%");

                if (save) {
                    if (typeof dx === "undefined") dx = 0;  // rare crazy-dragging case!
                    if (typeof dy === "undefined") dy = 0;
                    this.models.forEach(function(m){
                        m.save({'dx': dx,
                                'dy': dy});
                    });
                }
            }
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

        render: function() {

            // only show viewport if original w / h ratio is same for all models
            var model = this.models.head(),
                self = this;
            var imgs_css = [];

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
            
            this.theT_avg = theT;

            if (wh <= 1) {
                frame_h = this.full_size;
                frame_w = this.full_size * wh;
            } else {
                frame_w = this.full_size;
                frame_h = this.full_size / wh;
            }

            // Now get img src & positioning css for each panel, 
            this.models.forEach(function(m){
                var src = m.get_img_src(),
                    img_css = m.get_vp_img_css(m.get('zoom'), frame_w, frame_h, m.get('dx'), m.get('dy'));
                img_css.src = src;
                imgs_css.push(img_css);
            });

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
            self.theT_avg = Math.min(self.theT_avg, T_slider_max);
            // in case it's already been initialised:
            try {
                $("#vp_t_slider").slider("destroy");
            } catch (e) {}

            $("#vp_t_slider").slider({
                max: T_slider_max,
                disabled: T_disabled,
                min: 1,             // model is 0-based, UI is 1-based
                value: self.theT_avg + 1,
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

            json.opacity = 1 / imgs_css.length;
            json.imgs_css = imgs_css;
            json.frame_w = frame_w;
            json.frame_h = frame_h;
            json.sizeZ = sizeZ || "-";
            json.theZ = theZ+1;
            json.sizeT = sizeT || "-";
            json.theT = theT+1;
            json.deltaT = deltaT;
            if (z_projection) {
                json.theZ = (z_start + 1) + "-" + (z_end + 1);
            } else if (!this.models.allEqual('theZ')) {
                json.theZ = "-";
            }
            if (!this.models.allEqual('theT')) {
                json.theT = "-";
            }
            if (!deltaT || sizeT == 1) {
                json.deltaT = "";
            } else {
                json.deltaT = this.formatTime(deltaT);
            }
            var html = this.template(json);
            this.$el.html(html);

            this.$vp_frame = $(".vp_frame", this.$el);  // cache for later
            this.$vp_img = $(".vp_img", this.$el);
            this.zoom_avg = zoom >> 0;
            this.$vp_zoom_value.text(this.zoom_avg + "%");
            $("#vp_zoom_slider").slider({value: this.zoom_avg});

            return this;
        }
    });


    var ZoomView = Backbone.View.extend({

        initialize: function(opts) {

            this.models = opts.models;
            this.render();
        },

        events: {
            "click .reset-zoom-shape": "resetZoomShape",
            "click .crop-btn": "show_crop_dialog",
        },

        show_crop_dialog: function(event) {
            event.preventDefault();
            // Simply show dialog - Everything else handled by that
            $("#roiModal").modal('show');
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

        render: function() {

            this.$el.html('<div class="btn-group">'+
                '<button type="button" title="Crop panel" class="btn btn-default btn-sm crop-btn">' +
                    '<span class="glyphicon"></span>' +
                '</button>'+
                '<button type="button" class="btn btn-default btn-sm reset-zoom-shape" title="Reset Zoom and Shape">'+
                    '<span class="glyphicon glyphicon-resize-full"></span>'+
                '</button></div>');
        }
    });

    // Coloured Buttons to Toggle Channels on/off.
    var ChannelToggleView = Backbone.View.extend({
        tagName: "div",
        template: JST["static/figure/templates/channel_toggle_template.html"],

        initialize: function(opts) {
            // This View may apply to a single PanelModel or a list
            this.models = opts.models;
            var self = this;
            this.models.forEach(function(m){
                self.listenTo(m, 'change:channels change:z_projection', self.render);
            });
        },

        events: {
            "click .channel-btn": "toggle_channel",
            "click .dropdown-menu a": "pick_color",
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

        pick_color: function(e) {
            var color = e.currentTarget.getAttribute('data-color'),
                $colorbtn = $(e.currentTarget).parent().parent(),
                oldcolor = $(e.currentTarget).attr('data-oldcolor'),
                idx = $colorbtn.attr('data-index'),
                self = this;

            if (color == 'colorpicker') {
                FigureColorPicker.show({
                    'color': oldcolor,
                    'success': function(newColor){
                        // remove # from E.g. #ff00ff
                        newColor = newColor.replace("#", "");
                        self.set_color(idx, newColor);
                    }
                });
            } else {
                this.set_color(idx, color);
            }
            return false;
        },

        set_color: function(idx, color) {
            if (this.models) {
                this.models.forEach(function(m){
                    m.save_channel(idx, 'color', color);
                });
            }
        },

        toggle_channel: function(e) {
            var idx = e.currentTarget.getAttribute('data-index');

            if (this.model) {
                this.model.toggle_channel(idx);
            } else if (this.models) {
                // 'flat' means that some panels have this channel on, some off
                var flat = $(e.currentTarget).hasClass('ch-btn-flat');
                this.models.forEach(function(m){
                    if(flat) {
                        m.toggle_channel(idx, true);
                    } else {
                        m.toggle_channel(idx);
                    }
                });
            }
            return false;
        },

        clear: function() {
            $(".ch_slider").slider("destroy");
            try {
                this.$el.find('.rotation-slider').slider("destroy");
            } catch (e) {}
            $("#channel_sliders").empty();
            return this;
        },

        render: function() {
            var json, html,
                max_rotation = 0,
                sum_rotation = 0,
                sum_sizeZ = 0,
                rotation,
                z_projection,
                zp,
                self = this;
            if (this.models) {

                // Comare channels from each Panel Model to see if they are
                // compatible, and compile a summary json.
                json = [];
                var compatible = true;

                this.models.forEach(function(m){
                    var chs = m.get('channels');
                    rotation = m.get('rotation');
                    max_rotation = Math.max(max_rotation, rotation);
                    sum_rotation += rotation;
                    sum_sizeZ += m.get('sizeZ');
                    // start with a copy of the first image channels
                    if (json.length === 0) {
                        _.each(chs, function(c) {
                            json.push($.extend(true, {}, c));
                        });
                        z_projection = !!m.get('z_projection');
                    } else{
                        zp = !!m.get('z_projection');
                        if (zp !== z_projection) {
                            z_projection = undefined;
                        }
                        // compare json summary so far with this channels
                        if (json.length != chs.length) {
                            compatible = false;
                        } else {
                            // if attributes don't match - show 'null' state
                            _.each(chs, function(c, cIndex) {
                                if (json[cIndex].color != c.color) {
                                    json[cIndex].color = 'ccc';
                                }
                                if (json[cIndex].active != c.active) {
                                    json[cIndex].active = undefined;
                                }
                                // process the 'window' {min, max, start, end}
                                var wdw = json[cIndex].window,    // the window we're updating
                                    w = c.window;
                                // if we haven't got a label yet, compare 'start' from 1st 2 panels
                                if (typeof wdw.start_label === 'undefined') {
                                    wdw.start_label = (w.start === wdw.start) ? w.start : '-';
                                } else if (wdw.start_label != w.start) {
                                    wdw.start_label = "-";      // otherwise revert to '-' unless all same
                                }
                                if (typeof wdw.end_label === 'undefined') {
                                    wdw.end_label = (w.end === wdw.end) ? w.end : '-';
                                } else if (wdw.end_label != w.end) {
                                    wdw.end_label = "-";      // revert to '-' unless all same
                                }
                                wdw.min = Math.min(wdw.min, w.min);
                                wdw.max = Math.max(wdw.max, w.max);
                                wdw.start = wdw.start + w.start;    // average when done
                                wdw.end = wdw.end + w.end;
                            });
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

                // if all panels have sizeZ == 1, don't allow z_projection
                z_projection_disabled = (sum_sizeZ === this.models.length);

                if (!compatible) {
                    json = [];
                }
                html = this.template({'channels':json,
                    'z_projection_disabled': z_projection_disabled,
                    'rotation': rotation,
                    'z_projection': z_projection});
                this.$el.html(html);

                if (compatible) {
                    $(".ch_slider").slider("destroy");
                    var $channel_sliders = $("#channel_sliders").empty();
                    _.each(json, function(ch, idx) {
                        // Turn 'start' and 'end' into average values
                        var start = (ch.window.start / self.models.length) << 0,
                            end = (ch.window.end / self.models.length) << 0,
                            min = Math.min(ch.window.min, start),
                            max = Math.max(ch.window.max, end),
                            start_label = ch.window.start_label || start,
                            end_label = ch.window.end_label || end,
                            color = ch.color;
                        if (color == "FFFFFF") color = "ccc";  // white slider would be invisible
                        var $div = $("<div><span class='ch_start'>" + start_label +
                                "</span><div class='ch_slider' style='background-color:#" + color +
                                "'></div><span class='ch_end'>" + end_label + "</span></div>")
                            .appendTo($channel_sliders);

                        $div.find('.ch_slider').slider({
                            range: true,
                            min: min,
                            max: max,
                            values: [start, end],
                            slide: function(event, ui) {
                                $div.children('.ch_start').text(ui.values[0]);
                                $div.children('.ch_end').text(ui.values[1]);
                            },
                            stop: function(event, ui) {
                                self.models.forEach(function(m) {
                                    m.save_channel_window(idx, {'start': ui.values[0], 'end': ui.values[1]});
                                });
                            }
                        });
                    });
                }
            }
            return this;
        }
    });
