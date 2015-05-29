this["JST"] = this["JST"] || {};

this["JST"]["static/figure/templates/channel_toggle_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n\n    ';
 _.each(channels, function(c, i) { ;
__p += '\n        <div class="btn-group" style="padding:2px">\n            <button type="button"\n            title="Turn channel on/off"\nclass="btn btn-default channel-btn ';
 if(c.active) { ;
__p += 'ch-btn-down';
 } else if (typeof c.active == 'boolean') { ;
__p += 'ch-btn-up';
 } else { ;
__p += 'ch-btn-flat';
 };
__p += '"\n                    data-index="' +
((__t = ( i )) == null ? '' : __t) +
'"\n                    style="background-color:#' +
((__t = ( c.color )) == null ? '' : __t) +
'">\n                &nbsp\n            </button>\n            <button type="button" class="btn btn-default dropdown-toggle"\n                    data-toggle="dropdown" title="Pick channel color">\n                <span class="caret"></span>\n            </button>\n            <ul class="dropdown-menu colorpicker" data-index="' +
((__t = ( i )) == null ? '' : __t) +
'">\n                <li class="dropdown-header">Channel Color</li>\n                <li class="divider"></li>\n                <li><a data-color="0000FF" href="#">\n                    <span style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\n                </a></li>\n                <li><a data-color="00FF00" href="#">\n                    <span style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\n                </a></li>\n                <li><a data-color="FF0000" href="#">\n                    <span style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\n                </a></li>\n                <li><a data-color="FFFF00" href="#">\n                    <span style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\n                </a></li>\n                <li><a data-color="FFFFFF" href="#">\n                    <span style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\n                </a></li>\n                <li><a data-color="FF00FF" href="#">\n                    <span style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\n                </a></li>\n                <li class="divider"></li>\n                <li><a data-color="colorpicker" data-oldcolor="' +
((__t = ( c.color )) == null ? '' : __t) +
'" href="#">\n                    <span class="colorpickerOption">&nbsp &nbsp &nbsp</span>&nbsp More Colors...\n                </a></li>\n            </ul>\n        </div><br>\n    ';
 }); ;
__p += '\n\n    <div class="btn-group rotation-controls" style="padding:2px">\n        <button type="button" class="btn btn-default btn-sm show-rotation" title="Rotate image">\n            <span class="glyphicon glyphicon-repeat"></span>\n            <span class="rotation_value">' +
((__t = ( rotation )) == null ? '' : __t) +
'</span> &deg;\n        </button>\n\n        <div class="rotation-slider"></div>\n    </div>\n\n\n    <div class="btn-group" style="padding:2px" title="Maximum intensity Z-projection (choose range with 2 handles on Z-slider)">\n        <button type="button" class="btn btn-default btn-sm z-projection\n                ';
 if(z_projection) { ;
__p += 'zp-btn-down';
 } else if (typeof z_projection == 'boolean') { ;

 } else { ;
__p += 'ch-btn-flat';
 };
__p += '"\n                ';
 if (z_projection_disabled) { ;
__p += 'disabled="disabled"';
 } ;
__p += '\n                >\n            <span class="glyphicon"></span>\n        </button>\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/figure_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '    <!-- The content of <div class=\'imagePanel\'> for each panel -->\n    <div class="imgContainer">\n        <img class="img_panel" />\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/info_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <p>';
 print(_.escape(name)) ;
__p += '</p>\n    <div class="clearfix"></div>\n\n    <table class="table">\n        <tbody>\n            <tr><td>Image\n                ';
 if (imageLink) { ;
__p += '\n                <a class="pull-right" target="new"\n                    href="' +
((__t = ( imageLink )) == null ? '' : __t) +
'">\n                    <span class="glyphicon glyphicon-share"></span> Show in Webclient\n                </a>\n                ';
 } ;
__p += '\n            </td></tr>\n            <tr><td>\n                <div class="col-sm-6"><small><strong>Image ID</strong>:</small></div>\n                <div class="col-sm-6">\n                    <small>' +
((__t = ( imageId )) == null ? '' : __t) +
'</small>\n                    <button type="button"\n                            style="position:absolute; top:0px; right:0px"\n                            ';
 if(!setImageId) { ;
__p += 'disabled="disabled"';
 } ;
__p += '\n                            class="btn btn-small btn-success setId">\n                        Edit ID\n                    </button>\n                </div>\n\n                <div class="col-sm-6"><small><strong>Dimensions (XY)</strong>:</small></div>\n                <div class="col-sm-6"><small>' +
((__t = ( orig_width )) == null ? '' : __t) +
' x ' +
((__t = ( orig_height )) == null ? '' : __t) +
'</small></div>\n\n                <div class="col-sm-6"><small><strong>Z-sections/Timepoints</strong>:</small></div>\n                <div class="col-sm-6"><small>' +
((__t = ( sizeZ )) == null ? '' : __t) +
' x ' +
((__t = ( sizeT )) == null ? '' : __t) +
'</small></div>\n                <div class="clearfix"></div>\n                <div class="col-sm-6"><small><strong>Channels</strong>:</small></div>\n                <div class="col-sm-6"><small>\n                    ';
 _.each(channel_labels, function(c, i) {
                        print(_.escape(c)); print((i < channels.length-1) ? ", " : "");
                    }); ;
__p += '\n                </small></div>\n            </td></tr>\n        </tbody>\n    </table>\n';

}
return __p
};

