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
from omero.model import Image

path = "/omero/figure_scripts/"
name = "Figure_To_Pdf.py"


class TestFigureScripts(ScriptTest):
    """Test exporting a figure containing a big and a regular image."""

    @pytest.mark.parametrize("export_option", ["PDF", "TIFF", "PDF_IMAGES",
                                               "TIFF_IMAGES", "OMERO"])
    def test_export_figure_as(self, export_option, tmpdir):
        """Create images, add to figure and export as TIFF, PNG etc."""
        id = super(TestFigureScripts, self).get_script_by_name(path, name)
        assert id > 0
        # client, user = self.new_client_and_user()
        # Temp workaround for openmicroscopy/openmicroscopy/pull/5720
        client = self.client
        user = self.user
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

        image_id = self.import_pyramid(tmpdir, client=client)
        query_service = client.sf.getQueryService()
        big_image = query_service.findByQuery(
            """select i from Image i left outer join fetch i.pixels as p
               where i.id = :id""",
            ParametersI().addId(image_id))

        figure_name = "test_export_figure_as_%s" % export_option
        json = create_figure([image, big_image])
        uri = "https://www.openmicroscopy.org/"
        args = {
            "Figure_JSON": omero.rtypes.rstring(json),
            "Export_Option": omero.rtypes.rstring(export_option),
            "Figure_Name": omero.rtypes.rstring(figure_name),
            "Webclient_URI": omero.rtypes.rstring(uri)
        }
        robj = run_script(client, id, args, "New_Figure")
        ann = robj.getValue()
        # New image is returned when it is an OMERO image
        if export_option == "OMERO":
            assert isinstance(ann, Image)
        else:
            c = self.new_client(user=user)
            check_file_annotation(c, ann, link_count=2)


def create_figure(images):
    """Create JSON to export figure."""
    figure_json = {"version": 2,
                   "paper_width": 595,
                   "paper_height": 842,
                   "page_size": "A4",
                   }
    panels = []
    for idx, image in enumerate(images):
        panels.append(get_panel_json(image, 0, 50 + (idx * 300)))
        panels.append(get_panel_json(image, 1, 50 + (idx * 300)))
    figure_json['panels'] = panels
    json_string = json.dumps(figure_json)
    return json_string


def get_panel_json(image, index, page_x):
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

    pix = image.getPrimaryPixels()
    size_x = pix.getSizeX().val
    size_y = pix.getSizeY().val
    # shapes coordinates are Image coordinates
    # Red Line diagonal from corner to corner
    # Arrow from other corner to centre
    shapes = [{"type": "Rectangle", "x": size_x/4, "y": size_y/4,
               "width": size_x/2, "height": size_y/2,
               "strokeWidth": 4, "strokeColor": "#FFFFFF"},
              {"type": "Line", "x1": 0, "x2": size_x, "y1": 0,
               "y2": size_y, "strokeWidth": 5, "strokeColor": "#FF0000"},
              {"type": "Arrow", "x1": 0, "x2": size_x/2, "y1": size_y,
               "y2": size_y/2, "strokeWidth": 10, "strokeColor": "#FFFF00"},
              {"type": "Ellipse", "x": size_x/2, "y": size_y/2,
               "radiusX": size_x/3, "radiusY": size_y/2, "rotation": 45,
               "strokeWidth": 10, "strokeColor": "#00FF00"}]

    labels = (get_time_test_labels() + get_view_test_labels()
              + get_obj_test_labels() + get_other_test_labels())

    # This works if we have Units support (OMERO 5.1)
    px = image.getPrimaryPixels().getPhysicalSizeX()
    py = image.getPrimaryPixels().getPhysicalSizeY()
    pz = image.getPrimaryPixels().getPhysicalSizeZ()
    img_json = {
        "imageId": image.getId().getValue(),
        "name": "test_image",  # image.getName().getValue()
        "width": 100 * (index + 1),
        "height": 100 * (index + 1),
        "sizeZ": pix.getSizeZ().val,
        "theZ": 0,
        "sizeT": pix.getSizeT().val,
        "theT": 0,
        # rdef -> used at panel creation then deleted
        "channels": [channel],
        "orig_width": size_x,
        "orig_height": size_y,
        "x": page_x,
        "y": index * 200,
        'datasetName': "TestDataset",
        'datasetId': 123,
        'pixel_size_x': None if px is None else px.getValue(),
        'pixel_size_y': None if py is None else py.getValue(),
        'pixel_size_z': None if pz is None else pz.getValue(),
        'pixel_size_x_symbol': '\xB5m' if px is None else px.getSymbol(),
        'pixel_size_z_symbol': None if pz is None else pz.getSymbol(),
        'pixel_size_x_unit': None if px is None else str(px.getUnit()),
        'pixel_size_z_unit': None if pz is None else str(pz.getUnit()),
        'deltaT': [],
        "zoom": 100 + (index * 50),
        "dx": 0,
        "dy": 0,
        "labels": labels,
        "rotation": 100 * index,
        "rotation_symbol": '\xB0',
        "max_export_dpi": 1000,
        "shapes": shapes,
    }
    return img_json


