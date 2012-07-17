from django.conf.urls.defaults import *
from omeroweb.weblabs import views

urlpatterns = patterns('django.views.generic.simple',

    # index 'home page' of the weblabs app
    url( r'^$', views.index, name='weblabs_index' ),

)