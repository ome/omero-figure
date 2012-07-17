from django.conf.urls.defaults import *

from omeroweb.weblabs import views


urlpatterns = patterns('django.views.generic.simple',

    # index 'home page' of the weblabs app
    url( r'^$', views.index, name='weblabs_index' ),


    # view an image stack - loading all planes in hand
    url( r'^fast_image_stack/(?P<imageId>[0-9]+)/', views.fast_image_stack, name='weblabs_fast_image_stack' ),

)