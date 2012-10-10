
// This is a jQuery plugin for an <img> for loading and keeping track of the
// src attribute, theZ, theT, and a map of query-string attributes, allowing
// any to be updated independently.
// It triggers a 'status' message to notify loading / loaded status etc.
// This jQuery plugin is based on code at http://docs.jquery.com/Plugins/Authoring
(function ($) {

    "use strict";

    var get_src;
    var methods = {

    // initialise the plugin
    init : function (options) {

        get_src = options['get_src'];

        return this.each(function(){
            var $this = $(this),
                data = $this.data('src_loader');

            // If the plugin hasn't been initialized yet
            if ( ! data ) {

                data = {};
                data['image_id'] = options['image_id'];
                // query_opts are used to generate query string for img src.
                data['query_opts'] = options['query_opts'];
                data['sizeZ'] = options['sizeZ'];
                data['sizeT'] = options['sizeT'];
                if (options['theZ']) {
                    data['theZ'] = options['theZ'];
                } else {
                    data['theZ'] = 0;
                }
                if (options['theT']) {
                    data['theT'] = options['theT'];
                } else {
                    data['theT'] = 0;
                }


                $this.mousewheel(function (e, delta) {
                    var incr = delta > 0 ? 1 : -1;
                    methods.increment_z.apply($this, [incr]);
                    e.preventDefault();
                });
                
                $this.data('src_loader', data);
                
                // finally - load the current image
                methods.load_src.apply( $this, [data['theZ'], data['theT']] );
                
            }
        });
    },

    // increment Z index and update src
    increment_z : function(incr) {
        return this.each(function(){
            var $this = $(this),
                data = $this.data('src_loader');

            var theZ = data['theZ'] + incr;
            methods.load_src.apply( $this, [theZ] );
        });
    },

    // set the src attribute of the image, triggering a 'status' event (with message)
    // to indicate start of loading and completion.
    load_src : function(theZ, theT) {

        return this.each(function(){
            var $this = $(this),
                data = $this.data('src_loader');

            var load_msg = "";
            if (typeof theZ === 'number' && theZ >= 0){
                if (typeof data['sizeZ'] === 'undefined' || theZ < data['sizeZ']) {
                    data['theZ'] = theZ;
                    $this.data('src_loader', data);
                    load_msg += "Z: " + theZ;
                    $this.trigger("changeZ", [theZ]);
                }
            }
            if (typeof theT === 'number' && theT >= 0){
                if (typeof data['sizeT'] === 'undefined' || theT < data['sizeT']) {
                    data['theT'] = theT;
                    $this.data('src_loader', data);
                    load_msg += "T: " + theT;
                    $this.trigger("changeT", [theT]);
                }
            }

            var src = get_src(data['image_id'], data['theZ'], data['theT']);
            
            var rcb = function () {
                //after_img_load_cb(callback);
                $this.unbind('load', rcb);
                if (src === $this.attr('src')) {
                    // if another src update hasn't started loading again, clear load msg
                    $this.trigger('status', [load_msg]);
                }
            };
            if (data['query_opts'] && Object.keys(data['query_opts']).length > 0) {
                var query = [],
                    query_opts = data['query_opts'],
                    q;
                for (q in query_opts) {
                    if (query_opts.hasOwnProperty(q)){
                        query.push(q + "=" + data['query_opts'][q]);
                    }
                }
                src += "?" + query.join("&");
            }
            if (src !== $this.attr('src')){
                $this.trigger('status', ["Load.." + load_msg]);
                $this.load(rcb);
                $this.attr('src', src);
            }
        });
    },

    // revert the element to it's original state: remove data and listeners.
    destroy : function( ) {

        return this.each(function(){

            var $this = $(this);

            $this.removeData('src_loader');
            $this.unbind('mousewheel');
        });
    }
    };


    // the plugin definition: either we init or we're calling a named method.
    $.fn.src_loader = function( method ) {

        if ( methods[method] ) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        }
        $.error( 'Method ' +  method + ' does not exist on jQuery.src_loader' );
    };

}(jQuery));