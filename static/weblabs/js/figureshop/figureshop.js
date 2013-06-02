




    // ----------------------- Backbone MODEL --------------------------------------------

    // ------------------------ Panel -----------------------------------------
    // Simple place-holder for each Panel. Will have E.g. imageId, rendering options etc
    // Attributes can be added as we need them.
    var Panel = Backbone.Model.extend({

        defaults: {
            x: 100,     // coordinates on the 'paper'
            y: 100
        },

        initialize: function() {
        },

        containsPoint: function(x, y) {
            var panel_x = this.get('x'),
                panel_y = this.get('y');
            if ((x > panel_x && x < (panel_x+512)) && 
                    (y > panel_y && y < (panel_y+512))) {
                return true;
            }
            return false;
        },

        notifyClicked: function(event) {
            this.trigger('click', [event]);
        }
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

        handleClick: function(event, x, y) {

            // Check if any panel was clicked
            var panel_clicked = false;
            this.panels.each(function(p) {
                console.log(p, p.containsPoint(x, y));
                if (!panel_clicked && p.containsPoint(x, y)) {
                    p.notifyClicked(event);
                    panel_clicked = true
                }
            });
            return panel_clicked;
        }
    });



    // ---------------- UiState ---------------------
    // A Model to sync various UI changes that we never intend to Save.
    // E.g. Zoom, selected panels etc.
    // Every PanelView has reference to a single UiState to notify
    // of clicks etc.
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

        handleClick: function(event, canvas_x, canvas_y) {
            console.log("trigger click");
            if (!this.model.handleClick(event, canvas_x, canvas_y)) {
                this.clearSelected();
            }
        },

    });


    // -------------------------- Backbone VIEWS -----------------------------------------

    // -------------------------Panel View -----------------------------------
    // A Panel is a <td>, added to the <tr> by the Figure Table view below.
    var PanelView = Backbone.View.extend({
        tagName: "div",
        className: "panel",
        template: _.template($('#figure_panel_template').html()),

        initialize: function(opts) {
            this.uiState = opts.uiState;
            // we render on Changes in the model OR selected shape etc.
            this.model.on('destroy', this.remove, this);
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'click', this.handleClick);
            //this.template = _.template($('#table_shape-template').html());
        },

        events: {
            // "click .img_panel": "select_panel"
        },

        handleClick: function(data) {
            console.log("PanelView click");
            var event = data[0];
            if (event.shiftKey) {
                this.uiState.addSelected(this.model);
            } else {
                this.uiState.setSelected(this.model);
            }
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
            $("#canvas_wrapper>svg").click(function(event){
                var zoom_fraction = self.model.get('curr_zoom') * 0.01,
                    ost = $("#canvas_wrapper").offset(),
                    click_x = ((event.pageX - ost.left)/zoom_fraction >> 0) - self.paper_left,
                    click_y = (event.pageY - ost.top)/zoom_fraction >> 0;
                click_y = click_y - self.paper_top;

                self.handleClick(event, click_x, click_y);
            });

            // respond to uiStatus changes
            this.listenTo(this.model, 'change:curr_zoom', this.setZoom);
            this.listenTo(this.model, 'change:seletion', this.setSelection);
        },

        setZoom: function() {
            var scale = this.model.get('curr_zoom') * 0.01,
                newWidth = parseInt(this.orig_width * scale),
                newHeight = parseInt(this.orig_height * scale);
            this.paper.setSize(newWidth, newHeight);
        },

        handleClick: function(event, canvas_x, canvas_y) {
            this.model.handleClick(event, canvas_x, canvas_y);
        },

        setSelection: function() {
            this.paper.clear();
            var zoom = this.model.get('curr_zoom') * 0.01,
                self = this;
            this.model.getSelected().each(function(m){
                var rect_x = (self.paper_left + m.get('x')) * zoom,
                    rect_y = (self.paper_top + m.get('y')) * zoom,
                    rect_w = 103,
                    rect_h = 103;
                console.log( rect_x, rect_y );
                self.paper.rect(rect_x, rect_y, rect_w, rect_h).attr('stroke', '#ff0000');
            });
        }
    })


    // FigureView: Model is PanelList
    var FigureView = Backbone.View.extend({


        initialize: function(opts) {
            this.uiState = opts.uiState;
            var self = this;

            // Render on changes to the model
            this.model.on('change', this.render, this);

            // The element that is 'rendered' for the ROI is the <tr>
            // this.$el = $("<tr></tr>").appendTo(this.$el);
            this.$el = $("#paper");

            // If a panel is added, need to re-render whole table
            this.model.panels.on("add", this.addOne, this);

            this.render();
        },

        addOne: function(panel) {
            var view = new PanelView({model:panel, uiState:this.uiState});
            this.$el.append(view.render().el);
        },

        // Render is called on init() and when we add panels.
        render: function() {
            var self = this;

            // clean...
            this.$el.empty();

            // Go through all the Figure panels...
            // this.model.panels.each(function(panel, i) {
            //     var view = new PanelView({model:panel, uiState:self.uiState});
            //     self.$el.append(view.render().el);
            // });
            return this;
        }
    });