this["JST"]["static/figure/templates/labels_form_inner_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <div class="input-group pull-left">\n        <input type="text" class="label-text form-control input-sm" \n                placeholder="Label" value="';
 print(_.escape(l.text)) ;
__p += '" style="max-height:29px"/>\n        ';
 if (!edit){ ;
__p += '\n            <div class="input-group-btn">\n                <button type="button" class="btn btn-default btn-sm dropdown-toggle"\n                        data-toggle="dropdown" title="Label from data...">\n                    <span class="caret"></span>\n                </button>\n                <ul class="dropdown-menu pull-right">\n                    <li role="presentation" class="dropdown-header">Create Label(s) From:</li>\n                    <li role="presentation" class="divider"></li>\n                    <li><a href="#" data-label="[image-name]">Image Name</a></li>\n                    <li><a href="#" data-label="[dataset-name]">Dataset Name</a></li>\n                    <li><a href="#" data-label="[channels]">Channels</a></li>\n                    <li class="add_time_label">\n                        <a href="#" data-label="[time-secs]">Time (secs)</a>\n                    </li>\n                    <li class="add_time_label">\n                        <a href="#" data-label="[time-mins]">Time (mins)</a>\n                    </li>\n                    <li class="add_time_label">\n                        <a href="#" data-label="[time-hrs:mins:secs]">Time (hrs:mins:secs)</a>\n                    </li>\n                    <li class="add_time_label">\n                        <a href="#" data-label="[time-hrs:mins]">Time (hrs:mins)</a>\n                    </li>\n                </ul>\n            </div>\n        ';
 } ;
__p += '\n    </div>\n\n    <div class="btn-group">\n        <button type="button" class="font-size btn btn-default btn-sm dropdown-toggle" title="Font Size"\n            data-toggle="dropdown" style="width:33px">\n            <span>' +
((__t = ( l.size )) == null ? '' : __t) +
'</span>\n            <span class="caret"></span>\n        </button>\n        <ul class="dropdown-menu" role="menu">\n        ';
 _.each([6,8,10,12,14,18,21,24,36,48],function(p){
            print ("<li><a href='#'><span>"+p+"</span></a></li>")
        }); ;
__p += '\n        </ul>\n    </div>\n\n    <div class="btn-group">\n        <button type="button" class="label-position btn btn-default btn-sm dropdown-toggle" \n                title="Position" data-toggle="dropdown">\n            <span data-position="' +
((__t = ( position )) == null ? '' : __t) +
'" class="labelicon-' +
((__t = ( position )) == null ? '' : __t) +
' glyphicon \n                ';
 if (_.contains(['top','bottom','left','leftvert','right'],position)) print('glyphicon-log-out'); else {print('glyphicon-new-window')} ;
__p += '"></span>\n            <span class="caret"></span>\n        </button>\n        <ul class="dropdown-menu" role="menu">\n            <li role="presentation" class="dropdown-header">Inside Corners</li>\n            <li><a href="#">\n                <span data-position="topleft" class="labelicon-topleft glyphicon glyphicon-new-window"></span>\n                Top Left</a>\n            </li>\n            <li><a href="#">\n                <span data-position="topright" class="labelicon-topright glyphicon glyphicon-new-window"></span>\n                Top Right</a>\n            </li>\n            <li><a href="#">\n                <span data-position="bottomleft" class="labelicon-bottomleft glyphicon glyphicon-new-window"></span>\n                Bottom Left</a>\n            </li>\n            <li><a href="#">\n                <span data-position="bottomright" class="labelicon-bottomright glyphicon glyphicon-new-window"></span>\n                Bottom Right</a>\n            </li>\n\n            <li role="presentation" class="divider"></li>\n            <li role="presentation" class="dropdown-header">Outside Edges</li>\n            <li><a href="#">\n                <span data-position="left" class="labelicon-left glyphicon glyphicon-log-out"></span> Left</a>\n            </li>\n            <li><a href="#">\n                    <span data-position="leftvert" class="labelicon-leftvert glyphicon glyphicon-log-out"></span> \n                    Left vertical\n                </a>\n            </li>\n            <li><a href="#">\n                <span data-position="top" class="labelicon-top glyphicon glyphicon-log-out"></span> Top</a>\n            </li>\n            <li><a href="#">\n                <span data-position="right" class="labelicon-right glyphicon glyphicon-log-out"></span> Right</a>\n            </li>\n            <li><a href="#">\n                <span data-position="bottom" class="labelicon-bottom glyphicon glyphicon-log-out"></span> Bottom</a>\n            </li>\n        </ul>\n    </div>\n\n    <div class="btn-group">\n        <button type="button" class="label-color btn btn-default btn-sm dropdown-toggle" title="Label Color"\n            data-toggle="dropdown">\n            <span data-color="' +
((__t = ( l.color )) == null ? '' : __t) +
'" style="background-color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'">&nbsp &nbsp &nbsp</span>\n            <span class="caret"></span>\n        </button>\n        <ul class="dropdown-menu colorpicker" role="menu">\n            <li><a href="#">\n                <span data-color="000000" style="background-color:#000">&nbsp &nbsp &nbsp</span>&nbsp Black\n            </a></li>\n            <li><a href="#">\n                <span data-color="0000FF" style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\n            </a></li>\n            <li><a href="#">\n                <span data-color="00FF00" style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\n            </a></li>\n            <li><a href="#">\n                <span data-color="FF0000" style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\n            </a></li>\n            <li><a href="#">\n                <span data-color="FFFF00" style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\n            </a></li>\n            <li><a href="#">\n                <span data-color="FFFFFF" style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\n            </a></li>\n            <li><a href="#">\n                <span data-color="FF00FF" style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\n            </a></li>\n            <li class="divider"></li>\n            <li><a data-color="colorpicker" data-oldcolor="' +
((__t = ( l.color )) == null ? '' : __t) +
'" href="#">\n                <span class="colorpickerOption">&nbsp &nbsp &nbsp</span>&nbsp More Colors...\n            </a></li>\n        </ul>\n    </div>\n\n    ';
 if (edit){ ;
__p += '\n        <button type="button" title="Delete Label" class="close delete-label" aria-hidden="true">&times;</button>\n    ';
 } else { ;
__p += '\n\n        <button type="submit" class="btn btn-sm btn-success pull-right">Add</button>\n\n    ';
 } ;
__p += '\n';

}
return __p
};

