this["JST"] = this["JST"] || {};

this["JST"]["src/templates/channel_slider_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n <div class="clearfix" style="position: relative; padding-bottom: 4px">\r\n\r\n\r\n    <div class="btn-group">\r\n            <button type="button"\r\n            title="' +
((__t = ( _.escape(label) )) == null ? '' : __t) +
'"\r\n                    class="btn btn-default channel-btn lutBg ';
 if (isDark) { print('font-white') } ;
__p += '"\r\n                    data-index="' +
((__t = ( idx )) == null ? '' : __t) +
'"\r\n                    style="background-color:#' +
((__t = ( color )) == null ? '' : __t) +
'; background-position: ' +
((__t = ( lutBgPos )) == null ? '' : __t) +
'">\r\n\r\n                    ' +
((__t = ( _.escape(label) )) == null ? '' : __t) +
'\r\n                <div class="';
 if(active) { ;
__p += 'ch-btn-down';
 } else if (typeof active == 'boolean') { ;
__p += 'ch-btn-up';
 } else { ;
__p += 'ch-btn-flat';
 };
__p += '">&nbsp</div>&nbsp\r\n            </button>\r\n            <button type="button" class="btn btn-default dropdown-toggle"\r\n                    data-toggle="dropdown" title="Pick channel color">\r\n                <span class="caret"></span>\r\n            </button>\r\n            <ul class="dropdown-menu colorpicker" data-index="' +
((__t = ( idx )) == null ? '' : __t) +
'">\r\n                <li>\r\n                    <a data-color="reverse" class="reverseIntensity" href="#">\r\n                        <span style="font-size: 18px; position: relative; top: 4px;;"\r\n                            class="glyphicon\r\n                            ';
 if(reverse) { ;
__p += 'glyphicon-check';
 } else { ;
__p += 'glyphicon-unchecked';
 } ;
__p += '">\r\n                        </span> Invert\r\n                    </a>\r\n                </li>\r\n                <li class="divider"></li>\r\n                <li><a data-color="0000FF" href="#">\r\n                    <span style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\r\n                </a></li>\r\n                <li><a data-color="00FF00" href="#">\r\n                    <span style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\r\n                </a></li>\r\n                <li><a data-color="FF0000" href="#">\r\n                    <span style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\r\n                </a></li>\r\n                <li><a data-color="FFFF00" href="#">\r\n                    <span style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\r\n                </a></li>\r\n                <li><a data-color="FFFFFF" href="#">\r\n                    <span style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\r\n                </a></li>\r\n                <li><a data-color="FF00FF" href="#">\r\n                    <span style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\r\n                </a></li>\r\n                <li><a data-color="00FFFF" href="#">\r\n                    <span style="background-color:#0ff">&nbsp &nbsp &nbsp</span>&nbsp Cyan\r\n                </a></li>\r\n                <li class="divider"></li>\r\n                <li><a data-color="lutpicker" href="#">\r\n                    <span class="lutBg">&nbsp &nbsp &nbsp</span>&nbsp Lookup Tables\r\n                </a></li>\r\n                <li><a data-color="colorpicker" data-oldcolor="' +
((__t = ( color )) == null ? '' : __t) +
'" href="#">\r\n                    <span class="colorpickerOption">&nbsp &nbsp &nbsp</span>&nbsp More Colors...\r\n                </a></li>\r\n            </ul>\r\n        </div><br>\r\n\r\n    <span class="ch_start">\r\n        <input type="number" data-window="start"\r\n        ';
 if (startsNotEqual) { ;
__p += '\r\n            title="Average: ' +
((__t = ( startAvg )) == null ? '' : __t) +
' (selected images have different start values)"\r\n            style="color: #ccc;"\r\n        ';
 } ;
__p += '\r\n        data-idx="' +
((__t = (idx)) == null ? '' : __t) +
'" value="' +
((__t = ( startAvg )) == null ? '' : __t) +
'" max="' +
((__t = ( endAvg )) == null ? '' : __t) +
'">\r\n    </span>\r\n    <div class="ch_slider" style="background-color:#ddd; background-color:#' +
((__t = (color)) == null ? '' : __t) +
'" aria-disabled="false">\r\n    </div>\r\n    <span class="ch_end">\r\n        <input type="number" data-window="end"\r\n        ';
 if (endsNotEqual) { ;
__p += '\r\n            title="Average: ' +
((__t = ( endAvg )) == null ? '' : __t) +
' (selected images have different end values)"\r\n            style="color: #ccc;"\r\n        ';
 } ;
__p += '\r\n        data-idx="' +
((__t = (idx)) == null ? '' : __t) +
'" value="' +
((__t = ( endAvg )) == null ? '' : __t) +
'" min="' +
((__t = ( startAvg )) == null ? '' : __t) +
'">\r\n    </span>\r\n</div>\r\n';

}
return __p
};

this["JST"]["src/templates/figure_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '';
with (obj) {
__p += '    <!-- The content of <div class=\'imagePanel\'> for each panel -->\r\n    <div class="imgContainer">\r\n        <div class="glyphicon glyphicon-refresh"></div>\r\n        <img class="img_panel" />\r\n        <div id="' +
((__t = ( randomId )) == null ? '' : __t) +
'" class="panel_canvas"></div>\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/image_display_options_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <div class="btn-group image-display-options rotation-controls">\r\n        <button type="button" class="btn btn-default btn-sm show-rotation" title="Rotate image">\r\n            <span class="glyphicon glyphicon-repeat"></span>\r\n            <span class="rotation_value">' +
((__t = ( rotation )) == null ? '' : __t) +
'</span> &deg;\r\n        </button>\r\n\r\n        <div class="rotation-slider"></div>\r\n    </div>\r\n\r\n\r\n    <div class="btn-group image-display-options"\r\n         title="Maximum intensity Z-projection (choose range with 2 handles on Z-slider)">\r\n        <button type="button" class="btn btn-default btn-sm z-projection\r\n                ';
 if(z_projection) { ;
__p += 'zp-btn-down';
 } else if (typeof z_projection == 'boolean') { ;

 } else { ;
__p += 'ch-btn-flat';
 };
__p += '"\r\n                ';
 if (z_projection_disabled) { ;
__p += 'disabled="disabled"';
 } ;
__p += '\r\n                >\r\n            <span class="glyphicon"></span>\r\n        </button>\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/info_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <p>';
 print(_.escape(name)) ;
__p += '</p>\r\n    <div class="clearfix"></div>\r\n\r\n    <table class="table">\r\n        <tbody>\r\n            <tr><td>\r\n                <span class="glyphicon glyphicon-share"></span> Open with:\r\n                ';
 _.each(imageLinks, function(link, i) { ;
__p += '\r\n                    ';
 if (i > 0) {print("|")} ;
__p += '\r\n                    <a target="_blank" href="' +
((__t = ( link.url )) == null ? '' : __t) +
'">\r\n                        ' +
((__t = ( link.text )) == null ? '' : __t) +
'\r\n                    </a>\r\n                ';
 }) ;
__p += '\r\n            </td></tr>\r\n            <tr><td>\r\n                <div class="col-sm-5"><small><strong>Image ID</strong>:</small></div>\r\n                <div class="col-sm-7">\r\n                    <small>' +
((__t = ( imageId )) == null ? '' : __t) +
'</small>\r\n                    <button type="button"\r\n                            style="position:absolute; top:0px; right:0px"\r\n                            ';
 if(!setImageId) { ;
__p += 'disabled="disabled"';
 } ;
__p += '\r\n                            class="btn btn-small btn-success setId">\r\n                        Edit ID\r\n                    </button>\r\n                </div>\r\n\r\n                <div class="col-sm-5"><small><strong>Dimensions (XY)</strong>:</small></div>\r\n                <div class="col-sm-7"><small>' +
((__t = ( orig_width )) == null ? '' : __t) +
' x ' +
((__t = ( orig_height )) == null ? '' : __t) +
'</small></div>\r\n\r\n                <div class="col-sm-5"><small><strong>Z-sections</strong>:</small></div>\r\n                <div class="col-sm-7"><small>' +
((__t = ( sizeZ )) == null ? '' : __t) +
'</small></div>\r\n                <div class="clearfix"></div>\r\n                <div class="col-sm-5"><small><strong>Timepoints</strong>:</small></div>\r\n                <div class="col-sm-7"><small>' +
((__t = ( sizeT )) == null ? '' : __t) +
'</small></div>\r\n                <div class="clearfix"></div>\r\n                <div class="col-sm-5"><small><strong>Channels</strong>:</small></div>\r\n                <div class="col-sm-7"><small>\r\n                    ';
 _.each(channel_labels, function(c, i) {
                        print(_.escape(c)); print((i < channels.length-1) ? ", " : "");
                    }); ;
__p += '\r\n                </small></div>\r\n            </td></tr>\r\n        </tbody>\r\n    </table>\r\n';

}
return __p
};

