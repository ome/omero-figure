




    // ----------------------- Backbone MODEL --------------------------------------------

    // ------------------------ Panel -----------------------------------------
    // Simple place-holder for each Panel. Will have E.g. imageId, rendering options etc
    // Attributes can be added as we need them.
    var Panel = Backbone.Model.extend({

        initialize: function() {
        }
    });

    // ------------------------ Panel Collection - arranged into table -------------------------
    var PanelList = Backbone.Collection.extend({
        model: Panel,
        url: "fake"
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
    }
});


    // -------------------------- Backbone VIEWS -----------------------------------------

    // -------------------------Panel View -----------------------------------
    // A Panel is a <td>, added to the <tr> by the Figure Table view below.
    var PanelView = Backbone.View.extend({
        tagName: "div",

        // For some reason, this can't find the template at this stage (OK at init)
        template: _.template($('#figure_panel_template').html()),

        initialize: function(opts) {
            //this.uiState = opts.uiState;
            // we render on Changes in the model OR selected shape etc.
            this.model.on('change', this.render, this);
            //this.uiState.on('change', this.update_selection, this);
            //this.template = _.template($('#table_shape-template').html());
        },

        events: {
            "click .shape_cell": "select_panel"
        },


        // When we select a shape, we need to update Z, T and shape_id
        select_panel: function() {

            // The uiState is a Backbone Model that is never saved to server
            //this.uiState.set('theZ', newZ);
        },

        render: function() {
            console.log("panel render", this.model.get('imageId'));
            // Have to handle potential nulls, since the template doesn't like them!
            var json = this.model.toJSON();
            
            //this.$el.html("panel" + this.model.get("imageId"));
            var text = this.template(json);
            this.$el.html(text);
            return this;
        }
    });


    // FigureTableView: Model is PanelList
    // We have a <tbody> for the Figure Table (only 1 at this point)
    // Panels are added as <td> elements on render()
    // We need to manage their layout into <tr> depending on column count.
    // render() is called on init, and on any change to the model
    var FigureTableView = Backbone.View.extend({

        tagName: "tbody",

        initialize: function(opts) {
            this.uiState = opts.uiState;
            var self = this;

            // Render on changes to the model
            this.model.on('change', this.render, this);

            // The element that is 'rendered' for the ROI is the <tr>
            // this.$el = $("<tr></tr>").appendTo(this.$el);
            this.$el = $("#figureCanvas");

            // If a panel is added, need to re-render whole table
            this.model.panels.on("add", function(panel) {
                console.log("add...");
                self.render();
            });

            this.render();
        },

        // Here we build our table from scratch:
        // We go through all the panels, adding them as <td> to our table,
        // using the Figure 'colCount' to know when to add a new <tr>.
        // NB: We actually add spacer columns and rows in-between those containing panels.
        render: function() {
            console.log("render...");
            var self = this;

            // Start with empty tbody...
            this.$el.empty();

            // Go through all the Figure panels...
            this.model.panels.each(function(panel, i) {

            //     // If we're on 0, add a new ROW
            //     if ((i % colCount) === 0) {
            //         // add the spacer row first,
            //         self.$el.append("<tr><td height='" + hspacer + "' colspan='" + (colCount*2) + "'> </td></tr>" );
            //         // then the one to contain our panels
            //         $currentRow = $("<tr></tr>").appendTo(self.$el);
            //     }

            //     // Add a spacer <td> first
            //     $currentRow.append("<td width='" + vspacer + "'> </td>");
            //     // Then Create our panel view <td> and add it
                var view = new PanelView({model:panel, uiState:this.uiState});
            //     $currentRow.append(view.render().el);

                self.$el.append(view.render().el);

            });
            return this;
        }
    });
