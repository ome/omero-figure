#!/usr/bin/env python
# -*- coding: utf-8 -*-

#
# Copyright (C) 2018 University of Dundee & Open Microscopy Environment.
# All rights reserved. Use is subject to license terms supplied in LICENSE.txt
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

"""
   Integration tests for testing the export of figures in PDF, TIFF, etc.
"""

import omero
import pytest
import json
from script import ScriptTest
from script import run_script
from script import check_file_annotation


path = "/omero/figure_scripts/"
name = "Figure_To_Pdf.py"


class TestFigureScripts(ScriptTest):

    @pytest.mark.parametrize("export_option", ["PDF", "TIFF", "PDF_IMAGES",
                                               "TIFF_IMAGES"])
    def test_export_figure_as(self, export_option):
        id = super(TestFigureScripts, self).get_script_by_name(path, name)
        assert id > 0
        client, user = self.new_client_and_user()
        script_service = client.sf.getScriptService()
        assert script_service.getParams(id) is not None
        # create an image
        size_t = 1
        size_x = 100
        size_y = 100
        size_z = 1
        size_c = 1
        session = client.getSession()
        image = self.create_test_image(size_x, size_y, size_z, size_c,
                                       size_t, session)

        figure_name = "test_export_figure_as_%s" % export_option
        json = create_figure(image, size_x, size_y, size_z, size_c, size_t)
        uri = "https://www.openmicroscopy.org/"
        args = {
            "Figure_JSON": omero.rtypes.rstring(json),
            "Export_Option": omero.rtypes.rstring(export_option),
            "Figure_Name": omero.rtypes.rstring(figure_name),
            "Figure_URI": omero.rtypes.rstring(uri),
            "Webclient_URI": omero.rtypes.rstring(uri)
        }
        ann = run_script(client, id, args, "New_Figure")
        # New image is returned when it is an OMERO image
        if export_option is "OMERO":
            assert isinstance(ann, "Image")
        else:
            c = self.new_client(user=user)
            check_file_annotation(c, ann)


def create_figure(image, size_x, size_y, size_z, size_c, size_t):
    """Create JSON to export figure."""
    figure_json = {"version": 2,
                   "paper_width": size_x,
                   "paper_height": size_y,
                   "page_size": "A4",
                   }
    json_panel = get_panel_json(image, size_x, size_y, size_z, size_c, size_t)
    figure_json['panels'] = [json_panel]
    json_string = json.dumps(figure_json)
    return json_string


def get_panel_json(image, size_x, size_y, size_z, size_c, size_t):
    """Create a panel."""

    channel = {'emissionWave': "400",
               'label': "DAPI",
               'color': "0000FF",
               'inverted': False,
               'active': True,
               'window': {'min': 0,
                          'max': 255,
                          'start': 0,
                          'end': 255},
               }

    img_json = {
        "labels": [],
        "height": size_y,
        "channels": [channel],
        "width": size_x,
        "sizeT": size_t,
        "sizeZ": size_z,
        "dx": 0,
        "dy": 0,
        "rotation": 0,
        "imageId": image.getId().getValue(),
        "name": "test_image",
        "orig_width": size_x,
        "zoom": 100,
        "shapes": [],
        "orig_height": size_y,
        "theZ": 0,
        "y": 0,
        "x": 0,
        "theT": 0
    }
    return img_json
