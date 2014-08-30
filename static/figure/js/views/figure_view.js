
    // -------------------------- Backbone VIEWS -----------------------------------------


    // var SelectionView = Backbone.View.extend({
    var FigureView = Backbone.View.extend({

        el: $("#body"),

        initialize: function(opts) {

            // Delegate some responsibility to other views
            new AlignmentToolbarView({model: this.model});
            new AddImagesModalView({model: this.model, figureView: this});
            new SetIdModalView({model: this.model});
            new PaperSetupModalView({model: this.model});

            this.figureFiles = new FileList();
            new FileListView({model:this.figureFiles});

            // set up various elements and we need repeatedly
            this.$main = $('main');
            this.$canvas = $("#canvas");
            this.$canvas_wrapper = $("#canvas_wrapper");
            this.$paper = $("#paper");
            this.$copyBtn = $(".copy");
            this.$pasteBtn = $(".paste");
            this.$saveBtn = $(".save_figure.btn");
            this.$saveOption = $("li.save_figure");
            this.$saveAsOption = $("li.save_as");
            this.$deleteOption = $("li.delete_figure");

            var self = this;

            // Render on changes to the model
            this.model.on('change:paper_width change:paper_height', this.render, this);

            // If a panel is added...
            this.model.panels.on("add", this.addOne, this);

            // Select a different size paper
            $("#page_size_chooser").change(function(){
                var wh = $(this).val().split(","),
                    w = wh[0],
                    h = wh[1];
                self.model.set({'paper_width':w, 'paper_height':h});
            });

            // Don't leave the page with unsaved changes!
            window.onbeforeunload = function() {
                var canEdit = self.model.get('canEdit');
                if (self.model.get("unsaved")) {
                    return "Leave page with unsaved changes?";
                }
            };

            $("#zoom_slider").slider({
                max: 400,
                min: 10,
                value: 75,
                slide: function(event, ui) {
                    self.model.set('curr_zoom', ui.value);
                }
            });

            // respond to zoom changes
            this.listenTo(this.model, 'change:curr_zoom', this.renderZoom);
            this.listenTo(this.model, 'change:selection', this.renderSelectionChange);
            this.listenTo(this.model, 'change:unsaved', this.renderSaveBtn);
            this.listenTo(this.model, 'change:figureName', this.renderFigureName);

            // refresh current UI
            this.renderZoom();
            // this.zoom_paper_to_fit();

            // 'Auto-render' on init.
            this.render();
            this.renderSelectionChange();

        },

        events: {
            "click .export_pdf": "export_pdf",
            "click .add_panel": "addPanel",
            "click .delete_panel": "deleteSelectedPanels",
            "click .copy": "copy_selected_panels",
            "click .paste": "paste_panels",
            "click .save_figure": "save_figure_event",
            "click .save_as": "save_as_event",
            "click .new_figure": "goto_newfigure",
            "click .open_figure": "open_figure",
            "click .export_json": "export_json",
            "click .delete_figure": "delete_figure",
            "click .paper_setup": "paper_setup",
            "click .export-options a": "select_export_option",
            "click .zoom-paper-to-fit": "zoom_paper_to_fit",
            "click .about_figure": "show_about_dialog",
        },

        keyboardEvents: {
            'backspace': 'deleteSelectedPanels',
            'del': 'deleteSelectedPanels',
            'mod+a': 'select_all',
            'mod+c': 'copy_selected_panels',
            'mod+v': 'paste_panels',
            'mod+s': 'save_figure_event',
            'mod+n': 'goto_newfigure',
            'mod+o': 'open_figure',
            'down' : 'nudge_down',
            'up' : 'nudge_up',
            'left' : 'nudge_left',
            'right' : 'nudge_right',
        },

        paper_setup: function(event) {
            event.preventDefault();

            $("#paperSetupModal").modal();
        },

        show_about_dialog: function(event) {
            event.preventDefault();
            $("#aboutModal").modal();
        },

        // Heavy lifting of PDF generation handled by OMERO.script...
        export_pdf: function(event){

            event.preventDefault();

            // Status is indicated by showing / hiding 3 buttons
            var figureModel = this.model,
                $create_figure_pdf = $(event.target),
                $pdf_inprogress = $("#pdf_inprogress"),
                $pdf_download = $("#pdf_download");
            $create_figure_pdf.hide();
            $pdf_download.hide();
            $pdf_inprogress.show();

            // Get figure as json
            var figureJSON = this.model.figure_toJSON();

            var url = MAKE_WEBFIGURE_URL,
                data = {
                    figureJSON: JSON.stringify(figureJSON)
                };

            // Start the Figure_To_Pdf.py script
            $.post( url, data).done(function( data ) {

                // {"status": "in progress", "jobId": "ProcessCallback/64be7a9e-2abb-4a48-9c5e-6d0938e1a3e2 -t:tcp -h 192.168.1.64 -p 64592"}
                var jobId = data.jobId;

                // Now we keep polling for script completion, every second...

                var i = setInterval(function (){

                    $.getJSON(ACTIVITIES_JSON_URL, function(act_data) {

                            var pdf_job = act_data[jobId];

                            // We're waiting for this flag...
                            if (pdf_job.status == "finished") {
                                clearInterval(i);

                                // Update UI
                                $create_figure_pdf.show();
                                $pdf_inprogress.hide();
                                var fa_id = pdf_job.results.File_Annotation.id,
                                    fa_download = WEBINDEX_URL + "annotation/" + fa_id + "/";
                                $pdf_download.attr('href', fa_download).show();
                            }

                            if (act_data.inprogress === 0) {
                                clearInterval(i);
                            }

                        }).error(function() {
                            clearInterval(i);
                        });

                }, 1000);
            });
        },

        select_export_option: function(event) {
            event.preventDefault();
            var $a = $(event.target),
                $span = $a.children('span.glyphicon');
            // We take the <span> from the <a> and place it in the <button>
            if ($span.length === 0) $span = $a;  // in case we clicked on <span>
            var $li = $span.parent().parent(),
                $button = $li.parent().prev().prev(),
                option = $span.attr("data-option");
            var $flag = $button.find("span[data-option='" + option + "']");
            if ($flag.length > 0) {
                $flag.remove();
            } else {
                $span = $span.clone();
                $button.append($span);
            }
            $button.trigger('change');      // can listen for this if we want to 'submit' etc
        },

        nudge_right: function(event) {
            event.preventDefault();
            this.model.nudge_right();
        },

        nudge_left: function(event) {
            event.preventDefault();
            this.model.nudge_left();
        },

        nudge_down: function(event) {
            event.preventDefault();
            this.model.nudge_down();
        },

        nudge_up: function(event) {
            event.preventDefault();
            this.model.nudge_up();
        },

        goto_newfigure: function(event) {
            if (event) event.preventDefault();
            $(".modal").modal('hide');

            var self = this;
            var callback = function() {
                self.model.clearFigure();
                $('#addImagesModal').modal();
                // navigate will be ignored if we're already on /new
                app.navigate("new/", {trigger: true});
            };

            if (this.model.get("unsaved")) {
                var saveBtnTxt = "Save",
                    canEdit = this.model.get('canEdit');
                if (!canEdit) saveBtnTxt = "Save a Copy";

                figureConfirmDialog("Save Changes to Figure?",
                    "Your changes will be lost if you don't save them",
                    ["Cancel", "Don't Save", saveBtnTxt],
                    function(btnTxt){
                        if (btnTxt === saveBtnTxt) {
                            self.save_figure({success: callback});
                        } else if (btnTxt === "Don't Save") {
                            callback();
                        }
                    });
            } else {
                callback();
            }
        },

        delete_figure: function(event) {
            event.preventDefault();
            var fileId = this.model.get('fileId'),
                figName = this.model.get('figureName');
            if(fileId) {
                this.model.set("unsaved", false);   // prevent "Save?" dialog
                this.figureFiles.deleteFile(fileId, figName);
            }
        },

        open_figure: function(event) {
            event.preventDefault();
            $(".modal").modal('hide');

            var self = this,
                currentFileId = self.model.get('fileId');
            var callback = function() {
                $("#openFigureModal").modal();
                if (self.figureFiles.length === 0) {
                    self.figureFiles.fetch({success: function(fileList){
                        // Don't allow opening of current figure
                        if (currentFileId) {
                            fileList.disable(currentFileId);
                        }
                    }});
                } else {
                    if (currentFileId) {
                        self.figureFiles.disable(currentFileId);
                    }
                }
            };

            if (this.model.get("unsaved")) {
                var saveBtnTxt = "Save",
                    canEdit = this.model.get('canEdit');
                if (!canEdit) saveBtnTxt = "Save a Copy";

                figureConfirmDialog("Save Changes to Figure?",
                    "Your changes will be lost if you don't save them",
                    ["Cancel", "Don't Save", saveBtnTxt],
                    function(btnTxt){
                        if (btnTxt === saveBtnTxt) {
                            self.save_figure();
                            callback();
                        } else if (btnTxt === "Don't Save") {
                            self.model.set("unsaved", false);
                            callback();
                        }
                    });
            } else {
                callback();
            }
        },

        save_figure_event: function(event) {
            if (event) {
                event.preventDefault();
            }
            this.$saveBtn.tooltip('hide');
            this.save_figure();
        },

        save_figure: function(options) {
            options = options || {};

            var fileId = this.model.get('fileId'),
                canEdit = this.model.get('canEdit');
            if (fileId && canEdit) {
                // Save
                options.fileId = fileId;
                this.model.save_to_OMERO(options);
            } else {
                this.save_as(options);
            }

        },

        save_as_event: function(event) {
            if (event) {
                event.preventDefault();
            }
            this.save_as();
        },

        save_as: function(options) {

            // clear file list (will be re-fetched when needed)
            this.figureFiles.reset();

            var self = this;
            options = options || {};
            var defaultName = this.model.get('figureName');
            if (!defaultName) {
                var d = new Date(),
                    dt = d.getFullYear() + "-" + (d.getMonth()+1) + "-" +d.getDate(),
                    tm = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
                defaultName = "Figure_" + dt + "_" + tm;
            } else {
                defaultName = defaultName + "_copy";
            }
            var figureName = prompt("Enter Figure Name", defaultName);

            var nav = function(data){
                app.navigate("file/"+data);
                // in case you've Saved a copy of a file you can't edit
                self.model.set('canEdit', true);
            };
            if (figureName) {
                options.figureName = figureName;
                // On save, go to newly saved page, unless we have callback already
                options.success = options.success || nav;
                // Save
                this.model.save_to_OMERO(options);
            }

        },

        export_json: function(event) {
            event.preventDefault();

            var figureJSON = this.model.figure_toJSON(),
                figureText = JSON.stringify(figureJSON);
            $('#exportJsonModal').modal('show');
            $('#exportJsonModal textarea').text(figureText);
        },

        copy_selected_panels: function(event) {
            event.preventDefault();
            var s = this.model.getSelected();
            this.clipboard_data = cd = [];
            _.each(s, function(m) {
                var copy = m.toJSON();
                delete copy.id;
                cd.push(copy);
            });
            this.$pasteBtn.removeClass("disabled");
        },

        paste_panels: function(event) {
            event.preventDefault();

            if (!this.clipboard_data) return;

            var self = this;
            this.model.clearSelected();

            // first work out the bounding box of clipboard panels
            var top, left, bottom, right;
            _.each(this.clipboard_data, function(m, i) {
                var t = m.y,
                    l = m.x,
                    b = t + m.height,
                    r = l + m.width;
                if (i === 0) {
                    top = t; left = l; bottom = b; right = r;
                } else {
                    top = Math.min(top, t);
                    left = Math.min(left, l);
                    bottom = Math.max(bottom, b);
                    right = Math.max(right, r);
                }
            });
            var height = bottom - top,
                width = right - left,
                offset_x = 0,
                offset_y = 0;

            // if pasting a 'row', paste below. Paste 'column' to right.
            if (width > height) {
                offset_y = height + height/20;  // add a spacer
            } else {
                offset_x = width + width/20;
            }

            // apply offset to clipboard data & paste
            _.each(this.clipboard_data, function(m) {
                m.x = m.x + offset_x;
                m.y = m.y + offset_y;
                self.model.panels.create(m);
            });
            // only pasted panels are selected - simply trigger...
            this.model.notifySelectionChange();
        },

        clipboard_data: undefined,

        select_all: function(event) {
            event.preventDefault();
            this.model.select_all();
        },

        deleteSelectedPanels: function(event) {
            event.preventDefault();
            this.model.deleteSelected();
        },

        // User has zoomed the UI - work out new sizes etc...
        // We zoom the main content 'canvas' using css transform: scale()
        // But also need to resize the canvas_wrapper manually.
        renderZoom: function() {
            var curr_zoom = this.model.get('curr_zoom'),
                zoom = curr_zoom * 0.01,
                newWidth = parseInt(this.orig_width * zoom, 10),
                newHeight = parseInt(this.orig_height * zoom, 10),
                scale = "scale("+zoom+", "+zoom+")";

            // We want to stay centered on the same spot...
            var curr_centre = this.getCentre(true);

            // Scale canvas via css
            this.$canvas.css({"transform": scale, "-webkit-transform": scale, "-ms-transform": scale});

            // Scale canvas wrapper manually
            var canvas_w = this.model.get('canvas_width'),
                canvas_h = this.model.get('canvas_height');
            var scaled_w = canvas_w * zoom,
                scaled_h = canvas_h * zoom;
            this.$canvas_wrapper.css({'width':scaled_w+"px", 'height': scaled_h+"px"});
            // and offset the canvas to stay visible
            var margin_top = (scaled_h - canvas_h)/2,
                margin_left = (scaled_w - canvas_w)/2;
            this.$canvas.css({'top': margin_top+"px", "left": margin_left+"px"});

            // ...apply centre from before zooming
            if (curr_centre) {
                this.setCentre(curr_centre);
            }

            // Show zoom level in UI
            $("#zoom_input").val(curr_zoom);
        },

        // Centre the viewport on the middle of the paper
        reCentre: function() {
            var paper_w = this.model.get('paper_width'),
                paper_h = this.model.get('paper_height');
            this.setCentre( {'x':paper_w/2, 'y':paper_h/2} );
        },

        // Get the coordinates on the paper of the viewport center.
        // Used after zoom update (but BEFORE the UI has changed)
        getCentre: function(previous) {
            // Need to know the zoom BEFORE the update
            var m = this.model,
                curr_zoom = m.get('curr_zoom');
            if (previous) {
                curr_zoom = m.previous('curr_zoom');
            }
            if (curr_zoom === undefined) {
                return;
            }
            var viewport_w = this.$main.width(),
                viewport_h = this.$main.height(),
                co = this.$canvas_wrapper.offset(),
                mo = this.$main.offset(),
                offst_left = co.left - mo.left,
                offst_top = co.top - mo.top,
                cx = -offst_left + viewport_w/2,
                cy = -offst_top + viewport_h/2,
                zm_fraction = curr_zoom * 0.01;

            var paper_left = (m.get('canvas_width') - m.get('paper_width'))/2,
                paper_top = (m.get('canvas_height') - m.get('paper_height'))/2;
            return {'x':(cx/zm_fraction)-paper_left, 'y':(cy/zm_fraction)-paper_top};
        },

        // Scroll viewport to place a specified paper coordinate at the centre
        setCentre: function(cx_cy, speed) {
            var m = this.model,
                paper_left = (m.get('canvas_width') - m.get('paper_width'))/2,
                paper_top = (m.get('canvas_height') - m.get('paper_height'))/2;
            var curr_zoom = m.get('curr_zoom'),
                zm_fraction = curr_zoom * 0.01,
                cx = (cx_cy.x+paper_left) * zm_fraction,
                cy = (cx_cy.y+paper_top) * zm_fraction,
                viewport_w = this.$main.width(),
                viewport_h = this.$main.height(),
                offst_left = cx - viewport_w/2,
                offst_top = cy - viewport_h/2;
            speed = speed || 0;
            this.$main.animate({
                scrollLeft: offst_left,
                scrollTop: offst_top
            }, speed);
        },

        zoom_paper_to_fit: function(event) {

            var m = this.model,
                pw = m.get('paper_width'),
                ph = m.get('paper_height'),
                viewport_w = this.$main.width(),
                viewport_h = this.$main.height();

            var zoom_x = viewport_w/pw,
                zoom_y = viewport_h/ph,
                zm = Math.min(zoom_x, zoom_y);
            zm = (zm * 100) >> 0;

            // TODO: Need to update slider!
            m.set('curr_zoom', zm-5) ;
            $("#zoom_slider").slider({ value: zm-5 });

            // seems we sometimes need to wait to workaround bugs
            var self = this;
            setTimeout(function(){
                self.reCentre();
            }, 10);
        },

        // Add a panel to the view
        addOne: function(panel) {
            var view = new PanelView({model:panel});    // uiState:this.uiState
            this.$paper.append(view.render().el);
        },

        renderFigureName: function() {

            var title = "OMERO.figure",
                figureName = this.model.get('figureName');
            if ((figureName) && (figureName.length > 0)) {
                title += " - " + figureName;
            } else {
                figureName = "";
            }
            $('title').text(title);
            $(".figure-title").text(figureName);
        },

        renderSaveBtn: function() {

            var canEdit = this.model.get('canEdit'),
                noFile = (typeof this.model.get('fileId') == 'undefined'),
                btnText = (canEdit || noFile) ? "Save" : "Can't Save";
            this.$saveBtn.text(btnText);
            if (this.model.get('unsaved') && (canEdit || noFile)) {
                this.$saveBtn.addClass('btn-success').removeClass('btn-default').removeAttr('disabled');
                this.$saveOption.removeClass('disabled');
            } else {
                this.$saveBtn.addClass('btn-default').removeClass('btn-success').attr('disabled', 'disabled');
                this.$saveOption.addClass('disabled');
            }
            if (this.model.get('fileId')) {
                this.$deleteOption.removeClass('disabled');
            } else {
                this.$deleteOption.addClass('disabled');
            }
        },

        renderSelectionChange: function() {
            var $delete_panel = $('.delete_panel', this.$el);
            if (this.model.getSelected().length > 0) {
                $delete_panel.removeAttr("disabled");
                this.$copyBtn.removeClass("disabled");
            } else {
                $delete_panel.attr("disabled", "disabled");
                this.$copyBtn.addClass("disabled");
            }
        },

        // Render is called on init()
        // Update any changes to sizes of paper or canvas
        render: function() {
            var m = this.model,
                zoom = m.get('curr_zoom') * 0.01;

            var paper_w = m.get('paper_width'),
                paper_h = m.get('paper_height'),
                canvas_w = m.get('canvas_width'),
                canvas_h = m.get('canvas_height'),
                paper_left = (canvas_w - paper_w)/2,
                paper_top = (canvas_h - paper_h)/2;

            this.$paper.css({'width': paper_w, 'height': paper_h,
                    'left': paper_left, 'top': paper_top});
            $("#canvas").css({'width': this.model.get('canvas_width'),
                    'height': this.model.get('canvas_height')});

            // always want to do this?
            this.zoom_paper_to_fit();

            return this;
        }
    });



    var AlignmentToolbarView = Backbone.View.extend({

        el: $("#alignment-toolbar"),

        model:FigureModel,

        events: {
            "click .aleft": "align_left",
            "click .agrid": "align_grid",
            "click .atop": "align_top",

            "click .awidth": "align_width",
            "click .aheight": "align_height",
            "click .asize": "align_size",
        },

        initialize: function() {
            this.listenTo(this.model, 'change:selection', this.render);
            this.$buttons = $("button", this.$el);
        },

        align_left: function(event) {
            event.preventDefault();
            this.model.align_left();
        },

        align_grid: function(event) {
            event.preventDefault();
            this.model.align_grid();
        },

        align_width: function(event) {
            event.preventDefault();
            this.model.align_size(true, false);
        },

        align_height: function(event) {
            event.preventDefault();
            this.model.align_size(false, true);
        },

        align_size: function(event) {
            event.preventDefault();
            this.model.align_size(true, true);
        },

        align_top: function(event) {
            event.preventDefault();
            this.model.align_top();
        },

        render: function() {
            if (this.model.getSelected().length > 1) {
                this.$buttons.removeAttr("disabled");
            } else {
                this.$buttons.attr("disabled", "disabled");
            }
        }
    });
