
//
// Copyright (C) 2015 University of Dundee & Open Microscopy Environment.
// All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//


// Should only ever have a singleton on this
var ColorPickerView = Backbone.View.extend({

    el: $("#colorpickerModal"),

    initialize:function () {
        
        var sliders = {
            saturation: {
                maxLeft: 200,
                maxTop: 200,
                callLeft: 'setSaturation',
                callTop: 'setBrightness'
            },
            hue: {
                maxLeft: 0,
                maxTop: 200,
                callLeft: false,
                callTop: 'setHue'
            },
            alpha: {
                maxLeft: 0,
                maxTop: 200,
                callLeft: false,
                callTop: 'setAlpha'
            }
        };

        var self = this;

        this.$submit_btn = $("#colorpickerModal .modal-footer button[type='submit']");

        $('.demo-auto').colorpicker({
            'sliders': sliders,
            'color': '00ff00',
        }).on('changeColor', function(ev){
            console.log(arguments);
            self.$submit_btn.prop('disabled', false);
            $('.oldNewColors li:first-child').css('background-color', ev.color.toHex());
        });
    },

    
    events: {
        "submit .colorpickerForm": "handleColorpicker",
    },

    handleColorpicker: function(event) {
        event.preventDefault();


        var color = $(".colorpickerForm input[name='color']").val();

        if (this.success) {
            this.success(color);
        }

        $("#colorpickerModal").modal('hide');
        return false;
    },

    show: function(options) {

        $("#colorpickerModal").modal('show');

        if (options.color) {
            $('.demo-auto').colorpicker('setValue', options.color);

            // compare old and new colors - init with old color
            $('.oldNewColors li').css('background-color', "#" + options.color);

            // disable submit button until color is chosen
            this.$submit_btn.prop('disabled', 'disabled');
        }

        // save callback to use on submit
        if (options.success) {
            this.success = options.success;
        }

    },

    render:function () {
        
    }
});
