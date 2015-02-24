---
layout: post
title:  "Customizing Bootstrap colorpicker"
date:   2015-02-24
---

When looking to add a color-picker to OMERO.figure [as requested](https://github.com/will-moore/figure/issues/36),
I searched for "bootstrap colorpicker" since all the UI is currently built using the fantastic [Twitter bootstrap framework](http://getbootstrap.com/).
I quickly found [bootstrap colorpicker](http://mjolnic.com/bootstrap-colorpicker/) which seemed to do
everything I needed. The only problem was that the color-picker itself was smaller than I wanted, at
only 100 pixels wide. 

<div class="well">
  <div id="demo_cont" class="demo inl-bl" data-container="#demo_cont" data-color="#f41070" data-inline="true"></div>
  <div class="demo-bigger inl-bl" data-container="true" data-color="#6f01d1" data-inline="true"></div>
</div>

The docs didn't provide any clues on how to increase the size of the colorpicker, so I started to play with
Chrome's dev-tools and managed to add a couple of styles to double the size as follows:

<pre class="markup">
&lt;style /&gt;

  .colorpicker-hue {
      height: 200px;
      width: 30px;
      background-size: 30px 200px;
  }
  .colorpicker-saturation {
      width: 200px;
      height: 200px;
      background-size: 200px 200px;
  }
&lt;/style&gt;
        </pre>


However, these 
changes alone broke the colorpicker, since it was still using the 100px size in the plugin.
Fortunately a little inspection of the code revealed that these dimensions were configurable in the
plugin's 'slider' option.

By passing in a customised 'slider' option, the colorpicker works as normal at it's new size: 

<pre class="markup">
&lt;script&gt;
$(function(){

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

    $('.demo').colorpicker({'sliders': sliders});
});
&lt;/script&gt;</pre>




<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css">
<link rel="stylesheet" href="{{ site.baseurl }}/demo/static/figure/colorpicker/css/bootstrap-colorpicker.min.css">

<script src="//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js"></script>
<script src="{{ site.baseurl }}/demo/static/figure/colorpicker/js/bootstrap-colorpicker.min.js"></script>

<script>
  $(function(){
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

    $('.demo').colorpicker();
    $('.demo-bigger').colorpicker({'sliders': sliders});
  });
</script>

<style>

  .inl-bl {
    display: inline-block;
  }

  .demo-bigger .colorpicker-hue {
      height: 200px;
      width: 30px;
      background-size: 30px 200px;
  }
  .demo-bigger .colorpicker-saturation {
      width: 200px;
      height: 200px;
      background-size: 200px 200px;
  }

</style>
