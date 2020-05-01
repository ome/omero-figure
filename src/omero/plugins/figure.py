#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright (C) 2020 University of Dundee & Open Microscopy Environment.
# All rights reserved.
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

from functools import wraps
import os
import json

from omero.cli import CLI
from omero.cli import BaseControl
from omero.config import ConfigXml

import omero_figure
from omero.gateway import BlitzGateway
from omero.model import OriginalFileI
import omero_figure.utils as utils

HELP = "CLI tool for OMERO.figure to aid install"
INSTALL_HELP = "Install figure export script"

OMERODIR = os.environ.get('OMERODIR')
if not OMERODIR:
    raise Exception('ERROR: OMERODIR not set')


def gateway_required(func):
    """
    Decorator which initializes a client (self.client),
    a BlitzGateway (self.gateway), and makes sure that
    all services of the Blitzgateway are closed again.
    """

    @wraps(func)
    def _wrapper(self, *args, **kwargs):
        self.client = self.ctx.conn(*args)
        self.conn = BlitzGateway(client_obj=self.client)

        try:
            return func(self, *args, **kwargs)
        finally:
            if self.conn is not None:
                self.conn.close(hard=False)
                self.conn = None
                self.client = None

    return _wrapper


class FigureControl(BaseControl):

    gateway = None
    client = None

    def _configure(self, parser):
        parser.add_login_arguments()
        sub = parser.sub()
        parser.add(sub, self.install, INSTALL_HELP)
        parser.add(sub, self.config, INSTALL_HELP)
        parser.add(sub, self.script, INSTALL_HELP)

    @gateway_required
    def install(self, args):

        self.config(args)
        self.script(args)

    @gateway_required
    def config(self, args):

        cli = CLI()
        cli.loadplugins()
        config_path = os.path.join(OMERODIR, 'etc', 'grid', 'config.xml')
        if os.path.exists(config_path):
            config_xml = ConfigXml(config_path, read_only=True)
            custom_settings = config_xml.as_map()

            # config omero.web.apps
            to_set = {
                'omero.web.apps': "omero_figure",
                'omero.web.ui.top_links': [
                    "Figure",
                    "figure_index",
                    {"title": "Open Figure in new tab", "target": "_blank"}],
                'append omero.web.open_with': [
                    "omero_figure",
                    "new_figure",
                    {"supported_objects": ["images"],
                     "target": "_blank",
                     "label": "OMERO.figure"}],
            }
            for key, value in to_set.items():
                json_value = json.dumps(value)
                print("check config %s" % key)
                cli.invoke(["config", "get", key], strict=True)
                if not self.is_in_settings(custom_settings, key, json_value):
                    print("config append %s: %s" % (key, json_value))
                    cli.invoke(["config", "append", key,
                                json_value], strict=True)
                    # check settings were updated
                    cli.invoke(["config", "get", key], strict=True)

    def is_in_settings(self, settings, key, value):
        values = settings.get(key)
        if values is None:
            return False
        return value in values

    @gateway_required
    def script(self, args):

        script_path = os.path.dirname(os.path.abspath(omero_figure.__file__))
        path_to_script = os.path.join(
            script_path, "scripts/omero/figure_scripts/Figure_To_Pdf.py")
        script_text = utils.read_file(path_to_script)

        script_service = self.conn.getScriptService()
        script_path = "/omero/figure_scripts/Figure_To_Pdf.py"

        # replace if script exists
        script_id = script_service.getScriptID(script_path)
        if script_id > 0:
            orig_file = OriginalFileI(script_id, False)
            script_service.editScript(orig_file, script_text)
            print("Script Replaced: %s" % script_id)
        else:
            script_id = script_service.uploadOfficialScript(
                script_path, script_text)
            print("Script Uploaded: %s" % script_id)

register("figure", FigureControl, HELP)  # noqa
