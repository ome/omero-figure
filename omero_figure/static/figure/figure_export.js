
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

            this.draw_labels(panel);
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

    draw_labels: function (panel, page) {
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
                    label_h = this.draw_lab(l, lx, ly, { baseline: "hanging" })
                    ly += label_h + 7;
                });
            } else if(key == 'topright') {
                let lx = x + width - spacer;
                let ly = y + spacer;
                labels.forEach(l => {
                    label_h = this.draw_lab(l, lx, ly, { baseline: "hanging", align: "right" })
                    ly += label_h + 7;
                });
            } else if (key == 'bottomright') {
                let lx = x + width - spacer;
                let ly = y + height - spacer;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.draw_lab(l, lx, ly, { align: "right" })
                    ly -= label_h + 7;
                });
            } else if (key == 'bottomleft') {
                let lx = x + spacer;
                let ly = y + height - spacer;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.draw_lab(l, lx, ly, {})
                    ly -= label_h + 7;
                });
            } else if (key == 'top') {
                let lx = x + (width / 2);
                let ly = y - spacer - 2;
                labels.reverse();
                labels.forEach(l => {
                    label_h = this.draw_lab(l, lx, ly, { align: "center" });
                    ly -= (label_h + spacer);
                });
            } else if (key == 'left') {
                let lx = x - spacer;
                let total_h = labels.reduce((height, label) => height + label.size, 0);
                total_h += spacer * (labels.length - 1);
                let ly = y + (height - total_h) / 2;
                labels.forEach(l => {
                    label_h = this.draw_lab(l, lx, ly, { align: "right", baseline: "hanging" });
                    ly += label_h + spacer;
                });
            } else if (key == 'right') {
                let lx = x + width + spacer;
                let total_h = labels.reduce((height, label) => height + label.size, 0);
                total_h += spacer * (labels.length - 1);
                let ly = y + (height - total_h) / 2;
                labels.forEach(l => {
                    label_h = this.draw_lab(l, lx, ly, { baseline: "hanging" });
                    ly += label_h + spacer;
                });
            } else if (key == "leftvert") {
                let lx = x - 10;
                let ly = y + (height / 2);
                labels.reverse();
                labels.forEach(l => {
                    let text_half_width = this.getTextDimensions(l.text, l.size).w / 2;
                    label_h = this.draw_lab(l, lx, ly + text_half_width, { align: "left", angle: 90 },);
                    lx -= (label_h + spacer);
                });
            } else if (key == "bottom") {
                let lx = x + (width / 2);
                let ly = y + height + spacer;
                labels.forEach(l => {
                    label_h = this.draw_lab(l, lx, ly, { align: "center", baseline: "hanging" });
                    ly += (label_h + spacer);
                });
            }
        }
    },

    draw_lab: function(label, lx, ly, options = {}) {

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

        label_h = label['size']
        red = parseInt(color[0] + color[1], 16)
        green = parseInt(color[2] + color[3], 16)
        blue = parseInt(color[4] + color[5], 16)
        fontsize = label['size']

        this.doc.setTextColor(red, green, blue)
        text = label['text']

        this.doc.setFontSize(parseInt(fontsize * FONT_IN_PT));
        this.doc.text(text, lx, ly, options);
        // self.draw_text(text, lx, ly, fontsize, rgb, align = align)
        return label_h
    },

    getTextDimensions: function(text, fontSize) {
        // We don't need a cell, but it gives us getTextDimensions()
        if (!this.cell) {
            this.cell = this.doc.cell(0, 0, 1, 1, "");
        }
        this.doc.setFontSize(parseInt(fontSize * FONT_IN_PT));     // so that we get right dimensions
        return this.cell.getTextDimensions(text);
    }

});