this["JST"]["src/templates/labels_form_inner_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <div class="input-group pull-left">\r\n        <input type="text" class="label-text form-control input-sm" \r\n                placeholder="Label" value="';
 print(_.escape(l.text)) ;
__p += '" style="max-height:29px"/>\r\n        ';
 if (!edit){ ;
__p += '\r\n            <div class="input-group-btn">\r\n                <button type="button" class="btn btn-default btn-sm dropdown-toggle"\r\n                        data-toggle="dropdown" title="Label from data...">\r\n                    <span class="caret"></span>\r\n                </button>\r\n                <ul class="dropdown-menu pull-right">\r\n                    <li role="presentation" class="dropdown-header">Create Label(s) From:</li>\r\n                    <li role="presentation" class="divider"></li>\r\n                    <li><a href="#" data-label="[image.name]">Image Name</a></li>\r\n                    <li><a href="#" data-label="[dataset.name]">Dataset Name</a></li>\r\n                    <li title="Create labels from active Channels on the selected panel">\r\n                        <a href="#" data-label="[channels labels]">Channels (separate labels)</a>\r\n                    </li>\r\n                    <li title="Create labels from active Channels on the selected panel">\r\n                        <a href="#" data-label="[channels]">Channels (single label)</a>\r\n                    </li>\r\n                    <li title="Create labels from Tags on this Image in OMERO">\r\n                        <a href="#" data-label="[tags]">Tags</a>\r\n                    </li>\r\n                    <li title="Create labels from Map Annotations on this Image in OMERO">\r\n                        <a href="#" data-label="[key-values]">Key-Value Pairs</a>\r\n                    </li>\r\n                    <li title="Add a label that shows the current T-index">\r\n                        <a href="#" data-label="[time.index]">Time (T-index)</a>\r\n                    </li>\r\n                    <li class="add_time_label" title="Label shows time in milliseconds">\r\n                        <a href="#" data-label="[time.milliseconds]">Time (milliseconds)</a>\r\n                    </li>\r\n                    <li class="add_time_label">\r\n                        <a href="#" data-label="[time.secs]">Time (seconds)</a>\r\n                    </li>\r\n                    <li class="add_time_label">\r\n                        <a href="#" data-label="[time.mins]">Time (mins)</a>\r\n                    </li>\r\n                    <li class="add_time_label" title="Label shows time in mins:secs">\r\n                        <a href="#" data-label="[time.mins:secs]">Time (mins:secs)</a>\r\n                    </li>\r\n                    <li class="add_time_label">\r\n                        <a href="#" data-label="[time.hrs:mins:secs]">Time (hrs:mins:secs)</a>\r\n                    </li>\r\n                    <li class="add_time_label">\r\n                        <a href="#" data-label="[time.hrs:mins]">Time (hrs:mins)</a>\r\n                    </li>\r\n                    <li title="Add a label that shows the viewport X and Y in pixels">\r\n                        <a href="#" data-label="X: [x.pixel] Y: [y.pixel]">X and Y (pixel or unit)</a>\r\n                    </li>\r\n                    <li  title="Add a label that shows the current Z-index">\r\n                        <a href="#" data-label="Z: [z.pixel]">Z (pixel or unit)</a>\r\n                    </li>\r\n                    <li  title="Add a label that shows the current Zoom level">\r\n                        <a href="#" data-label="[zoom]">Zoom level (%)</a>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n        ';
 } ;
__p += '\r\n    </div>\r\n\r\n    <div class="btn-group">\r\n        <button type="button" class="font-size btn btn-default btn-sm dropdown-toggle" title="Font Size"\r\n            data-toggle="dropdown" style="width:33px">\r\n            <span>' +
((__t = ( l.size )) == null ? '' : __t) +
'</span>\r\n            <span class="caret"></span>\r\n        </button>\r\n        <ul class="dropdown-menu" role="menu">\r\n        ';
 _.each([6,8,10,12,14,18,21,24,36,48],function(p){
            print ("<li><a href='#'><span>"+p+"</span></a></li>")
        }); ;
__p += '\r\n        </ul>\r\n    </div>\r\n\r\n    <div class="btn-group">\r\n        <button type="button" class="label-position btn btn-default btn-sm dropdown-toggle" \r\n                title="Position" data-toggle="dropdown">\r\n            <span data-position="' +
((__t = ( position )) == null ? '' : __t) +
'" class="labelicon-' +
((__t = ( position )) == null ? '' : __t) +
' glyphicon \r\n                ';
 if (_.contains(['top','bottom','left','leftvert','right','rightvert'],position)) print('glyphicon-log-out'); else {print('glyphicon-new-window')} ;
__p += '"></span>\r\n            <span class="caret"></span>\r\n        </button>\r\n        <ul class="dropdown-menu" role="menu">\r\n            <li role="presentation" class="dropdown-header">Inside Corners</li>\r\n            <li><a href="#">\r\n                <span data-position="topleft" class="labelicon-topleft glyphicon glyphicon-new-window"></span>\r\n                Top Left</a>\r\n            </li>\r\n            <li><a href="#">\r\n                <span data-position="topright" class="labelicon-topright glyphicon glyphicon-new-window"></span>\r\n                Top Right</a>\r\n            </li>\r\n            <li><a href="#">\r\n                <span data-position="bottomleft" class="labelicon-bottomleft glyphicon glyphicon-new-window"></span>\r\n                Bottom Left</a>\r\n            </li>\r\n            <li><a href="#">\r\n                <span data-position="bottomright" class="labelicon-bottomright glyphicon glyphicon-new-window"></span>\r\n                Bottom Right</a>\r\n            </li>\r\n\r\n            <li role="presentation" class="divider"></li>\r\n            <li role="presentation" class="dropdown-header">Outside Edges</li>\r\n            <li><a href="#">\r\n                <span data-position="left" class="labelicon-left glyphicon glyphicon-log-out"></span> Left</a>\r\n            </li>\r\n            <li><a href="#">\r\n                    <span data-position="leftvert" class="labelicon-leftvert glyphicon glyphicon-log-out"></span> \r\n                    Left vertical\r\n                </a>\r\n            </li>\r\n            <li><a href="#">\r\n                <span data-position="top" class="labelicon-top glyphicon glyphicon-log-out"></span> Top</a>\r\n            </li>\r\n            <li><a href="#">\r\n                <span data-position="right" class="labelicon-right glyphicon glyphicon-log-out"></span> Right</a>\r\n            </li>\r\n            <li><a href="#">\r\n                <span data-position="rightvert" class="labelicon-rightvert glyphicon glyphicon-log-out"></span> \r\n                Right vertical\r\n            </a>\r\n        </li>\r\n            <li><a href="#">\r\n                <span data-position="bottom" class="labelicon-bottom glyphicon glyphicon-log-out"></span> Bottom</a>\r\n            </li>\r\n        </ul>\r\n    </div>\r\n\r\n    <div class="btn-group">\r\n        <button type="button" class="label-color btn btn-default btn-sm dropdown-toggle" title="Label Color"\r\n            data-toggle="dropdown">\r\n            <span data-color="' +
((__t = ( l.color )) == null ? '' : __t) +
'" style="background-color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'">&nbsp &nbsp &nbsp</span>\r\n            <span class="caret"></span>\r\n        </button>\r\n        <ul class="dropdown-menu colorpicker" role="menu">\r\n            <li><a href="#">\r\n                <span data-color="000000" style="background-color:#000">&nbsp &nbsp &nbsp</span>&nbsp Black\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="0000FF" style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="00FF00" style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FF0000" style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FFFF00" style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FFFFFF" style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FF00FF" style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="00FFFF" style="background-color:#0ff">&nbsp &nbsp &nbsp</span>&nbsp Cyan\r\n            </a></li>\r\n            <li class="divider"></li>\r\n            <li><a data-color="colorpicker" data-oldcolor="' +
((__t = ( l.color )) == null ? '' : __t) +
'" href="#">\r\n                <span class="colorpickerOption">&nbsp &nbsp &nbsp</span>&nbsp More Colors...\r\n            </a></li>\r\n        </ul>\r\n    </div>\r\n\r\n    ';
 if (edit){ ;
__p += '\r\n        <button type="button" title="Delete Label" class="close delete-label" aria-hidden="true">&times;</button>\r\n    ';
 } else { ;
__p += '\r\n\r\n        <button type="submit" class="btn btn-sm btn-success pull-right">Add</button>\r\n\r\n    ';
 } ;
__p += '\r\n';

}
return __p
};

