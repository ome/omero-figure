

    // ----------------------- Backbone MODEL --------------------------------------------

    // ------------------------ Panel -----------------------------------------
    // Simple place-holder for each Panel. Will have E.g. imageId, rendering options etc
    // Attributes can be added as we need them.
    var Panel = Backbone.Model.extend({

        defaults: {
            x: 100,     // coordinates on the 'paper'
            y: 100,
            width: 512,
            height: 512,
            selected: false
        },

        initialize: function() {

            this.on('change', function(event){
                console.log("** Panel Model Change", event.changed);
            });
        },

        // When a multi-select rectangle is drawn around several Panels
        // a resize of the rectangle x1, y1, w1, h1 => x2, y2, w2, h2
        // will resize the Panels within it in proportion.
        // This might be during a drag, or drag-stop (save=true)
        multiselectdrag: function(x1, y1, w1, h1, x2, y2, w2, h2, save){

            var shift_x = function(startX) {
                return ((startX - x1)/w1) * w2 + x2;
            }
            var shift_y = function(startY) {
                return ((startY - y1)/h1) * h2 + y2;
            }

            var newX = shift_x( this.get('x') ),
                newY = shift_y( this.get('y') ),
                newW = shift_x( this.get('x')+this.get('width') ) - newX,
                newH = shift_y( this.get('y')+this.get('height') ) - newY;

            // Either set the new coordinates...
            if (save) {
                this.set( {'x':newX, 'y':newY, 'width':newW, 'height':newH} );
            } else {
                // ... Or update the UI Panels
                // both svg and DOM views listen for this...
                this.trigger('multiselectdrag', [newX, newY, newW, newH] );
            }
        }

    });

    // ------------------------ Panel Collection -------------------------
    var PanelList = Backbone.Collection.extend({
        model: Panel,

        getSelected: function() {
            return this.filter(function(panel){
                return panel.get('selected'); 
            });
        }
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
            this.clearSelected(false);
            item.set('selected', true);
            this.trigger('change:selection');
        },

        addSelected: function(item) {
            item.set('selected', true);
            this.trigger('change:selection');
        },

        clearSelected: function(trigger) {
            this.panels.each(function(p){
                p.set('selected', false);
            });
            if (trigger !== false) {
                this.trigger('change:selection');
            }
        },

        getSelected: function() {
            return this.panels.getSelected();
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
            this.model.on('drag multiselectdrag', this.dragResize, this);
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

            return this;
        }
    });


    // -------------- Selection Overlay Views ----------------------


    // SvgView uses ProxyRectModel to manage Svg Rects (raphael)
    // This converts between zoomed coordiantes of the html DOM panels
    // and the unzoomed SVG overlay.
    // Attributes of this model apply to the SVG canvas and are updated from
    // the PanelModel.
    // The SVG RectView (Raphael) notifies this Model via trigger 'drag' & 'dragStop'
    // and this is delegated to the PanelModel via trigger or set respectively.
    var ProxyRectModel = Backbone.Model.extend({

        initialize: function(opts) {
            this.panelModel = opts.panel;    // ref to the genuine PanelModel
            this.figureModel = opts.figure;

            this.renderFromModel();

            // Refresh c
            this.listenTo(this.figureModel, 'change:curr_zoom', this.renderFromModel);
            this.listenTo(this.panelModel, 'change:x change:y change:width change:height', this.renderFromModel);
            // when PanelModel is being dragged, but NOT by this ProxyRectModel
            this.listenTo(this.panelModel, 'multiselectdrag', this.renderFromTrigger);
            this.listenTo(this.panelModel, 'change:selected', this.renderSelection);
            // listen to a trigger on this Model (triggered from Rect)
            this.listenTo(this, 'drag', this.drag);
            // listen to change to this model - update PanelModel
            this.listenTo(this, 'dragStop', this.dragStop);
        },

        // return the SVG x, y, w, h (converting from figureModel)
        getSvgCoords: function(coords) {
            var zoom = this.figureModel.get('curr_zoom') * 0.01,
                paper_top = (this.figureModel.get('canvas_height') - this.figureModel.get('paper_height'))/2;
                paper_left = (this.figureModel.get('canvas_width') - this.figureModel.get('paper_width'))/2;
                rect_x = (paper_left + 1 + coords.x) * zoom,
                rect_y = (paper_top + 1 + coords.y) * zoom,
                rect_w = coords.width * zoom,
                rect_h = coords.height * zoom;
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
            return {'x':x>>0, 'y':y>>0, 'width':w>>0, 'height':h>>0};
        },

        // called on trigger from the RectView, we simply convert coordinates and delegate to panelModel
        drag: function(xywh) {
            var coords = this.getModelCoords({'x':xywh[0], 'y':xywh[1], 'width':xywh[2], 'height':xywh[3]})
            this.panelModel.trigger('drag', [coords.x, coords.y, coords.width, coords.height]);
        },

        // Needed to update the Model on changes to Rect (drag stop etc)
        dragStop: function(xywh) {
            var coords = this.getModelCoords({'x':xywh[0], 'y':xywh[1], 'width':xywh[2], 'height':xywh[3]})
            this.panelModel.set(coords);
        },

        // Called when the FigureModel zooms or the PanelModel changes coords.
        // Refreshes the RectView since that listens to changes in this ProxyModel
        renderFromModel: function() {
            this.set( this.getSvgCoords({
                'x': this.panelModel.get('x'),
                'y': this.panelModel.get('y'),
                'width': this.panelModel.get('width'),
                'height': this.panelModel.get('height')
            }) );
        },

        // While the Panel is being dragged (by the multi-select Rect), we need to keep updating
        // from the 'multiselectDrag' trigger on the model. RectView renders on change
        renderFromTrigger:function(xywh) {
            this.set( this.getSvgCoords({
                'x': xywh[0],
                'y': xywh[1],
                'width': xywh[2],
                'height': xywh[3]
            }) );
        },

        // When PanelModel changes selection - update and RectView will render change
        renderSelection: function() {
            this.set('selected', this.panelModel.get('selected'));
        },

        // Handle click (mousedown) on the RectView - changing selection.
        handleClick: function(event) {
            if (event.shiftKey) {
                this.figureModel.addSelected(this.panelModel);
            } else {
                this.figureModel.setSelected(this.panelModel);
            }
        }

    });


    // This model underlies the Rect that is drawn around multi-selected panels
    // (only shown if 2 or more panels selected)
    // On drag or resize, we calculate how to move or resize the seleted panels.
    var MultiSelectRectModel = ProxyRectModel.extend({

        defaults: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },

        initialize: function(opts) {
            this.figureModel = opts.figureModel;

            // listen to a trigger on this Model (triggered from Rect)
            this.listenTo(this, 'drag', this.drag);
            this.listenTo(this, 'dragStop', this.dragStop);
            this.listenTo(this.figureModel, 'change:selection', this.updateSelection);
            this.listenTo(this.figureModel, 'change:curr_zoom', this.updateSelection);
        },


        // Need to re-draw on selection AND zoom changes
        updateSelection: function() {

            var min_x = 100000, max_x = -10000,
                min_y = 100000, max_y = -10000

            var selected = this.figureModel.getSelected();
            if (selected.length < 2){

                this.set({
                    'x': 0,
                    'y': 0,
                    'width': 0,
                    'height': 0,
                    'selected': false
                });
                return;
            }

            for (var i=0; i<selected.length; i++) {
                var panel = selected[i],
                    x = panel.get('x'),
                    y = panel.get('y'),
                    w = panel.get('width'),
                    h = panel.get('height');
                min_x = Math.min(min_x, x);
                max_x = Math.max(max_x, x+w);
                min_y = Math.min(min_y, y);
                max_y = Math.max(max_y, y+h);
            };

            this.set( this.getSvgCoords({
                'x': min_x,
                'y': min_y,
                'width': max_x - min_x,
                'height': max_y - min_y
            }) );

            // Rect SVG will be notified and re-render
            this.set('selected', true);
        },

        // RectView drag is delegated to Panels to update coords (don't save)
        drag: function(xywh) {

            this.notifyModelofDrag(xywh, false);
        },

        // RectView dragStop is delegated to Panels to update coords (with save 'true')
        dragStop: function(xywh) {
            this.notifyModelofDrag(xywh, true);

            this.set({
                'x': xywh[0],
                'y': xywh[1],
                'width': xywh[2],
                'height': xywh[3]
            });
        },

        // While the multi-select RectView is being dragged, we need to calculate the new coords
        // of all selected Panels, based on the start-coords and the current coords of
        // the multi-select Rect.
        notifyModelofDrag: function(xywh, save) {
            var startCoords = this.getModelCoords({
                'x': this.get('x'),
                'y': this.get('y'),
                'width': this.get('width'),
                'height': this.get('height')
            });
            var dragCoords = this.getModelCoords({
                'x': xywh[0],
                'y': xywh[1],
                'width': xywh[2],
                'height': xywh[3]
            });

            var selected = this.figureModel.getSelected();
            for (var i=0; i<selected.length; i++) {
                selected[i].multiselectdrag(startCoords.x, startCoords.y, startCoords.width, startCoords.height,
                    dragCoords.x, dragCoords.y, dragCoords.width, dragCoords.height, save);
            };
        },

        // Ignore mousedown
        handleClick: function(event) {

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

            var multiSelectRect = new MultiSelectRectModel({figureModel: this.model}),
                rv = new RectView({'model':multiSelectRect, 'paper':this.raphael_paper});
            rv.selected_line_attrs = {'stroke-width': 1, 'stroke':'#4b80f9'};
        },

        // A panel has been added - We add a corresponding Raphael Rect 
        addOne: function(m) {

            var rectModel = new ProxyRectModel({panel: m, figure:this.model});
            new RectView({'model':rectModel, 'paper':this.raphael_paper});
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