this["JST"]["static/figure/templates/labels_form_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n        <div class="">\n\n            ';
 _.each(labels, function(l, i) { ;
__p += '\n\n                <form class="edit-label-form form-inline" role="form" data-key="' +
((__t = ( l.key )) == null ? '' : __t) +
'">\n\n                    ' +
((__t = ( inner_template({l:l, position:position, edit:true}) )) == null ? '' : __t) +
'\n\n                </form>\n\n            ';
 }); ;
__p += '\n        </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/scalebar_form_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <div class="pixel_size_form" style="position:relative">\n        <div class="pixel_size_div">\n            Pixel Size:\n            <input class="input-sm form-control pixel_size_input" placeholder="Pixel Size (' +
((__t = ( symbol )) == null ? '' : __t) +
')"\n                    style="width:100px; display:none" value="' +
((__t = ( pixel_size_x )) == null ? '' : __t) +
'">\n            <span class="pixel_size_display">\n                ';
 if (!pixel_size_x)
                    {print('<span style="color:red">NOT SET</span>')}
                else if (typeof pixel_size_x === 'number')
                    {print(pixel_size_x.toFixed(3) + " " + symbol)}
                else
                    {print(pixel_size_x + " " + symbol)} ;
__p += '\n            </span>\n        </div>\n\n    </div>\n\n    <form class="scalebar_form form-inline">\n\n    <div class="input-group pull-left">\n        <input type="text" class="scalebar-length form-control input-sm" \n                placeholder="Length" value="' +
((__t = ( length )) == null ? '' : __t) +
'" />\n    </div>\n\n    <div class="form-group"><div class="checkbox checkbox-inline">\n        <label>' +
((__t = ( symbol )) == null ? '' : __t) +
'</label>\n        </div>\n    </div>\n\n    <div class="btn-group">\n        <button type="button" class="label-position btn btn-default btn-sm dropdown-toggle" \n                title="Position" data-toggle="dropdown">\n            <span data-position="' +
((__t = ( position )) == null ? '' : __t) +
'" class="labelicon-' +
((__t = ( position )) == null ? '' : __t) +
' glyphicon \n                ';
 if (_.contains(['top','bottom','left','right'],position)) print('glyphicon-log-out'); else {print('glyphicon-new-window')} ;
__p += '"></span>\n            <span class="caret"></span>\n        </button>\n        <ul class="dropdown-menu" role="menu">\n            <li role="presentation" class="dropdown-header">Inside Corners</li>\n            <li><a href="#">\n                <span data-position="topleft" class="labelicon-topleft glyphicon glyphicon-new-window"></span>\n                Top Left</a>\n            </li>\n            <li><a href="#">\n                <span data-position="topright" class="labelicon-topright glyphicon glyphicon-new-window"></span>\n                Top Right</a>\n            </li>\n            <li><a href="#">\n                <span data-position="bottomleft" class="labelicon-bottomleft glyphicon glyphicon-new-window"></span>\n                Bottom Left</a>\n            </li>\n            <li><a href="#">\n                <span data-position="bottomright" class="labelicon-bottomright glyphicon glyphicon-new-window"></span>\n                Bottom Right</a>\n            </li>\n        </ul>\n    </div>\n\n    <div class="btn-group">\n        <button type="button" class="label-color btn btn-default btn-sm dropdown-toggle" title="Label Color"\n            data-toggle="dropdown">\n            <span data-color="' +
((__t = ( color )) == null ? '' : __t) +
'" style="background-color:#' +
((__t = ( color )) == null ? '' : __t) +
'">&nbsp &nbsp &nbsp</span>\n            <span class="caret"></span>\n        </button>\n        <ul class="dropdown-menu colorpicker" role="menu">\n            <li><a href="#">\n                <span data-color="000000" style="background-color:#000">&nbsp &nbsp &nbsp</span>&nbsp Black\n            </a></li>\n            <li><a href="#">\n                <span data-color="0000FF" style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\n            </a></li>\n            <li><a href="#">\n                <span data-color="00FF00" style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\n            </a></li>\n            <li><a href="#">\n                <span data-color="FF0000" style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\n            </a></li>\n            <li><a href="#">\n                <span data-color="FFFF00" style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\n            </a></li>\n            <li><a href="#">\n                <span data-color="FFFFFF" style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\n            </a></li>\n            <li><a href="#">\n                <span data-color="FF00FF" style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\n            </a></li>\n        </ul>\n    </div>\n\n    <div class="checkbox">\n        <label>\n            <input type="checkbox" class="scalebar_label" ';
 if (show_label) print("checked") ;
__p += ' > Label\n        </label>\n    </div>\n\n    <div class="btn-group">\n        <button type="button" class="scalebar_font_size btn btn-default btn-sm dropdown-toggle" title="Label Size"\n            data-toggle="dropdown" style="width:33px; ';
 if (!show_label) print("display:none") ;
__p += '">\n            <span>' +
((__t = ( font_size )) == null ? '' : __t) +
'</span>\n            <span class="caret"></span>\n        </button>\n        <ul class="dropdown-menu" role="menu">\n        ';
 _.each([6,8,10,12,14,18,21,24,36,48],function(p){
            print ("<li><a href='#'><span>"+p+"</span></a></li>")
        }); ;
__p += '\n        </ul>\n    </div>\n\n    ';
 if (show){ ;
__p += '\n        <button type="submit" class="show_scalebar btn btn-sm btn-success pull-right">Show</button>\n    ';
 } else { ;
__p += '\n        <button type="button" class="hide_scalebar btn btn-sm btn-default pull-right">Hide</button>\n    ';
 } ;
__p += '\n    </form>\n';

}
return __p
};

