
    // Corresponds to css - allows us to calculate size of labels
    var LINE_HEIGHT = 1.43;

    // ------------------------ Panel -----------------------------------------
    // Simple place-holder for each Panel. Will have E.g. imageId, rendering options etc
    // Attributes can be added as we need them.
    var Panel = Backbone.Model.extend({

        defaults: {
            x: 100,     // coordinates on the 'paper'
            y: 100,
            width: 512,
            height: 512,
            zoom: 100,
            dx: 0,    // pan x & y within viewport
            dy: 0,
            labels: [],
            deltaT: [],     // list of deltaTs (secs) for tIndexes of movie
            rotation: 0,
            selected: false,
            pixel_size_x_symbol: '\xB5m',     // microns by default
            pixel_size_x_unit: 'MICROMETER',
            max_export_dpi: 1000,

            // 'export_dpi' optional value to resample panel on export
            // model includes 'scalebar' object, e.g:
            // scalebar: {length: 10, position: 'bottomleft', color: 'FFFFFF',
            //                show: false, show_label: false; font_size: 10}
        },

        initialize: function() {

        },

        // When we're creating a Panel, we process the data a little here:
        parse: function(data, options) {
            var greyscale = data.rdefs.model === "greyscale";
            delete data.rdefs
            data.channels = data.channels.map(function(ch){
                // channels: use 'lut' for color if set. Don't save 'lut'
                if (ch.lut) {
                    if (ch.lut.length > 0) {
                        ch.color = ch.lut;
                    }
                    delete ch.lut;
                }
                // we don't support greyscale, but instead set active channel grey
                if (greyscale && ch.active) {
                    ch.color = "FFFFFF";
                }
                return ch;
            });
            return data;
        },

        syncOverride: true,

        validate: function(attrs, options) {
            // obviously lots more could be added here...
            if (attrs.theT >= attrs.sizeT) {
                return "theT too big";
            }
            if (attrs.theT < 0) {
                return "theT too small";
            }
            if (attrs.theZ >= attrs.sizeZ) {
                return "theZ too big";
            }
            if (attrs.theZ < 0) {
                return "theZ too small";
            }
            if (attrs.z_start !== undefined) {
                if (attrs.z_start < 0 || attrs.z_start >= attrs.sizeZ) {
                    return "z_start out of Z range"
                }
            }
            if (attrs.z_end !== undefined) {
                if (attrs.z_end < 0 || attrs.z_end >= attrs.sizeZ) {
                    return "z_end out of Z range"
                }
            }
        },

        // Switch some attributes for new image...
        setId: function(data) {

            // we replace these attributes...
            var newData = {'imageId': data.imageId,
                'name': data.name,
                'sizeZ': data.sizeZ,
                'theZ': data.theZ,
                'sizeT': data.sizeT,
                'orig_width': data.orig_width,
                'orig_height': data.orig_height,
                'datasetName': data.datasetName,
                'pixel_size_x': data.pixel_size_x,
                'pixel_size_y': data.pixel_size_y,
                'pixel_size_x_symbol': data.pixel_size_x_symbol,
                'pixel_size_x_unit': data.pixel_size_x_unit,
                'deltaT': data.deltaT,
            };

            // theT is not changed unless we have to...
            if (this.get('theT') >= newData.sizeT) {
                newData.theT = newData.sizeT - 1;
            }

            // Make sure dx and dy are not outside the new image
            if (Math.abs(this.get('dx')) > newData.orig_width/2) {
                newData.dx = 0;
            }
            if (Math.abs(this.get('dy')) > newData.orig_height/2) {
                newData.dy = 0;
            }

            // new Channels are based on new data, but we keep the
            // 'active' state and color from old Channels.
            var newCh = [],
                oldCh = this.get('channels'),
                dataCh = data.channels;
            _.each(dataCh, function(ch, i) {
                var nc = $.extend(true, {}, dataCh[i]);
                nc.active = (i < oldCh.length && oldCh[i].active);
                if (i < oldCh.length) {
                    nc.color = "" + oldCh[i].color;
                }
                newCh.push(nc);
            });

            newData.channels = newCh;

            this.set(newData);
        },

        hide_scalebar: function() {
            // keep all scalebar properties, except 'show'
            var sb = $.extend(true, {}, this.get('scalebar'));
            sb.show = false;
            this.save('scalebar', sb);
        },

        save_scalebar: function(new_sb) {
            // update only the attributes of scalebar we're passed
            var old_sb = $.extend(true, {}, this.get('scalebar') || {});
            var sb = $.extend(true, old_sb, new_sb);
            this.save('scalebar', sb);
        },

        // Simple checking whether shape is in viewport (x, y, width, height)
        // Return true if any of the points in shape are within viewport.
        is_shape_in_viewport: function(shape, viewport) {
            var rect = viewport;
            var isPointInRect = function(x, y) {
                if (x < rect.x) return false;
                if (y < rect.y) return false;
                if (x > rect.x + rect.width) return false;
                if (y > rect.y + rect.height) return false;
                return true;
            }
            var points;
            if (shape.type === "Ellipse") {
                points = [[shape.cx, shape.cy]];
            } else if (shape.type === "Rectangle") {
                points = [[shape.x, shape.y],
                        [shape.x, shape.y + shape.height,],
                        [shape.x + shape.width, shape.y],
                        [shape.x + shape.width, shape.y + shape.height]];
            } else if (shape.type === "Line" || shape.type === "Arrow") {
                points = [[shape.x1, shape.y1],
                        [shape.x2, shape.y2],
                        [(shape.x1 + shape.x2)/2, (shape.y1 + shape.y2)/ 2]];
            } else if (shape.type === "Polyline" || shape.type === "Polygon") {
                points = shape.points.split(' ').map(function(p){
                    return p.split(",");
                });
            }
            if (points) {
                for (var p=0; p<points.length; p++) {
                    if (isPointInRect(points[p][0], points[p][1])) {
                        return true;
                    }
                }
            }
            return false;
        },

        setROIStrokeWidth: function(width) {
            this.setROIAttr('strokeWidth', width);
        },

        setROIColor: function(color) {
            this.setROIAttr('strokeColor', '#' + color);
        },

        setROIAttr: function(attr, value) {
            var old = this.get('shapes');
            if (!old || old.length === 0) {
                return;
            }
            var rois = [];
            old.forEach(function(roi){
                var xtra = {};
                xtra['' + attr] = value;
                rois.push($.extend(true, {}, roi, xtra));
            });
            this.save('shapes', rois);
        },

        // Adds list of shapes to panel (same logic as for labels below)
        add_shapes: function(shapes) {
            var old = this.get('shapes'),
                viewport = this.getViewportAsRect(),
                self = this,
                allAdded = true,
                shps = [];
            if (old) {
                old.forEach(function(sh){
                    shps.push($.extend(true, {}, sh));
                });
            }
            shapes.forEach(function(sh){
                // simple test if shape is in viewport
                if (self.is_shape_in_viewport(sh, viewport)) {
                    shps.push($.extend(true, {}, sh));
                } else {
                    allAdded = false;
                }
            });
            this.save('shapes', shps);
            return allAdded;
        },

        // takes a list of labels, E.g [{'text':"t", 'size':10, 'color':'FF0000', 'position':"top"}]
        add_labels: function(labels) {
            var oldLabs = this.get("labels");
            // Need to clone the list of labels...
            var labs = [];
            for (var i=0; i<oldLabs.length; i++) {
                labs.push( $.extend(true, {}, oldLabs[i]) );
            }
            // ... then add new labels ...
            for (var j=0; j<labels.length; j++) {
                labs.push( $.extend(true, {}, labels[j]) );
            }
            // ... so that we get the changed event triggering OK
            this.save('labels', labs);
        },

        create_labels_from_channels: function(options) {
            var newLabels = [];
            _.each(this.get('channels'), function(c){
                if (c.active) {
                    // If channel has LUT, make grey (visible on black/white bg)
                    var chColor = c.color.endsWith('lut') ? 'BBBBBB' : c.color;
                    newLabels.push({
                        'text': c.label,
                        'size': options.size,
                        'position': options.position,
                        'color': options.color || chColor
                    });
                }
            });
            this.add_labels(newLabels);
        },

        getDeltaT: function() {
            var theT = this.get('theT');
            return this.get('deltaT')[theT] || 0;
        },

        get_time_label_text: function(format) {
            var pad = function(digit) {
                var d = digit + "";
                return d.length === 1 ? ("0"+d) : d;
            };
            var theT = this.get('theT'),
                deltaT = this.get('deltaT')[theT] || 0,
                isNegative = (deltaT < 0),
                text = "", h, m, s;
            deltaT = Math.abs(deltaT);
            if (format === "index") {
                isNegative = false;
                text = "" + (theT + 1);
            } else if (format === "milliseconds") {
                text = Math.round(deltaT*1000) + " ms";
            } else if (format === "secs") {
                text = Math.round(deltaT) + " s";
            } else if (format === "mins:secs") {
                m = parseInt(deltaT / 60);
                s = pad(Math.round(deltaT % 60));
                text = m + ":" + s;
            } else if (format === "mins") {
                text = Math.round(deltaT / 60) + " mins";
            } else if (format === "hrs:mins") {
                h = parseInt(deltaT / 3600);
                m = pad(Math.round((deltaT % 3600) / 60));
                text = h + ":" + m;
            } else if (format === "hrs:mins:secs") {
                h = parseInt(deltaT / 3600);
                m = pad(parseInt((deltaT % 3600) / 60));
                s = pad(Math.round(deltaT % 60));
                text = h + ":" + m + ":" + s;
            }
            if (["0 s", "0:00", "0 mins", "0:00:00"].indexOf(text) > -1) {
                isNegative = false;
            }
            return (isNegative ? '-' : '') + text;
        },

        create_labels_from_time: function(options) {
            
            this.add_labels([{
                    'time': options.format,
                    'size': options.size,
                    'position': options.position,
                    'color': options.color
            }]);
        },

        get_label_key: function(label) {
            var key = (label.text || label.time) + '_' + label.size + '_' + label.color + '_' + label.position;
            key = _.escape(key);
            return key;
        },

        // labels_map is {labelKey: {size:s, text:t, position:p, color:c}} or {labelKey: false} to delete
        // where labelKey specifies the label to edit. "l.text + '_' + l.size + '_' + l.color + '_' + l.position"
        edit_labels: function(labels_map) {

            var oldLabs = this.get('labels');
            // Need to clone the list of labels...
            var labs = [],
                lbl, lbl_key;
            for (var i=0; i<oldLabs.length; i++) {
                lbl = oldLabs[i];
                lbl_key = this.get_label_key(lbl);
                // for existing label that matches...
                if (labels_map.hasOwnProperty(lbl_key)) {
                    if (labels_map[lbl_key]) {
                        // replace with the new label
                        lbl = $.extend(true, {}, labels_map[lbl_key]);
                        labs.push( lbl );
                    }
                    // else 'false' are ignored (deleted)
                } else {
                    // otherwise leave un-edited
                    lbl = $.extend(true, {}, lbl);
                    labs.push( lbl );
                }
            }
            // ... so that we get the changed event triggering OK
            this.save('labels', labs);
        },

        save_channel: function(cIndex, attr, value) {

            var oldChs = this.get('channels');
            // Need to clone the list of channels...
            var chs = [];
            for (var i=0; i<oldChs.length; i++) {
                chs.push( $.extend(true, {}, oldChs[i]) );
            }
            // ... then set new value ...
            chs[cIndex][attr] = value;
            // ... so that we get the changed event triggering OK
            this.save('channels', chs);
        },

        toggle_channel: function(cIndex, active){

            if (typeof active == "undefined"){
                active = !this.get('channels')[cIndex].active;
            }
            this.save_channel(cIndex, 'active', active);
        },

        save_channel_window: function(cIndex, new_w) {
            // save changes to the channel.window. Extend {} so save triggers change
            var w = $.extend(true, {}, this.get('channels')[cIndex].window);
            new_w = $.extend(true, w, new_w);
            this.save_channel(cIndex, 'window', new_w);
        },

        set_z_projection: function(z_projection) {
            var zp = this.get('z_projection'),
                z_start = this.get('z_start'),
                z_end = this.get('z_end'),
                sizeZ = this.get('sizeZ'),
                theZ = this.get('theZ'),
                z_diff = 2;

            // Only allow Z-projection if sizeZ > 1
            // If turning projection on...
            if (z_projection && !zp && sizeZ > 1) {

                // use existing z_diff interval if set
                if (z_start !== undefined && z_end !== undefined) {
                    z_diff = (z_end - z_start)/2;
                    z_diff = Math.round(z_diff);
                }
                // reset z_start & z_end
                z_start = Math.max(theZ - z_diff, 0);
                z_end = Math.min(theZ + z_diff, sizeZ - 1);
                this.set({
                    'z_projection': true,
                    'z_start': z_start,
                    'z_end': z_end
                });
            // If turning z-projection off...
            } else if (!z_projection && zp) {
                // reset theZ for average of z_start & z_end
                if (z_start !== undefined && z_end !== undefined) {
                    theZ = Math.round((z_end + z_start)/ 2 );
                    this.set({'z_projection': false,
                        'theZ': theZ});
                } else {
                    this.set('z_projection', false);
                }
            }
        },

        // When a multi-select rectangle is drawn around several Panels
        // a resize of the rectangle x1, y1, w1, h1 => x2, y2, w2, h2
        // will resize the Panels within it in proportion.
        // This might be during a drag, or drag-stop (save=true)
        multiselectdrag: function(x1, y1, w1, h1, x2, y2, w2, h2, save){

            var shift_x = function(startX) {
                return ((startX - x1)/w1) * w2 + x2;
            };
            var shift_y = function(startY) {
                return ((startY - y1)/h1) * h2 + y2;
            };

            var newX = shift_x( this.get('x') ),
                newY = shift_y( this.get('y') ),
                newW = shift_x( this.get('x')+this.get('width') ) - newX,
                newH = shift_y( this.get('y')+this.get('height') ) - newY;

            // Either set the new coordinates...
            if (save) {
                this.save( {'x':newX, 'y':newY, 'width':newW, 'height':newH} );
            } else {
                // ... Or update the UI Panels
                // both svg and DOM views listen for this...
                this.trigger('drag_resize', [newX, newY, newW, newH] );
            }
        },

        // resize, zoom and pan to show the specified region.
        // new panel will fit inside existing panel
        cropToRoi: function(coords) {
            var targetWH = coords.width/coords.height,
                currentWH = this.get('width')/this.get('height'),
                newW, newH,
                targetCx = Math.round(coords.x + (coords.width/2)),
                targetCy = Math.round(coords.y + (coords.height/2)),
                // centre panel at centre of ROI
                dx = (this.get('orig_width')/2) - targetCx,
                dy = (this.get('orig_height')/2) - targetCy;
            // make panel correct w/h ratio
            if (targetWH < currentWH) {
                // make it thinner
                newH = this.get('height');
                newW = targetWH * newH;
            } else {
                newW = this.get('width');
                newH = newW / targetWH;
            }
            // zoom to correct percentage
            var xPercent = this.get('orig_width') / coords.width,
                yPercent = this.get('orig_height') / coords.height,
                zoom = Math.min(xPercent, yPercent) * 100;

            this.set({'width': newW, 'height': newH, 'dx': dx, 'dy': dy, 'zoom': zoom});
        },

        // returns the current viewport as a Rect {x, y, width, height}
        getViewportAsRect: function(zoom, dx, dy) {
            zoom = zoom !== undefined ? zoom : this.get('zoom');
            dx = dx !== undefined ? dx : this.get('dx');
            dy = dy !== undefined ? dy : this.get('dy');

            var width = this.get('width'),
                height = this.get('height'),
                orig_width = this.get('orig_width'),
                orig_height = this.get('orig_height');

            // find if scaling is limited by width OR height
            var xPercent = width / orig_width,
                yPercent = height / orig_height,
                scale = Math.max(xPercent, yPercent);

            // if not zoomed or panned and panel shape is approx same as image...
            var orig_wh = orig_width / orig_height,
                view_wh = width / height;
            if (dx === 0 && dy === 0 && zoom == 100 && Math.abs(orig_wh - view_wh) < 0.01) {
                // ...ROI is whole image
                return {'x': 0, 'y': 0, 'width': orig_width, 'height': orig_height}
            }

            // Factor in the applied zoom...
            scale = scale * zoom / 100;
            // ...to get roi width & height
            var roiW = width / scale,
                roiH = height / scale;

            // Use offset from image centre to calculate ROI position
            var cX = orig_width/2 - dx,
                cY = orig_height    /2 - dy,
                roiX = cX - (roiW / 2),
                roiY = cY - (roiH / 2);

            return {'x': roiX, 'y': roiY, 'width': roiW, 'height': roiH};
        },

        // Drag resizing - notify the PanelView without saving
        drag_resize: function(x, y, w, h) {
            this.trigger('drag_resize', [x, y, w, h] );
        },

        // Drag moving - notify the PanelView & SvgModel with/without saving
        drag_xy: function(dx, dy, save) {
            // Ignore any drag_stop events from simple clicks (no drag)
            if (dx === 0 && dy === 0) {
                return;
            }
            var newX = this.get('x') + dx,
                newY = this.get('y') + dy,
                w = this.get('width'),
                h = this.get('height');

            // Either set the new coordinates...
            if (save) {
                this.save( {'x':newX, 'y':newY} );
            } else {
                // ... Or update the UI Panels
                // both svg and DOM views listen for this...
                this.trigger('drag_resize', [newX, newY, w, h] );
            }

            // we return new X and Y so FigureModel knows where panels are
            return {'x':newX, 'y':newY};
        },

        get_centre: function() {
            return {'x':this.get('x') + (this.get('width')/2),
                'y':this.get('y') + (this.get('height')/2)};
        },

        is_big_image: function() {
            return this.get('orig_width') * this.get('orig_height') > MAX_PLANE_SIZE;
        },

        get_img_src: function(force_no_padding) {
            var chs = this.get('channels');
            var cStrings = chs.map(function(c, i){
                return (c.active ? '' : '-') + (1+i) + "|" + c.window.start + ":" + c.window.end + "$" + c.color;
            });
            var maps_json = chs.map(function(c){
                return {'reverse': {'enabled': !!c.reverseIntensity}};
            });
            var renderString = cStrings.join(","),
                imageId = this.get('imageId'),
                theZ = this.get('theZ'),
                theT = this.get('theT'),
                baseUrl = this.get('baseUrl'),
                // stringify json and remove spaces
                maps = '&maps=' + JSON.stringify(maps_json).replace(/ /g, ""),
                proj = "";
            if (this.get('z_projection')) {
                proj = "&p=intmax|" + this.get('z_start') + ":" + this.get('z_end');
            }
            baseUrl = baseUrl || WEBGATEWAYINDEX.slice(0, -1);  // remove last /

            // If BIG image, render scaled region
            var region = "";
            if (this.is_big_image()) {
                baseUrl = BASE_WEBFIGURE_URL + 'render_scaled_region/';
                var rect = this.getViewportAsRect();
                // Render a region that is 1.5 x larger
                if (!force_no_padding) {
                    var length = Math.max(rect.width, rect.height) * 1.5;
                    rect.x = rect.x - ((length - rect.width) / 2);
                    rect.y = rect.y - ((length - rect.height) / 2);
                    rect.width = length;
                    rect.height = length;
                }
                var coords = [rect.x, rect.y, rect.width, rect.height].map(function(c){return parseInt(c)})
                region = '&region=' + coords.join(',');
            } else {
                baseUrl += '/render_image/';
            }

            return baseUrl + imageId + "/" + theZ + "/" + theT
                    + '/?c=' + renderString + proj + maps + region + "&m=c";
        },

        // Turn coordinates into css object with rotation transform
        _viewport_css: function(img_x, img_y, img_w, img_h, frame_w, frame_h) {
            var transform_x = 100 * (frame_w/2 - img_x) / img_w,
                transform_y = 100 * (frame_h/2 - img_y) / img_h,
                rotation = this.get('rotation') || 0;

            var css = {'left':img_x,
                       'top':img_y,
                       'width':img_w,
                       'height':img_h,
                       '-webkit-transform-origin': transform_x + '% ' + transform_y + '%',
                       'transform-origin': transform_x + '% ' + transform_y + '%',
                       '-webkit-transform': 'rotate(' + rotation + 'deg)',
                       'transform': 'rotate(' + rotation + 'deg)'
                   };
            return css;
        },

        // used by the PanelView and ImageViewerView to get the size and
        // offset of the img within it's frame
        get_vp_img_css: function(zoom, frame_w, frame_h, x, y) {

            // For non-big images, we have the full plane in hand
            // css just shows the viewport region
            if (!this.is_big_image()) {
                return this.get_vp_full_plane_css(zoom, frame_w, frame_h, x, y);

            // For 'big' images, we render just the viewport, so the rendered
            // image fully fills the viewport.
            } else {
                return this.get_vp_big_image_css(zoom, frame_w, frame_h, x, y);
            }
        },

        // For BIG images we just render the viewport
        // Rendered image will be filling viewport.
        // If we're zooming image will be larger.
        // If panning, offset from centre by x and y.
        // NB: Reshaping (changing aspect ratio) is buggy (so PanelView hides big image while reshaping)
        get_vp_big_image_css: function(zoom, frame_w, frame_h, x, y) {

            // Used for static rendering, as well as during zoom, panning, panel resizing
            // and panel re-shaping (stretch/squash).

            var zooming = zoom !== this.get('zoom');
            var panning = (x !== undefined && y!== undefined);

            // Need to know what the original offsets are...
            // We know that the image is 1.5 * bigger than viewport
            var length = Math.max(frame_w, frame_h) * 1.5;

            var img_x;
            var img_y;
            var img_w = length;
            var img_h = length;

            // if we're zooming...
            if (zooming) {
                img_w = length * zoom / this.get('zoom');
                img_h = length * zoom / this.get('zoom');
                img_y = y || ((frame_h - img_h) / 2);
                img_x = x || ((frame_w - img_w) / 2);
                return this._viewport_css(img_x, img_y, img_w, img_h, frame_w, frame_h);
            } else {
                img_x = (frame_w - length) / 2;
                img_y = (frame_h - length) / 2;
            }

            // if we're resizing width / height....
            var old_w = parseInt(this.get('width'), 10);
            var old_h = parseInt(this.get('height'), 10);
            frame_w = parseInt(frame_w);
            frame_h = parseInt(frame_h);

            var resizing = old_w !== img_w || old_h !== img_h;
            if (resizing) {

                img_y = (frame_h - img_h) / 2;
                img_x = (frame_w - img_w) / 2;

                // If we're panning...
                if (panning) {
                    // ...we need to simply increment existing offset
                    img_x += x;
                    img_y += y;
                }
            }

            return this._viewport_css(img_x, img_y, img_w, img_h, frame_w, frame_h);
        },

        // get CSS that positions and scales a full image plane so that
        // only the 'viewport' shows in the parent container
        get_vp_full_plane_css: function(zoom, frame_w, frame_h, x, y) {

            var dx = x;
            var dy = y;

            var orig_w = this.get('orig_width'),
                orig_h = this.get('orig_height');
            if (typeof dx == 'undefined') dx = this.get('dx');
            if (typeof dy == 'undefined') dy = this.get('dy');
            zoom = zoom || 100;

            var img_x = 0,
                img_y = 0,
                img_w = frame_w * (zoom/100),
                img_h = frame_h * (zoom/100),
                orig_ratio = orig_w / orig_h,
                vp_ratio = frame_w / frame_h;
            if (Math.abs(orig_ratio - vp_ratio) < 0.01) {
                // ignore...
            // if viewport is wider than orig, offset y
            } else if (orig_ratio < vp_ratio) {
                img_h = img_w / orig_ratio;
            } else {
                img_w = img_h * orig_ratio;
            }
            var vp_scale_x = frame_w / orig_w,
                vp_scale_y = frame_h / orig_h,
                vp_scale = Math.max(vp_scale_x, vp_scale_y);

            // offsets if image is centered
            img_y = (img_h - frame_h)/2;
            img_x = (img_w - frame_w)/2;

            // now shift by dx & dy
            dx = dx * (zoom/100);
            dy = dy * (zoom/100);
            img_x = (dx * vp_scale) - img_x;
            img_y = (dy * vp_scale) - img_y;

            return this._viewport_css(img_x, img_y, img_w, img_h, frame_w, frame_h);
        },

        getPanelDpi: function(w, h, zoom) {
            // page is 72 dpi
            w = w || this.get('width');
            h = h || this.get('height');
            zoom = zoom || this.get('zoom');
            var img_width = this.get_vp_full_plane_css(zoom, w, h).width,  // not viewport width
                orig_width = this.get('orig_width'),
                scaling = orig_width / img_width,
                dpi = scaling * 72;
            return dpi.toFixed(0);
        },

        getBoundingBoxTop: function() {
            // get top of panel including 'top' labels
            var labels = this.get("labels");
            var y = this.get('y');
            // get labels by position
            var top_labels = labels.filter(function(l) {return l.position === 'top'});
            // offset by font-size of each
            y = top_labels.reduce(function(prev, l){
                return prev - (LINE_HEIGHT * l.size);
            }, y);
            return y;
        },

        getBoundingBoxLeft: function() {
            // get left of panel including 'leftvert' labels (ignore
            // left horizontal labels - hard to calculate width)
            var labels = this.get("labels");
            var x = this.get('x');
            // get labels by position
            var left_labels = labels.filter(function(l) {return l.position === 'leftvert'});
            // offset by font-size of each
            x = left_labels.reduce(function(prev, l){
                return prev - (LINE_HEIGHT * l.size);
            }, x);
            return x;
        },

        getBoundingBoxRight: function() {
            // Ignore right (horizontal) labels since we don't know how long they are
            return this.get('x') + this.get('width');
        },

        getBoundingBoxBottom: function() {
            // get bottom of panel including 'bottom' labels
            var labels = this.get("labels");
            var y = this.get('y') + this.get('height');
            // get labels by position
            var bottom_labels = labels.filter(function(l) {return l.position === 'bottom'});
            // offset by font-size of each
            y = bottom_labels.reduce(function(prev, l){
                return prev + (LINE_HEIGHT * l.size);
            }, y);
            return y;
        },

        // True if coords (x,y,width, height) overlap with panel
        regionOverlaps: function(coords) {

            var px = this.get('x'),
                px2 = px + this.get('width'),
                py = this.get('y'),
                py2 = py + this.get('height'),
                cx = coords.x,
                cx2 = cx + coords.width,
                cy = coords.y,
                cy2 = cy + coords.height;
            // overlap needs overlap on x-axis...
            return ((px < cx2) && (cx < px2) && (py < cy2) && (cy < py2));
        },

    });

    // ------------------------ Panel Collection -------------------------
    var PanelList = Backbone.Collection.extend({
        model: Panel,

        getSelected: function() {
            var s = this.filter(function(panel){
                return panel.get('selected');
            });
            return new PanelList(s);
        },

        getAverage: function(attr) {
            return this.getSum(attr) / this.length;
        },

        getAverageWH: function() {
            var sumWH = this.reduce(function(memo, m){
                return memo + (m.get('width')/ m.get('height'));
            }, 0);
            return sumWH / this.length;
        },

        getSum: function(attr) {
            return this.reduce(function(memo, m){
                return memo + (m.get(attr) || 0);
            }, 0);
        },

        getMax: function(attr) {
            return this.reduce(function(memo, m){ return Math.max(memo, m.get(attr)); }, 0);
        },

        getMin: function(attr) {
            return this.reduce(function(memo, m){ return Math.min(memo, m.get(attr)); }, Infinity);
        },

        allTrue: function(attr) {
            return this.reduce(function(memo, m){
                return (memo && m.get(attr));
            }, true);
        },

        // check if all panels have the same value for named attribute
        allEqual: function(attr) {
            var vals = this.pluck(attr);
            return _.max(vals) === _.min(vals);
        },

        // Return the value of named attribute IF it's the same for all panels, otherwise undefined
        getIfEqual: function(attr) {
            var vals = this.pluck(attr);
            if (_.max(vals) === _.min(vals)) {
                return _.max(vals);
            }
        },

        getDeltaTIfEqual: function() {
            var vals = this.map(function(m){ return m.getDeltaT() });
            if (_.max(vals) === _.min(vals)) {
                return _.max(vals);
            }
        },

        createLabelsFromTags: function(options) {
            // Loads Tags for selected images and creates labels
            var image_ids = this.map(function(s){return s.get('imageId')})
            image_ids = "image=" + image_ids.join("&image=");
            // TODO: Use /api/ when annotations is supported
            var url = WEBINDEX_URL + "api/annotations/?type=tag&limit=1000&" + image_ids;
            $.getJSON(url, function(data){
                // Map {iid: {id: 'tag'}, {id: 'names'}}
                var imageTags = data.annotations.reduce(function(prev, t){
                    var iid = t.link.parent.id;
                    if (!prev[iid]) {
                        prev[iid] = {};
                    }
                    prev[iid][t.id] = t.textValue;
                    return prev;
                }, {});
                // Apply tags to panels
                this.forEach(function(p){
                    var iid = p.get('imageId');
                    var labels = _.values(imageTags[iid]).map(function(text){
                        return {
                            'text': text,
                            'size': options.size,
                            'position': options.position,
                            'color': options.color
                        }
                    });

                    p.add_labels(labels);
                });
            }.bind(this));
        }

        // localStorage: new Backbone.LocalStorage("figureShop-backbone")
    });