this["JST"]["src/templates/labels_form_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n        <div class="">\r\n\r\n            ';
 _.each(labels, function(l, i) { ;
__p += '\r\n\r\n                <form class="edit-label-form form-inline" role="form" data-key="' +
((__t = ( l.key )) == null ? '' : __t) +
'">\r\n\r\n                    ' +
((__t = ( inner_template({l:l, position:position, edit:true}) )) == null ? '' : __t) +
'\r\n\r\n                </form>\r\n\r\n            ';
 }); ;
__p += '\r\n        </div>\r\n';

}
return __p
};

this["JST"]["src/templates/lut_picker.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n\r\n<div class="btn-group-vertical col-xs-6" role="group">\r\n\r\n	';
 _.each(luts, function(lut, i) { ;
__p += '\r\n\r\n		<button type="button" class="btn btn-default lutOption" data-lut="' +
((__t = ( lut.name )) == null ? '' : __t) +
'">\r\n			<span class="lutBg" style="background-position: ' +
((__t = ( lut.bgPos )) == null ? '' : __t) +
'">&nbsp</span>\r\n			' +
((__t = ( lut.displayName )) == null ? '' : __t) +
' </button>\r\n\r\n		';
 if (i === parseInt(luts.length/2)) { ;
__p += '\r\n			</div>\r\n			<div class="btn-group-vertical col-xs-6" role="group">\r\n		';
 } ;
__p += '\r\n\r\n	';
 }) ;
__p += '\r\n</div>\r\n';

}
return __p
};

this["JST"]["src/templates/rois_form_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n\r\n<h5>ROIs\r\n    ';
 if (panelCount > 0) { ;
__p += '\r\n        <span style="font-weight:normal; padding-left:64px">' +
((__t = ( roiCount )) == null ? '' : __t) +
' ROIs selected</span>\r\n    ';
 } ;
__p += '\r\n</h5>\r\n\r\n';
 if (panelCount > 0) { ;
__p += '\r\n\r\n<form class="form-inline" role="form">\r\n\r\n    <div class="btn-group">\r\n        <button type="button" class="shape-color btn btn-default btn-sm dropdown-toggle" title="ROI Color"\r\n            ';
 if (roiCount === 0) print('disabled') ;
__p += '\r\n            data-toggle="dropdown">\r\n            <span data-color="' +
((__t = ( color )) == null ? '' : __t) +
'" style="background-color:#' +
((__t = ( color )) == null ? '' : __t) +
'">&nbsp &nbsp &nbsp</span>\r\n            <span class="caret"></span>\r\n        </button>\r\n        <ul class="dropdown-menu dropdownSelect colorpicker" role="menu">\r\n            <li><a href="#">\r\n                <span data-color="000000" style="background-color:#000">&nbsp &nbsp &nbsp</span>&nbsp Black\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="0000FF" style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="00FF00" style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FF0000" style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FFFF00" style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FFFFFF" style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\r\n            </a></li>\r\n            <li><a href="#">\r\n                <span data-color="FF00FF" style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\r\n            </a></li>\r\n            <li class="divider"></li>\r\n            <li><a data-color="colorpicker" data-oldcolor="' +
((__t = ( color )) == null ? '' : __t) +
'" href="#">\r\n                <span class="colorpickerOption">&nbsp &nbsp &nbsp</span>&nbsp More Colors...\r\n            </a></li>\r\n        </ul>\r\n    </div>\r\n\r\n    <div class="btn-group">\r\n        <button type="button" class="line-width btn btn-default btn-sm dropdown-toggle" title="Line Width: ' +
((__t = ( lineWidth )) == null ? '' : __t) +
'"\r\n            ';
 if (roiCount === 0) print('disabled') ;
__p += '\r\n            data-toggle="dropdown">\r\n            <span data-line-width="' +
((__t = ( lineWidth )) == null ? '' : __t) +
'">' +
((__t = ( lineWidth )) == null ? '' : __t) +
' pt</span>\r\n            <span class="caret"></span>\r\n        </button>\r\n        <ul class="dropdown-menu dropdownSelect lineWidth" role="menu">\r\n\r\n            ';
 _.each([0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 7, 10, 15, 20, 30],function(p){ ;
__p += '\r\n                <li><a href=\'#\'><span data-line-width=\'' +
((__t = ( p )) == null ? '' : __t) +
'\'>' +
((__t = ( p )) == null ? '' : __t) +
' pt</span></a></li>\r\n            ';
 }); ;
__p += '\r\n\r\n        </ul>\r\n    </div>\r\n\r\n    <div class="btn-group">\r\n        <button type="button" class="btn btn-sm btn-default copyROIs" title="Copy All ROIs"\r\n                ';
 if (roiCount === 0) print('disabled') ;
__p += ' >\r\n            Copy\r\n        </button>\r\n        <button type="button" class="btn btn-sm btn-default pasteROIs" title="Paste ROIs"\r\n                ';
 if (!canPaste) print('disabled') ;
__p += ' >\r\n            Paste\r\n        </button>\r\n        <button type="button" class="btn btn-sm btn-default deleteROIs" title="Delete All ROIs"\r\n                ';
 if (roiCount === 0) print('disabled') ;
__p += ' >\r\n            Delete\r\n        </button>\r\n    </div>\r\n\r\n    <div class="pull-right"\r\n        ';
 if (panelCount > 1) { ;
__p += '\r\n            title="Cannot draw ROIs on multiple panels. Select a single panel"\r\n        ';
 } else if (panelCount === 0) { ;
__p += '\r\n            title="Select a panel to draw ROIs"\r\n        ';
 } ;
__p += ' >\r\n        <button class="edit_rois btn btn-sm btn-success"\r\n            ';
 if (panelCount !== 1) { ;
__p += ' disabled="disabled"';
 } ;
__p += ' >\r\n            Edit\r\n        </button>\r\n    </div>\r\n\r\n</form>\r\n';
 } ;
__p += '\r\n';

}
return __p
};

