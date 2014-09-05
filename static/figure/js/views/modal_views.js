
// Events, show/hide and rendering for various Modal dialogs.

    var PaperSetupModalView = Backbone.View.extend({

        el: $("#paperSetupModal"),

        template: JST["static/figure/templates/paper_setup_modal_template.html"],

        model:FigureModel,

        events: {
            "submit .paperSetupForm": "handlePaperSetup",
            "change .paperSizeSelect": "rerender",
            // "keyup #dpi": "rerenderDb",
            "change input": "rerender",
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
                size = $('.paperSizeSelect', $form).val(),
                orientation = $form.find('input[name="pageOrientation"]:checked').val(),
                custom_w = parseInt($("#paperWidth").val(), 10),
                custom_h = parseInt($("#paperHeight").val(), 10),
                units = $('.wh_units:first', $form).text();

            var w_mm, h_m, w_pixels, h_pixels;
            if (size == 'A4') {
                w_mm = 210;
                h_mm = 297;
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

            var rv = {
                // 'dpi': dpi,
                'page_size': size,
                'orientation': orientation,
                'width_mm': w_mm,
                'height_mm': h_mm,
                'paper_width': w_pixels,
                'paper_height': h_pixels,
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

        template: JST["static/figure/templates/preview_Id_change_template.html"],

        model:FigureModel,

        events: {
            "submit .addIdForm": "previewSetId",
            "click .preview": "previewSetId",
            "keyup .imgIds": "keyPressed",
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
            var idInput = $('input.imgIds', this.$el).val(),
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
                idInput = $('input.imgIds', this.$el).val();

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
                    'pixel_size_x': data.pixel_size.x,
                    'pixel_size_y': data.pixel_size.y,
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
                    _.each(sel, function(o){
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
        keyPressed: function() {
            var idInput = $('input.imgIds', this.$el).val(),
                submitBtn = $('button.btn-primary', this.$el),
                re = /\d.*/;
            if (re.test(idInput)) {
                submitBtn.removeAttr("disabled");
            } else {
                submitBtn.attr("disabled", "disabled");
            }
        },

        // handle adding Images to figure
        addImages: function() {

            var self = this,
                paper_width = this.model.get('paper_width'),
                iIds;

            var $input = $('input.imgIds', this.$el),
                submitBtn = $('button.btn-primary', this.$el),
                idInput = $input.val();

            $input.val("");
            submitBtn.attr("disabled", "disabled");

            if (!idInput || idInput.length === 0)    return;

            this.model.clearSelected();

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

            // approx work out number of columns to layout new panels
            var colCount = Math.ceil(Math.sqrt(iIds.length)),
                rowCount = Math.ceil(iIds.length/colCount),
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

            // This loop sets up a load of async imports.
            // The first one to return will set all the coords
            // and subsequent ones will update coords to position
            // new image panels appropriately in a grid.
            for (var i=0; i<iIds.length; i++) {
                var imgId = iIds[i],
                    imgDataUrl = BASE_WEBFIGURE_URL + 'imgData/' + parseInt(imgId, 10) + '/';
                this.importImage(imgDataUrl, coords);
            }
        },

        importFromRemote: function(img_detail_url) {
            var iid = parseInt(img_detail_url.split('img_detail/')[1], 10),
                baseUrl = img_detail_url.split('/img_detail')[0],
                // http://jcb-dataviewer.rupress.org/jcb/imgData/25069/
                imgDataUrl = baseUrl + '/imgData/' + iid;

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

            this.importImage(imgDataUrl, coords, baseUrl);

        },

        importImage: function(imgDataUrl, coords, baseUrl) {

            var self = this,
                callback,
                dataType = "json";

            if (baseUrl) {
                callback = "callback";
                dataType = "jsonp";
            }

            // Get the json data for the image...
            $.ajax({
                url: imgDataUrl,
                jsonp: callback, // 'callback'
                dataType: dataType,
                // work with the response
                success: function( data ) {

                    if (data.size.width * data.size.height > 5000 * 5000) {
                        alert("Image '" + data.meta.imageName + "' is too big for OMERO.figure");
                        return;
                    }

                    // For the FIRST IMAGE ONLY (coords.px etc undefined), we
                    // need to work out where to start (px,py) now that we know size of panel
                    // (assume all panels are same size)
                    coords.spacer = coords.spacer || data.size.width/20;
                    var full_width = (coords.colCount * (data.size.width + coords.spacer)) - coords.spacer,
                        full_height = (coords.rowCount * (data.size.height + coords.spacer)) - coords.spacer;
                    coords.scale = (coords.paper_width - (2 * coords.spacer)) / full_width;
                    coords.scale = Math.min(coords.scale, 1);    // only scale down
                    coords.px = coords.px || coords.c.x - (full_width * coords.scale)/2;
                    coords.py = coords.py || coords.c.y - (full_height * coords.scale)/2;
                    var channels = data.channels;
                    if (data.rdefs.model === "greyscale") {
                        // we don't support greyscale, but instead set active channel grey
                        _.each(channels, function(ch){
                            if (ch.active) {
                                ch.color = "FFFFFF";
                            }
                        });
                    }
                    // ****** This is the Data Model ******
                    //-------------------------------------
                    // Any changes here will create a new version
                    // of the model and will also have to be applied
                    // to the 'version_transform()' function so that
                    // older files can be brought up to date.
                    // Also check 'previewSetId()' for changes.
                    var n = {
                        'imageId': data.id,
                        'name': data.meta.imageName,
                        'width': data.size.width * coords.scale,
                        'height': data.size.height * coords.scale,
                        'sizeZ': data.size.z,
                        'theZ': data.rdefs.defaultZ,
                        'sizeT': data.size.t,
                        'theT': data.rdefs.defaultT,
                        'channels': channels,
                        'orig_width': data.size.width,
                        'orig_height': data.size.height,
                        'x': coords.px,
                        'y': coords.py,
                        'datasetName': data.meta.datasetName,
                        'datasetId': data.meta.datasetId,
                        'pixel_size_x': data.pixel_size.x,
                        'pixel_size_y': data.pixel_size.y,
                        'deltaT': data.deltaT,
                    };
                    if (baseUrl) {
                        n.baseUrl = baseUrl;
                    }
                    // create Panel (and select it)
                    self.model.panels.create(n).set('selected', true);
                    self.model.notifySelectionChange();

                    // update px, py for next panel
                    coords.col += 1;
                    coords.px += (data.size.width + coords.spacer) * coords.scale;
                    if (coords.col == coords.colCount) {
                        coords.row += 1;
                        coords.col = 0;
                        coords.py += (data.size.height + coords.spacer) * coords.scale;
                        coords.px = undefined; // recalculate next time
                    }
                },

                error: function(event) {
                    alert("Image not found on the server, " +
                        "or you don't have permission to access it at " + imgDataUrl);
                },
            });

        }
    });
