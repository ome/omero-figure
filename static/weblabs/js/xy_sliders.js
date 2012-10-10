
// This is a jQuery plugin for adding scroll bars on the x and y axes of an element.
// It requires another element 'image' to be passed in the options - this image is
// notified of changes in the sliders and we listen for 'changeZ' / 'changeT' 
// events on the image to update the sliders position
// We also need current and max Z/T positions in the init options.
// This jQuery plugin is based on code at http://docs.jquery.com/Plugins/Authoring
// Example useage:
// $frame.xy_sliders({
//     image: $image,      // will sync currZ & currT with this. 
//     theZ: currZ,
//     theT: currT,
//     sizeZ: sizeZ,
//     sizeT: sizeT
// });

(function ($) {

    "use strict";

    var methods = {

    // initialise the plugin
    init : function (options) {

        return this.each(function(){
            var $this = $(this),
                data = $this.data('xy_sliders');

            // If the plugin hasn't been initialized yet
            if ( ! data ) {
                data = {};
                $this.wrap("<div class='slider_frame'></div>");
                var $slider_frame = $this.parent()
                    .css({
                        'height': $this.height() + "px",
                        'width': $this.width() + "px",
                        'position': 'relative'
                    });
                
                var $vertical_slider = $("<div class='vertical_slider'></div>")
                    .appendTo($slider_frame)
                    .css({
                        'height': $this.height() + 'px',
                        'top': '0px',
                        'position': 'absolute',
                        'left': '-5px',
                        'width': '5px'
                    });
                if (options.sizeZ > 1) {
                    $vertical_slider.slider({
                        orientation: "vertical",
                        min: 0,
                        max: options.sizeZ-1,
                        value: options.theZ,
                        slide: function( event, ui ) {
                            options.image.src_loader("load_src", ui.value);
                        }
                    });
                    options.image.bind("changeZ", function(e, zpos) {
                        $vertical_slider.slider('value', zpos);
                    });
                }
                var $horizontal_slider = $("<div class='horizontal_slider'></div>")
                    .appendTo($slider_frame)
                    .css({
                        'height': '5px',
                        'top': $this.height() + 'px',
                        'position': 'absolute',
                        'left': '0px',
                        'width': $this.width() + 'px'
                    });
                if (options.sizeT > 1) {
                    $horizontal_slider.slider({
                        min: 0,
                        max: options.sizeT-1,
                        value: options.theT,
                        slide: function( event, ui ) {
                            options.image.src_loader("load_src", null, ui.value);
                        }
                    });
                    options.image.bind("changeT", function(e, tpos) {
                        $horizontal_slider.slider('value', tpos);
                    });
                    
                }
                
                $this.data('xy_sliders', data);
                
            }
        });
    },

    // revert the element to it's original state: remove data and listeners.
    destroy : function( ) {

        return this.each(function(){

            var $this = $(this);

            $(".vertical_slider", $this.parent()).remove();
            $(".horizontal_slider", $this.parent()).remove();
            $this.unwrap();
            $this.removeData('xy_sliders');
        });
    }
    };


    // the plugin definition: either we init or we're calling a named method.
    $.fn.xy_sliders = function( method ) {

        if ( methods[method] ) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        }
        $.error( 'Method ' +  method + ' does not exist on jQuery.xy_sliders' );
    };

}(jQuery));