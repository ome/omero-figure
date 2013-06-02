

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
            var $c = $("#canvas"),
                $p = $("#paper"),
                po = $p.offset(),
                co = $c.offset(),
                self = this;
            this.orig_width = $c.width();
            this.orig_height = $c.height();
            this.paper_top = po.top - co.top,
            this.paper_left = po.left - co.left,

            // Create <svg> canvas
            this.paper = Raphael("canvas_wrapper", this.orig_width, this.orig_height);

            // Add global click handler
            $("#canvas_wrapper>svg").mousedown(function(event){
                self.handleClick(event, click_x, click_y);
            });

            // respond to uiStatus changes
            this.listenTo(this.model, 'change:curr_zoom', this.setZoom);
            this.listenTo(this.model, 'change:seletion', this.render);
        },

        // User has zoomed the UI - work out new sizes etc...
        setZoom: function() {
            var scale = this.model.get('curr_zoom') * 0.01,
                newWidth = parseInt(this.orig_width * scale),
                newHeight = parseInt(this.orig_height * scale);
            this.paper.setSize(newWidth, newHeight);
            // re-render at the new coordinates
            this.render();
        },

        // Canvas mouse-down. Need to work out x and y on paper at current zoom
        handleClick: function(event) {
            var zoom_fraction = self.model.get('curr_zoom') * 0.01,
                    ost = $("#canvas_wrapper").offset(),
                    click_x = ((event.pageX - ost.left)/zoom_fraction >> 0) - self.paper_left,
                    click_y = ((event.pageY - ost.top)/zoom_fraction >> 0) - self.paper_top;
            // Let the model work out what to do with it (check panels etc)
            this.model.handleClick(event, canvas_x, canvas_y);
        },

        // draw outlines around any selected panels
        render: function() {
            this.paper.clear();
            var zoom = this.model.get('curr_zoom') * 0.01,
                self = this;
            this.model.getSelected().each(function(m){
                var rect_x = (self.paper_left + 1 + m.get('x')) * zoom,
                    rect_y = (self.paper_top + 1 + m.get('y')) * zoom,
                    rect_w = m.get('width') * zoom,
                    rect_h = m.get('height') * zoom,
                    path1 = "M" + rect_x +","+ rect_y +"l"+ rect_w +","+ rect_h,
                    path2 = "M" + (rect_x+rect_w) +","+ rect_y +"l-"+ rect_w +","+ rect_h;
                // rectangle plus 2 diagonal lines
                self.paper.rect(rect_x, rect_y, rect_w, rect_h).attr('stroke', '#4b80f9');
                self.paper.path(path1).attr('stroke', '#4b80f9');
                self.paper.path(path2).attr('stroke', '#4b80f9');
            });
        }
    })


    // FigureView: Model is PanelList
    var FigureView = Backbone.View.extend({


        initialize: function(opts) {
            // this.uiState = opts.uiState;
            var self = this;

            // Render on changes to the model
            this.model.on('change', this.render, this);

            this.$el = $("#paper");

            // If a panel is added...
            this.model.panels.on("add", this.addOne, this);

            // 'Auto-render' on init.
            this.render();
        },

        // Add a panel to the view
        addOne: function(panel) {
            var view = new PanelView({model:panel});    // uiState:this.uiState
            this.$el.append(view.render().el);
        },

        // Render is called on init(). TODO - Move more main UI code here.
        render: function() {
            var self = this;

            return this;
        }
    });
