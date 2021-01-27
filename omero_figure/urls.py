
#
# Copyright (c) 2014-2020 University of Dundee.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

from omeroweb.webgateway import views as webgateway_views
from . import views
from django.conf.urls import url


urlpatterns = [

    # index 'home page' of the figure app
    url(r'^$', views.index, name='figure_index'),
    url(r'^new/$', views.index, name='new_figure'),
    url(r'^recover/$', views.index, name='recover_figure'),
    url(r'^open/$', views.index, name='open_figure'),
    url(r'^file/(?P<file_id>[0-9]+)/$', views.index, name='load_figure'),

    url(r'^imgData/(?P<image_id>[0-9]+)/$', views.img_data_json,
        name='figure_imgData'),

    # Send json to OMERO to create pdf using scripting service
    url(r'^make_web_figure/', views.make_web_figure, name='make_web_figure'),

    # Save json to file annotation
    url(r'^save_web_figure/', views.save_web_figure, name='save_web_figure'),

    # Get json from file (file annotation Id)
    url(r'^load_web_figure/(?P<file_id>[0-9]+)/$', views.load_web_figure,
        name='load_web_figure'),

    # List file annotations of saved Figures
    url(r'^list_web_figures/', views.list_web_figures,
        name='list_web_figures'),

    url(r'^render_thumbnail/(?P<iid>[0-9]+)/$',
        webgateway_views.render_thumbnail,
        {'_defcb': views.default_thumbnail},
        name="figure_render_thumbnail"),

    # Region defined by ?region=x,y,w,h
    url(r'^render_scaled_region/(?P<iid>[0-9]+)/(?P<z>[0-9]+)/(?P<t>[0-9]+)/$',
        views.render_scaled_region,
        name="figure_render_scaled_region"),

    # Delete file annotations of saved Figures - 'POST' with 'fileId' of file
    # annotation
    url(r'^delete_web_figure/$', views.delete_web_figure,
        name='delete_web_figure'),

    # Converts Lengths of value in 'fromUnit' to 'toUnit'.
    # E.g. unit_conversion/1.12/MICROMETER/ANGSTROM/.
    # Returns result as json with keys of 'value', 'unit' and 'symbol'
    url(r'^unit_conversion/(?P<value>[0-9.]+)/(?P<from_unit>[A-Z]+)/'
        '(?P<to_unit>[A-Z]+)/$',
        views.unit_conversion, name='unit_conversion'),

    # Get timestamps in seconds for images
    # Use query ?image=1&image=2
    url(r'^timestamps/$', views.timestamps, name='figure_timestamps'),

    url(r'^roiCount/(?P<image_id>[0-9]+)/$', views.roi_count,
        name='figure_roiCount'),

    # POST to change figure to new group with ann_id and group_id
    url(r'chgrp/$', views.chgrp, name='figure_chgrp'),

    # Get group and owner info for multiple images. ?image=1,2,3
    url(r'images_details/', views.images_details,
        name="figure_images_details")
]
