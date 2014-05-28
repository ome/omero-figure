describe("Viewport", function() {

    var panel, view;

    Panel.prototype.save = function(attributes, options) {
        options = options || {};
        // options.silent = true;
        Backbone.Model.prototype.save.call(this, attributes, options);
    }

    beforeEach(function() {
        panel = new Panel();
        panel.url = "dummy";

        // view = new FigureView();
        // console.log("ImageViewerView", ImageViewerView);
        // view = new ImageViewerView();
        // $("body").append(view.el);
    });

    it("should expose a property with its DOM element", function() {

        var models = [panel];
        var view = new ImageViewerView({models: models});
        expect(view.$el).toExist();
    });

})
