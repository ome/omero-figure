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
from omero.testlib import ITest
from omero.gateway import BlitzGateway
from test_figure_scripts import create_figure

from omero_figure.figure_export import FigureExport, \
                                       TiffExport, \
                                       OmeroExport

class TestExportNoScript(ITest):
    """Test exporting a figure containing a regular image."""

    @pytest.mark.parametrize("export_option", ["PDF"])
    def test_export_no_script(self, export_option):
        """Create image, add to figure and export as TIFF, PNG etc."""
        client = self.client
        user = self.user
        # create an image
        session = client.getSession()
        image = self.create_test_image(100, 100, 1, 1, 1, session)

        figure_name = "test_export_no_script_%s" % export_option
        json = create_figure([image])
        uri = "https://www.openmicroscopy.org/"
        script_params = {
            "Figure_JSON": json,
            "Export_Option": export_option,   # TODO - shouldn't need to include this
            "Figure_Name": figure_name,
            "Webclient_URI": uri
        }
        conn = BlitzGateway(client_obj=client)
        if export_option == 'PDF':
            fig_export = FigureExport(conn, script_params)
        elif export_option == 'PDF_IMAGES':
            fig_export = FigureExport(conn, script_params, export_images=True)
        elif export_option == 'TIFF':
            fig_export = TiffExport(conn, script_params)
        elif export_option == 'TIFF_IMAGES':
            fig_export = TiffExport(conn, script_params, export_images=True)
        elif export_option == 'OMERO':
            fig_export = OmeroExport(conn, script_params)
        result = fig_export.build_figure()
