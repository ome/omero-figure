this["JST"] = this["JST"] || {};

this["JST"]["static/figure/templates/channel_toggle_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\n\n    ';
 _.each(channels, function(c, i) { ;
__p += '\n        <div class="btn-group" style="padding:2px">\n            <button type="button"\nclass="btn btn-default channel-btn ';
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
'">\n                &nbsp\n            </button>\n            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">\n                <span class="caret"></span>\n            </button>\n            <ul class="dropdown-menu colorpicker" data-index="' +
((__t = ( i )) == null ? '' : __t) +
'">\n                <li class="dropdown-header">Channel Color</li>\n                <li class="divider"></li>\n                <li><a data-color="0000FF" href="#">\n                    <span style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\n                </a></li>\n                <li><a data-color="00FF00" href="#">\n                    <span style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\n                </a></li>\n                <li><a data-color="FF0000" href="#">\n                    <span style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\n                </a></li>\n                <li><a data-color="FFFF00" href="#">\n                    <span style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\n                </a></li>\n                <li><a data-color="FFFFFF" href="#">\n                    <span style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\n                </a></li>\n                <li><a data-color="FF00FF" href="#">\n                    <span style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\n                </a></li>\n            </ul>\n        </div><br>\n    ';
 }); ;
__p += '\n\n    <div class="btn-group rotation-controls" style="padding:2px">\n        <button type="button" class="btn btn-default btn-sm show-rotation">\n            <span class="glyphicon glyphicon-repeat"></span>\n            <span class="rotation_value">' +
((__t = ( rotation )) == null ? '' : __t) +
'</span> &deg;\n        </button>\n\n        <div class="rotation-slider"></div>\n    </div>\n';

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
__p += '\n    <p>' +
((__t = ( name )) == null ? '' : __t) +
'</p>\n    <div class="clearfix"></div>\n\n    <table class="table">\n        <tbody>\n            <tr><td>Image\n                <a class="pull-right" target="new"\n                    href="{% url \'webindex\' %}?show=image-';
 print(imageIds.join('|image-')) ;
__p += '">\n                    <span class="glyphicon glyphicon-share"></span> Show in Webclient\n                </a>\n            </td></tr>\n            <tr><td>\n                <div class="col-sm-6"><small><strong>Image ID</strong>:</small></div>\n                <div class="col-sm-6">\n                    <small>' +
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
                        print(c); print((i < channels.length-1) ? ", " : "");
                    }); ;
__p += '\n                </small></div>\n            </td></tr>\n        </tbody>\n    </table>\n';

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
__p += '\n            <img class="vp_img"\n                style="opacity:' +
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
__p += '\n    <table id="xywh_table" class="table">\n        <tbody>\n            <tr><td>\n                Panel\n                <div class="pull-right">' +
((__t = ( dpi )) == null ? '' : __t) +
' dpi</div>\n            </td></tr>\n            <tr><td>\n                <div class="col-sm-3" style="text-align: right"><small><strong>X</strong>:</small></div>\n                <div class="col-sm-3"><small>';
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
__p += '\n        </td>\n        <td title="This figure is currently open">\n            ' +
((__t = ( name )) == null ? '' : __t) +
'\n        </td>\n    ';
 } else { ;
__p += '\n        <td>\n            <a href="{% url \'figure_index\' %}file/' +
((__t = ( id )) == null ? '' : __t) +
'">\n                ';
 if(imageId > 0) { print("<img class='small-thumb' src='" + thumbSrc + "' />") } ;
__p += '\n            </a>\n        </td>\n        <td>\n            <a href="{% url \'figure_index\' %}file/' +
((__t = ( id )) == null ? '' : __t) +
'">' +
((__t = ( formatName(name) )) == null ? '' : __t) +
'</a>\n        </td>\n    ';
 } ;
__p += '\n        <td>\n            ' +
((__t = ( formatDate(creationDate) )) == null ? '' : __t) +
'\n        </td>\n        <td>\n            ' +
((__t = ( ownerFullName )) == null ? '' : __t) +
'\n        </td>\n';

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