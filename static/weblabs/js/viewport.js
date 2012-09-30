
// This is a jQuery plugin for creating a 'viewport' from an <img> element.
// It wraps the image in a dragable div, and this is wrapped in a frame, so that
// the div and image can be dragged & zoomed within the frame.
// Reuses code from Carlos' ome.viewport.js plugin.
// This jQuery plugin style is based on code at http://docs.jquery.com/Plugins/Authoring

(function( $ ){

    "use strict";

    var methods = {

    // Initialise: wrap the image in 2 divs to create the viewport, adding other widgets for 
    // displaying and editing Zoom and Z index.
    init : function( options ) {

        return this.each(function(){
            var $this = $(this),    // image
                data = $this.data('viewport'),
                dragdiv,            // draggable div
                $frame,             // outer frame
                $msg;

            // If the plugin hasn't been initialized yet
            if ( ! data ) {

                data = {};
                data.orig_width = options.orig_width || $this.width();
                data['orig_height'] = options['orig_height'] || $this.height();
                data['wrapwidth'] = options['wrapwidth'] || data['orig_width'];
                data['wrapheight'] = options['wrapheight'] || data['orig_height'];
                data['cur_zoom'] = 100;

                $this.addClass('weblitz-viewport-img');
                $this.wrap('<div style="display: inline; position: absolute;" class="draggable"></div>');
                
                dragdiv = $this.parent();
                $this.parent().wrap('<div></div>');
                
                $frame = $this.parent().parent();
                $frame.css( {'border': 'solid black 1px',
                        'background-color': '#ddd', 
                        'position':'relative', 
                        'overflow': 'hidden'});
                $frame.css( {'width':data['wrapheight']+'px', 'height':data['wrapheight']+'px'} );
                
                // Status message display
                $msg = $('<div class="viewport-msg" style="display:none"></div>')
                    .hide()
                    .appendTo($frame);
                $this.bind('status',function(e, status){
                    $msg.text(status)
                        .show();
                });

                // Handle mouse-wheel zoom on the 'zoom' controls (NB: not on the image itself)
                // we want the image zoom to be centered on the point of the image that is currently
                // at the center of the viewport. cx & cy.
                // Since recentering on each individual mousewheel event leads to rounding errors,
                // we aggregate a whole series of mousewheel events, noting the cx & cy at the
                // start, and calculating the new position after each new event 
                // until we have a timeout of 500 millisecs (cx & cy are reset)
                var zoom_timeout, cx, cy;
                var mw_zoom = function (e, delta) {                    
                    // only note a new cx, cy if we're starting a new zoom
                    if (typeof cx === "undefined") {
                        var poffset = dragdiv.parent().offset(),
                            doffset = dragdiv.offset(),
                            offset_x = poffset.left - doffset.left,
                            offset_y = poffset.top - doffset.top;
                        var vp_cx = offset_x + (data['wrapwidth'] / 2),
                            vp_cy = offset_y + (data['wrapheight'] / 2);
                        
                        cx = (vp_cx / $this.width()) * data['orig_width'];
                        cy = (vp_cy / $this.height()) * data['orig_height'];
                    }

                    // now we can do the zoom, before recentering
                    methods.doZoom.apply( $this, [delta, false] );  // don't recenter

                    // recenter
                    var move_x = (cx / data['orig_width']) * $this.width(),
                        off_x = move_x - (data['wrapwidth'] / 2),
                        move_y = (cy / data['orig_height']) * $this.height(),
                        off_y = move_y - (data['wrapheight'] / 2);
                    dragdiv.css({left: -off_x, top: -off_y});

                    // check we're within viewport
                    methods.doMove.apply( $this, [0,0] );

                    if (zoom_timeout) {
                        // we're currently zooming
                        clearTimeout(zoom_timeout);
                    }

                    // after half a sec of no mouse-wheel zooming - clear cx and cy.
                    zoom_timeout = setTimeout(function(){
                        cx = undefined;
                        cy = undefined;
                    }, 500);
                    
                    e.preventDefault();
                    return false;
                };
                
                // prepare and add buttons for zooming
                var $zm_1_1 = $('<button class="zoom_1_1" title="Zoom 1:1">1:1</button>')
                    .click(function(){
                        methods.setZoom.apply( $this, [100] );
                    });
                var $zm_tofit = $('<button class="zoom_to_fit" title="Zoom to fit">fit</button>')
                    .click(function(){
                        methods.zoomToFit.apply( $this, [] );
                    });
                var $zm_in = $('<button class="zoom_in" title="Zoom In"></button>')
                    .click(function(){
                        methods.doZoom.apply( $this, [10] );
                    });
                var $zm_out = $('<button class="zoom_out" title="Zoom Out"></button>')
                    .click(function(){
                        methods.doZoom.apply( $this, [-10] );
                    });
                $('<div class="zoom_percent" title="Use Mouse-wheel to Zoom"><div class="cur_zoom"></div></div>')
                    .mousewheel(mw_zoom)
                    .append($zm_in)
                    .append($zm_out)
                    .append($zm_1_1)
                    .append($zm_tofit)
                    .mouseout(function(){$zm_1_1.hide(); $zm_tofit.hide(); $(this).css('opacity','0.7');})
                    .mouseover(function(){$zm_1_1.show(); $zm_tofit.show(); $(this).css('opacity','1.0');})
                    .css('opacity','0.7')
                    .appendTo($frame);
                $zm_1_1.hide();
                $zm_tofit.hide();

                // allows a class that may be on the image to be moved to parent frame
                // to maintain layout of the frame in place of the image
                if (typeof options.klass === "string") {
                    $frame.addClass(options.klass);
                    $this.removeClass(options.klass);
                }
                $(this).data('viewport', data);

                /**
                 * Handle panning by mouse drag
                 */
                var ondrag = false;
                var clickinterval = null;
                var drag_px;
                var drag_py;
                dragdiv
                  .click(function (e) {
                      if (clickinterval !== null) {
                        clickinterval = null;
                        $this.trigger(e);
                      }
                    })
                .mousedown(function (e) {
                  drag_px = e.screenX;
                  drag_py = e.screenY;
                  //jQuery(this).css('cursor', 'move');
                  $(this).addClass('ondrag');
                  ondrag = true;
                  if (clickinterval !== null) {
                    clearInterval(clickinterval);
                  }
                  clickinterval = setTimeout(function () {clearTimeout(clickinterval); clickinterval = null;}, 250);
                  return false;
                })
                .mouseup(function (e) {
                  if (ondrag) {
                    ondrag = false;
                    $(this).removeClass('ondrag');
                    return false;
                    //jQuery(this).css('cursor', 'default');
                  }
                })
                .mouseout(function (e) {
                  if (ondrag) {
                    ondrag = false;
                    $(this).removeClass('ondrag');
                    return false;
                    //jQuery(this).css('cursor', 'default');
                  }
                })
                .mousemove(function (e) {
                  if (ondrag) {
                    methods.doMove.apply( $this, [e.screenX-drag_px, e.screenY-drag_py] );
                    drag_px = e.screenX;
                    drag_py = e.screenY;
                    return false;
                  }
                })
                // Double-clicking on the image zooms in (zoom x 2).
                // Zooming is centered on the point that is clicked.
                .dblclick(function (e) {
                    var x = e.pageX - dragdiv.offset().left,
                        y = e.pageY - dragdiv.offset().top,
                        w_before = $this.width(),
                        h_before = $this.height(),
                        czm = $this.data('viewport')['cur_zoom'];
                    if (czm) {
                        methods.setZoom.apply( $this, [czm * 2, false] );
                    } else {
                        methods.doZoom.apply( $this, [50] );
                    }
                    // after zoom, center the zoom on the clicked x and y coords
                    var zoom_w = $this.width() - w_before;
                    var zoom_h = $this.height() - h_before;
                    var offset_w = zoom_w * (x / w_before);
                    var offset_h = zoom_h * (y / h_before);
                    methods.doMove.apply( $this, [-offset_w, -offset_h] );
                    return false;
                });

            // By default, after initialising the viewport, we zoom to fit.
            methods.zoomToFit.apply( $this, [] );
            }
        });
    },

    setZoom : function (val, recenter) {
        return this.each(function(){
            var $this = $(this);
            var data = $this.data('viewport');
            var width = +(data['orig_width']*val/100);
            var height = +(data['orig_height']*val/100);
            data['cur_zoom'] = val;

            $this.css({'width': width, 'height': height});
            //overlay.attr({width: width, height: height});
            $this.data('viewport', data);
            
            $('.cur_zoom', $this.parent().parent()).text(parseInt(val,10) + " %");
            
            if (recenter !== false) {
                methods.doMove.apply( $(this), [0, 0] );
            }
        });
    },

    doZoom : function(incr, recenter) {
        return this.each(function(){
            var $this = $(this);
            var data = $this.data('viewport');
            var zoom = data['cur_zoom'] + incr;
            methods.setZoom.apply( $(this), [zoom, recenter] );
        });
    },

    zoomToFit : function() {
        return this.each(function(){
            
            var $this = $(this);
            var data = $this.data('viewport');
            var ztf = Math.min(data['wrapwidth'] * 100.0 / data['orig_width'], 
                    data['wrapheight'] * 100.0 / data['orig_height']);
            methods.setZoom.apply( $(this), [ztf] );
        });
    },
    
    doMove : function (deltax, deltay, smooth, auto_move_cb) {
        
        return this.each(function(){
            
            var $this = $(this);
            var data = $this.data('viewport');
            var dragdiv = $this.parent();
            var dragdiv_dom = dragdiv.get(0);
            var wrapdiv = $(dragdiv_dom.parentNode);
            
            /* Image and wrapping div */
            var pos = dragdiv.offset();
            var rel = wrapdiv.offset();

            pos.left -= rel.left + parseInt($.curCSS(wrapdiv[0], "borderLeftWidth", true),10);
            pos.top -= rel.top + parseInt($.curCSS(wrapdiv[0], "borderTopWidth", true),10);
            var left = pos.left + deltax;
            var top = pos.top + deltay;
            var self = this;

            var imagewidth = $this.width(),
                wrapwidth = data['wrapwidth'],
                imageheight = $this.height(),
                wrapheight = data['wrapheight'];

            /* Is the viewport bigger than the image ? */
            if (imagewidth <= wrapwidth) {
                /* Viewport wider than image, center horizontally */
                left = (wrapwidth - imagewidth) / 2;
            } else {
                /* Image wider than viewport... */
                if (left >= 0) {
                    left = 0;
                }
                if ((wrapwidth - imagewidth) >= left ) {
                    left = wrapwidth - imagewidth;
                }
            }

            if (imageheight <= wrapheight) {
                /* Viewport higher than image, center vertically */
                top = (wrapheight - imageheight) / 2;
            } else {
                /* Image higher than viewport... */
                if (top >= 0) {
                    top = 0;
                }
                if ((wrapheight - imageheight) >= top ) {
                    top = wrapheight - imageheight;
                }
            }
            if (left === dragdiv_dom.offsetLeft && top === dragdiv_dom.offsetTop) {
                return;
            }

            if (smooth) {
                dragdiv.animate({left: left, top: top}, 'fast', 'linear', function () {
                    if (auto_move_cb !== null && auto_move_cb()) {
                        self.doMove(deltax, deltay, smooth, auto_move_cb);
                    }
                });
            } else {
                dragdiv.css({left: left, top: top});
            }

        });
    },

    destroy : function( ) {

        return this.each(function(){

            var $this = $(this);

            $('.zoom_percent', $this.parent().parent()).remove();
            $this.unwrap();
            $this.unwrap();
            $this.removeData('viewport');
            $this.unbind('status');
        });
    }
    };

    $.fn.viewport = function( method ) {

        if ( methods[method] ) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        }
        $.error( 'Method ' +  method + ' does not exist on jQuery.viewport' );
    };

}(jQuery));