this["JST"]["src/templates/scalebar_form_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <div class="pixel_size_form" style="position:relative">\r\n        <div class="pixel_size_div">\r\n            Pixel Size:\r\n            <input class="input-sm form-control pixel_size_input" placeholder="Pixel Size (' +
((__t = ( pixel_size_symbol )) == null ? '' : __t) +
')"\r\n                    style="width:100px; display:none" value="' +
((__t = ( pixel_size_x )) == null ? '' : __t) +
'">\r\n            <span class="pixel_size_display">\r\n                ';
 if (!pixel_size_x)
                    {print('<span style="color:red">NOT SET</span>')}
                else if (typeof pixel_size_x === 'number')
                    {print(pixel_size_x.toFixed(3) + " " + pixel_size_symbol)}
                else
                    {print(pixel_size_x + " " + pixel_size_symbol)} ;
__p += '\r\n            </span>\r\n        </div>\r\n    </div>\r\n    <form class="scalebar_form" style="position: relative">\r\n        <div style="position: absolute; right: 0;">\r\n            ';
 if (show){ ;
__p += '\r\n                <button type="submit" class="show_scalebar btn btn-sm btn-success pull-right">Show</button>\r\n            ';
 } else { ;
__p += '\r\n                <button type="button" class="hide_scalebar btn btn-default btn-sm pull-right">Hide</button>\r\n            ';
 } ;
__p += '\r\n        </div>\r\n\r\n        <div class="row">\r\n            <div class="form-group col-sm-2 scalebar_text">\r\n                Length\r\n            </div>\r\n            <div class="form-group col-sm-2 scalebar_length">\r\n                <input type="text" class="scalebar-length form-control input-sm" \r\n                            placeholder="Length" value="' +
((__t = ( length )) == null ? '' : __t) +
'" />\r\n            </div>\r\n            <div class="form-group col-sm-1 btn-group scalebar_unit">\r\n                <button type="button" class="scalebar-units btn btn-default btn-sm dropdown-toggle"\r\n                        title="Units" data-toggle="dropdown">\r\n                    <span data-unit="' +
((__t = ( units )) == null ? '' : __t) +
'">' +
((__t = ( units_symbol )) == null ? '' : __t) +
'</span>\r\n                    <span class="caret"></span>\r\n                </button>\r\n                <ul class="dropdown-menu" role="menu">\r\n                    ';
 _.each(unit_symbols, function(u){ ;
__p += '\r\n                        <li><a href=\'#\'>' +
((__t = ( u.unit )) == null ? '' : __t) +
' (<span data-unit="' +
((__t = ( u.unit )) == null ? '' : __t) +
'">' +
((__t = ( u.symbol )) == null ? '' : __t) +
'</span>)</a></li>\r\n                    ';
 }); ;
__p += '\r\n                </ul>\r\n            </div>\r\n            <div class="col-sm-1" />\r\n            <div class="form-group col-sm-auto btn-group">\r\n                <button type="button" class="label-position btn btn-default btn-sm dropdown-toggle" \r\n                        title="Position" data-toggle="dropdown">\r\n                    <span data-position="' +
((__t = ( position )) == null ? '' : __t) +
'" class="labelicon-' +
((__t = ( position )) == null ? '' : __t) +
' glyphicon \r\n                        ';
 if (_.contains(['top','bottom','left','right'],position)) print('glyphicon-log-out'); else {print('glyphicon-new-window')} ;
__p += '"></span>\r\n                    <span class="caret"></span>\r\n                </button>\r\n                <ul class="dropdown-menu" role="menu">\r\n                    <li role="presentation" class="dropdown-header">Inside Corners</li>\r\n                    <li><a href="#">\r\n                        <span data-position="topleft" class="labelicon-topleft glyphicon glyphicon-new-window"></span>\r\n                        Top Left</a>\r\n                    </li>\r\n                    <li><a href="#">\r\n                        <span data-position="topright" class="labelicon-topright glyphicon glyphicon-new-window"></span>\r\n                        Top Right</a>\r\n                    </li>\r\n                    <li><a href="#">\r\n                        <span data-position="bottomleft" class="labelicon-bottomleft glyphicon glyphicon-new-window"></span>\r\n                        Bottom Left</a>\r\n                    </li>\r\n                    <li><a href="#">\r\n                        <span data-position="bottomright" class="labelicon-bottomright glyphicon glyphicon-new-window"></span>\r\n                        Bottom Right</a>\r\n                    </li>\r\n                </ul>\r\n            </div>\r\n            <div class="form-group col-sm-auto btn-group">\r\n                <button type="button" class="label-color btn btn-default btn-sm dropdown-toggle" title="Label Color"\r\n                    data-toggle="dropdown">\r\n                    <span data-color="' +
((__t = ( color )) == null ? '' : __t) +
'" style="background-color:#' +
((__t = ( color )) == null ? '' : __t) +
'">&nbsp &nbsp &nbsp</span>\r\n                    <span class="caret"></span>\r\n                </button>\r\n                <ul class="dropdown-menu colorpicker" role="menu">\r\n                    <li><a href="#">\r\n                        <span data-color="000000" style="background-color:#000">&nbsp &nbsp &nbsp</span>&nbsp Black\r\n                    </a></li>\r\n                    <li><a href="#">\r\n                        <span data-color="0000FF" style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\r\n                    </a></li>\r\n                    <li><a href="#">\r\n                        <span data-color="00FF00" style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\r\n                    </a></li>\r\n                    <li><a href="#">\r\n                        <span data-color="FF0000" style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\r\n                    </a></li>\r\n                    <li><a href="#">\r\n                        <span data-color="FFFF00" style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\r\n                    </a></li>\r\n                    <li><a href="#">\r\n                        <span data-color="FFFFFF" style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\r\n                    </a></li>\r\n                    <li><a href="#">\r\n                        <span data-color="FF00FF" style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\r\n                    </a></li>\r\n                    <li><a href="#">\r\n                        <span data-color="00FFFF" style="background-color:#0ff">&nbsp &nbsp &nbsp</span>&nbsp Cyan\r\n                    </a></li>\r\n                </ul>\r\n            </div>\r\n        </div>\r\n\r\n        <div class="row">\r\n            <div class="form-group col-sm-2 scalebar_text">\r\n                Height\r\n            </div>\r\n            <div class="form-group col-sm-2 scalebar_length">\r\n                <input type="text" class="scalebar-height form-control input-sm" \r\n                placeholder="Height" value="' +
((__t = ( height )) == null ? '' : __t) +
'" />\r\n            </div>\r\n            <div class="form-group col-sm-1 scalebar_text" style="padding-left: 2px;">\r\n                px\r\n            </div>\r\n\r\n            <div class="form-group col-sm-auto scalebar_text">\r\n                Label\r\n            </div>\r\n            <div class="form-group col-sm-auto" style="margin: 2px">\r\n                <input type="checkbox" class="scalebar_label" ';
 if (show_label) print("checked") ;
__p += ' /> \r\n            </div>\r\n            <div class="form-group col-sm-1 btn-group" style="padding: 0;">\r\n                <button type="button" class="scalebar_font_size btn btn-default btn-sm dropdown-toggle" title="Font Size"\r\n                data-toggle="dropdown" style="width:33px; ';
 if (!show_label) print("display:none") ;
__p += '">\r\n                    <span>' +
((__t = ( font_size )) == null ? '' : __t) +
'</span>\r\n                    <span class="caret"></span>\r\n                </button>\r\n                <ul class="dropdown-menu" role="menu">\r\n                ';
 _.each([6,8,10,12,14,18,21,24,36,48],function(p){
                    print ("<li><a href='#'><span>"+p+"</span></a></li>")
                }); ;
__p += '\r\n                </ul>\r\n            </div>\r\n            <div class="form-group col-sm-1 scalebar_text" style="padding-left: 2px;">\r\n                ';
 if (show_label) print("pt") ;
__p += '\r\n            </div>\r\n        </div>\r\n    </form>';

}
return __p
};

this["JST"]["src/templates/scalebar_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <div class="scalebar label_' +
((__t = ( position )) == null ? '' : __t) +
'" style="background-color: #' +
((__t = ( color )) == null ? '' : __t) +
'; height: ' +
((__t = ( height )) == null ? '' : __t) +
'px">\r\n        ';
 if (show_label) { ;
__p += '\r\n            <div class=\'scalebar-label\' style=\'color: #' +
((__t = ( color )) == null ? '' : __t) +
'; font-size: ' +
((__t = ( font_size )) == null ? '' : __t) +
'px;\r\n            ';
 if(position === "bottomleft"  || position === "bottomright") print("margin-bottom:" + height);;
__p += 'px;\r\n            ';
 if(position === "topleft"  || position === "topright") print("margin-top:" + height);;
__p += 'px;\'>\r\n                ' +
((__t = ( length )) == null ? '' : __t) +
' ' +
((__t = ( symbol )) == null ? '' : __t) +
'\r\n            </div>\r\n        ';
 } ;
__p += '\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/viewport_inner_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    ';
 _.each(imgs_css, function(css, i) { ;
__p += '\r\n    <img class="vp_img';
 if (css.pixelated) {;
__p += ' pixelated';
 } ;
__p += '"\r\n        style="opacity:' +
((__t = ( opacity )) == null ? '' : __t) +
'; left:' +
((__t = ( css.left )) == null ? '' : __t) +
'px; top:' +
((__t = ( css.top )) == null ? '' : __t) +
'px;\r\n            width:' +
((__t = ( css.width )) == null ? '' : __t) +
'px; height:' +
((__t = ( css.height )) == null ? '' : __t) +
'px;\r\n            -webkit-transform-origin:' +
((__t = ( css['transform-origin'] )) == null ? '' : __t) +
';\r\n            transform-origin:' +
((__t = ( css['transform-origin'] )) == null ? '' : __t) +
';\r\n            -webkit-transform:' +
((__t = ( css['transform'] )) == null ? '' : __t) +
';\r\n            transform:' +
((__t = ( css['transform'] )) == null ? '' : __t) +
'"\r\n        src=\'' +
((__t = ( css.src )) == null ? '' : __t) +
'\' />\r\n    ';
 }); ;
__p += '\r\n';

}
return __p
};

this["JST"]["src/templates/viewport_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '';
with (obj) {
__p += '\r\n        <div id="vp_z_label">Z</div>\r\n        <div id="vp_z_value"></div>\r\n        <div id="vp_t_label">T</div>\r\n        <div id="vp_t_value"></div>\r\n        <div id="vp_deltaT"></div>\r\n        <div class="vp_frame" style="width:' +
((__t = ( frame_w )) == null ? '' : __t) +
'px; height:' +
((__t = ( frame_h )) == null ? '' : __t) +
'px">\r\n            ' +
((__t = ( inner_template({imgs_css:imgs_css, opacity:opacity}) )) == null ? '' : __t) +
'\r\n        </div>\r\n';

}
return __p
};

