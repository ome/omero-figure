

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

    });

    // ------------------------ Panel Collection -------------------------
    var PanelList = Backbone.Collection.extend({
        model: Panel
    });


    // ------------------------- Figure Model -----------------------------------
    // Has a PanelList as well as other attributes of the Figure
    var FigureModel = Backbone.Model.extend({

        defaults: {
            'curr_zoom': 100
        },

        initialize: function() {
            this.panels = new PanelList();      //this.get("shapes"));
        },

        setSelected: function(item) {
            this.clearSelected();
            item.set('selected', true);
        },

        addSelected: function(item) {
            item.set('selected', true);
        },

        clearSelected: function() {
            this.panels.each(function(p){
                p.set('selected', false);
            });
        },

        getSelected: function() {
            return this.filter(function(panel){ return panel.get('selected'); });
        },

    });


    // -------------------------- Backbone VIEWS -----------------------------------------


    // var SelectionView = Backbone.View.extend({
    var FigureView = Backbone.View.extend({

        el: $("#paper"),

        initialize: function(opts) {

            // set up various elements and we need repeatedly
            this.$main = $('main');
            this.$canvas = $("#canvas");
            this.$canvas_wrapper = $("#canvas_wrapper");
            this.$paper = $("#paper");

            var self = this;

            // Render on changes to the model
            this.model.on('change:paper_width', this.render, this);

            // If a panel is added...
            this.model.panels.on("add", this.addOne, this);

            // Select a different size paper
            $("#paper_size_chooser").change(function(){
                var wh = $(this).val().split(","),
                    w = wh[0],
                    h = wh[1];
                self.model.set({'paper_width':w, 'paper_height':h});
            });

            // respond to zoom changes
            this.listenTo(this.model, 'change:curr_zoom', this.setZoom);

            // refresh current UI
            this.setZoom();
            this.reCentre();

            // 'Auto-render' on init.
            this.render();

        },

        // User has zoomed the UI - work out new sizes etc...
        // We zoom the main content 'canvas' using css transform: scale()
        // But also need to resize the canvas_wrapper manually.
        setZoom: function() {
            var curr_zoom = this.model.get('curr_zoom'),
                zoom = curr_zoom * 0.01,
                newWidth = parseInt(this.orig_width * zoom),
                newHeight = parseInt(this.orig_height * zoom),
                scale = "scale("+zoom+", "+zoom+")";

            // We want to stay centered on the same spot...
            var curr_centre = this.getCentre();

            // Scale canvas via css
            this.$canvas.css({"transform": scale, "-webkit-transform": scale});

            // Scale canvas wrapper manually
            var canvas_w = this.model.get('canvas_width'),
                canvas_h = this.model.get('canvas_height');
            var scaled_w = canvas_w * zoom,
                scaled_h = canvas_h * zoom;
            this.$canvas_wrapper.css({'width':scaled_w+"px", 'height': scaled_h+"px"});
            // and offset the canvas to stay visible
            var margin_top = (canvas_h - scaled_h)/2,
                margin_left = (canvas_w - scaled_w)/2;
            this.$canvas.css({'top': "-"+margin_top+"px", "left": "-"+margin_left+"px"});

            // ...apply centre from before zooming
            if (curr_centre) {
                this.setCentre(curr_centre);
            }

            // Show zoom level in UI
            $("#zoom_input").val(curr_zoom);
        },

        // Centre the viewport on the middle of the paper
        reCentre: function() {
            var canvas_w = this.model.get('canvas_width'),
                canvas_h = this.model.get('canvas_height');
            this.setCentre( [canvas_w/2, canvas_h/2] );
        },

        // Get the coordinates on the paper of the viewport center.
        // Used after zoom update (but BEFORE the UI has changed)
        getCentre: function() {
            // Need to know the zoom BEFORE the update
            var curr_zoom = this.model.previous('curr_zoom');
            if (curr_zoom == undefined) {
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
            return [cx/zm_fraction, cy/zm_fraction];
        },

        // Scroll viewport to place a specified paper coordinate at the centre
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

        // Add a panel to the view
        addOne: function(panel) {
            var view = new PanelView({model:panel});    // uiState:this.uiState
            this.$el.append(view.render().el);
        },

        // Render is called on init()
        // Update any changes to sizes of paper or canvas
        render: function() {
            var zoom = this.model.get('curr_zoom') * 0.01,
                self = this;

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



    // -------------------------Panel View -----------------------------------
    // A Panel is a <div>, added to the #paper by the FigureView below.
    var PanelView = Backbone.View.extend({
        tagName: "div",
        className: "panel",
        template: _.template($('#figure_panel_template').html()),

        initialize: function(opts) {
            // we render on Changes in the model OR selected shape etc.
            this.model.on('destroy', this.remove, this);
            this.listenTo(this.model, 'change:x change:y change:width change:height', this.render);
            // During drag, model isn't updated, but we trigger 'drag'
            this.model.on('drag', this.dragResize, this);
            console.log("PanelView init done");
        },

        events: {
            // "click .img_panel": "select_panel"
        },

        // TODO
        remove: function() {
            // TODO: remove from DOM, remove event handlers etc.
        },

        // During drag, we resize etc
        dragResize: function(xywh) {
            console.log("dragResize", xywh);
            this.$img_panel.css({
                'width': xywh[2]+'px',
                'height': xywh[3]+'px'
            });
            this.$el.css({
                'left': xywh[0]+'px',
                'top': xywh[1]+'px'
            });
        },

        render: function() {
            // Have to handle potential nulls, since the template doesn't like them!
            var json = this.model.toJSON(),
                text = this.template(json);
            this.$el.html(text);
            this.$el.css({'top': this.model.get('y')+'px',
                            'left': this.model.get('x')+'px'});

            this.$img_panel = $(".img_panel", this.$el);    // cache for later

            console.log("render", this.$el, this.$img_panel);
            return this;
        }
    });


    // -------------- Selection Overlay Views ----------------------


    // SvgView uses ProxyRectModel to manage Svg Rects (raphael)
    // They convert between zoomed coordiantes of the html DOM panels
    // and the unzoomed SVG overlay.
    var ProxyRectModel = Backbone.Model.extend({

        initialize: function(opts) {
            this.panelModel = opts.panel;    // ref to the genuine PanelModel
            this.figureModel = opts.figure;
            this.set( this.getSvgCoords() );

            this.listenTo(this.figureModel, 'change:curr_zoom', this.updateZoom);
            this.listenTo(this.panelModel, 'change:selected', this.updateSelection);
            // listen to a trigger on this Model (triggered from Rect)
            this.listenTo(this, 'drag', this.dragResize);
            // listen to change to this model
            this.listenTo(this, 'change', this.resize);
        },

        // return the SVG x, y, w, h (converting from figureModel)
        getSvgCoords: function() {
            var zoom = this.figureModel.get('curr_zoom') * 0.01,
                paper_top = (this.figureModel.get('canvas_height') - this.figureModel.get('paper_height'))/2;
                paper_left = (this.figureModel.get('canvas_width') - this.figureModel.get('paper_width'))/2;
                rect_x = (paper_left + 1 + this.panelModel.get('x')) * zoom,
                rect_y = (paper_top + 1 + this.panelModel.get('y')) * zoom,
                rect_w = this.panelModel.get('width') * zoom,
                rect_h = this.panelModel.get('height') * zoom;
            return {'x':rect_x, 'y':rect_y, 'width':rect_w, 'height':rect_h};
        },

        // return the Model x, y, w, h (converting from SVG coords)
        getModelCoords: function(coords) {
            var zoom = this.figureModel.get('curr_zoom') * 0.01,
                paper_top = (this.figureModel.get('canvas_height') - this.figureModel.get('paper_height'))/2;
                paper_left = (this.figureModel.get('canvas_width') - this.figureModel.get('paper_width'))/2;
                x = (coords.x/zoom) - paper_left - 1,
                y = (coords.y/zoom) - paper_top - 1,
                w = coords.width/zoom,
                h = coords.height/zoom;
            //console.log("getModelCoords", zoom, paper_top, xywh, [x,y,w,h]);
            return {'x':x, 'y':y, 'width':w, 'height':h};
        },

        dragResize: function(xywh) {
            var coords = this.getModelCoords({'x':xywh[0], 'y':xywh[1], 'width':xywh[2], 'height':xywh[3]})
            this.panelModel.trigger('drag', [coords.x, coords.y, coords.width, coords.height]);
        },

        resize: function(event) {
            console.log(event.changed);
            var coords = this.getModelCoords({
                    'x':this.get('x'),
                    'y':this.get('y'),
                    'width':this.get('width'),
                    'height':this.get('height')
                });
            console.log("resize", coords);
            this.panelModel.set(coords);
        },

        updateZoom: function() {
            this.set( this.getSvgCoords() );
        },

        updateSelection: function() {
            this.set('selected', this.panelModel.get('selected'));
        },

        handleClick: function(event) {
            if (event.shiftKey) {
                this.figureModel.addSelected(this.panelModel);
            } else {
                this.figureModel.setSelected(this.panelModel);
            }
        }

    });

    // var ProxyRectModelList = Backbone.Collection.extend({
    //     model: ProxyRectModel
    // });

    var SvgView = Backbone.View.extend({

        initialize: function(opts) {

            var self = this,
                canvas_width = this.model.get('canvas_width'),
                canvas_height = this.model.get('canvas_height');

            // Create <svg> canvas
            this.raphael_paper = Raphael("canvas_wrapper", canvas_width, canvas_height);

            // this.panelRects = new ProxyRectModelList();

            // Add global click handler
            $("#canvas_wrapper>svg").mousedown(function(event){
                self.handleClick(event);
            });

            // If a panel is added...
            this.model.panels.on("add", this.addOne, this);
            // TODO remove on destroy

            this.listenTo(this.model, 'change:selection', this.render);

        },

        // A panel has been added - We add a corresponding Raphael Rect 
        addOne: function(m) {

            var rectModel = new ProxyRectModel({panel: m, figure:this.model});
            rectModel.on('all', function(name, evt){
            });
            new RectView({'model':rectModel, 'paper':this.raphael_paper});

            // this.panelRects.add(rectModel);
        },

        // TODO
        remove: function() {
            // TODO: remove from svg, remove event handlers etc.
        },

        // We simply re-size the Raphael svg itself - Shapes have their own zoom listeners
        setZoom: function() {
            var zoom = this.model.get('curr_zoom') * 0.01,
                newWidth = parseInt(this.orig_width * zoom),
                newHeight = parseInt(this.orig_height * zoom);

            this.raphael_paper.setSize(newWidth, newHeight);
        },

        // Any mouse click (mousedown) that isn't captured by Panel Rect clears selection
        handleClick: function(event) {
            this.model.clearSelected();
        }
    });

