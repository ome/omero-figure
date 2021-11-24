
const FONT_IN_PT = 2.83465;

const FigureExport = FigureModel.extend({

    exportPdf: function (progressCallback) {

        this.doc = new jspdf.jsPDF({
            format: [this.get("paper_width"), this.get("paper_height")]
        });

        const panelCount = this.panels.length;

        this.panels.forEach((panel, index) => {

            let imgSrc = panel.get_img_src(true, true);

            let x = panel.get('x');
            let y = panel.get('y');
            let width = panel.get('width');
            let height = panel.get('height');

            this.doc.addImage(imgSrc, "JPEG", x, y, width, height);

            this.drawShapes(panel);
            this.drawLabels(panel);
            this.drawScalebar(panel);

            if (progressCallback) {
                progressCallback(100 * (index + 1)/panelCount);
            }
        });

        return this.doc.output('datauristring');
    },

    getLabelText: function (label, panel) {
        if (!('text' in label)) {
            let the_t = panel.get('theT');
            let timestamps = panel.get('deltaT')
            if (label.time == "index") {
                return "" + (the_t + 1);
            } else if (timestamps && panel.get('theT') < timestamps.length) {
                return panel.get_time_label_text(label.time);
            }
        }
        return label.text;
    },

    drawLabels: function (panel, page) {
        // Add the panel labels to the page.
        // Here we calculate the position of labels but delegate
        // to self.draw_text() to actually place the labels on PDF / TIFF
        let labels = panel.get('labels')

        let x = panel.get('x');
        let y = panel.get('y');
        let width = panel.get('width');
        let height = panel.get('height');

        // Handle page offsets
        // x = x - page['x']
        // y = y - page['y']

        let spacer = 5;

        // group by 'position':
        let positions = {
            'top': [], 'bottom': [], 'left': [],
            'leftvert': [], 'right': [],
            'topleft': [], 'topright': [],
            'bottomleft': [], 'bottomright': []
        }

        labels.forEach(l => {

            let labelText = this.getLabelText(l, panel);
            if (!labelText) return;

            l.text = labelText;
            let pos = l['position'];
            l['size'] = parseInt(l['size'])   // make sure 'size' is number
            if (Object.keys(positions).includes(pos)) {
                positions[pos].push(l);
            }
        });

        for (const [key, labels] of Object.entries(positions)) {

            if (key == 'topleft') {
                let lx = x + spacer;
                let ly = y + spacer;
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, { baseline: "hanging" })
                    ly += label_h + 7;
                });
            } else if(key == 'topright') {
                let lx = x + width - spacer;
                let ly = y + spacer;
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, { baseline: "hanging", align: "right" })
                    ly += label_h + 7;
                });
            } else if (key == 'bottomright') {
                let lx = x + width - spacer;
                let ly = y + height - spacer;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, { align: "right" })
                    ly -= label_h + 7;
                });
            } else if (key == 'bottomleft') {
                let lx = x + spacer;
                let ly = y + height - spacer;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, {})
                    ly -= label_h + 7;
                });
            } else if (key == 'top') {
                let lx = x + (width / 2);
                let ly = y - spacer - 2;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, { align: "center" });
                    ly -= (label_h + spacer);
                });
            } else if (key == 'left') {
                let lx = x - spacer;
                let total_h = labels.reduce((height, label) => height + label.size, 0);
                total_h += spacer * (labels.length - 1);
                let ly = y + (height - total_h) / 2;
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, { align: "right", baseline: "hanging" });
                    ly += label_h + spacer;
                });
            } else if (key == 'right') {
                let lx = x + width + spacer;
                let total_h = labels.reduce((height, label) => height + label.size, 0);
                total_h += spacer * (labels.length - 1);
                let ly = y + (height - total_h) / 2;
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, { baseline: "hanging" });
                    ly += label_h + spacer;
                });
            } else if (key == "leftvert") {
                let lx = x - 10;
                let ly = y + (height / 2);
                labels.reverse();
                labels.forEach(l => {
                    let text_half_width = this.getTextDimensions(l.text, l.size).w / 2;
                    label_h = this.drawText(l, lx, ly + text_half_width, { align: "left", angle: 90 },);
                    lx -= (label_h + spacer);
                });
            } else if (key == "bottom") {
                let lx = x + (width / 2);
                let ly = y + height + spacer;
                labels.forEach(l => {
                    label_h = this.drawText(l, lx, ly, { align: "center", baseline: "hanging" });
                    ly += (label_h + spacer);
                });
            }
        }
    },

    drawText: function(label, lx, ly, options = {}) {

        // If page is black and label is black, make label white
        let page_color = this.get('page_color', 'ffffff').toLowerCase();
        let color = label.color.toLowerCase();
        let label_on_page = ['left', 'right', 'top', 'bottom', 'leftvert'].includes(label.position);
        if (label_on_page) {
            if (color == '000000' && page_color == '000000') {
                color = 'ffffff';
            } else if (color == 'ffffff' && page_color == 'ffffff') {
                color = '000000'
            }
        }

        let {red, green, blue} = this.colorHexToRgb(color);

        this.doc.setTextColor(red, green, blue);
        this.doc.setFontSize(parseInt(label.size * FONT_IN_PT));
        this.doc.text(label.text, lx, ly, options);
        return label.size
    },

    colorHexToRgb: function(color) {
        if (color[0] == "#") {
            color = color.slice(1);
        }
        let red = parseInt(color[0] + color[1], 16);
        let green = parseInt(color[2] + color[3], 16);
        let blue = parseInt(color[4] + color[5], 16);
        return {red, green, blue}
    },

    getTextDimensions: function(text, fontSize) {
        // We don't need a cell, but it gives us getTextDimensions()
        if (!this.cell) {
            this.cell = this.doc.cell(0, 0, 1, 1, "");
        }
        this.doc.setFontSize(parseInt(fontSize * FONT_IN_PT));     // so that we get right dimensions
        return this.cell.getTextDimensions(text);
    },

    drawScalebar: function(panel, page) {
        // Add the scalebar to the page.
        let x = panel.get('x');
        let y = panel.get('y');
        let width = panel.get('width');
        let height = panel.get('height');
        let pixel_size_x = panel.get('pixel_size_x');

        // Handle page offsets
        // x = x - page['x']
        // y = y - page['y']
        const scalebar = panel.get('scalebar');
        if (!scalebar || !scalebar.show) return;

        if (!pixel_size_x || pixel_size_x <= 0){
            console.log("Can't show scalebar - pixel_size_x is not defined for panel");
            return;
        }

        let spacer = 0.05 * Math.max(height, width);

        let color = scalebar.color;
        let red = parseInt(color[0] + color[1], 16);
        let green = parseInt(color[2] + color[3], 16);
        let blue = parseInt(color[4] + color[5], 16);

        let position = scalebar.position || 'bottomright';
        // let align = 'left';
        let lx, ly;

        let sbLength = panel.get_scalebar_display_length();
        const SB_THICKNESS = 3;
        let sb_half = SB_THICKNESS / 2;

        if (position == 'topleft'){
            lx = x + spacer
            ly = y + spacer + sb_half;
        } else if (position == 'topright'){
            lx = x + width - sbLength - spacer
            ly = y + spacer + sb_half
        } else if (position == 'bottomleft') {
            lx = x + spacer
            ly = y + height - spacer - sb_half
        } else if (position == 'bottomright') {
            lx = x + width - sbLength - spacer
            ly = y + height - spacer - sb_half
        }

        this.doc.setDrawColor(red, green, blue);
        this.doc.setLineWidth(SB_THICKNESS);
        this.doc.line(lx, ly, lx + sbLength, ly);

        if (scalebar.show_label) {
            let units = scalebar.units;
            let symbol = "µm";
            if (panel.pixel_size_x_symbol) {
                symbol = panel.pixel_size_x_symbol;
            }
            if (LENGTH_UNITS[units]) {
                symbol = LENGTH_UNITS[units].symbol;
            }
            label = `${scalebar.length} ${symbol}`;
            font_size = 10
            f_size = parseInt(scalebar.font_size)
            if (!isNaN(f_size)) {
                font_size = f_size;
            }

            let options = { align: "center" }
            // For 'bottom' scalebar, put label above
            if (position.includes("bottom")) {
                ly = ly - 5 - SB_THICKNESS;
            } else {
                ly = ly + 5;
                options.baseline = "hanging";
            }
            lx += (sbLength/2);

            this.drawText({ text: label, size: font_size, color: scalebar.color}, lx, ly, options)
        }
    },

    drawShapes: function(panel) {

        const shapes = panel.get("shapes");
        if (!shapes) {
            return;
        }

        shapes.forEach(shape => {
            // convert shape coordinates (relative to Image) to page coordinates

            if (shape.type == "Line") {
                let start = this.panel_to_page_coords(panel, shape.x1, shape.y1);
                let end = this.panel_to_page_coords(panel, shape.x2, shape.y2);

                let { red, green, blue } = this.colorHexToRgb(shape.strokeColor);
                this.doc.setDrawColor(red, green, blue);
                this.doc.setLineWidth(shape.strokeWidth || 2);
                this.doc.line(start.x, start.y, end.x, end.y);
            } else if (shape.type == "Arrow") {
                console.log("shape", shape);
                this.drawArrow(panel, shape);
            }
        });
    },

    drawArrow: function(panel, shape) {
        let start = this.panel_to_page_coords(panel, shape.x1, shape.y1);
        let end = this.panel_to_page_coords(panel, shape.x2, shape.y2);
        let x1 = start.x;
        let y1 = start.y;
        let x2 = end.x;
        let y2 = end.y;

        var headSize = (shape.strokeWidth * 4) + 5,
            dx = x2 - x1,
            dy = y2 - y1;

        var lineAngle = Math.atan(dx / dy);
        var f = (dy < 0 ? 1 : -1);

        // Angle of arrow head is 0.8 radians (0.4 either side of lineAngle)
        var arrowPoint1x = x2 + (f * Math.sin(lineAngle - 0.4) * headSize),
            arrowPoint1y = y2 + (f * Math.cos(lineAngle - 0.4) * headSize),
            arrowPoint2x = x2 + (f * Math.sin(lineAngle + 0.4) * headSize),
            arrowPoint2y = y2 + (f * Math.cos(lineAngle + 0.4) * headSize),
            arrowPointMidx = x2 + (f * Math.sin(lineAngle) * headSize * 0.5),
            arrowPointMidy = y2 + (f * Math.cos(lineAngle) * headSize * 0.5);

        // Fill triangle ('F')
        let { red, green, blue } = this.colorHexToRgb(shape.strokeColor);
        this.doc.setFillColor(red, green, blue);
        this.doc.triangle(arrowPoint1x, arrowPoint1y, x2, y2, arrowPoint2x, arrowPoint2y, 'F')

        // draw arrow line
        this.doc.setDrawColor(red, green, blue);
        this.doc.setLineWidth(shape.strokeWidth);
        this.doc.line(start.x, start.y, arrowPointMidx, arrowPointMidy);
    },

    drawPath: function(points) {
        // An array of { op: operator, c: coordinates } object, where op is one of "m"(move to), "l"(line to) "c"(cubic bezier curve) and "h"(close(sub)path)).c is an array of coordinates. "m" and "l" expect two, "c" six and "h" an empty array(or undefined).
        

        this.doc.path(moves);
    },

    panel_to_page_coords: function(panel, shape_x, shape_y) {
        // Convert coordinate from the image onto the PDF page.
        // Handles zoom, offset & rotation of panel, rotating the
        // x, y point around the centre of the cropped region
        // and scaling appropriately.
        // Also includes 'inPanel' key - True if point within
        // the cropped panel region

        let crop = panel.getViewportAsRect();

        console.log("crop", crop);

        rotation = panel.get('rotation')
        // if rotation != 0:
        //     # img coords: centre of rotation
        //     cx = self.crop['x'] + (self.crop['width'] / 2)
        //     cy = self.crop['y'] + (self.crop['height'] / 2)
        //     dx = cx - shape_x
        //     dy = cy - shape_y
        //     # distance of point from centre of rotation
        //     h = sqrt(dx * dx + dy * dy)
        //     # and the angle
        //     angle1 = atan2(dx, dy)

        //     # Add the rotation to the angle and calculate new
        //     # opposite and adjacent lengths from centre of rotation
        //     angle2 = angle1 - radians(rotation)
        //     newo = sin(angle2) * h
        //     newa = cos(angle2) * h
        //     # to give correct x and y within cropped panel
        //     shape_x = cx - newo
        //     shape_y = cy - newa

        // convert to coords within crop region
        fraction_x = (shape_x - crop.x) / crop.width;
        fraction_y = (shape_y - crop.y) / crop.height;

        console.log("fraction_x", fraction_x);
        console.log("fraction_y", fraction_y);

        // check if points are within panel
        in_panel = true;
        if (fraction_x < 0 || fraction_x > 1) {
            in_panel = false;
        }
        if (fraction_y < 0 || fraction_y > 1) {
            in_panel = false;
        }
        // Handle page offsets
        // x = self.panel['x'] - self.page['x']
        // y = self.panel['y'] - self.page['y']
        // scale and position on page within panel
        page_x = (panel.get("width") * fraction_x) + panel.get("x");
        page_y = (panel.get("height") * fraction_y) + panel.get("y");
        return { 'x': page_x, 'y': page_y, 'inPanel': in_panel }
    }

});