this["JST"]["src/templates/xywh_panel_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n\r\n\r\n    <table id="xywh_table" class="table">\r\n        <tbody>\r\n            <tr><td>\r\n                Panel\r\n\r\n                <form class="form-inline pull-right">\r\n                    <div class="checkbox">\r\n                        ' +
((__t = ( dpi )) == null ? '' : __t) +
' dpi\r\n\r\n                        ';
 if (export_dpi != dpi && !isNaN(export_dpi)) { ;
__p += '\r\n                        (Export at ' +
((__t = ( export_dpi )) == null ? '' : __t) +
' dpi\r\n                            ';
 if (export_dpi > dpi) { ;
__p += '\r\n                            <button type="button" title="Delete Label" class="close clear_dpi"\r\n                                title="Remove (don\'t change dpi on export)"\r\n                                aria-hidden="true" style="float: none; left: 0; margin: 0; top: -2px;">×</button>\r\n                            ';
 } ;
__p += '\r\n                        <label>)</label>\r\n                        ';
 } ;
__p += '\r\n                    </div>\r\n                    <button class="btn btn-sm btn-success set_dpi"\r\n                        title="Resample to a higher dpi at export">Set dpi</button>\r\n                </form>\r\n                \r\n            </td></tr>\r\n            <tr><td>\r\n                <form class="form-horizontal xywh_form" role="form" style="position:relative">\r\n                    <div class="form-group">\r\n                        <label class="col-sm-2 control-label">X</label>\r\n                        <div class="col-sm-4">\r\n                            <input type="number" name="x" min="0" class="form-control input-sm" value="' +
((__t = ( x )) == null ? '' : __t) +
'">\r\n                        </div>\r\n                        <label class="col-sm-2 control-label">Width</label>\r\n                        <div class="col-sm-4">\r\n                            <input type="number" name="width" min="0" class="form-control input-sm" value="' +
((__t = ( width )) == null ? '' : __t) +
'">\r\n                        </div>\r\n                    </div>\r\n                    <div class="form-group" style="margin-bottom: -15px">\r\n                        <label class="col-sm-2 control-label">Y</label>\r\n                        <div class="col-sm-4">\r\n                            <input type="number" name="y" min="0" class="form-control input-sm" value="' +
((__t = ( y )) == null ? '' : __t) +
'">\r\n                        </div>\r\n                        <label class="col-sm-2 control-label">\r\n                            Height\r\n                        </label>\r\n                        <div class="col-sm-4">\r\n                            <input type="number" name="height" min="0" class="form-control input-sm" value="' +
((__t = ( height )) == null ? '' : __t) +
'">\r\n                        </div>\r\n                    </div>\r\n                    <button type="button" class="btn btn-link setAspectRatio"\r\n                        style="position:absolute; left:195px; top:25px; padding:3px; width:23px; height:24px; outline:none !important" title="Maintain aspect ratio"><span class="glyphicon glyphicon-link"></span><span class="glyphicon glyphicon-ok-sign okSign" style="left:-28px; top:-7px; font-size:10px; color:green"></span></button>\r\n                    <div style="position:absolute;left: 220px;top: 12px;border: solid #bbb 1px;width: 12px;height: 48px;border-right: 0px;"></div>\r\n                </form>\r\n            </td></tr>\r\n        </tbody>\r\n    </table>\r\n';

}
return __p
};

this["JST"]["src/templates/zoom_crop_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n<h5 style="margin-top:6px">\r\n    View\r\n    <span style="font-weight:normal; float:right">\r\n        x: <span style="color: #aaa">' +
((__t = ( x )) == null ? '' : __t) +
'</span>\r\n        y: <span style="color: #aaa">' +
((__t = ( y )) == null ? '' : __t) +
'</span>\r\n        width: <span style="color: #aaa">' +
((__t = ( width )) == null ? '' : __t) +
'</span>\r\n        height: <span style="color: #aaa">' +
((__t = ( height )) == null ? '' : __t) +
'</span>\r\n    </span>\r\n</h5>\r\n\r\n<div class="btn-group">\r\n    <button type="button" class="btn btn-sm btn-default copyCropRegion" title="Copy crop region"\r\n        ';
 if (!canCopyRect) print('disabled') ;
__p += ' >\r\n        Copy\r\n    </button>\r\n    <button type="button" class="btn btn-sm btn-default pasteCropRegion" title="Paste crop region"\r\n        ';
 if (!canPasteRect) print('disabled') ;
__p += ' >\r\n        Paste\r\n    </button>\r\n    <button type="button" class="btn btn-sm btn-default reset-zoom-shape" title="Reset crop">\r\n        Reset\r\n    </button>\r\n</div>\r\n\r\n<button class="pull-right crop-btn btn btn-sm btn-success">\r\n    Crop\r\n</button>\r\n';

}
return __p
};

this["JST"]["src/templates/files/figure_file_item.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    ';
 if (disabled) { ;
__p += '\r\n        <td>\r\n            ';
 if(imageId > 0) { print("<img class='small-thumb' src='" + thumbSrc + "' />") }
               else { print ("<div class='missingThumb small-thumb'></div>")} ;
__p += '\r\n        </td>\r\n        <td title="This figure is currently open">\r\n            <div style="width:400px; word-wrap:break-word;">\r\n                ' +
__e( name ) +
'\r\n            </div>\r\n        </td>\r\n    ';
 } else { ;
__p += '\r\n        <td>\r\n            <a href="' +
((__t = ( url )) == null ? '' : __t) +
'">\r\n                <img class=\'small-thumb\' src=\'' +
((__t = ( thumbSrc )) == null ? '' : __t) +
'\' />\r\n            </a>\r\n        </td>\r\n        <td>\r\n            <div style="width:400px; word-wrap:break-word;">\r\n                <a href="' +
((__t = ( url )) == null ? '' : __t) +
'">' +
__e( name ) +
'</a>\r\n            </div>\r\n        </td>\r\n    ';
 } ;
__p += '\r\n    <td>\r\n        ' +
((__t = ( formatDate(creationDate) )) == null ? '' : __t) +
'\r\n    </td>\r\n    <td>\r\n        ' +
__e( ownerFullName ) +
'\r\n    </td>\r\n    <td>\r\n        ' +
__e( group.name ) +
'\r\n    </td>\r\n';

}
return __p
};

this["JST"]["src/templates/labels/label_right_vertical_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n<div class="label_layout right_vlabels">\r\n    <div>\r\n        ';
 _.each(labels, function(l, i) { ;
__p += '\r\n            <div style=\'color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'; font-size:' +
((__t = ( l.size )) == null ? '' : __t) +
'px\'>' +
((__t = ( l.text )) == null ? '' : __t) +
'</div>\r\n        ';
 }); ;
__p += '\r\n    </div>\r\n</div>\r\n';

}
return __p
};

