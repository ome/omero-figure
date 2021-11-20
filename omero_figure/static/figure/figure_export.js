
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
            // If page is black and label is black, make label white
            let page_color = this.get('page_color', 'ffffff').toLowerCase();
            let label_color = l['color'].toLowerCase();
            let label_on_page = ['left', 'right', 'top', 'bottom', 'leftvert'].includes(pos);
            if (label_on_page) {
                if (label_color == '000000' && page_color == '000000') {
                    l['color'] = 'ffffff';
                }
                if (label_color == 'ffffff' && page_color == 'ffffff') {
                    l['color'] = '000000'
                }
            }
            if (Object.keys(positions).includes(pos)) {
                positions[pos].push(l);
            }
        });

        let doc = this.doc;
        console.log('positions', positions);

        function draw_lab(label, lx, ly, options = {}) {
            label_h = label['size']
            color = label['color']
            red = parseInt(color[0] + color[1], 16)
            green = parseInt(color[2] + color[3], 16)
            blue = parseInt(color[4] + color[5], 16)
            fontsize = label['size']

            doc.setTextColor(red, green, blue)
            text = label['text']

            console.log("draw_lab", text, fontsize, { red, green, blue }, lx, ly)
            doc.setFontSize(parseInt(fontsize * FONT_IN_PT));
            doc.text(text, lx, ly, options);
            // self.draw_text(text, lx, ly, fontsize, rgb, align = align)
            return label_h
        }

        for (const [key, labels] of Object.entries(positions)) {
            // console.log(key, labels);

            if (key == 'topleft') {
                let lx = x + spacer;
                let ly = y + spacer;

                labels.forEach(function (l) {
                    label_h = draw_lab(l, lx, ly, { baseline: "hanging" })
                    ly += label_h + 7;
                });
            } else if (key == 'top') {
                let lx = x + (width / 2);
                let ly = y - spacer - 2;

                labels.reverse();
                labels.forEach(function (l) {
                    label_h = draw_lab(l, lx, ly, { align: "center" });
                    ly -= (label_h + spacer);
                });
            } else if (key == 'left') {
                let lx = x - spacer;
                spacer = 5;
                let total_h = labels.reduce((height, label) => height + label.size, 0);
                total_h += spacer * (labels.length - 1);
                let ly = y + (height - total_h) / 2;
                labels.forEach(function (l) {
                    label_h = draw_lab(l, lx, ly, { align: "right", baseline: "hanging" });
                    ly += label_h + spacer;
                });
            } else if (key == "leftvert") {
                let lx = x - spacer;
                let ly = y + (height / 2);

                // We don't need a cell, but it gives us getTextDimensions()
                let cell = doc.cell(0, 0, 1, 1, "");

                labels.reverse();
                labels.forEach(function (l) {
                    doc.setFontSize(parseInt(l.size * FONT_IN_PT));     // so that we get right dimensions
                    let text_half_width = cell.getTextDimensions(l.text).w / 2;
                    label_h = draw_lab(l, lx, ly + text_half_width, { align: "left", angle: 90 },);
                    lx -= (label_h + spacer);
                });
            }
        }
    }

});
