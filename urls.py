
#
# Copyright (c) 2014 University of Dundee.
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

import django
if django.VERSION < (1, 6):
    from django.conf.urls.defaults import *
else:
    from django.conf.urls import *

from figure import views

urlpatterns = patterns(

    'django.views.generic.simple',

    # index 'home page' of the figure app
    url(r'^$', views.index, name='figure_index'),
    url(r'^new/$', views.index, name='new_figure'),
    url(r'^file/(?P<fileId>[0-9]+)/$', views.index, name='load_figure'),

    url(r'^shape_editor/$', views.shape_editor, name='shape_editor'),

    url(r'^imgData/(?P<imageId>[0-9]+)/$', views.imgData_json, name='figure_imgData'),

    # Send json to OMERO to create pdf using scripting service
    url(r'^make_web_figure/', views.make_web_figure, name='make_web_figure'),

    # Save json to file annotation
    url(r'^save_web_figure/', views.save_web_figure, name='save_web_figure'),

    # Get json from file (file annotation Id)
    url(r'^load_web_figure/(?P<fileId>[0-9]+)/$', views.load_web_figure, name='load_web_figure'),

    # List file annotations of saved Figures
    url(r'^list_web_figures/', views.list_web_figures, name='list_web_figures'),

    # Delete file annotations of saved Figures - 'POST' with 'fileId' of file annotation
    url(r'^delete_web_figure/$', views.delete_web_figure, name='delete_web_figure'),

    # Converts Lengths of value in 'fromUnit' to 'toUnit'.
    # E.g. unit_conversion/1.12/MICROMETER/ANGSTROM/.
    # Returns result as json with keys of 'value', 'unit' and 'symbol'
    url(r'^unit_conversion/(?P<value>[0-9.]+)/(?P<fromUnit>[A-Z]+)/(?P<toUnit>[A-Z]+)/$',
        views.unit_conversion, name='unit_conversion'),
)
