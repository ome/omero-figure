
const FONT_IN_PT = 2.83465;

const FigureExport = FigureModel.extend({

    exportPdf: function () {

        console.log("exportPdf", this.panels.length);

        console.log(this.get("paper_width"));
        this.doc = new jspdf.jsPDF({
            format: [this.get("paper_width"), this.get("paper_height")]
        });

        // doc.setFontSize(40);
        // doc.text("Octonyan loves jsPDF", 35, 25);

        // doc.text("test...", 10, 10);

        this.panels.forEach(panel => {

            let imgSrc = panel.get_img_src(true, true);

            let x = panel.get('x');
            let y = panel.get('y');
            let width = panel.get('width');
            let height = panel.get('height');

            this.doc.addImage(imgSrc, "JPEG", x, y, width, height);

            this.drawLabels(panel);

            this.drawScalebar(panel);
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
                    label_h = this.drawLab(l, lx, ly, { baseline: "hanging" })
                    ly += label_h + 7;
                });
            } else if(key == 'topright') {
                let lx = x + width - spacer;
                let ly = y + spacer;
                labels.forEach(l => {
                    label_h = this.drawLab(l, lx, ly, { baseline: "hanging", align: "right" })
                    ly += label_h + 7;
                });
            } else if (key == 'bottomright') {
                let lx = x + width - spacer;
                let ly = y + height - spacer;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.drawLab(l, lx, ly, { align: "right" })
                    ly -= label_h + 7;
                });
            } else if (key == 'bottomleft') {
                let lx = x + spacer;
                let ly = y + height - spacer;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.drawLab(l, lx, ly, {})
                    ly -= label_h + 7;
                });
            } else if (key == 'top') {
                let lx = x + (width / 2);
                let ly = y - spacer - 2;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.drawLab(l, lx, ly, { align: "center" });
                    ly -= (label_h + spacer);
                });
            } else if (key == 'left') {
                let lx = x - spacer;
                let total_h = labels.reduce((height, label) => height + label.size, 0);
                total_h += spacer * (labels.length - 1);
                let ly = y + (height - total_h) / 2;
                labels.forEach(l => {
                    label_h = this.drawLab(l, lx, ly, { align: "right", baseline: "hanging" });
                    ly += label_h + spacer;
                });
            } else if (key == 'right') {
                let lx = x + width + spacer;
                let total_h = labels.reduce((height, label) => height + label.size, 0);
                total_h += spacer * (labels.length - 1);
                let ly = y + (height - total_h) / 2;
                labels.forEach(l => {
                    label_h = this.drawLab(l, lx, ly, { baseline: "hanging" });
                    ly += label_h + spacer;
                });
            } else if (key == "leftvert") {
                let lx = x - 10;
                let ly = y + (height / 2);
                labels.reverse();
                labels.forEach(l => {
                    let text_half_width = this.getTextDimensions(l.text, l.size).w / 2;
                    label_h = this.drawLab(l, lx, ly + text_half_width, { align: "left", angle: 90 },);
                    lx -= (label_h + spacer);
                });
            } else if (key == "bottom") {
                let lx = x + (width / 2);
                let ly = y + height + spacer;
                labels.forEach(l => {
                    label_h = this.drawLab(l, lx, ly, { align: "center", baseline: "hanging" });
                    ly += (label_h + spacer);
                });
            }
        }
    },

    drawLab: function(label, lx, ly, options = {}) {

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

        let red = parseInt(color[0] + color[1], 16);
        let green = parseInt(color[2] + color[3], 16);
        let blue = parseInt(color[4] + color[5], 16);

        this.doc.setTextColor(red, green, blue);
        this.doc.setFontSize(parseInt(label.size * FONT_IN_PT));
        this.doc.text(label.text, lx, ly, options);
        return label.size
    },

    getTextDimensions: function(text, fontSize) {
        // We don't need a cell, but it gives us getTextDimensions()
        if (!this.cell) {
            this.cell = this.doc.cell(0, 0, 1, 1, "");
        }
        this.doc.setFontSize(parseInt(fontSize * FONT_IN_PT));     // so that we get right dimensions
        return this.cell.getTextDimensions(text);
    },

    drawScalebar: function(panel, region_width, page) {
        // Add the scalebar to the page.
        // Here we calculate the position of scalebar but delegate
        // to self.draw_line() and self.draw_text() to actually place
        // the scalebar and label on PDF/ TIFF
        let x = panel.get('x');
        let y = panel.get('y');
        let width = panel.get('width');
        let height = panel.get('height');
        let pixel_size_x = panel.get('pixel_size_x');

        // Handle page offsets
        // x = x - page['x']
        // y = y - page['y']
        console.log("pixel_size_x", pixel_size_x)
        const scalebar = panel.get('scalebar');
        console.log("scalebar", scalebar);
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
            align = "right"
        } else if (position == 'bottomleft') {
            lx = x + spacer
            ly = y + height - spacer - sb_half
        } else if (position == 'bottomright') {
            lx = x + width - sbLength - spacer
            ly = y + height - spacer - sb_half
            align = "right"
        }

        console.log("LENGTH", sbLength);

        this.doc.setDrawColor(red, green, blue);
        this.doc.setLineWidth(SB_THICKNESS);
        this.doc.line(lx, ly, lx + sbLength, ly);

        // if 'show_label' in sb and sb['show_label']:
        // symbol = u"\u00B5m"
        // if 'pixel_size_x_symbol' in panel:
        //     symbol = panel['pixel_size_x_symbol']
        // if scalebar_unit and scalebar_unit in unit_symbols:
        // symbol = unit_symbols[scalebar_unit]['symbol']
        // label = "%s %s" % (sb['length'], symbol)
        // font_size = 10
        // try:
        // font_size = int(sb.get('font_size'))
        //             except Exception:
        // pass

        //             # For 'bottom' scalebar, put label above
        // if 'bottom' in position:
        //     ly = ly - font_size
        // else:
        // ly = ly + 5

        // self.draw_text(
        //     label, (lx + lx_end) / 2, ly, font_size, (red, green, blue),
        //     align = "center")

    }
});
