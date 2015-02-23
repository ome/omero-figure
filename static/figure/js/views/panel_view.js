
    // -------------------------Panel View -----------------------------------
    // A Panel is a <div>, added to the #paper by the FigureView below.
    var PanelView = Backbone.View.extend({
        tagName: "div",
        className: "imagePanel",
        template: JST["static/figure/templates/figure_panel_template.html"],
        label_template: JST["static/figure/templates/labels/label_template.html"],
        label_vertical_template: JST["static/figure/templates/labels/label_vertical_template.html"],
        label_table_template: JST["static/figure/templates/labels/label_table_template.html"],
        scalebar_template: JST["static/figure/templates/scalebar_panel_template.html"],


        initialize: function(opts) {
            // we render on Changes in the model OR selected shape etc.
            this.model.on('destroy', this.remove, this);
            this.listenTo(this.model,
                'change:x change:y change:width change:height change:zoom change:dx change:dy change:rotation',
                this.render_layout);
            this.listenTo(this.model, 'change:scalebar change:pixel_size_x', this.render_scalebar);
            this.listenTo(this.model, 'change:channels change:theZ change:theT change:z_start change:z_end change:z_projection', this.render_image);
            this.listenTo(this.model, 'change:labels change:theT change:deltaT', this.render_labels);
            // This could be handled by backbone.relational, but do it manually for now...
            // this.listenTo(this.model.channels, 'change', this.render);
            // During drag, model isn't updated, but we trigger 'drag'
            this.model.on('drag_resize', this.drag_resize, this);

            this.render();
        },

        events: {
            // "click .img_panel": "select_panel"
        },

        // During drag, we resize etc
        drag_resize: function(xywh) {
            var x = xywh[0],
                y = xywh[1],
                w = xywh[2],
                h = xywh[3];
            this.update_resize(x, y, w, h);
            this.$el.addClass('dragging');
        },

        render_layout: function() {
            var x = this.model.get('x'),
                y = this.model.get('y'),
                w = this.model.get('width'),
                h = this.model.get('height');

            this.update_resize(x, y, w, h);
            this.$el.removeClass('dragging');
        },

        update_resize: function(x, y, w, h) {

            // update layout of panel on the canvas
            this.$el.css({'top': y +'px',
                        'left': x +'px',
                        'width': w +'px',
                        'height': h +'px'});

            // container needs to be square for rotation to vertical
            $('.left_vlabels', this.$el).css('width', h + 'px');

            // update the img within the panel
            var zoom = this.model.get('zoom'),
                vp_css = this.model.get_vp_img_css(zoom, w, h);
            this.$img_panel.css(vp_css);

            // update length of scalebar
            var sb = this.model.get('scalebar');
            if (sb && sb.show) {
                // this.$scalebar.css('width':);
                var sb_pixels = sb.length / this.model.get('pixel_size_x');
                var panel_scale = vp_css.width / this.model.get('orig_width'),
                    sb_width = panel_scale * sb_pixels;
                this.$scalebar.css('width', sb_width);
            }
        },

        render_image: function() {
            var src = this.model.get_img_src();
            this.$img_panel.attr('src', src);
        },

        render_labels: function() {

            $('.label_layout', this.$el).remove();  // clear existing labels

            var labels = this.model.get('labels'),
                self = this,
                positions = {
                    'top':[], 'bottom':[], 'left':[], 'right':[],
                    'leftvert':[],
                    'topleft':[], 'topright':[],
                    'bottomleft':[], 'bottomright':[]
                };

            // group labels by position
            _.each(labels, function(l) {
                // check if label is dynamic delta-T
                var ljson = $.extend(true, {}, l);
                if (typeof ljson.text == 'undefined' && ljson.time) {
                    ljson.text = self.model.get_time_label_text(ljson.time);
                } else {
                    // Escape all labels so they are safe
                    ljson.text = _.escape(ljson.text);
                }
                positions[l.position].push(ljson);
            });

            // Render template for each position and append to Panel.$el
            var html = "";
            _.each(positions, function(lbls, p) {
                var json = {'position':p, 'labels':lbls};
                if (lbls.length === 0) return;
                if (p == 'leftvert') {  // vertical
                    html += self.label_vertical_template(json);
                } else if (p == 'left' || p == 'right') {
                    html += self.label_table_template(json);
                } else {
                    html += self.label_template(json);
                }
            });
            self.$el.append(html);

            // need to force update of vertical labels layout
            $('.left_vlabels', self.$el).css('width', self.$el.height() + 'px');

            return this;
        },

        render_scalebar: function() {

            if (this.$scalebar) {
                this.$scalebar.remove();
            }
            var sb = this.model.get('scalebar');
            if (sb && sb.show) {
                var sb_json = {};
                sb_json.position = sb.position;
                sb_json.color = sb.color;
                sb_json.length = sb.length;
                sb_json.font_size = sb.font_size;
                sb_json.show_label = sb.show_label;
                sb_json.symbol = this.model.get('pixel_size_x_symbol');

                var sb_html = this.scalebar_template(sb_json);
                this.$el.append(sb_html);
            }
            this.$scalebar = $(".scalebar", this.$el);

            // update scalebar size wrt current sizes
            this.render_layout();
        },

        render: function() {

            // Have to handle potential nulls, since the template doesn't like them!
            var json = {'imageId': this.model.get('imageId')};
            // need to add the render string, E.g: 1|110:398$00FF00,2|...

            var html = this.template(json);
            this.$el.html(html);

            this.$img_panel = $(".img_panel", this.$el);    // cache for later

            this.render_image();
            this.render_labels();
            this.render_scalebar();     // also calls render_layout()

            return this;
        }
    });
