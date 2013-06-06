

    // ----------------------- Backbone MODEL --------------------------------------------

    // ------------------------ Panel -----------------------------------------
    // Simple place-holder for each Panel. Will have E.g. imageId, rendering options etc
    // Attributes can be added as we need them.
    var Panel = Backbone.Model.extend({

        defaults: {
            x: 100,     // coordinates on the 'paper'
            y: 100,
            width: 512,
            height: 512
        },

        initialize: function() {
        },

        // When the canvas is clicked etc, we test if it's on a Panel
        containsPoint: function(x, y) {
            var panel_x = this.get('x'),
                panel_y = this.get('y');
            if ((x > panel_x && x < (panel_x+512)) && 
                    (y > panel_y && y < (panel_y+512))) {
                return true;
            }
            return false;
        },

    });

    // ------------------------ Panel Collection -------------------------
    var PanelList = Backbone.Collection.extend({
        model: Panel
    });


    // ------------------------- Figure Model -----------------------------------
    // Has a PanelList as well as other attributes of the Figure
    var FigureModel = Backbone.Model.extend({
        initialize: function() {
            this.panels = new PanelList();      //this.get("shapes"));
            var that = this;
            
            // we notify ROI of changes to Shapes, for Undo etc.
            //this.shapes.on("change", function(shape, attr) {
            //    that.trigger("change", shape, attr);
            //});
        },

    });



    // ---------------- UiState ---------------------
    // A Model to sync various UI changes that we never intend to Save.
    // E.g. Zoom, selected panels etc.
    // Every PanelView has reference to a single UiState to notify
    // of clicks etc.
    // UiState knows about the FigureModel, to check panels for clicks etc.
    var UiState = Backbone.Model.extend({

        defaults: {
            curr_zoom: 100
        },

        initialize: function(opts) {
            this.model = opts.model;    // FigureModel
            this.selectedItems = new PanelList();
        },

        addSelected: function(item) {
            this.selectedItems.add(item);
            this.trigger("change:seletion");
        },

        setSelected: function(item) {
            this.selectedItems = new PanelList([item]);
            this.trigger("change:seletion");
        },

        clearSelected: function() {
            this.selectedItems = new PanelList();
            this.trigger("change:seletion");
        },

        getSelected: function() {
            return this.selectedItems;
        },


        // Main canvas click handler
        // x and y refer to coordinates on the paper
        handleClick: function(event, x, y) {

            // Check if any panel was clicked
            var panel_found = false,
                self = this;
            this.model.panels.each(function(p) {
                if (panel_found) return;      // only handle first one

                // If clicked, set or add to selection
                if (p.containsPoint(x, y)) {
                    panel_found = true;
                    if (event.shiftKey) {
                        self.addSelected(p);
                    } else {
                        self.setSelected(p);
                    }
                }
            });

            // If no panels were clicked, clear selection
            if (!panel_found) {
                this.clearSelected();
            }
        }

    });


    // -------------------------- Backbone VIEWS -----------------------------------------

    // -------------------------Panel View -----------------------------------
    // A Panel is a <div>, added to the #paper by the FigureView below.
    var PanelView = Backbone.View.extend({
        tagName: "div",
        className: "panel",
        template: _.template($('#figure_panel_template').html()),

        initialize: function(opts) {
            // this.uiState = opts.uiState;
            // we render on Changes in the model OR selected shape etc.
            this.model.on('destroy', this.remove, this);
            this.listenTo(this.model, 'change', this.render);
        },

        events: {
            // "click .img_panel": "select_panel"
        },

        render: function() {
            // Have to handle potential nulls, since the template doesn't like them!
            var json = this.model.toJSON(),
                text = this.template(json);
            this.$el.html(text);
            this.$el.css({'top': this.model.get('y')+'px',
                            'left': this.model.get('x')+'px'});
            return this;
        }
    });


    // -------------- Selection Overlay View ----------------------

    var SelectionView = Backbone.View.extend({

        initialize: function(opts) {

            // set up various elements and we need repeatedly
            this.$main = $('main');
            this.$canvas = $("#canvas");
            this.$canvas_wrapper = $("#canvas_wrapper");
            this.$paper = $("#paper");

            var self = this,
                canvas_width = this.model.model.get('canvas_width'),
                canvas_height = this.model.model.get('canvas_height');

            // Create <svg> canvas
            this.raphael_paper = Raphael("canvas_wrapper", canvas_width, canvas_height);

            // Add global click handler
            $("#canvas_wrapper>svg").mousedown(function(event){
                self.handleClick(event);
            });

            // respond to uiStatus changes
            this.listenTo(this.model, 'change:curr_zoom', this.setZoom);
            this.listenTo(this.model, 'change:seletion', this.render);

            this.setZoom();
            this.reCentre();
        },

        // User has zoomed the UI - work out new sizes etc...
        setZoom: function() {
            var curr_zoom = this.model.get('curr_zoom'),
                fraction = curr_zoom * 0.01,
                newWidth = parseInt(this.orig_width * fraction),
                newHeight = parseInt(this.orig_height * fraction),
                scale = "scale("+fraction+", "+fraction+")";

            this.raphael_paper.setSize(newWidth, newHeight);

            // var setZoomPercent = function(percent) {

            var curr_centre = this.getCentre();
            // var scale = "scale("+fraction+", "+fraction+")";
            this.$canvas.css({"transform": scale, "-webkit-transform": scale});

            var canvas_w = this.model.model.get('canvas_width'),
                canvas_h = this.model.model.get('canvas_height');
            var scaled_w = canvas_w * fraction,
                scaled_h = canvas_h * fraction;
            this.$canvas_wrapper.css({'width':scaled_w+"px", 'height': scaled_h+"px"});
            var margin_top = (canvas_h - scaled_h)/2,
                margin_left = (canvas_w - scaled_w)/2;
            this.$canvas.css({'top': "-"+margin_top+"px", "left": "-"+margin_left+"px"});

            if (curr_centre) {
                this.setCentre(curr_centre);
            }
            // curr_zoom = percent;
            // uiState.set('curr_zoom', curr_zoom);
            $("#zoom_input").val(curr_zoom);

            // re-render raphael at the new coordinates
            this.render();
        },

        reCentre: function() {
            var canvas_w = this.model.model.get('canvas_width'),
                canvas_h = this.model.model.get('canvas_height');
            this.setCentre( [canvas_w/2, canvas_h/2] );
        },

        getCentre: function() {
            var curr_zoom = this.model.previous('curr_zoom');
            if (curr_zoom == undefined) {
                return;
            }
            var viewport_w = this.$main.width(),
                viewport_h = this.$main.height(),
                offst_left = this.$canvas_wrapper.offset().left - this.$main.offset().left,
                offst_top = this.$canvas_wrapper.offset().top - this.$main.offset().top,
                cx = -offst_left + viewport_w/2,
                cy = -offst_top + viewport_h/2,
                zm_fraction = curr_zoom * 0.01;
            return [cx/zm_fraction, cy/zm_fraction];
        },

        setCentre: function(cx_cy, speed) {
            var curr_zoom = this.model.get('curr_zoom'),
                zm_fraction = curr_zoom * 0.01,
                cx = cx_cy[0] * zm_fraction,
                cy = cx_cy[1] * zm_fraction,
                viewport_w = this.$main.width(),
                viewport_h = this.$main.height(),
                offst_left = cx - viewport_w/2,
                offst_top = cy - viewport_h/2,
                speed = speed || 0;
            this.$main.animate({
                scrollLeft: offst_left,
                scrollTop: offst_top
            }, speed);
        },

        // Canvas mouse-down. Need to work out x and y on paper at current zoom
        handleClick: function(event) {
            var zoom_fraction = this.model.get('curr_zoom') * 0.01,
                ost = this.$canvas_wrapper.offset(),
                paper_top = (this.model.model.get('canvas_height') - this.model.model.get('paper_height'))/2;
                paper_left = (this.model.model.get('canvas_width') - this.model.model.get('paper_width'))/2;
                click_x = ((event.pageX - ost.left)/zoom_fraction >> 0) - paper_left,
                click_y = ((event.pageY - ost.top)/zoom_fraction >> 0) - paper_top;
            // Let the model work out what to do with it (check panels etc)
            console.log("handleClick // ");
            this.model.handleClick(event, click_x, click_y);
        },

        // draw outlines around any selected panels
        render: function() {
            console.log("SelectionView render...");
            this.raphael_paper.clear();
            var zoom = this.model.get('curr_zoom') * 0.01,
                self = this;
            // this.model.getSelected().each(function(m){
            this.model.model.panels.each(function(m){
                var paper_top = (self.model.model.get('canvas_height') - self.model.model.get('paper_height'))/2;
                    paper_left = (self.model.model.get('canvas_width') - self.model.model.get('paper_width'))/2;
                    rect_x = (paper_left + 1 + m.get('x')) * zoom,
                    rect_y = (paper_top + 1 + m.get('y')) * zoom,
                    rect_w = m.get('width') * zoom,
                    rect_h = m.get('height') * zoom,
                    path1 = "M" + rect_x +","+ rect_y +"l"+ rect_w +","+ rect_h,
                    path2 = "M" + (rect_x+rect_w) +","+ rect_y +"l-"+ rect_w +","+ rect_h;
                // rectangle plus 2 diagonal lines
                // self.raphael_paper.rect(rect_x, rect_y, rect_w, rect_h).attr('stroke', '#4b80f9');
                // self.raphael_paper.path(path1).attr('stroke', '#4b80f9');
                // self.raphael_paper.path(path2).attr('stroke', '#4b80f9');
                var rectModel = new RectModel({'x':rect_x, 'y':rect_y, 'width':rect_w, 'height':rect_h});
                rectModel.on('all', function(name, evt){
                    console.log("Rect", name, evt);
                });
                var rectView = new RectView({'model':rectModel, 'paper':self.raphael_paper});
            });
        }
    })


    // FigureView: Model is PanelList
    var FigureView = Backbone.View.extend({

        el: $("#paper"),

        initialize: function(opts) {
            // this.uiState = opts.uiState;
            var self = this;

            // Render on changes to the model
            this.model.on('change:paper_width', this.render, this);

            // If a panel is added...
            this.model.panels.on("add", this.addOne, this);

            $("#paper_size_chooser").change(function(){
                var wh = $(this).val().split(","),
                    w = wh[0],
                    h = wh[1];
                self.model.set({'paper_width':w, 'paper_height':h});
            });

            // 'Auto-render' on init.
            this.render();
        },

        events: {

        },

        // Add a panel to the view
        addOne: function(panel) {
            var view = new PanelView({model:panel});    // uiState:this.uiState
            this.$el.append(view.render().el);
        },

        // Render is called on init(). TODO - Move more main UI code here.
        render: function() {

            var paper_w = this.model.get('paper_width'),
                paper_h = this.model.get('paper_height'),
                canvas_w = this.model.get('canvas_width'),
                canvas_h = this.model.get('canvas_height'),
                paper_left = (canvas_w - paper_w)/2,
                paper_top = (canvas_h - paper_h)/2;

            this.$el.css({'width': paper_w, 'height': paper_h,
                    'left': paper_left, 'top': paper_top});
            $("#canvas").css({'width': this.model.get('canvas_width'),
                    'height': this.model.get('canvas_height')});

            return this;
        }
    });