this["JST"]["static/figure/templates/scalebar_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <div class="scalebar label_' +
((__t = ( position )) == null ? '' : __t) +
'" style="background-color: #' +
((__t = ( color )) == null ? '' : __t) +
'">\n        ';
 if (show_label) { ;
__p += '\n            <div class=\'scalebar-label\' style=\'color: #' +
((__t = ( color )) == null ? '' : __t) +
'; font-size: ' +
((__t = ( font_size )) == null ? '' : __t) +
'px\'>\n                ' +
((__t = ( length )) == null ? '' : __t) +
' ' +
((__t = ( symbol )) == null ? '' : __t) +
'\n            </div>\n        ';
 } ;
__p += '\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/viewport_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n        <div id="vp_z_label">Z</div>\n        <div id="vp_z_value">' +
((__t = ( theZ )) == null ? '' : __t) +
'/' +
((__t = ( sizeZ )) == null ? '' : __t) +
'</div>\n        <div id="vp_t_label">T</div>\n        <div id="vp_t_value">' +
((__t = ( theT )) == null ? '' : __t) +
'/' +
((__t = ( sizeT )) == null ? '' : __t) +
'</div>\n        <div id="vp_deltaT">' +
((__t = ( deltaT )) == null ? '' : __t) +
'</div>\n        <div class="vp_frame" style="width:' +
((__t = ( frame_w )) == null ? '' : __t) +
'px; height:' +
((__t = ( frame_h )) == null ? '' : __t) +
'px">\n            ';
 _.each(imgs_css, function(css, i) { ;
__p += '\n            <img class="vp_img';
 if (css.pixelated) {;
__p += ' pixelated';
 } ;
__p += '"\n                style="opacity:' +
((__t = ( opacity )) == null ? '' : __t) +
'; left:' +
((__t = ( css.left )) == null ? '' : __t) +
'px; top:' +
((__t = ( css.top )) == null ? '' : __t) +
'px;\n                    width:' +
((__t = ( css.width )) == null ? '' : __t) +
'px; height:' +
((__t = ( css.height )) == null ? '' : __t) +
'px;\n                    -webkit-transform-origin:' +
((__t = ( css['transform-origin'] )) == null ? '' : __t) +
';\n                    transform-origin:' +
((__t = ( css['transform-origin'] )) == null ? '' : __t) +
';\n                    -webkit-transform:' +
((__t = ( css['transform'] )) == null ? '' : __t) +
';\n                    transform:' +
((__t = ( css['transform'] )) == null ? '' : __t) +
'"\n                src="' +
((__t = ( css.src )) == null ? '' : __t) +
'" />\n            ';
 }); ;
__p += '\n        </div>';

}
return __p
};

