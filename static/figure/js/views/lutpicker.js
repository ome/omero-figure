
//
// Copyright (C) 2016 University of Dundee & Open Microscopy Environment.
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
var LutPickerView = Backbone.View.extend({

    el: $("#lutpickerModal"),

    template: JST["static/figure/templates/lut_picker.html"],

    initialize:function () {
    },

    
    events: {
        "click button[type='submit']": "handleSubmit",
        "click .lutOption": "pickLut",
    },

    handleSubmit: function() {
        this.success(this.pickedLut);
        $("#lutpickerModal").modal('hide');
    },

    pickLut: function(event) {
        var lutName = event.currentTarget.getAttribute('data-lut');
        console.log(lutName);
        this.pickedLut = lutName;
    },

    loadLuts: function () {
        var url = WEBGATEWAYINDEX + 'luts/';
        var promise = $.getJSON(url);
        return promise;
    },

    show: function(options) {

        $("#lutpickerModal").modal('show');

        // save callback to use on submit
        if (options.success) {
            this.success = options.success;
        }

        this.loadLuts().done(function(data){
            console.log(data);
            this.luts = data;
            this.render();
        }.bind(this));

        // this.render();
    },

    render:function () {
        
        var data = this.luts;
        var html = this.template(data);

        $(".modal-body", this.el).html(html);
    }
});
