
import django
if django.VERSION < (1, 6):
    from django.conf.urls.defaults import *
else:
    from django.conf.urls import *

from figure import views

urlpatterns = patterns('django.views.generic.simple',

    # index 'home page' of the figure app
    url( r'^$', views.index, name='figure_index' ),
    url( r'^new/$', views.index, name='new_figure' ),
    url( r'^file/[0-9]+/$', views.index, name='load_figure' ),

    url( r'^imgData/(?P<imageId>[0-9]+)/$', views.imgData_json, name='figure_imgData'),

    # Send json to OMERO to create pdf using scripting service
    url( r'^make_web_figure/', views.make_web_figure, name='make_web_figure'),

    # Save json to file annotation
    url( r'^save_web_figure/', views.save_web_figure, name='save_web_figure'),

    # Get json from file (file annotation Id)
    url( r'^load_web_figure/(?P<fileId>[0-9]+)/$', views.load_web_figure, name='load_web_figure'),

    # List file annotations of saved Figures
    url( r'^list_web_figures/', views.list_web_figures, name='list_web_figures'),

    # Delete file annotations of saved Figures - 'POST' with 'fileId' of file annotation
    url( r'^delete_web_figure/$', views.delete_web_figure, name='delete_web_figure'),
)