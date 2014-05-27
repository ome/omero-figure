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
        // expect(view.$el).toExist();

        // This is OK...
        console.log("FigureModel", FigureModel);

        // But later objects from the same figure.js are undefined
        // since Views try to do _.template($("#some_element").text()) which fails.
        console.log("ProxyRectModel", ProxyRectModel);
        console.log("ImageViewerView", ImageViewerView);
        view = new ImageViewerView();
    });

})