def get_time_test_labels(size=12, position="top", color="000000"):
    """Create test labels about the time"""
    time_props = ["time", "t"]
    time_formats = ["", ".index", ".milliseconds", ".ms", ".seconds", ".secs",
                    ".s", ".minutes", ".mins", ".m", ".hrs:mins:secs",
                    ".h:m:s", ".hrs:mins", ".h:m", ".mins:secs", ".m:s"]

    precisions = ["", ";precision=0", ";precision=2",
                  " ; precision  = abc "]  # abc and spaces for resilience test
    offsets = ["", ";offset=0", ";offset=1",
               " ; offset = abc "]  # 0, abc and spaces for resilience test

    label_text = []
    for prop in time_props:
        tmp = [f"[{prop}{format}]" for format in time_formats]
        label_text.append(" or ".join(tmp))
    for precision in precisions:
        tmp = [f"[t{precision}{offset}]" for offset in offsets]
        label_text.append(" or ".join(tmp))
        tmp = [f"[t.s{precision}{offset}]" for offset in offsets]
        label_text.append(" or ".join(tmp))

    labels = []
    for text in label_text:
        labels.append({"text": text, "size": size,
                       "position": position, "color": color})
    return labels


def get_view_test_labels(size=12, position="top", color="000000"):
    """Create test labels for about the view"""

    view_props = ["x", "y", "z", "width", "w", "height", "h"]
    view_formats = ["", ".pixel", ".px", ".unit"]

    precisions = ["", ";precision=0", ";precision=2",
                  "; precision = abc "]  # abc and spaces for resilience test

    label_text = []
    for prop in view_props:
        tmp = [f"[{prop}{format}]" for format in view_formats]
        label_text.append(" or ".join(tmp))
    tmp = [f"[x{precision}]" for precision in precisions]
    label_text.append(" or ".join(tmp))
    tmp = [f"[x.unit{precision}]" for precision in precisions]
    label_text.append(" or ".join(tmp))

    labels = []
    for text in label_text:
        labels.append({"text": text, "size": size,
                       "position": position, "color": color})
    return labels


def get_obj_test_labels(size=12, position="top", color="000000"):
    """Create test labels for about the image or dataset"""

    obj_props = ["image", "dataset"]
    obj_formats = ["", ".id", ".name"]

    label_text = []
    for prop in obj_props:
        tmp = [f"[{prop}{format}]" for format in obj_formats]
        label_text.append(" or ".join(tmp))

    labels = []
    for text in label_text:
        labels.append({"text": text, "size": size,
                       "position": position, "color": color})
    return labels


def get_other_test_labels(size=12, position="top", color="000000"):
    """Create test labels for other labels and markdown"""
    other_props = ["rotation", "rot", "channels", "c"]
    markdowns = ["", "*", "**"]

    label_text = []
    for prop in other_props:
        tmp = [f"{md}[{prop}]{md}" for md in markdowns]
        label_text.append(" or ".join(tmp))

    labels = []
    for text in label_text:
        labels.append({"text": text, "size": size,
                       "position": position, "color": color})
    return labels
