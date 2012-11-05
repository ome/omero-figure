from django.conf.urls.defaults import *

from omeroweb.weblabs import views
from omeroweb.webclient import views as wc_views


urlpatterns = patterns('django.views.generic.simple',

    # index 'home page' of the weblabs app
    url( r'^$', views.index, name='weblabs_index' ),


    # view an image stack - loading all planes in hand
    url( r'^fast_image_stack/(?P<imageId>[0-9]+)/', views.fast_image_stack, name='weblabs_fast_image_stack' ),
    # get a json 2D 'plane' where every pixel is the Z-index of max intensity (for given Channel)
    url( r'^max_intensity_indices/(?P<imageId>[0-9]+)/(?P<theC>[0-9]+)', views.max_intensity_indices, name='weblabs_max_intensity_indices' ),


    # Viewer that allows 3D rotation of images or image regions
    url( r'^rotation_3d_viewer/(?P<imageId>[0-9]+)/', views.rotation_3d_viewer, name='weblabs_rotation_3d_viewer' ),
    #  Use ImageJ to give 3D 'rotation projections' - stitch these into a single jpeg
    url( r'^rotation_proj_stitch/(?P<imageId>[0-9]+)/', views.rotation_proj_stitch, name='weblabs_rotation_proj_stitch' ),


    # colocalisation plot. E.g. http://www.ncbi.nlm.nih.gov/pmc/articles/PMC1993886/
    url( r'^scatter_gram/(?P<imageId>[0-9]+)/', views.scatter_gram, name='webtest_scatter_gram' ),
    # json array of rendered pixel values 0-255 for up to 3 channels. E.g. 2 channels is [[10,30], [12,35]...for each pixel]
    # uses the webgateway ?c=... for rendering settings.
    url( r'^plane_as_json/(?P<imageId>[0-9]+)/(?P<theZ>[0-9]+)/(?P<theT>[0-9]+)', views.plane_as_json, name='webtest_plane_as_json' ),


    # Demo a 'render_settings' plugin for creating a rendering settings panel for an image - using render.js templating
    url( r'^render_settings/(?P<imageId>[0-9]+)/', views.render_settings, name='weblabs_render_settings' ),
    # Same idea using Backbone.js MVC library
    url( r'^backbone_render_pane/(?P<imageId>[0-9]+)/', views.backbone_render_pane, name='weblabs_backbone_render_pane' ),
    
    
    # Playing with viewport
    url( r'^viewport_test/(?P<imageId>[0-9]+)/', views.viewport_test, name='weblabs_viewport_test' ),
    url( r'^viewport_from_scratch/(?P<imageId>[0-9]+)/', views.viewport_from_scratch, name='weblabs_viewport_from_scratch' ),
    url( r'^viewport_on_dataset/(?P<o1_id>[0-9]+)/', wc_views.load_data, 
        {'o1_type': 'dataset', 'template':'weblabs/image_viewers/viewport_on_dataset.html'}, name='weblabs_viewport_on_dataset' ),
    
    # ROIs
    url( r'^roi_backbone/(?P<imageId>[0-9]+)/', views.roi_backbone, name='weblabs_roi_backbone' ),
)