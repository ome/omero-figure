describe("Viewport", function() {

    var panel, view, $vp_img;

    var jcbPanel = {"labels":[
            {"color":"000000","text":"DNA","position":"top","size":"10"},
            {"color":"000000","text":"Control siRNA","position":"leftvert","size":"10"}
        ],
        "channels":[
            {"metalabel":"","color":"0000FF","emissionWave":457,"label":"457","window":{"max":2377,"min":75,"end":2060,"start":190},"active":true},
            {"metalabel":"","color":"00FF00","emissionWave":617,"label":"617","window":{"max":5853,"min":47,"end":2151,"start":337},"active":true},
            {"metalabel":"","color":"FF0000","emissionWave":685,"label":"685","window":{"max":5892,"min":4,"end":3021,"start":298},"active":true}
        ],
        "deltaT":[],
        "selected":false,
        "baseUrl":"http://jcb-dataviewer.rupress.org/jcb",
        "width":200,
        "height":400,
        "sizeT":1,
        "sizeZ":35,
        "dx":200,
        "dy":200,
        "rotation":0,
        "imageId":127,
        "pixel_size_y":0.06631,
        "pixel_size_x":0.06631,
        "datasetId":134,
        "datasetName":"Figure 5",
        "name":"Control siRNA Aurora B",
        "orig_width":400,
        "orig_height":400,
        "zoom":100,
        "theZ":16,
        "y":77.58632573688713,
        "x":80.72887374011736,
        "theT":0,
        "scalebar":{"show":true,"length":5,"position":"bottomleft","color":"FFFFFF"}
    }

    panel = new Panel(jcbPanel);
    panel.url = "dummy";

    // var models = [panel];
    // view = new ImageViewerView({models: models});   // auto-renders on init


    beforeEach(function() {

        // remove any previous viewport
        $("#previewTab").remove();

        // set fixture for next test
        $("body").append('<div class="tab-pane active" style="width:250px" id="previewTab">' +
'    <div class="col-sm-2 no-padding" id="channelToggle"></div>' +
'    <div class="col-sm-10 no-padding" id="viewportContainer">' +
'        <div id="vp_z_slider" class="pull-left"></div>' +
'        <div id="vp_t_slider"></div>' +
'    </div>' +
'    <div class="clearfix" style="padding-bottom:3px"></div>' +
'    <div id="channel_sliders"></div>' +
'    <div class="clearfix"></div>' +
'    <div class="tab-footer">' +
'        <div class="col-sm-2" style="padding:5px">Zoom:</div>' +
'        <div class="col-sm-6 no-padding">' +
'            <div id="vp_zoom_slider"></div>' +
'        </div>' +
'        <div id="vp_zoom_value" class="col-sm-4" style="padding:5px"></div>' +
'        <div class="clearfix"></div>' +
'    </div>' +
'</div>');

        var models = [panel];
        view = new ImageViewerView({models: models});   // auto-renders on init
        $("#viewportContainer").append(view.el);
        $vp_img = $(".vp_img");
        // console.log( $vp_img.length);
    });


    it("should expose a property with its DOM element", function() {
        expect(view.$el).toExist();
    });

    it("should be centered when dx and dy are 0", function() {
        panel.set({
            'dx': 0,
            'dy': 0,
            "width":200,
            "height":200
        });

        // Can't seem to access these elements directly
        console.log( "$vp_img.length", $vp_img.length);
        console.log("view.$vp_frame.length", view.$vp_frame);

        // expect($vp_img).toHaveCss({"top":0, "left":0});
    });

})
