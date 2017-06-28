
// Events, show/hide and rendering for various Modal dialogs.

    var DpiModalView = Backbone.View.extend({

        el: $("#dpiModal"),

        model: FigureModel,

        events: {
            "submit .dpiModalForm": "handleDpiForm",
        },

        handleDpiForm: function(event) {
            event.preventDefault();

            var dpiVal = $(".export_dpi", this.el).val(),
                dpi = parseInt(dpiVal, 10),
                sel = this.model.getSelected();

            // if we have a valid number...
            if (dpi == dpiVal) {

                sel.forEach(function(p) {
                    p.save("export_dpi", dpi);
                });
                $("#dpiModal").modal('hide');
            }
            return false;
        }

    });

    var PaperSetupModalView = Backbone.View.extend({

        el: $("#paperSetupModal"),

        template: JST["src/templates/modal_dialogs/paper_setup_modal_template.html"],

        model:FigureModel,

        events: {
            "submit .paperSetupForm": "handlePaperSetup",
            "change .paperSizeSelect": "rerender",
            // "keyup #dpi": "rerenderDb",
            "change input": "rerender",
            "click .pageColor": "handlePaperColor",
        },

        handlePaperColor: function(event) {
            event.preventDefault();

            var page_color = $(event.target).val();
            FigureColorPicker.show({
                'color': page_color,
                'pickedColors': ['#000000', '#ffffff', '#eeeeee'],
                'success': function(newColor){
                    // simply update <input>
                    $('.pageColor', this.$el).val(newColor);
                }.bind(this)
            });

            return false;
        },

        initialize: function(options) {

            var self = this;
            $("#paperSetupModal").bind("show.bs.modal", function(){
                self.render();
            });
            // don't update while typing
            // this.rerenderDb = _.debounce(this.rerender, 1000);
        },

        processForm: function() {

            // On form submit, need to work out paper width & height
            var $form = $('form', this.$el),
                dpi = 72,
                pageCount = $('.pageCountSelect', $form).val(),
                size = $('.paperSizeSelect', $form).val(),
                orientation = $form.find('input[name="pageOrientation"]:checked').val(),
                custom_w = parseInt($("#paperWidth").val(), 10),
                custom_h = parseInt($("#paperHeight").val(), 10),
                units = $('.wh_units:first', $form).text(),
                pageColor = $('.pageColor', $form).val().replace('#', '');

            var w_mm, h_m, w_pixels, h_pixels;
            if (size == 'A4') {
                w_mm = 210;
                h_mm = 297;
            } else if (size == 'A3') {
                w_mm = 297;
                h_mm = 420;
            } else if (size == 'A2') {
                w_mm = 420;
                h_mm = 594;
            } else if (size == 'A1') {
                w_mm = 594;
                h_mm = 841;
            } else if (size == 'A0') {
                w_mm = 841;
                h_mm = 1189;
            } else if (size == 'letter') {
                w_mm = 216;
                h_mm = 280;
            } else { // if ($.trim(units) == 'mm') {
                // get dims from custom fields and units
                w_mm = custom_w;
                h_mm = custom_h;
            }
            if (w_mm && h_mm) {
                // convert mm -> pixels (inch is 25.4 mm)
                w_pixels = Math.round(dpi * w_mm / 25.4);
                h_pixels = Math.round(dpi * h_mm / 25.4);
            } // else {
            //     w_pixels = custom_w;
            //     h_pixels = custom_h;
            //     w_mm = Math.round(w_pixels * 25.4 / dpi);
            //     h_mm = Math.round(h_pixels * 25.4 / dpi);
            // }

            if (orientation == 'horizontal' && size != 'mm') {
                var tmp = w_mm; w_mm = h_mm; h_mm = tmp;
                tmp = w_pixels; w_pixels = h_pixels; h_pixels = tmp;
            }

            var cols = pageCount;
            if (pageCount > 3) {
                cols = Math.ceil(pageCount/2);
            }

            var rv = {
                // 'dpi': dpi,
                'page_size': size,
                'orientation': orientation,
                'width_mm': w_mm,
                'height_mm': h_mm,
                'paper_width': w_pixels,
                'paper_height': h_pixels,
                'page_count': pageCount,
                'page_col_count': cols,
                'page_color': pageColor,
            };
            return rv;
        },

        handlePaperSetup: function(event) {
            event.preventDefault();
            var json = this.processForm();

            this.model.set(json);
            $("#paperSetupModal").modal('hide');
        },

        rerender: function() {
            var json = this.processForm();
            this.render(json);
        },

        render: function(json) {
            json = json || this.model.toJSON();
            // if we're not manually setting mm or pixels, disable
            json.wh_disabled = (json.page_size != 'mm');
            // json.units = json.page_size == 'mm' ? 'mm' : 'pixels';
            // if (json.page_size == "mm") {
            //     json.paper_width = json.width_mm;
            //     json.paper_height = json.height_mm;
            // }

            this.$el.find(".modal-body").html(this.template(json));
        },
    });


    var SetIdModalView = Backbone.View.extend({

        el: $("#setIdModal"),

        template: JST["src/templates/modal_dialogs/preview_Id_change_template.html"],

        model:FigureModel,

        events: {
            "submit .addIdForm": "previewSetId",
            "click .preview": "previewSetId",
            "keyup .imgId": "keyPressed",
            "click .doSetId": "doSetId",
        },

        initialize: function(options) {

            var self = this;

            // when dialog is shown, clear and render
            $("#setIdModal").bind("show.bs.modal", function(){
                delete self.newImg;
                self.render();
            });
        },

        // Only enable submit button when input has a number in it
        keyPressed: function() {
            var idInput = $('input.imgId', this.$el).val(),
                previewBtn = $('button.preview', this.$el),
                re = /^\d+$/;
            if (re.test(idInput)) {
                previewBtn.removeAttr("disabled");
            } else {
                previewBtn.attr("disabled", "disabled");
            }
        },

        // handle adding Images to figure
        previewSetId: function(event) {
            event.preventDefault();

            var self = this,
                idInput = $('input.imgId', this.$el).val();

            // get image Data
            $.getJSON(BASE_WEBFIGURE_URL + 'imgData/' + parseInt(idInput, 10) + '/', function(data){

                // Don't allow BIG images
                if (data.size.width * data.size.height > 5000 * 5000) {
                    alert("Image '" + data.meta.imageName + "' is too big for OMERO.figure");
                    return;
                }

                // just pick what we need
                var newImg = {
                    'imageId': data.id,
                    'name': data.meta.imageName,
                    // 'width': data.size.width,
                    // 'height': data.size.height,
                    'sizeZ': data.size.z,
                    'theZ': data.rdefs.defaultZ,
                    'sizeT': data.size.t,
                    // 'theT': data.rdefs.defaultT,
                    'channels': data.channels,
                    'orig_width': data.size.width,
                    'orig_height': data.size.height,
                    // 'x': px,
                    // 'y': py,
                    'datasetName': data.meta.datasetName,
                    'pixel_size_x': data.pixel_size.valueX,
                    'pixel_size_y': data.pixel_size.valueY,
                    'pixel_size_x_unit': data.pixel_size.unitX,
                    'pixel_size_x_symbol': data.pixel_size.symbolX,
                    'deltaT': data.deltaT,
                };
                self.newImg = newImg;
                self.render();
            }).fail(function(event) {
                alert("Image ID: " + idInput +
                    " could not be found on the server, or you don't have permission to access it");
            });
        },

        doSetId: function() {

            var self = this,
                sel = this.model.getSelected();

            if (!self.newImg)   return;

            sel.forEach(function(p) {
                p.setId(self.newImg);
            });

        },

        render: function() {

            var sel = this.model.getSelected(),
                selImg,
                json = {};

            if (sel.length < 1) {
                self.selectedImage = null;
                return; // shouldn't happen
            }
            selImg = sel.head();
            json.selImg = selImg.toJSON();
            json.newImg = {};
            json.comp = {};
            json.messages = [];

            json.ok = function(match, match2) {
                if (typeof match == 'undefined') return "-";
                if (typeof match2 != 'undefined') {
                    match = match && match2;
                }
                var m = match ? "ok" : "flag";
                var rv = "<span class='glyphicon glyphicon-" + m + "'></span>";
                return rv;
            };

            // thumbnail
            json.selThumbSrc = WEBGATEWAYINDEX + "render_thumbnail/" + json.selImg.imageId + "/";

            // minor attributes ('info' only)
            var attrs = ["sizeZ", "orig_width", "orig_height"],
                attrName = ['Z size', 'Width', 'Height'];

            if (this.newImg) {
                json.newImg = this.newImg;
                // compare attrs above
                _.each(attrs, function(a, i) {
                    if (json.selImg[a] == json.newImg[a]) {
                        json.comp[a] = true;
                    } else {
                        json.comp[a] = false;
                        json.messages.push({"text":"Mismatch of " + attrName[i] + ": should be OK.",
                            "status": "success"});   // status correspond to css alert class.
                    }
                });
                // special message for sizeT
                if (json.selImg.sizeT != json.newImg.sizeT) {
                    // check if any existing images have theT > new.sizeT
                    var tooSmallT = false;
                    sel.forEach(function(o){
                        if (o.get('theT') > json.newImg.sizeT) tooSmallT = true;
                    });
                    if (tooSmallT) {
                        json.messages.push({"text": "New Image has fewer Timepoints than needed. Check after update.",
                            "status": "danger"});
                    } else {
                        json.messages.push({"text":"Mismatch of Timepoints: should be OK.",
                            "status": "success"});
                    }
                    json.comp.sizeT = false;
                } else {
                    json.comp.sizeT = true;
                }
                // compare channels
                json.comp.channels = json.ok(true);
                var selC = json.selImg.channels,
                    newC = json.newImg.channels,
                    cCount = selC.length;
                if (cCount != newC.length) {
                    json.comp.channels = json.ok(false);
                    json.messages.push({"text":"New Image has " + newC.length + " channels " +
                        "instead of " + cCount + ". Check after update.",
                            "status": "danger"});
                } else {
                    for (var i=0; i<cCount; i++) {
                        if (selC[i].label != newC[i].label) {
                            json.comp.channels = json.ok(false);
                            json.messages.push({"text": "Channel Names mismatch: should be OK.",
                                "status": "success"});
                            break;
                        }
                    }
                }

                // thumbnail
                json.newThumbSrc = WEBGATEWAYINDEX + "render_thumbnail/" + json.newImg.imageId + "/";

                $(".doSetId", this.$el).removeAttr('disabled');
            } else {
                $(".doSetId", this.$el).attr('disabled', 'disabled');
            }

            $(".previewIdChange", this.$el).html(this.template(json));
        }
    });


    var AddImagesModalView = Backbone.View.extend({

        el: $("#addImagesModal"),

        model:FigureModel,

        events: {
            "submit .addImagesForm": "addImages",
            "click .btn-primary": "addImages",
            "keyup .imgIds": "keyPressed",
            "paste .imgIds": "keyPressed",
        },

        initialize: function(options) {
            this.figureView = options.figureView;   // need this for .getCentre()

            var self = this;
            // when the modal dialog is shown, focus the input
            $("#addImagesModal").bind("focus",
                function() {
                    setTimeout(function(){
                        $('input.imgIds', self.$el).focus();
                    },20);
                });
        },

        // Only enable submit button when input has a number in it
        keyPressed: function(event) {
            var idInput = $('input.imgIds', this.$el).val(),
                submitBtn = $('button.btn-primary', this.$el),
                re = /\d.*/;
            // Strangely if 'paste' event, value is not immediately set
            // Try again after short timeout...
            if (event && event.type === "paste") {
                setTimeout(this.keyPressed, 50);
                return;
            }
            if (re.test(idInput)) {
                submitBtn.removeAttr("disabled");
            } else {
                submitBtn.attr("disabled", "disabled");
            }
        },

        // handle adding Images to figure
        addImages: function() {

            var self = this,
                iIds;

            var $input = $('input.imgIds', this.$el),
                submitBtn = $('button.btn-primary', this.$el),
                idInput = $input.val();

            $input.val("");
            submitBtn.attr("disabled", "disabled");

            if (!idInput || idInput.length === 0)    return;

            // test for E.g: http://localhost:8000/webclient/?show=image-25|image-26|image-27
            if (idInput.indexOf('?') > 10) {
                iIds = idInput.split('image-').slice(1);
            } else if (idInput.indexOf('img_detail') > 0) {
                // url of image viewer...
                this.importFromRemote(idInput);
                return;
            } else {
                iIds = idInput.split(',');
            }

            this.model.addImages(iIds);
        },

        importFromRemote: function(img_detail_url) {
            var iid = parseInt(img_detail_url.split('img_detail/')[1], 10),
                baseUrl = img_detail_url.split('/img_detail')[0],
                // http://jcb-dataviewer.rupress.org/jcb/imgData/25069/
                imgDataUrl = baseUrl + '/imgData/' + iid + "/";

            var colCount = 1,
                rowCount = 1,
                paper_width = this.model.get('paper_width'),
                c = this.figureView.getCentre(),
                col = 0,
                row = 0,
                px, py, spacer, scale,
                coords = {'px': px,
                          'py': py,
                          'c': c,
                          'spacer': spacer,
                          'colCount': colCount,
                          'rowCount': rowCount,
                          'col': col,
                          'row': row,
                          'paper_width': paper_width};

            this.model.importImage(imgDataUrl, coords, baseUrl);
        },
    });
