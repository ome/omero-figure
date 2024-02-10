
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
from django.urls import path, re_path


urlpatterns = [

    # index 'home page' of the figure app
    path('', views.index, name='figure_index'),
    path('new/', views.index, name='new_figure'),
    path('recover/', views.index, name='recover_figure'),
    path('open/', views.index, name='open_figure'),
    path('file/<int:file_id>/', views.index, name='load_figure'),

    path('imgData/<int:image_id>/', views.img_data_json,
         name='figure_imgData'),

    re_path(r'^max_projection_range_exceeded/'
            r'(?P<iid>[0-9]+)/(?:(?P<z>[0-9]+)/)?(?:(?P<t>[0-9]+)/)?$',
            views.max_projection_range_exceeded,
            name='max_projection_range_exceeded'),

    # Send json to OMERO to create pdf using scripting service
    path('make_web_figure/', views.make_web_figure,
         name='make_web_figure'),

    # Save json to file annotation
    path('save_web_figure/', views.save_web_figure, name='save_web_figure'),

    # Get json from file (file annotation Id)
    path('load_web_figure/<int:file_id>/', views.load_web_figure,
         name='load_web_figure'),

    # List file annotations of saved Figures
    path('list_web_figures/', views.list_web_figures,
         name='list_web_figures'),

    path('render_thumbnail/<int:iid>/',
         webgateway_views.render_thumbnail,
         {'_defcb': views.default_thumbnail},
         name="figure_render_thumbnail"),

    # Region defined by ?region=x,y,w,h
    path(
        'render_scaled_region/<int:iid>/<int:z>/<int:t>/',
        views.render_scaled_region,
        name="figure_render_scaled_region"),

    # Delete file annotations of saved Figures - 'POST' with 'fileId' of file
    # annotation
    path('delete_web_figure/', views.delete_web_figure,
         name='delete_web_figure'),

    # Converts Lengths of value in 'fromUnit' to 'toUnit'.
    # E.g. unit_conversion/1.12/MICROMETER/ANGSTROM/.
    # Returns result as json with keys of 'value', 'unit' and 'symbol'
    path('unit_conversion/<int:value>/<slug:from_unit>/<slug:to_unit>/',
         views.unit_conversion, name='unit_conversion'),

    # Get timestamps in seconds for images
    # Use query ?image=1&image=2
    path('timestamps/', views.timestamps, name='figure_timestamps'),

    # Get pixelsType for images. Use query ?image=1&image=2
    path('pixels_type/', views.pixels_type, name='figure_pixels_type'),

    # Get parents (e.g. Plate, Well, WellSample) for images
    # Use query ?image=1&image=2
    re_path(r'^paths_to_objects/$', views.paths_to_objects,
            name='figure_paths_to_objects'),

    # Get Z scale for images
    # Use query ?image=1&image=2
    path('z_scale/', views.z_scale, name='figure_z_scale'),

    path('roiCount/<int:image_id>/', views.roi_count, name='figure_roiCount'),

    path('roiRectangles/<int:image_id>/', views.roi_rectangles,
         name='figure_roiRectangles'),

    # POST to change figure to new group with ann_id and group_id
    path('chgrp/', views.chgrp, name='figure_chgrp'),

    # Get group and owner info for multiple images. ?image=1,2,3
    path('images_details/', views.images_details,
         name="figure_images_details")
]