this["JST"]["src/templates/labels/label_table_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <!-- Alternative label_template - uses table to valign middle for \'left\' & \'right\' labels -->\r\n    <div class="label_layout label_middle label_' +
((__t = ( position )) == null ? '' : __t) +
'">\r\n        <table>\r\n            <tr><td>\r\n                ';
 _.each(labels, function(l, i) { ;
__p += '\r\n                    <div style=\'color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'; font-size:' +
((__t = ( l.size )) == null ? '' : __t) +
'px\'>' +
((__t = ( l.text )) == null ? '' : __t) +
'</div>\r\n                ';
 }); ;
__p += '\r\n            </td></tr>\r\n        </table>\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/labels/label_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n\r\n    <!-- One of these added to each position \'top\', \'topleft\' etc within Panel $el -->\r\n    <div class="label_layout label_' +
((__t = ( position )) == null ? '' : __t) +
'">\r\n        ';
 _.each(labels, function(l, i) { ;
__p += '\r\n            <div style=\'color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'; font-size:' +
((__t = ( l.size )) == null ? '' : __t) +
'px\'>' +
((__t = ( l.text )) == null ? '' : __t) +
'</div>\r\n        ';
 }); ;
__p += '\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/labels/label_vertical_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <div class="label_layout left_vlabels">\r\n        <div>\r\n            ';
 _.each(labels, function(l, i) { ;
__p += '\r\n                <div style=\'color:#' +
((__t = ( l.color )) == null ? '' : __t) +
'; font-size:' +
((__t = ( l.size )) == null ? '' : __t) +
'px\'>' +
((__t = ( l.text )) == null ? '' : __t) +
'</div>\r\n            ';
 }); ;
__p += '\r\n        </div>\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/modal_dialogs/crop_modal_roi.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n<tr class="roiPickMe">\r\n    <td>\r\n        <div class="roi_wrapper" style="position: relative; overflow: hidden; margin: 5px; height: ' +
((__t = ( h )) == null ? '' : __t) +
'px; width: ' +
((__t = ( w )) == null ? '' : __t) +
'px">\r\n            <img class="roi_content"\r\n                data-roiId="' +
((__t = ( roiId )) == null ? '' : __t) +
'"\r\n                data-rotation="' +
((__t = ( rect.rotation )) == null ? '' : __t) +
'"\r\n                data-x="' +
((__t = ( rect.x )) == null ? '' : __t) +
'" data-y="' +
((__t = ( rect.y )) == null ? '' : __t) +
'" \r\n                data-width="' +
((__t = ( rect.width )) == null ? '' : __t) +
'" data-height="' +
((__t = ( rect.height )) == null ? '' : __t) +
'"\r\n                data-theT="' +
((__t = ( rect.theT )) == null ? '' : __t) +
'" data-theZ="' +
((__t = ( rect.theZ )) == null ? '' : __t) +
'"\r\n                style="position: absolute; top: ' +
((__t = ( top )) == null ? '' : __t) +
'px; left: ' +
((__t = ( left )) == null ? '' : __t) +
'px; width: ' +
((__t = ( img_w )) == null ? '' : __t) +
'px; height: ' +
((__t = ( img_h )) == null ? '' : __t) +
'px;\r\n                transform: ' +
((__t = ( css.transform )) == null ? '' : __t) +
';\r\n                transform-origin: ' +
((__t = ( css['transform-origin'] )) == null ? '' : __t) +
';"\r\n                src=\'' +
((__t = ( src )) == null ? '' : __t) +
'\' />\r\n        </div>\r\n    </td>\r\n    ';
 if (zStart) { ;
__p += '\r\n    <td>\r\n        ' +
((__t = ( zStart )) == null ? '' : __t) +
'\r\n        ';
 if (zStart !== zEnd) print(" - " + zEnd); ;
__p += '\r\n    </td>\r\n    ';
 } ;
__p += '\r\n    ';
 if (tStart) { ;
__p += '\r\n    <td>\r\n        ' +
((__t = ( tStart )) == null ? '' : __t) +
'\r\n        ';
 if (tStart !== tEnd) print(" - " + tEnd); ;
__p += '\r\n    </td>\r\n    ';
 } ;
__p += '\r\n</tr>\r\n';

}
return __p
};

this["JST"]["src/templates/modal_dialogs/paper_setup_modal_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <div class="col-sm-12">\r\n        <div class="form-horizontal">\r\n            <div class="form-group col-sm-6" style="margin-bottom: 15px;">\r\n                <label>Page Color</label>\r\n                <input class="pageColor form-control"\r\n                    value="#' +
((__t = ( page_color )) == null ? '' : __t) +
'"\r\n                    type="color" style="padding: 0" />\r\n            </div>\r\n        </div>\r\n        <div class="form-group col-sm-6"></div>\r\n        <div class="clearfix"></div>\r\n    </div>\r\n\r\n\r\n    <div class="col-sm-12">\r\n\r\n        <div class="form-horizontal">\r\n            <div class="form-group col-sm-6">\r\n                <label>Number of Pages</label>\r\n                <select class="pageCountSelect form-control">\r\n                    ';
 _.each([1,2,3,4,5,6,7,8,9,10],function(p){
                        print ("<option value='"+p+"'" + ((p == page_count) ? " selected " : "") + " >"+p+"</option>")
                    }); ;
__p += '\r\n                </select>\r\n            </div>\r\n            <div class="form-group col-sm-6"></div>\r\n            <div class="clearfix"></div>\r\n        </div>\r\n\r\n    </div>\r\n\r\n\r\n    <div class="col-sm-6">\r\n        <label>Size</label>\r\n        <div class="form-horizontal">\r\n            <div class="form-group col-sm-12">\r\n                <select class="paperSizeSelect form-control">\r\n                    <option value="A4" ';
 if (page_size == 'A4') { print('selected') } ;
__p += ' >\r\n                        A4 (210 x 297 mm)\r\n                    </option>\r\n                    <option value="A3" ';
 if (page_size == 'A3') { print('selected') } ;
__p += ' >\r\n                        A3 (297 x 420 mm)\r\n                    </option>\r\n                    <option value="A2" ';
 if (page_size == 'A2') { print('selected') } ;
__p += ' >\r\n                        A2 (420 x 594 mm)\r\n                    </option>\r\n                    <option value="A1" ';
 if (page_size == 'A1') { print('selected') } ;
__p += ' >\r\n                        A1 (594 x 841 mm)\r\n                    </option>\r\n                    <option value="A0" ';
 if (page_size == 'A0') { print('selected') } ;
__p += ' >\r\n                        A0 (841 x 1189 mm)\r\n                    </option>\r\n                    <option value="letter" ';
 if (page_size == 'letter') { print('selected') } ;
__p += ' >\r\n                        Letter (216 x 280 mm)\r\n                    </option>\r\n                    <option value="mm" ';
 if (page_size == 'mm') { print('selected') } ;
__p += ' >\r\n                        Custom (mm)\r\n                    </option>\r\n                    <option value="crop" ';
 if (page_size == 'crop') { print('selected') } ;
__p += '\r\n                        title="Fit a single page around all panels">\r\n                        ';
 if (page_count > 1) { ;
__p += '\r\n                            Crop single page to panels\r\n                        ';
 } else { ;
__p += '\r\n                            Crop page around panels\r\n                        ';
 } ;
__p += '\r\n                    </option>\r\n                </select>\r\n            </div>\r\n            <!-- <label for="inputPassword" class="col-sm-2 control-label">Password</label> -->\r\n        </div>\r\n    </div>\r\n    <div class="col-sm-6">\r\n        <label>Orientation</label>\r\n        <div class="form-horizontal">\r\n            <div class="form-group col-sm-6">\r\n                <input type="radio" name="pageOrientation" value="vertical"\r\n                    ';
 if (orientation == 'vertical') { print('checked') } ;
__p += ' >\r\n                <label class="control-label text-muted">Vertical</label>\r\n            </div>\r\n            <div class="form-group col-sm-6">\r\n                <input type="radio" name="pageOrientation" value="horizontal"\r\n                    ';
 if (orientation == 'horizontal') { print('checked') } ;
__p += ' >\r\n                <label class="control-label text-muted">Horizontal</label>\r\n            </div>\r\n        </div>\r\n    </div>\r\n    <div class="clearfix"></div>\r\n\r\n    <div class="col-sm-3';
 if (wh_disabled) { print(' wh_disabled')} ;
__p += '">\r\n        <label>Width</label>\r\n        <div class="form-horizontal">\r\n            <div class="form-group col-sm-10">\r\n                <input id=\'paperWidth\' type="number"\r\n                    ';
 if (wh_disabled) { print('disabled')} ;
__p += '\r\n                    class="form-control" value="' +
((__t = ( width_mm )) == null ? '' : __t) +
'">\r\n            </div>\r\n            <label class="col-sm-4 control-label text-muted wh_units" style="text-align:left">\r\n                mm\r\n            </label>\r\n        </div>\r\n    </div>\r\n    <div class="col-sm-3';
 if (wh_disabled) { print(' wh_disabled')} ;
__p += '">\r\n        <label>Height</label>\r\n        <div class="form-horizontal">\r\n            <div class="form-group col-sm-10">\r\n                <input id=\'paperHeight\' type="number"\r\n                    ';
 if (wh_disabled) { print('disabled')} ;
__p += '\r\n                    class="form-control" value="' +
((__t = ( height_mm )) == null ? '' : __t) +
'">\r\n            </div>\r\n            <label class="col-sm-4 control-label text-muted wh_units" style="text-align:left">\r\n                mm\r\n            </label>\r\n        </div>\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/modal_dialogs/preview_Id_change_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <table class="table" style="margin-bottom:0">\r\n        <tbody>\r\n            <tr><td>\r\n                <div class="col-sm-3">Compare:</div>\r\n                <div class="col-sm-3">\r\n                    <img class="small-thumb" title="' +
__e( selImg.name ) +
'"\r\n                        src="' +
((__t = ( selThumbSrc )) == null ? '' : __t) +
'" />\r\n                </div>\r\n                <div class="col-sm-3">\r\n                    ';
 if(newImg.imageId) { ;
__p += '\r\n                        <img class="small-thumb" title="' +
__e( newImg.name ) +
'"\r\n                            src="' +
((__t = ( newThumbSrc )) == null ? '' : __t) +
'" />\r\n                    ';
 } else { ;
__p += '\r\n                        <div style="width:40px; height:40px; background-color:#ddd"></div>\r\n                    ';
 } ;
__p += '\r\n                </div>\r\n                <div class="col-sm-3">Matching</div>\r\n            </td></tr>\r\n            <tr><td>\r\n                <div class="col-sm-3"><small><strong>Dimensions (XY)</strong>:</small></div>\r\n                <div class="col-sm-3"><small>' +
((__t = ( selImg.orig_width )) == null ? '' : __t) +
' x ' +
((__t = ( selImg.orig_height )) == null ? '' : __t) +
'</small></div>\r\n                <div class="col-sm-3"><small>\r\n                    ' +
((__t = ( newImg.orig_width || "-" )) == null ? '' : __t) +
' x ' +
((__t = ( newImg.orig_height || "-"  )) == null ? '' : __t) +
'\r\n                </small></div>\r\n                <div class="col-sm-3">\r\n                    ' +
((__t = ( ok(comp.orig_width, comp.orig_height) )) == null ? '' : __t) +
'\r\n                </div>\r\n\r\n                <div class="col-sm-3"><small><strong>Z-sections</strong>:</small></div>\r\n                <div class="col-sm-3"><small>' +
((__t = ( selImg.sizeZ )) == null ? '' : __t) +
'</small></div>\r\n                <div class="col-sm-3"><small>' +
((__t = ( newImg.sizeZ || "-" )) == null ? '' : __t) +
'</small></div>\r\n                <div class="col-sm-3">' +
((__t = ( ok(comp.sizeZ) )) == null ? '' : __t) +
'</div>\r\n\r\n                <div class="col-sm-3"><small><strong>Time-points</strong>:</small></div>\r\n                <div class="col-sm-3"><small>' +
((__t = ( selImg.sizeT )) == null ? '' : __t) +
'</small></div>\r\n                <div class="col-sm-3"><small>' +
((__t = ( newImg.sizeT || "-" )) == null ? '' : __t) +
'</small></div>\r\n                <div class="col-sm-3"><small>' +
((__t = ( ok(comp.sizeT) )) == null ? '' : __t) +
'</small></div>\r\n\r\n                <div class="col-sm-3"><small><strong>Channels</strong>:</small></div>\r\n                <div class="col-sm-3"><small>\r\n                    ';
 _.each(selImg.channels, function(ch, i) { ;
__p += '\r\n                        ' +
__e( ch.label );
 if(i < selImg.channels.length-1){print(',')} ;
__p += '\r\n                    ';
 }); ;
__p += '\r\n                </small></div>\r\n                <div class="col-sm-3"><small>\r\n                    ';
 if(newImg.channels){ _.each(newImg.channels, function(ch, i) { ;
__p += '\r\n                        ' +
__e( ch.label );
 if(i < newImg.channels.length-1){print(',')} ;
__p += '\r\n                    ';
 }) } else { print("-") } ;
__p += '\r\n                </small></div>\r\n                <div class="col-sm-3"><small>' +
((__t = ( comp.channels || "-" )) == null ? '' : __t) +
'</small></div>\r\n\r\n            </td></tr>\r\n        </tbody>\r\n    </table>\r\n    ';
 _.each(messages, function(m) { ;
__p += '\r\n        <div class="alert alert-' +
((__t = ( m.status )) == null ? '' : __t) +
'">' +
((__t = ( m.text )) == null ? '' : __t) +
'</div>\r\n    ';
 }); ;
__p += '\r\n    ';
 if (newImg.imageId && messages.length == 0) {
        print("<div class='alert alert-success'>Perfect Match!</div>")
    } ;
__p += '\r\n';

}
return __p
};

