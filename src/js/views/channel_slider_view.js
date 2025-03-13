
import Backbone from "backbone";
import _ from "underscore";
import $ from "jquery";

import FigureLutPicker from "../views/lutpicker";
import FigureColorPicker from "../views/colorpicker";

import channel_slider_template from '../../templates/channel_slider.template.html?raw';
import checkbox_template from '../../templates/checkbox_template.html?raw';

const SLIDER_INCR_CUTOFF = 100;
// If the max value of a slider is below this, use smaller slider increments

var ChannelSliderView = Backbone.View.extend({

    template: _.template(channel_slider_template),
    checkboxTemplate: _.template(checkbox_template),

    initialize: function(opts) {
        // This View may apply to a single PanelModel or a list
        this.models = opts.models;
        var self = this;
        this.models.forEach(function(m){
            self.listenTo(m, 'change:channels', self.render);
        });
    },

    events: {
        "keyup .ch_start": "handle_channel_input",
        "keyup .ch_end": "handle_channel_input",
        "click .channel-btn": "toggle_channel",
        "click .dropdown-menu a": "pick_color",
        "input .ch_slider input": "channel_slider_slide",
        "change .ch_slider input": "channel_slider_stop",
        "mousemove .ch_start_slider": "start_slider_mousemove",
        "mousemove .ch_end_slider": "end_slider_mousemove",
        "change #hiloCheckbox": "handle_hilo_checkbox",
    },

    start_slider_mousemove: function(event) {
        // To avoid clicking start-slider when the mouse is ABOVE the midpoint (between slider handles)
        // On mouseover we add pointer events to end-slider (which is on top, so clicks will be handled by it)
        let $target = $(event.target);
        let fraction = event.offsetX/$target.width();
        // value of the 'end' slider is stored on the start-slider
        let slidemax = parseFloat($target.data('slidemax'));
        let slideval = parseFloat($target.val());
        let midfraction = this.get_midfraction(slideval, slidemax, $target);
        if (fraction > midfraction) {
            $(".ch_end_slider", $target.parent()).css("pointer-events", "all");
        }
    },

    end_slider_mousemove: function(event) {
        // To avoid clicking end-slider when the mouse is BELOW the midpoint (between slider handles)
        // On mouseover we REMOVE pointer events from end-slider (so they fall to the start-slider underneath)
        let $target = $(event.target);
        let fraction = event.offsetX/$target.width();
        // value of the 'start' slider is stored on the end-slider
        let slidemin = parseFloat($target.data('slidemin'));
        let slideval = parseFloat($target.val());
        let midfraction = this.get_midfraction(slidemin, slideval, $target);
        if (fraction < midfraction) {
            $target.css("pointer-events", "none");
        }
    },

    get_midfraction(start, end, $target) {
        let midvalue = (start + end) / 2;
        let minval = parseFloat($target.attr('min'));
        let maxval = parseFloat($target.attr('max'));
        return (midvalue - minval) / (maxval - minval);
    },

    pick_color: function(e) {
        var color = e.currentTarget.getAttribute('data-color'),
            $colorbtn = $(e.currentTarget).parent().parent(),
            oldcolor = $(e.currentTarget).attr('data-oldcolor'),
            idx = $colorbtn.attr('data-index'),
            self = this;

        if (color == 'colorpicker') {
            FigureColorPicker.show({
                'color': oldcolor,
                'success': function(newColor){
                    // remove # from E.g. #ff00ff
                    newColor = newColor.replace("#", "");
                    self.set_color(idx, newColor);
                }
            });
        } else if (color == 'lutpicker') {
            FigureLutPicker.show({
                success: function(lutName){
                    // LUT names are handled same as color strings
                    self.set_color(idx, lutName);
                }
            });
        } else if (color == 'reverse') {
            var reverse = $('i', e.currentTarget).length > 0;
            self.models.forEach(function(m){
                m.save_channel(idx, 'reverseIntensity', !reverse);
            });
        } else {
            this.set_color(idx, color);
        }
        return false;
    },

    set_color: function(idx, color) {
        if (this.models) {
            this.models.forEach(function(m){
                m.save_channel(idx, 'color', color);
            });
        }
    },

    hexToRgb: function hexToRgb(hex) {
        // handle #ff00ff
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
        // handle #ccc
        result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);
        if (result) return {
            r: parseInt(result[1]+'0', 16),
            g: parseInt(result[2]+'0', 16),
            b: parseInt(result[3]+'0', 16)
        };
    },

    isDark: function(color) {
        if (color.endsWith('.lut')) {
            return false;
        }
        var c = this.hexToRgb(color);
        if (!c) {
            return false;
        }
        var min, max, delta;
        var v, s, h;
        min = Math.min(c.r, c.g, c.b);
        max = Math.max(c.r, c.g, c.b);
        v = max;
        delta = max-min;
        if (max !== 0) {
            s = delta/max;
        }
        else {
            v = 0;
            s = 0;
            h = 0;
        }
        if (delta === 0) {
            h = 0;
        } else if (c.r==max) {
            h = (c.g-c.b)/delta;
        } else if (c.g == max) {
            h = 2 + (c.b-c.r)/delta;
        } else {
            h = 4 +(c.r-c.g)/delta;
        }
        h = h * 60;
        if (h < 0) {
            h += 360;
        }
        h = h/360;
        v = v/255;
        return (v < 0.6 || (h > 0.6 && s > 0.7));
    },

    toggle_channel: function(e) {
        var idx = e.currentTarget.getAttribute('data-index');

        if (this.model) {
            this.model.toggle_channel(idx);
        } else if (this.models) {
            // 'flat' means that some panels have this channel on, some off
            var flat = $('div', e.currentTarget).hasClass('ch-btn-flat');
            this.models.forEach(function(m){
                if(flat) {
                    m.toggle_channel(idx, true);
                } else {
                    m.toggle_channel(idx);
                }
            });
        }
        return false;
    },

    handle_channel_input: function(event) {
        if (event.type === "keyup" && event.which !== 13) {
            return;     // Ignore keyups except 'Enter'
        }
        var idx = event.target.getAttribute('data-idx'),
            startEnd = event.target.getAttribute('data-window');  // 'start' or 'end'
        idx = parseInt(idx, 10);
        var value = parseFloat(event.target.value, 10);
        if (isNaN(value)) return;
        // Make sure 'start' < 'end' value
        if (event.target.getAttribute('max') && value > event.target.getAttribute('max')){
            alert("Enter a value less than " + event.target.getAttribute('max'));
            return;
        }
        if (event.target.getAttribute('min') && value < event.target.getAttribute('min')){
            alert("Enter a value greater than " + event.target.getAttribute('min'))
            return;
        }
        var newCh = {};
        newCh[startEnd] = value;
        this.models.forEach(function(m) {
            m.save_channel_window(idx, newCh);
        });
    },

    channel_slider_slide: function(event) {
        // Handle sliding action for start slider and end slider
        let $target = $(event.target);
        let value = parseFloat(event.target.value);
        let max = $target.attr('max');
        let min = $target.attr('min');
        let chIndex = $target.data('idx');
        // ensure that start < end
        const start = $target.hasClass("ch_start_slider");
        if (start) {
            let slidemax = $target.data('slidemax');
            if (value > slidemax) {
                $target.val(slidemax);
                return;
            }
        } else {
            let slidemin = $target.data('slidemin');
            if (value < slidemin) {
                $target.val(slidemin);
                return;
            }
        }
        // simply format and update the correct text input...
        value = (max - min > SLIDER_INCR_CUTOFF) ? value : value.toFixed(2);
        if (start){
            $(`.channel_slider_${chIndex} .ch_start input`).val(value);
        } else {
            $(`.channel_slider_${chIndex}  .ch_end input`).val(value);
        }
    },

    channel_slider_stop: function(event) {
        // Handle slide -> stop for start slider and end slider
        let value = parseFloat(event.target.value);
        let $target = $(event.target);
        let chIndex = $target.data('idx');
        let toUpdate = {};
        // Save change to 'start' or 'end' value;
        if ($target.hasClass("ch_start_slider")) {
            toUpdate.start = value;
        } else {
            toUpdate.end = value;
        }
        this.models.forEach(function(m) {
            m.save_channel_window(chIndex, toUpdate);
        });
    },

    clear: function() {
        // $(".ch_slider").slider("destroy");
        $("#channel_sliders").empty();
        return this;
    },

    handle_hilo_checkbox: function(event) {
        var checkboxState = event.target.checked;
        this.models.forEach(function(m) {
            if (checkboxState && !m.get("hilo_enabled")){
                m.save({
                    "hilo_enabled": true,
                    "hilo_channels_state": m.get('channels').map(function(channel) {
                        return {
                            "color": channel.color,
                            "active": channel.active
                        };
                    })
                });
                let foundActive = false;
                let newChs = m.get('channels').map(function(channel, idx) {
                    // Switch LUT to HiLo for all channels
                    // Keep only the first active channel active
                    let new_state = {
                        'color': 'hilo.lut',
                        'active': (!foundActive && channel.active)
                    }
                    foundActive = (foundActive || channel.active);
                    return new_state;
                });
                m.save_channels(newChs);
            } else if (!checkboxState && m.get("hilo_enabled")){
                m.save("hilo_enabled", false);
                let newChs = m.get('channels').map(function(channel, idx) {
                    return m.get("hilo_channels_state")[idx];
                });
                m.save_channels(newChs);
            }
        })
    },

    loadCheckboxState: function() {
        var checkbox = this.$("#hiloCheckbox")[0];
        this.models.forEach(function(m) {
            checkbox.checked = m.get('hilo_enabled') || checkbox.checked;
        });
    },

    render: function() {
        var json,
            self = this;

            // Helper functions for map & reduce below
            var addFn = function (prev, s) {
                return prev + s;
            };
            var getColor = function(idx) {
                return function(ch) {
                    return ch[idx].color;
                }
            }
            var getLabel = function(idx) {
                return function(ch) {
                    return ch[idx].label;
                }
            }
            var getReverse = function(idx) {
                return function(ch) {
                    // For older figures (created pre 5.3.0) might be undefined
                    return ch[idx].reverseIntensity === true;
                }
            }
            var getActive = function(idx) {
                return function(ch) {
                    return ch[idx].active === true;
                }
            }
            var windowFn = function (idx, attr) {
                return function (ch) {
                    return parseFloat(ch[idx].window[attr]);
                }
            };
            var allEqualFn = function(prev, value) {
                return value === prev ? prev : undefined;
            };
            var reduceFn = function(fn) {
                return function(prev, curr) {
                    return fn(prev, curr);
                }
            }
            // Comare channels from each Panel Model to see if they are
            // compatible, and compile a summary json.
            var chData = this.models.map(function(m){
                return m.get('channels');
            });
            // images are compatible if all images have same channel count
            var allSameCount = chData.reduce(function(prev, channels){
                return channels.length === prev ? prev : false;
            }, chData[0].length);
            if (!allSameCount) {
                return this;
            }
            // $(".ch_slider").slider("destroy");
            this.$el.empty();
            chData[0].forEach(function(d, chIdx) {
                // For each channel, summarise all selected images:
                // Make list of various channel attributes:
                var starts = chData.map(windowFn(chIdx, 'start'));
                var ends = chData.map(windowFn(chIdx, 'end'));
                var mins = chData.map(windowFn(chIdx, 'min'));
                var maxs = chData.map(windowFn(chIdx, 'max'));
                var colors = chData.map(getColor(chIdx));
                var reverses = chData.map(getReverse(chIdx));
                var actives = chData.map(getActive(chIdx));
                var labels = chData.map(getLabel(chIdx));
                // Reduce lists into summary for this channel
                var startAvg = starts.reduce(addFn, 0) / starts.length;
                var endAvg = ends.reduce(addFn, 0) / ends.length;
                var startsNotEqual = starts.reduce(allEqualFn, starts[0]) === undefined;
                var endsNotEqual = ends.reduce(allEqualFn, ends[0]) === undefined;
                var min = mins.reduce(reduceFn(Math.min));
                var max = maxs.reduce(reduceFn(Math.max));
                if (max - min > SLIDER_INCR_CUTOFF) {
                    // If we have a large range, use integers, otherwise format to 2dp
                    startAvg = parseInt(startAvg);
                    endAvg = parseInt(endAvg);
                } else {
                    startAvg = startAvg.toFixed(2);
                    endAvg = endAvg.toFixed(2);
                }
                var color = colors.reduce(allEqualFn, colors[0]) ? colors[0] : 'ccc';
                // allEqualFn for booleans will return undefined if not or equal
                var label = labels.reduce(allEqualFn, labels[0]) ? labels[0] : ' ';
                var reverse = reverses.reduce(allEqualFn, reverses[0]) ? true : false;
                var active = actives.reduce(allEqualFn, actives[0]);
                var lutBgPos = FigureLutPicker.getLutBackgroundPosition(color);
                var lutBgCss = '--bgPos: 0 0;';
                if (color.endsWith('.lut')) {
                    var lutPng = FigureLutPicker.getLutPng(color);
                    if (lutPng) {
                        lutBgCss = `--bgPos: 0 0; --lutPng: url('${lutPng}'); --pngHeight: 100%;`;
                    } else {
                        lutBgCss = `--bgPos: ${lutBgPos};`
                    }
                    color = "ccc";
                } else if (color.toUpperCase() === "FFFFFF") {
                    color = "ccc";  // white slider would be invisible
                }
                if (color == "FFFFFF") color = "ccc";  // white slider would be invisible

                // Make sure slider range is increased if needed to include current values
                min = Math.min(min, startAvg);
                max = Math.max(max, endAvg);

                var sliderHtml = self.template({'idx': chIdx,
                                                'label': label,
                                                'startAvg': startAvg,
                                                'startsNotEqual': startsNotEqual,
                                                'endAvg': endAvg,
                                                'endsNotEqual': endsNotEqual,
                                                'min': min,
                                                'max': max,
                                                'step': (max - min > SLIDER_INCR_CUTOFF) ? 1 : 0.01,
                                                'active': active,
                                                'lutBgCss': lutBgCss,
                                                'reverse': reverse,
                                                'color': color,
                                                'isDark': this.isDark(color)
                                            });
                $(sliderHtml).appendTo(this.$el);

            }.bind(this));
            // Append the checkbox template
            var checkboxHtml = this.checkboxTemplate();
            this.$el.append(checkboxHtml);
            // Load checkbox state after rendering
            this.loadCheckboxState();
        return this;
    }
});

export default ChannelSliderView
