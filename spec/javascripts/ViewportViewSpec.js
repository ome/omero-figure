describe("Viewport", function() {

    var panel, view;

    var jcbPanel = {"labels":[
            {"color":"000000","text":"DNA","position":"top","size":"10"},
            {"color":"000000","text":"Control siRNA","position":"leftvert","size":"10"}
        ],
        "height":75.16804761992246,
        "channels":[
            {"metalabel":"","color":"FFFFFF","emissionWave":457,"label":"457","window":{"max":2377,"min":75,"end":2060,"start":190},"active":true},
            {"metalabel":"","color":"FF0000","emissionWave":617,"label":"617","window":{"max":5853,"min":47,"end":2151,"start":337},"active":false},
            {"metalabel":"","color":"FF0000","emissionWave":685,"label":"685","window":{"max":5892,"min":4,"end":3021,"start":298},"active":false}
        ],
        "deltaT":[],
        "selected":false,
        "baseUrl":"http://jcb-dataviewer.rupress.org/jcb",
        "width":78.3773707967566,
        "sizeT":1,
        "sizeZ":35,
        "dx":0,
        "dy":0,
        "rotation":0,
        "imageId":127,
        "pixel_size_y":0.06631,
        "pixel_size_x":0.06631,
        "datasetId":134,
        "datasetName":"Figure 5",
        "name":"Control siRNA Aurora B",
        "orig_width":340,
        "zoom":200,
        "orig_height":328,
        "theZ":16,
        "y":77.58632573688713,
        "x":80.72887374011736,
        "theT":0,
        "scalebar":{"show":true,"length":5,"position":"bottomleft","color":"FFFFFF"}
    }

    // Panel.prototype.save = function(attributes, options) {
    //     options = options || {};
    //     // options.silent = true;
    //     Backbone.Model.prototype.save.call(this, attributes, options);
    // }

    beforeEach(function() {
        panel = new Panel(jcbPanel);
        panel.url = "dummy";
        loadFixtures("previewTab.html");
    });

    it("should expose a property with its DOM element", function() {


        $("body").append('<div class="col-sm-10 no-padding" id="viewportContainer">' +
                    '<div id="vp_z_slider" class="pull-left"></div>' +
                    '<div id="vp_t_slider"></div>' +
                    '</div>');

        var models = [panel];
        var view = new ImageViewerView({models: models});   // auto-renders on init
        $("#viewportContainer").append(view.el);

        expect(view.$el).toExist();

        // $("body").append(view.el);
    });

})
