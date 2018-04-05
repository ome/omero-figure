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

"""Integration tests for testing the export of figures in PDF, TIFF, etc."""

import omero
import pytest
import json
from script import ScriptTest
from script import run_script
from script import check_file_annotation
from omero.sys import ParametersI
import time


path = "/omero/figure_scripts/"
name = "Figure_To_Pdf.py"


class TestFigureScripts(ScriptTest):
    """Test exporting a figure containing a big and a regular image."""

    def import_pyramid(self, tmpdir, name=None, thumb=False):
        if name is None:
            name = "test&sizeX=20000&sizeY=10000.fake"
        fakefile = tmpdir.join(name)
        fakefile.write('')
        pixels = self.import_image(filename=str(fakefile), skip="checksum")[0]
        id = long(float(pixels))
        assert id >= 0
        # wait for the pyramid to be generated
        self.wait_for_pyramid(id)
        query_service = self.client.sf.getQueryService()
        image = query_service.findByQuery(
            """select i from Image i left outer join fetch i.pixels as p
               where p.id = :id""",
            ParametersI().addId(id))
        return image

    def wait_for_pyramid(self, id):
        store = self.client.sf.createRawPixelsStore()
        not_ready = True
        count = 0
        elapse_time = 1  # time in seconds
        try:
            # Do not wait more than 60 seconds
            while not_ready and count < 60:
                try:
                    store.setPixelsId(id, True)
                    # No exception. The pyramid is now ready
                    not_ready = False
                except Exception:
                    # try again in elapse_time
                    time.sleep(elapse_time)
                    count = count + elapse_time
        finally:
            store.close()

    @pytest.mark.parametrize("export_option", ["PDF", "TIFF", "PDF_IMAGES",
                                               "TIFF_IMAGES"])
    def test_export_figure_as(self, export_option, tmpdir):
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

        big_image = self.import_pyramid(tmpdir)

        figure_name = "test_export_figure_as_%s" % export_option
        json = create_figure([image, big_image])
        uri = "https://www.openmicroscopy.org/"
        args = {
            "Figure_JSON": omero.rtypes.rstring(json),
            "Export_Option": omero.rtypes.rstring(export_option),
            "Figure_Name": omero.rtypes.rstring(figure_name),
            "Webclient_URI": omero.rtypes.rstring(uri)
        }
        ann = run_script(client, id, args, "New_Figure")
        # New image is returned when it is an OMERO image
        if export_option is "OMERO":
            assert isinstance(ann, "Image")
        else:
            c = self.new_client(user=user)
            check_file_annotation(c, ann)


def create_figure(images):
    """Create JSON to export figure."""
    figure_json = {"version": 2,
                   "paper_width": 595,
                   "paper_height": 842,
                   "page_size": "A4",
                   }
    panels = [get_panel_json(image, idx) for idx, image in enumerate(images)]
    figure_json['panels'] = panels
    json_string = json.dumps(figure_json)
    return json_string


def get_panel_json(image, index):
    """Create a panel."""
    print "get_panel_json", type(image), index

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

    shapes = [{"type": "Rectangle", "x": 287, "y": 184.7, "width": 187,
               "height": 230,  "strokeWidth": 4, "strokeColor": "#FFFFFF"},
              {"type": "Arrow", "x1": 659, "x2": 408.7, "y1": 465.6,
               "y2": 323.9, "strokeWidth": 10, "strokeColor": "#FFFF00"},
              {"type": "Ellipse", "x": 235, "y": 231, "radiusX": 139,
               "radiusY": 69, "rotation": -32.3, "strokeWidth": 10,
               "strokeColor": "#00FF00"}]

    pix = image.getPrimaryPixels()
    img_json = {
        "labels": [],
        "channels": [channel],
        "height": 100 * (index + 1),
        "width": 100 * (index + 1),
        "sizeT": pix.getSizeT().val,
        "sizeZ": pix.getSizeZ().val,
        "orig_width": pix.getSizeX().val,
        "orig_height": pix.getSizeY().val,
        "dx": 0,
        "dy": 0,
        "rotation": 100 * index,
        "imageId": image.getId().getValue(),
        "name": "test_image",
        "zoom": 100 + (index * 100),
        "shapes": shapes,
        "y": index * 200,
        "x": 50,
        "theZ": 0,
        "theT": 0
    }
    return img_json