this["JST"]["src/templates/modal_dialogs/roi_modal_roi.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n<tr>\r\n    <th></th>\r\n    <th></th>\r\n    <th>Z</th>\r\n    <th>T</th>\r\n    <th></th>\r\n</tr>\r\n';
 _.each(rois, function(roi) { ;
__p += '\r\n\r\n<tr class="roiModalRoiItem"\r\n        data-roiId="' +
((__t = ( roi.id )) == null ? '' : __t) +
'"\r\n        ';
 if (!roi.shapes[0].icon) { ;
__p += '\r\n            title="' +
((__t = ( roi.shapes[0].type )) == null ? '' : __t) +
' not supported in OMERO.figure"\r\n        ';
 } ;
__p += '\r\n        ';
 if (roi.shapes.length === 1) { ;
__p += '\r\n            data-shapeId="' +
((__t = ( roi.shapes[0].id )) == null ? '' : __t) +
'"\r\n            title="' +
((__t = ( roi.shapes[0].tooltip )) == null ? '' : __t) +
'"\r\n        ';
 } ;
__p += '\r\n        >\r\n    <td>\r\n        ';
 if (roi.shapes.length > 1) { ;
__p += '\r\n            <span class="toggleRoi glyphicon glyphicon-play"></span>\r\n        ';
 } ;
__p += '\r\n    </td>\r\n    <td>\r\n        <span class="glyphicon ';
 if (roi.shapes[0].icon) { ;
__p +=
((__t = ( roi.icon )) == null ? '' : __t);
 } ;
__p += '"></span>\r\n    </td>\r\n\r\n    <td style="padding-left: 0; padding-right: 0">\r\n        ';
 if (roi.minZ !== undefined) { ;
__p += '\r\n            ' +
((__t = ( roi.minZ + 1 )) == null ? '' : __t);
 if (roi.maxZ !== roi.minZ) print("-" + (roi.maxZ + 1)); ;
__p += '\r\n        ';
 } ;
__p += '\r\n    </td>\r\n    <td style="padding-left: 0; padding-right: 0">\r\n        ';
 if (roi.minT !== undefined) { ;
__p += '\r\n            ' +
((__t = ( roi.minT + 1 )) == null ? '' : __t);
 if (roi.maxT !== roi.minT) print("-" + (roi.maxT + 1)); ;
__p += '\r\n        ';
 } ;
__p += '\r\n    </td>\r\n    <td>\r\n        ';
 if (roi.shapes.length === 1 && roi.shapes[0].icon) { ;
__p += '\r\n        <button type="button" class="addOmeroShape btn btn-success btn-sm"\r\n                title="Add Shape to image">\r\n            Add\r\n        </button>\r\n        ';
 } ;
__p += '\r\n    </td>\r\n</tr>\r\n\r\n';
 }) ;
__p += '\r\n';

}
return __p
};

this["JST"]["src/templates/modal_dialogs/roi_modal_shape.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n\r\n';
 if (shapes.length > 1) { ;
__p += '\r\n    ';
 _.each(shapes, function(shape) { ;
__p += '\r\n    <tr class="roiModalRoiItem shape" data-shapeId="' +
((__t = ( shape.id )) == null ? '' : __t) +
'"\r\n        title="' +
((__t = ( shape.tooltip )) == null ? '' : __t) +
'"\r\n        ';
 if (!shape.icon) { ;
__p += 'title="' +
((__t = ( shape.type )) == null ? '' : __t) +
' not supported in OMERO.figure"';
 } ;
__p += '\r\n        >\r\n        <td></td>\r\n        <td>\r\n            <span class="glyphicon ';
 if (shape.icon) { ;
__p +=
((__t = ( shape.icon )) == null ? '' : __t);
 } ;
__p += '"></span>\r\n        </td>\r\n        <td>\r\n            ';
 if (shape.theZ !== undefined) { ;
__p += '\r\n                ' +
((__t = ( shape.theZ + 1 )) == null ? '' : __t) +
'\r\n            ';
 } ;
__p += '\r\n        </td>\r\n        <td>\r\n            ';
 if (shape.theT !== undefined) { ;
__p += '\r\n                ' +
((__t = ( shape.theT + 1 )) == null ? '' : __t) +
'\r\n            ';
 } ;
__p += '\r\n        </td>\r\n        <td>\r\n            ';
 if (shape.icon) { ;
__p += '\r\n            <button type="button" class="addOmeroShape btn btn-success btn-sm"\r\n                    title="Add Shape to image">\r\n                Add\r\n            </button>\r\n            ';
 } else { ;
__p += '\r\n                <span>\r\n                    ' +
((__t = ( shape.type )) == null ? '' : __t) +
'\r\n                </span>\r\n            ';
 } ;
__p += '\r\n        </td>\r\n    </tr>\r\n    ';
 }) ;
__p += '\r\n';
 } ;
__p += '\r\n';

}
return __p
};