this["JST"]["static/figure/templates/xywh_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n\n\n    <table id="xywh_table" class="table">\n        <tbody>\n            <tr><td>\n                Panel\n\n                <form class="form-inline pull-right">\n                    <div class="checkbox">\n                        ' +
((__t = ( dpi )) == null ? '' : __t) +
' dpi\n\n                        ';
 if (export_dpi) { ;
__p += '\n                        (Export at ' +
((__t = ( export_dpi )) == null ? '' : __t) +
' dpi\n                        <button type="button" title="Delete Label" class="close clear_dpi"\n                            title="Remove (don\'t change dpi on export)"\n                            aria-hidden="true" style="float: none; left: 0; margin: 0; top: -2px;">×</button>\n                        <label>)</label>\n                        ';
 } ;
__p += '\n                    </div>\n                    <button class="btn btn-sm btn-success set_dpi"\n                        title="Resample to a higher dpi at export">Set dpi</button>\n                </form>\n                \n            </td></tr>\n            <tr><td>\n                <div class="col-sm-3" style="text-align: right"><small><strong>X</strong>:</small></div>\n                <div class="col-sm-3"><small>';
 print(x) ;
__p += '</small></div>\n\n                <div class="col-sm-3" style="text-align: right"><small><strong>Width</strong>:</small></div>\n                <div class="col-sm-3"><small>';
 print(width) ;
__p += '</small></div>\n\n                <div class="col-sm-3" style="text-align: right"><small><strong>Y</strong>:</small></div>\n                <div class="col-sm-3"><small>';
 print(y) ;
__p += '</small></div>\n\n                <div class="col-sm-3" style="text-align: right"><small><strong>Height</strong>:</small></div>\n                <div class="col-sm-3"><small>';
 print(height) ;
__p += '</small></div>\n            </td></tr>\n        </tbody>\n    </table>\n';

}
return __p
};

this["JST"]["static/figure/templates/files/figure_file_item.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    ';
 if (disabled) { ;
__p += '\n        <td>\n            ';
 if(imageId > 0) { print("<img class='small-thumb' src='" + thumbSrc + "' />") } ;
__p += '\n        </td>\n        <td title="This figure is currently open">\n            <div style="width:400px; word-wrap:break-word;">\n                ' +
((__t = ( name )) == null ? '' : __t) +
'\n            </div>\n        </td>\n    ';
 } else { ;
__p += '\n        <td>\n            <a href="' +
((__t = ( url )) == null ? '' : __t) +
'">\n                ';
 if(imageId > 0) { print("<img class='small-thumb' src='" + thumbSrc + "' />") } ;
__p += '\n            </a>\n        </td>\n        <td>\n            <div style="width:400px; word-wrap:break-word;">\n                <a href="' +
((__t = ( url )) == null ? '' : __t) +
'">' +
((__t = ( name )) == null ? '' : __t) +
'</a>\n            </div>\n        </td>\n    ';
 } ;
__p += '\n    <td>\n        ' +
((__t = ( formatDate(creationDate) )) == null ? '' : __t) +
'\n    </td>\n    <td>\n        ' +
((__t = ( ownerFullName )) == null ? '' : __t) +
'\n    </td>\n';

}
return __p
};

