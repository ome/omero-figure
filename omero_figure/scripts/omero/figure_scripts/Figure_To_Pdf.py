#
# Copyright (c) 2014-2018 University of Dundee.
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
"""OMERO.script to export figures."""

import logging

import omero.scripts as scripts
from omero.gateway import BlitzGateway
from omero.rtypes import rstring, robject

logger = logging.getLogger('figure_to_pdf')

from omero_figure.figure_export import FigureExport, \
                                       TiffExport, \
                                       OmeroExport

def export_figure(conn, script_params):
    """Main function to perform figure export."""
    # make sure we can find all images
    conn.SERVICE_OPTS.setOmeroGroup(-1)

    export_option = script_params['Export_Option']

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
    return fig_export.build_figure()


def run_script():
    """The main entry point of the script, as called by the client."""
    export_options = [rstring('PDF'), rstring('PDF_IMAGES'),
                      rstring('TIFF'), rstring('TIFF_IMAGES'),
                      rstring('OMERO')]

    client = scripts.client(
        'Figure_To_Pdf.py',
        """Used by web.figure to generate pdf figures from json data""",

        scripts.String("Figure_JSON", optional=False,
                       description="All figure info as json stringified"),

        scripts.String("Export_Option", values=export_options,
                       default="PDF"),

        scripts.String("Webclient_URI", optional=False, grouping="4",
                       description="webclient URL for adding links to images"),

        scripts.String("Figure_Name", grouping="4",
                       description="Name of the Pdf Figure"),

        scripts.String("Figure_URI",
                       description="URL to the Figure")
    )

    try:
        script_params = {}

        conn = BlitzGateway(client_obj=client)

        # process the list of args above.
        for key in client.getInputKeys():
            if client.getInput(key):
                script_params[key] = client.getInput(key, unwrap=True)

        # call the main script - returns a file annotation wrapper
        file_annotation = export_figure(conn, script_params)

        # return this file_annotation to the client.
        client.setOutput("Message", rstring("Figure created"))
        if file_annotation is not None:
            client.setOutput(
                "New_Figure",
                robject(file_annotation._obj))

    finally:
        client.closeSession()


if __name__ == "__main__":
    run_script()