this["JST"]["src/templates/modal_dialogs/roi_zt_buttons.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n<span class="label label-default" style="font-size: 12px">Z: ' +
((__t = ( theZ + 1 )) == null ? '' : __t) +
'</span>\r\n';
 if (theZ != origZ) { ;
__p += '\r\n    <button type="button" class="revert_theZ btn btn-success btn-xs">Revert to Z: ' +
((__t = ( origZ + 1 )) == null ? '' : __t) +
'</button>\r\n';
 } ;
__p += '\r\n<span class="label label-default" style="font-size: 12px">T: ' +
((__t = ( theT +1 )) == null ? '' : __t) +
'</span>\r\n';
 if (theT != origT) { ;
__p += '\r\n    <button type="button" class="revert_theT btn btn-success btn-xs">Revert to T: ' +
((__t = ( origT + 1 )) == null ? '' : __t) +
'</button>\r\n';
 } ;
__p += '\r\n';

}
return __p
};

this["JST"]["src/templates/shapes/shape_item_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n    <div ';
 if (selected) print ("style='background:#ddf'") ;
__p += ' >\r\n\r\n    	' +
((__t = ( type )) == null ? '' : __t) +
'\r\n\r\n    	';
 if (type === 'RECT') print("x:" + x + " y:" + y + " width:"+ width + " height:" + height) ;
__p += '\r\n\r\n    	';
 if (type === 'LINE' || type === 'ARROW') print("x1:" + (x1 >> 0) + " y1:" + (y1 >> 0) + " x2:" + (x2 >> 0) + " y2:" + (y2 >> 0)) ;
__p += '\r\n\r\n    	';
 if (type === 'ELLIPSE') print("x:" + (cx >> 0) + " y:" + (cy >> 0) + " rx:" + (rx >> 0) + " ry:" + (ry >> 0)) ;
__p += '\r\n\r\n    </div>\r\n';

}
return __p
};

this["JST"]["src/templates/shapes/shape_toolbar_template.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '\r\n\r\n<div class="btn-group shape-option" role="group" aria-label="...">\r\n    <button type="button" data-state="SELECT"\r\n        class="btn btn-default';
 if (state==='SELECT')print('pressed') ;
__p += '">\r\n        <span class="glyphicon select-icon"></span></button>\r\n</div>\r\n\r\n\r\n<div class="btn-group shape-option" role="group" aria-label="...">\r\n    <button type="button" class="btn btn-default ';
 if (state==='RECT')print('pressed') ;
__p += '"\r\n            title="Rectangle" data-state="RECT">\r\n        <span class="glyphicon rect-icon"></span></button>\r\n    <button type="button" class="btn btn-default ';
 if (state==='LINE')print('pressed') ;
__p += '"\r\n            title="Line" data-state="LINE">\r\n        <span class="glyphicon line-icon"></span></button>\r\n    <button type="button" class="btn btn-default ';
 if (state==='ARROW')print('pressed') ;
__p += '"\r\n            title="Arrow" data-state="ARROW">\r\n        <span class="glyphicon arrow-icon"></span></button>\r\n    <button type="button" class="btn btn-default ';
 if (state==='ELLIPSE')print('pressed') ;
__p += '"\r\n            title="Ellipse" data-state="ELLIPSE">\r\n        <span class="glyphicon ellipse-icon"></span></button>\r\n</div>\r\n\r\n\r\n<div class="btn-group">\r\n    <button type="button" class="shape-color btn btn-default dropdown-toggle" title="Label Color"\r\n        data-toggle="dropdown">\r\n        <span data-color="' +
((__t = ( color )) == null ? '' : __t) +
'" style="background-color:#' +
((__t = ( color )) == null ? '' : __t) +
'">&nbsp &nbsp &nbsp</span>\r\n        <span class="caret"></span>\r\n    </button>\r\n    <ul class="dropdown-menu dropdownSelect colorpicker" role="menu">\r\n        <li><a href="#">\r\n            <span data-color="000000" style="background-color:#000">&nbsp &nbsp &nbsp</span>&nbsp Black\r\n        </a></li>\r\n        <li><a href="#">\r\n            <span data-color="0000FF" style="background-color:#00f">&nbsp &nbsp &nbsp</span>&nbsp Blue\r\n        </a></li>\r\n        <li><a href="#">\r\n            <span data-color="00FF00" style="background-color:#0f0">&nbsp &nbsp &nbsp</span>&nbsp Green\r\n        </a></li>\r\n        <li><a href="#">\r\n            <span data-color="FF0000" style="background-color:#f00">&nbsp &nbsp &nbsp</span>&nbsp Red\r\n        </a></li>\r\n        <li><a href="#">\r\n            <span data-color="FFFF00" style="background-color:#ff0">&nbsp &nbsp &nbsp</span>&nbsp Yellow\r\n        </a></li>\r\n        <li><a href="#">\r\n            <span data-color="FFFFFF" style="background-color:#fff">&nbsp &nbsp &nbsp</span>&nbsp White\r\n        </a></li>\r\n        <li><a href="#">\r\n            <span data-color="FF00FF" style="background-color:#f0f">&nbsp &nbsp &nbsp</span>&nbsp Magenta\r\n        </a></li>\r\n        <li class="divider"></li>\r\n        <li><a data-color="colorpicker" data-oldcolor="' +
((__t = ( color )) == null ? '' : __t) +
'" href="#">\r\n            <span class="colorpickerOption">&nbsp &nbsp &nbsp</span>&nbsp More Colors...\r\n        </a></li>\r\n    </ul>\r\n</div>\r\n\r\n\r\n<div class="btn-group">\r\n    <button type="button" class="line-width btn btn-default dropdown-toggle" title="Line Width: ' +
((__t = ( lineWidth )) == null ? '' : __t) +
'"\r\n        data-toggle="dropdown">\r\n        <span data-line-width="' +
((__t = ( lineWidth )) == null ? '' : __t) +
'">' +
((__t = ( lineWidth )) == null ? '' : __t) +
' pt</span>\r\n        <span class="caret"></span>\r\n    </button>\r\n    <ul class="dropdown-menu dropdownSelect lineWidth" style="min-width: 0" role="menu">\r\n        ';
 _.each(lineWidths,function(p){ ;
__p += '\r\n            <li><a href=\'#\'><span data-line-width=\'' +
((__t = ( p )) == null ? '' : __t) +
'\'>' +
((__t = ( p )) == null ? '' : __t) +
' pt</span></a></li>\r\n        ';
 }); ;
__p += '\r\n    </ul>\r\n</div>\r\n\r\n\r\n<div class="btn-group">\r\n    <button type="button" class="line-width btn btn-default dropdown-toggle" title="Delete, Copy, Paste etc"\r\n        data-toggle="dropdown">\r\n        <span>Edit</span>\r\n        <span class="caret"></span>\r\n    </button>\r\n    <ul class="dropdown-menu" role="menu">\r\n        <li ';
 if (!sel) print('class="disabled"') ;
__p += ' >\r\n            <a href="#" class="copyShape">\r\n                Copy Shape   &nbsp&nbsp&nbsp ' +
((__t = ( cmdKey )) == null ? '' : __t) +
'C\r\n            </a>\r\n        </li>\r\n        <li ';
 if (!toPaste) print('class="disabled"') ;
__p += ' >\r\n            <a href="#" class="pasteShape">\r\n                Paste Shape   &nbsp&nbsp&nbsp ' +
((__t = ( cmdKey )) == null ? '' : __t) +
'V\r\n            </a>\r\n        </li>\r\n        <li ';
 if (!sel) print('class="disabled"') ;
__p += ' >\r\n            <a href="#" class="deleteShape">\r\n                Delete Shape    &nbsp&nbsp&nbsp Del\r\n            </a>\r\n        </li>\r\n        <li>\r\n            <a href="#" class="selectAll">\r\n                Select All Shapes    &nbsp&nbsp ' +
((__t = ( cmdKey )) == null ? '' : __t) +
'A\r\n            </a>\r\n        </li>\r\n    </ul>\r\n</div>\r\n\r\n\r\n<div class="btn-group" style="float: right"\r\n    ';
 if (omeroRoiCount > 0) { ;
__p += '\r\n        title="Load ' +
((__t = (omeroRoiCount)) == null ? '' : __t) +
' ROIs from OMERO"\r\n    ';
 } else { ;
__p += '\r\n        title="This image has no ROIs on the OMERO server"\r\n    ';
 } ;
__p += '>\r\n    <button class="loadRois btn btn-success"\r\n        ';
 if (omeroRoiCount == 0) { ;
__p += '\r\n            disabled=\'disabled\'\r\n        ';
 } ;
__p += '\r\n    >\r\n        ';
 if (roisLoaded) {;
__p += '\r\n            Refresh ROIs\r\n        ';
 } else { ;
__p += '\r\n            Load ROIs\r\n        ';
 } ;
__p += '\r\n    </button>\r\n</div>\r\n';

}
return __p
};