this["JST"]["static/figure/templates/labels/label_table_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <!-- Alternative label_template - uses table to valign middle for \'left\' & \'right\' labels -->\n    <div class="label_layout label_middle label_' +
((__t = ( position )) == null ? '' : __t) +
'">\n        <table>\n            <tr><td>\n                ';
 _.each(labels, function(l, i) { ;
__p += '\n                    <div style=\'color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'; font-size:' +
((__t = ( l.size )) == null ? '' : __t) +
'px\'>' +
((__t = ( l.text )) == null ? '' : __t) +
'</div>\n                ';
 }); ;
__p += '\n            </td></tr>\n        </table>\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/labels/label_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n\n    <!-- One of these added to each position \'top\', \'topleft\' etc within Panel $el -->\n    <div class="label_layout label_' +
((__t = ( position )) == null ? '' : __t) +
'">\n        ';
 _.each(labels, function(l, i) { ;
__p += '\n            <div style=\'color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'; font-size:' +
((__t = ( l.size )) == null ? '' : __t) +
'px\'>' +
((__t = ( l.text )) == null ? '' : __t) +
'</div>\n        ';
 }); ;
__p += '\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/labels/label_vertical_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <div class="label_layout left_vlabels">\n        <div>\n            ';
 _.each(labels, function(l, i) { ;
__p += '\n                <div style=\'color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'; font-size:' +
((__t = ( l.size )) == null ? '' : __t) +
'px\'>' +
((__t = ( l.text )) == null ? '' : __t) +
'</div>\n            ';
 }); ;
__p += '\n        </div>\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/modal_dialogs/paper_setup_modal_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <div class="col-sm-12">\n\n        <div class="form-horizontal">\n            <div class="form-group col-sm-6">\n                <label>Number of Pages</label>\n                <select class="pageCountSelect form-control">\n                    ';
 _.each([1,2,3,4,5,6,7,8,9,10],function(p){
                        print ("<option value='"+p+"'" + ((p == page_count) ? " selected " : "") + " >"+p+"</option>")
                    }); ;
__p += '\n                </select>\n            </div>\n            <div class="form-group col-sm-6"></div>\n            <div class="clearfix"></div>\n        </div>\n\n    </div>\n\n\n    <div class="col-sm-6">\n        <label>Size</label>\n        <div class="form-horizontal">\n            <div class="form-group col-sm-12">\n                <select class="paperSizeSelect form-control">\n                    <option value="A4" ';
 if (page_size == 'A4') { print('selected') } ;
__p += ' >\n                        A4 (210 x 297 mm)\n                    </option>\n                    <option value="A3" ';
 if (page_size == 'A3') { print('selected') } ;
__p += ' >\n                        A3 (297 x 420 mm)\n                    </option>\n                    <option value="A2" ';
 if (page_size == 'A2') { print('selected') } ;
__p += ' >\n                        A2 (420 x 594 mm)\n                    </option>\n                    <option value="A1" ';
 if (page_size == 'A1') { print('selected') } ;
__p += ' >\n                        A1 (594 x 841 mm)\n                    </option>\n                    <option value="A0" ';
 if (page_size == 'A0') { print('selected') } ;
__p += ' >\n                        A0 (841 x 1189 mm)\n                    </option>\n                    <option value="letter" ';
 if (page_size == 'letter') { print('selected') } ;
__p += ' >\n                        Letter (216 x 280 mm)\n                    </option>\n                    <option value="mm" ';
 if (page_size == 'mm') { print('selected') } ;
__p += ' >\n                        Custom (mm)\n                    </option>\n                </select>\n            </div>\n            <!-- <label for="inputPassword" class="col-sm-2 control-label">Password</label> -->\n        </div>\n    </div>\n    <div class="col-sm-6">\n        <label>Orientation</label>\n        <div class="form-horizontal">\n            <div class="form-group col-sm-6">\n                <input type="radio" name="pageOrientation" value="vertical"\n                    ';
 if (orientation == 'vertical') { print('checked') } ;
__p += ' >\n                <label class="control-label text-muted">Vertical</label>\n            </div>\n            <div class="form-group col-sm-6">\n                <input type="radio" name="pageOrientation" value="horizontal"\n                    ';
 if (orientation == 'horizontal') { print('checked') } ;
__p += ' >\n                <label class="control-label text-muted">Horizontal</label>\n            </div>\n        </div>\n    </div>\n    <div class="clearfix"></div>\n\n    <div class="col-sm-3';
 if (wh_disabled) { print(' wh_disabled')} ;
__p += '">\n        <label>Width</label>\n        <div class="form-horizontal">\n            <div class="form-group col-sm-10">\n                <input id=\'paperWidth\' type="number"\n                    ';
 if (wh_disabled) { print('disabled')} ;
__p += '\n                    class="form-control" value="' +
((__t = ( width_mm )) == null ? '' : __t) +
'">\n            </div>\n            <label class="col-sm-4 control-label text-muted wh_units" style="text-align:left">\n                mm\n            </label>\n        </div>\n    </div>\n    <div class="col-sm-3';
 if (wh_disabled) { print(' wh_disabled')} ;
__p += '">\n        <label>Height</label>\n        <div class="form-horizontal">\n            <div class="form-group col-sm-10">\n                <input id=\'paperHeight\' type="number"\n                    ';
 if (wh_disabled) { print('disabled')} ;
__p += '\n                    class="form-control" value="' +
((__t = ( height_mm )) == null ? '' : __t) +
'">\n            </div>\n            <label class="col-sm-4 control-label text-muted wh_units" style="text-align:left">\n                mm\n            </label>\n        </div>\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/modal_dialogs/preview_Id_change_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <table class="table" style="margin-bottom:0">\n        <tbody>\n            <tr><td>\n                <div class="col-sm-3">Compare:</div>\n                <div class="col-sm-3">\n                    <img class="small-thumb" title="' +
((__t = ( selImg.name )) == null ? '' : __t) +
'"\n                        src="' +
((__t = ( selThumbSrc )) == null ? '' : __t) +
'" />\n                </div>\n                <div class="col-sm-3">\n                    ';
 if(newImg.imageId) { ;
__p += '\n                        <img class="small-thumb" title="' +
((__t = ( newImg.name )) == null ? '' : __t) +
'"\n                            src="' +
((__t = ( newThumbSrc )) == null ? '' : __t) +
'" />\n                    ';
 } else { ;
__p += '\n                        <div style="width:40px; height:40px; background-color:#ddd"></div>\n                    ';
 } ;
__p += '\n                </div>\n                <div class="col-sm-3">Matching</div>\n            </td></tr>\n            <tr><td>\n                <div class="col-sm-3"><small><strong>Dimensions (XY)</strong>:</small></div>\n                <div class="col-sm-3"><small>' +
((__t = ( selImg.orig_width )) == null ? '' : __t) +
' x ' +
((__t = ( selImg.orig_height )) == null ? '' : __t) +
'</small></div>\n                <div class="col-sm-3"><small>\n                    ' +
((__t = ( newImg.orig_width || "-" )) == null ? '' : __t) +
' x ' +
((__t = ( newImg.orig_height || "-"  )) == null ? '' : __t) +
'\n                </small></div>\n                <div class="col-sm-3">\n                    ' +
((__t = ( ok(comp.orig_width, comp.orig_height) )) == null ? '' : __t) +
'\n                </div>\n\n                <div class="col-sm-3"><small><strong>Z-sections</strong>:</small></div>\n                <div class="col-sm-3"><small>' +
((__t = ( selImg.sizeZ )) == null ? '' : __t) +
'</small></div>\n                <div class="col-sm-3"><small>' +
((__t = ( newImg.sizeZ || "-" )) == null ? '' : __t) +
'</small></div>\n                <div class="col-sm-3">' +
((__t = ( ok(comp.sizeZ) )) == null ? '' : __t) +
'</div>\n\n                <div class="col-sm-3"><small><strong>Time-points</strong>:</small></div>\n                <div class="col-sm-3"><small>' +
((__t = ( selImg.sizeT )) == null ? '' : __t) +
'</small></div>\n                <div class="col-sm-3"><small>' +
((__t = ( newImg.sizeT || "-" )) == null ? '' : __t) +
'</small></div>\n                <div class="col-sm-3"><small>' +
((__t = ( ok(comp.sizeT) )) == null ? '' : __t) +
'</small></div>\n\n                <div class="col-sm-3"><small><strong>Channels</strong>:</small></div>\n                <div class="col-sm-3"><small>\n                    ';
 _.each(selImg.channels, function(ch, i) { ;
__p += '\n                        ' +
((__t = ( ch.label )) == null ? '' : __t);
 if(i < selImg.channels.length-1){print(',')} ;
__p += '\n                    ';
 }); ;
__p += '\n                </small></div>\n                <div class="col-sm-3"><small>\n                    ';
 if(newImg.channels){ _.each(newImg.channels, function(ch, i) { ;
__p += '\n                        ' +
((__t = ( ch.label )) == null ? '' : __t);
 if(i < newImg.channels.length-1){print(',')} ;
__p += '\n                    ';
 }) } else { print("-") } ;
__p += '\n                </small></div>\n                <div class="col-sm-3"><small>' +
((__t = ( comp.channels || "-" )) == null ? '' : __t) +
'</small></div>\n\n            </td></tr>\n        </tbody>\n    </table>\n    ';
 _.each(messages, function(m) { ;
__p += '\n        <div class="alert alert-' +
((__t = ( m.status )) == null ? '' : __t) +
'">' +
((__t = ( m.text )) == null ? '' : __t) +
'</div>\n    ';
 }); ;
__p += '\n    ';
 if (newImg.imageId && messages.length == 0) {
        print("<div class='alert alert-success'>Perfect Match!</div>")
    } ;
__p += '\n';

}
return __p
};

this["JST"]["static/figure/templates/modal_dialogs/roi_modal_roi.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n<tr class="roiPickMe">\n    <td>\n        <div class="roi_wrapper" style="position: relative; overflow: hidden; margin: 5px; height: ' +
((__t = ( h )) == null ? '' : __t) +
'px; width: ' +
((__t = ( w )) == null ? '' : __t) +
'px">\n            <img class="roi_content"\n                data-roiId="' +
((__t = ( roiId )) == null ? '' : __t) +
'"\n                data-x="' +
((__t = ( rect.x )) == null ? '' : __t) +
'" data-y="' +
((__t = ( rect.y )) == null ? '' : __t) +
'" \n                data-width="' +
((__t = ( rect.width )) == null ? '' : __t) +
'" data-height="' +
((__t = ( rect.height )) == null ? '' : __t) +
'"\n                data-theT="' +
((__t = ( rect.theT )) == null ? '' : __t) +
'" data-theZ="' +
((__t = ( rect.theZ )) == null ? '' : __t) +
'"\n                style="position: absolute; top: ' +
((__t = ( top )) == null ? '' : __t) +
'px; left: ' +
((__t = ( left )) == null ? '' : __t) +
'px; width: ' +
((__t = ( img_w )) == null ? '' : __t) +
'px; height: ' +
((__t = ( img_h )) == null ? '' : __t) +
'px" src="' +
((__t = ( src )) == null ? '' : __t) +
'" />\n        </div>\n    </td>\n    <td>\n        ' +
((__t = ( zStart )) == null ? '' : __t) +
'\n        ';
 if (zStart !== zEnd) print(" - " + zEnd); ;
__p += '\n    </td>\n    <td>\n        ' +
((__t = ( tStart )) == null ? '' : __t) +
'\n        ';
 if (tStart !== tEnd) print(" - " + tEnd); ;
__p += '\n    </td>\n</tr>\n';

}
return __p
};

this["JST"]["static/figure/templates/shapes/shape_item_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n    <div ';
 if (selected) print ("style='background:#ddf'") ;
__p += ' >\n\n    \t' +
((__t = ( type )) == null ? '' : __t) +
'\n\n    \t';
 if (type === 'RECT') print("x:" + x + " y:" + y + " width:"+ width + " height:" + height) ;
__p += '\n\n    \t';
 if (type === 'LINE' || type === 'ARROW') print("x1:" + x1 + " y1:" + y1 + " x2:" + x2 + " y2:" + y2) ;
__p += '\n\n    \t';
 if (type === 'ELLIPSE') print("x:" + (cx >> 0) + " y:" + (cy >> 0) + " rx:" + (rx >> 0) + " ry:" + (ry >> 0)) ;
__p += '\n\n    </div>\n';

}
return __p
};

this["JST"]["static/figure/templates/shapes/shape_toolbar_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n\n<div class="btn-group" role="group" aria-label="...">\n    <button type="button"\n    \tclass="btn btn-default select-btn ';
 if (state==='SELECT')print('pressed') ;
__p += '">\n        <span class="glyphicon"></span></button>\n</div>\n<div class="btn-group" role="group" aria-label="...">\n    <button type="button" class="btn btn-default rect-btn ';
 if (state==='RECT')print('pressed') ;
__p += '">\n        <span class="glyphicon"></span></button>\n    <button type="button" class="btn btn-default line-btn ';
 if (state==='LINE')print('pressed') ;
__p += '">\n        <span class="glyphicon"></span></button>\n    <button type="button" class="btn btn-default arrow-btn ';
 if (state==='ARROW')print('pressed') ;
__p += '">\n        <span class="glyphicon"></span></button>\n    <button type="button" class="btn btn-default ellipse-btn ';
 if (state==='ELLIPSE')print('pressed') ;
__p += '">\n        <span class="glyphicon"></span></button>\n</div>\n\n<div class="btn-group">\n    <button type="button" class="shape-color btn btn-default dropdown-toggle" title="Label Color"\n        data-toggle="dropdown">\n        <span data-color="' +
((__t = ( color )) == null ? '' : __t) +
'" style="background-color:#' +
((__t = ( color )) == null ? '' : __t) +
'">&nbsp &nbsp &nbsp</span>\n        <span class="caret"></span>\n    </button>\n    <ul class="dropdown-menu colorpicker" role="menu">\n        <li><a href="#">\n            <span data-color="000000" style="background-color:#000">&nbsp &nbsp &nbsp</span>&nbsp Black\n        </a></li>\n        <li><a href="#">\n            <span data-color="0000FF" style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\n        </a></li>\n        <li><a href="#">\n            <span data-color="00FF00" style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\n        </a></li>\n        <li><a href="#">\n            <span data-color="FF0000" style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\n        </a></li>\n        <li><a href="#">\n            <span data-color="FFFF00" style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\n        </a></li>\n        <li><a href="#">\n            <span data-color="FFFFFF" style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\n        </a></li>\n        <li><a href="#">\n            <span data-color="FF00FF" style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\n        </a></li>\n        <li class="divider"></li>\n        <li><a data-color="colorpicker" data-oldcolor="' +
((__t = ( color )) == null ? '' : __t) +
'" href="#">\n            <span class="colorpickerOption">&nbsp &nbsp &nbsp</span>&nbsp More Colors...\n        </a></li>\n    </ul>\n</div>\n\n\n<div class="btn-group">\n    <button type="button" class="line-width btn btn-default dropdown-toggle" title="Line Width: ' +
((__t = ( lineWidth )) == null ? '' : __t) +
'"\n        data-toggle="dropdown">\n        <span data-line-width="' +
((__t = ( lineWidth )) == null ? '' : __t) +
'" class=\'linewidthOption\' style=\'height:' +
((__t = ( lineWidth )) == null ? '' : __t) +
'px\'></span>\n        <span class="caret"></span>\n    </button>\n    <ul class="dropdown-menu lineWidth" role="menu">\n\n        ';
 _.each([1,2,3,4,5,7,10,15,20,30],function(p){
            print ("<li><a href='#'>"+p+"<span title='Line Width: "+p+"' data-line-width='"+p+"' class='linewidthOption' style='height:"+p+"px'></span></a></li>")
        }); ;
__p += '\n\n    </ul>\n</div>\n';

}
return __p
};