#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright (C) 2017 University of Dundee & Open Microscopy Environment.
# All rights reserved.
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

"""Functionality for exporting OMERO.figure JSON as PDF/TIFF/OMERO image."""

import logging
import json
import unicodedata
import numpy
import tempfile
import shutil

from datetime import datetime
import os
from os import path
import zipfile
# from math import atan, sin, cos, sqrt, radians
from io import BytesIO

from shapes import ShapeToPdfExport, ShapeToPilExport

from cStringIO import StringIO
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger('figure_to_pdf')

try:
    import markdown
    markdown_imported = True
except ImportError:
    markdown_imported = False
    logger.error("Markdown not installed. See"
                 " https://pypi.python.org/pypi/Markdown")

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib.utils import ImageReader
    from reportlab.platypus import Paragraph
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    reportlab_installed = True
except ImportError:
    reportlab_installed = False
    logger.error("Reportlab not installed.")


ORIGINAL_DIR = "1_originals"
RESAMPLED_DIR = "2_pre_resampled"
FINAL_DIR = "3_final"

README_TXT = """These folders contain images used in the creation
of the figure. Each folder contains one image per figure panel,
with images numbered according to the order they were added to
the figure. The numbered folders represent the sequence of
processing steps:

 - 1_originals: This contains the full-sized and un-cropped images that are
   rendered by OMERO according to your chosen rendering settings.

 - 2_pre_resampled: This folder will only contain those images that are
   resampled in order to match the export figure resolution. This will be
   all panels for export of TIFF figures. For export of PDF Figures,
   only panels that have a 'dpi' set, which is higher than their
   existing resolution will be resampled.

 - 3_final: These are the image panels that are inserted into the
   final figure, saved following any cropping, rotation and resampling steps.
"""

def compress(target, base):
    """
    Create a ZIP recursively from a given base directory.

    @param target:      Name or file object to write to
    @param base:        Name of folder that we want to zip up E.g. "folder"
    """
    with zipfile.ZipFile(target, 'w') as zip_file:
        for root, dirs, files in os.walk(base):
            archive_root = os.path.relpath(root, base)
            for f in files:
                fullpath = os.path.join(root, f)
                archive_name = os.path.join(archive_root, f)
                zip_file.write(fullpath, archive_name)


class FigureExport(object):
    """Super class for exporting various figures, such as PDF or TIFF etc."""

    def __init__(self, conn, script_params, export_images=False):
        """Constructor."""
        self.conn = conn
        self.script_params = script_params
        self.export_images = export_images
        self.file_object = BytesIO()

        self.ns = "omero.web.figure.pdf"
        self.mimetype = "application/pdf"

        figure_json_string = script_params['Figure_JSON']
        # Since unicode can't be wrapped by rstring
        # figure_json_string = figure_json_string.decode('utf8')
        # figure_json_string = str(figure_json_string)
        self.figure_json = json.loads(figure_json_string)

        n = datetime.now()
        # time-stamp name by default: Figure_2013-10-29_22-43-53.pdf
        self.figure_name = u"Figure_%s-%s-%s_%s-%s-%s" % (
            n.year, n.month, n.day, n.hour, n.minute, n.second)
        if 'figureName' in self.figure_json:
            self.figure_name = self.figure_json['figureName']

        # get Figure width & height...
        self.page_width = self.figure_json['paper_width']
        self.page_height = self.figure_json['paper_height']

        # test to see if we've got multiple pages
        page_count = ('page_count' in self.figure_json and
                      self.figure_json['page_count'] or 1)
        self.page_count = int(page_count)

        # Create a zip if we have multiple TIFF pages or we're exporting Images
        export_option = self.script_params['Export_Option']

        self.create_zip = False
        if self.export_images:
            self.create_zip = True
        if (self.page_count > 1) and (export_option.startswith("TIFF")):
            self.create_zip = True

    def build_figure(self):
        """
        The main building of the figure happens here, independently of format.

        We set up directories as needed, call create_figure() to create
        the PDF or TIFF then iterate through figure pages, adding panels
        for each page.
        Then we add an info page and create a zip of everything if needed.
        Finally the created file or zip is uploaded to OMERO and attached
        as a file annotation to all the images in the figure.
        """
        paper_spacing = ('paper_spacing' in self.figure_json and
                         self.figure_json['paper_spacing'] or 50)
        page_col_count = ('page_col_count' in self.figure_json and
                          self.figure_json['page_col_count'] or 1)

        # somewhere to put PDF and images
        self.zip_folder_name = None
        try:
            if self.create_zip:
                self.zip_folder_name = tempfile.mkdtemp()
                if self.export_images:
                    for d in (ORIGINAL_DIR, RESAMPLED_DIR, FINAL_DIR):
                        img_dir = os.path.join(self.zip_folder_name, d)
                        os.mkdir(img_dir)
                    self.add_read_me_file()

            # Create the figure file(s)
            self.create_figure()

            panels_json = self.figure_json['panels']
            image_ids = set()

            # For each page, add panels...
            col = 0
            row = 0
            for p in range(self.page_count):

                self.add_page_color()

                px = col * (self.page_width + paper_spacing)
                py = row * (self.page_height + paper_spacing)
                page = {'x': px, 'y': py}

                self.add_panels_to_page(panels_json, image_ids, page)

                # complete page and save
                self.save_page(p)

                col = col + 1
                if col >= page_col_count:
                    col = 0
                    row = row + 1

            # Add thumbnails and links page
            self.add_info_page(panels_json)

            # Saves the completed figure file
            self.save_figure()

            if self.zip_folder_name is not None:
                # Recursively zip everything up to the file_object
                compress(self.file_object, self.zip_folder_name)

                # output_file = zip_name
                self.ns = "omero.web.figure.zip"
                self.mimetype = "application/zip"
        finally:
            if self.zip_folder_name is not None:
                shutil.rmtree(self.zip_folder_name, ignore_errors=True)
        return self.file_object

    def get_zip_name(self):
        """Return name for zip file."""
        # file names can't include unicode characters
        name = unicodedata.normalize(
            'NFKD', self.figure_name).encode('ascii', 'ignore')
        # in case we have path/to/name.pdf, just use name.pdf
        name = path.basename(name)
        # Remove commas: causes problems 'duplicate headers' in file download
        name = name.replace(",", ".")
        return "%s.zip" % name

    def get_figure_file_name(self, page=None):
        """
        Return a figure file name.

        For PDF export we will only create a single figure file, but
        for TIFF export we may have several pages, so we need unique names
        for each to avoid overwriting.
        This method supports both, simply using different extension
        (pdf/tiff) for each.

        @param page:        If we know a page number we want to use.
        """
        # Extension is pdf or tiff
        fext = self.get_figure_file_ext()

        # file names can't include unicode characters
        name = unicodedata.normalize(
            'NFKD', self.figure_name).encode('ascii', 'ignore')
        # in case we have path/to/name, just use name
        name = path.basename(name)

        # if ends with E.g. .pdf, remove extension
        if name.endswith("." + fext):
            name = name[0: -len("." + fext)]

        # Name with extension and folder
        full_name = "%s.%s" % (name, fext)
        # Remove commas: causes problems 'duplicate headers' in file download
        full_name = full_name.replace(",", ".")

        index = page if page is not None else 1
        if fext == "tiff" and self.page_count > 1:
            full_name = "%s_page_%02d.%s" % (name, index, fext)
        if self.zip_folder_name is not None:
            full_name = os.path.join(self.zip_folder_name, full_name)

        while(os.path.exists(full_name)):
            index += 1
            full_name = "%s_page_%02d.%s" % (name, index, fext)
            if self.zip_folder_name is not None:
                full_name = os.path.join(self.zip_folder_name, full_name)

        # Handy to know what the last created file is:
        self.figure_file_name = full_name
        return full_name

    def get_exported_file_name(self):
        """Return name of pdf/tiff or zip returned from build_figure()."""
        if self.create_zip:
            return self.get_zip_name()
        else:
            return self.get_figure_file_name()

    def apply_rdefs(self, image, channels):
        """Apply the channel levels and colors to the image."""
        c_idxs = []
        windows = []
        colors = []
        reverses = []

        # OMERO.figure doesn't support greyscale rendering
        image.setColorRenderingModel()

        for i, c in enumerate(channels):
            if c['active']:
                c_idxs.append(i+1)
                windows.append([c['window']['start'], c['window']['end']])
                colors.append(c['color'])
                reverses.append(c.get('reverseIntensity', False))

        image.setActiveChannels(c_idxs, windows, colors, reverses)

    def get_crop_region(self, panel):
        """
        Get the width and height in points/pixels for a panel in the figure.

        This is at the 'original' figure / PDF coordinates
        (E.g. before scaling for TIFF export)
        """
        zoom = float(panel['zoom'])
        frame_w = panel['width']
        frame_h = panel['height']
        dx = panel['dx']
        dy = panel['dy']
        orig_w = panel['orig_width']
        orig_h = panel['orig_height']

        # need tile_x, tile_y, tile_w, tile_h

        tile_w = orig_w / (zoom/100)
        tile_h = orig_h / (zoom/100)

        orig_ratio = float(orig_w) / orig_h
        wh = float(frame_w) / frame_h

        if abs(orig_ratio - wh) > 0.01:
            # if viewport is wider than orig...
            if (orig_ratio < wh):
                tile_h = tile_w / wh
            else:
                tile_w = tile_h * wh

        cropx = ((orig_w - tile_w)/2) - dx
        cropy = ((orig_h - tile_h)/2) - dy

        return {'x': cropx, 'y': cropy, 'width': tile_w, 'height': tile_h}

    def get_time_label_text(self, delta_t, format):
        """Get the text for 'live' time-stamp labels."""
        if format == "secs":
            text = "%s secs" % delta_t
        elif format == "mins":
            text = "%s mins" % int(round(float(delta_t) / 60))
        elif format == "hrs:mins":
            h = (delta_t / 3600)
            m = int(round((float(delta_t) % 3600) / 60))
            text = "%s:%02d" % (h, m)
        elif format == "hrs:mins:secs":
            h = (delta_t / 3600)
            m = (delta_t % 3600) / 60
            s = delta_t % 60
            text = "%s:%02d:%02d" % (h, m, s)
        return text

    def add_rois(self, panel, page):
        """Add any Shapes."""
        if "shapes" not in panel:
            return

        crop = self.get_crop_region(panel)
        ShapeToPdfExport(self.figure_canvas, panel, page, crop,
                         self.page_height)

    def draw_labels(self, panel, page):
        """
        Add the panel labels to the page.

        Here we calculate the position of labels but delegate
        to self.draw_text() to actually place the labels on PDF/TIFF
        """
        labels = panel['labels']
        x = panel['x']
        y = panel['y']
        width = panel['width']
        height = panel['height']

        # Handle page offsets
        x = x - page['x']
        y = y - page['y']

        spacer = 5

        # group by 'position':
        positions = {'top': [], 'bottom': [], 'left': [],
                     'leftvert': [], 'right': [],
                     'topleft': [], 'topright': [],
                     'bottomleft': [], 'bottomright': []}

        for l in labels:
            if 'text' not in l:
                if 'deltaT' in panel and panel['theT'] < len(panel['deltaT']):
                    the_t = panel['theT']
                    d_t = panel['deltaT'][the_t]
                    text = self.get_time_label_text(d_t, l['time'])
                    l['text'] = text
                else:
                    continue

            pos = l['position']
            l['size'] = int(l['size'])   # make sure 'size' is number
            # If page is black and label is black, make label white
            page_color = self.figure_json.get('page_color', 'ffffff').lower()
            label_color = l['color'].lower()
            label_on_page = pos in ('left', 'right', 'top',
                                    'bottom', 'leftvert')
            if label_on_page:
                if label_color == '000000' and page_color == '000000':
                    l['color'] = 'ffffff'
                if label_color == 'ffffff' and page_color == 'ffffff':
                    l['color'] = '000000'
            if pos in positions:
                positions[pos].append(l)

        def draw_lab(label, lx, ly, align='left'):
            label_h = label['size']
            color = label['color']
            red = int(color[0:2], 16)
            green = int(color[2:4], 16)
            blue = int(color[4:6], 16)
            fontsize = label['size']
            rgb = (red, green, blue)
            text = label['text']

            self.draw_text(text, lx, ly, fontsize, rgb, align=align)
            return label_h

        # Render each position:
        for key, labels in positions.items():
            if key == 'topleft':
                lx = x + spacer
                ly = y + spacer
                for l in labels:
                    label_h = draw_lab(l, lx, ly)
                    ly += label_h + spacer
            elif key == 'topright':
                lx = x + width - spacer
                ly = y + spacer
                for l in labels:
                    label_h = draw_lab(l, lx, ly, align='right')
                    ly += label_h + spacer
            elif key == 'bottomleft':
                lx = x + spacer
                ly = y + height
                labels.reverse()  # last item goes bottom
                for l in labels:
                    ly = ly - l['size'] - spacer
                    draw_lab(l, lx, ly)
            elif key == 'bottomright':
                lx = x + width - spacer
                ly = y + height
                labels.reverse()  # last item goes bottom
                for l in labels:
                    ly = ly - l['size'] - spacer
                    draw_lab(l, lx, ly, align='right')
            elif key == 'top':
                lx = x + (width/2)
                ly = y
                labels.reverse()
                for l in labels:
                    ly = ly - l['size'] - spacer
                    draw_lab(l, lx, ly, align='center')
            elif key == 'bottom':
                lx = x + (width/2)
                ly = y + height + spacer
                for l in labels:
                    label_h = draw_lab(l, lx, ly, align='center')
                    ly += label_h + spacer
            elif key == 'left':
                lx = x - spacer
                sizes = [l['size'] for l in labels]
                total_h = sum(sizes) + spacer * (len(labels)-1)
                ly = y + (height-total_h)/2
                for l in labels:
                    label_h = draw_lab(l, lx, ly, align='right')
                    ly += label_h + spacer
            elif key == 'right':
                lx = x + width + spacer
                sizes = [l['size'] for l in labels]
                total_h = sum(sizes) + spacer * (len(labels)-1)
                ly = y + (height-total_h)/2
                for l in labels:
                    label_h = draw_lab(l, lx, ly)
                    ly += label_h + spacer
            elif key == 'leftvert':
                lx = x - spacer
                ly = y + (height/2)
                labels.reverse()
                for l in labels:
                    lx = lx - l['size'] - spacer
                    draw_lab(l, lx, ly, align='vertical')

    def draw_scalebar(self, panel, region_width, page):
        """
        Add the scalebar to the page.

        Here we calculate the position of scalebar but delegate
        to self.draw_line() and self.draw_text() to actually place
        the scalebar and label on PDF/TIFF
        """
        x = panel['x']
        y = panel['y']
        width = panel['width']
        height = panel['height']

        # Handle page offsets
        x = x - page['x']
        y = y - page['y']

        if not ('scalebar' in panel and 'show' in panel['scalebar'] and
                panel['scalebar']['show']):
            return

        if not ('pixel_size_x' in panel and panel['pixel_size_x'] > 0):
            v = "Can't show scalebar - pixel_size_x is not defined for panel"
            logger.error(v)
            return

        sb = panel['scalebar']

        spacer = 0.05 * max(height, width)

        color = sb['color']
        red = int(color[0:2], 16)
        green = int(color[2:4], 16)
        blue = int(color[4:6], 16)

        position = 'position' in sb and sb['position'] or 'bottomright'
        align = 'left'

        if position == 'topleft':
            lx = x + spacer
            ly = y + spacer
        elif position == 'topright':
            lx = x + width - spacer
            ly = y + spacer
            align = "right"
        elif position == 'bottomleft':
            lx = x + spacer
            ly = y + height - spacer
        elif position == 'bottomright':
            lx = x + width - spacer
            ly = y + height - spacer
            align = "right"

        pixels_length = sb['length'] / panel['pixel_size_x']
        scale_to_canvas = panel['width'] / float(region_width)
        canvas_length = pixels_length * scale_to_canvas

        if align == 'left':
            lx_end = lx + canvas_length
        else:
            lx_end = lx - canvas_length

        self.draw_line(lx, ly, lx_end, ly, 3, (red, green, blue))

        if 'show_label' in sb and sb['show_label']:
            symbol = u"\u00B5m"
            if 'pixel_size_x_symbol' in panel:
                symbol = panel['pixel_size_x_symbol']
            label = "%s %s" % (sb['length'], symbol)
            font_size = 10
            try:
                font_size = int(sb['font_size'])
            except:
                pass

            # For 'bottom' scalebar, put label above
            if 'bottom' in position:
                ly = ly - font_size
            else:
                ly = ly + 5

            self.draw_text(
                label, (lx + lx_end)/2, ly, font_size, (red, green, blue),
                align="center")

    def get_panel_image(self, image, panel, orig_name=None):
        """
        Get the rendered image from OMERO, then crops & rotates as needed.

        Optionally saving original and cropped images as TIFFs.
        Returns image as PIL image.
        """
        z = panel['theZ']
        t = panel['theT']

        if 'z_projection' in panel and panel['z_projection']:
            if 'z_start' in panel and 'z_end' in panel:
                image.setProjection('intmax')
                image.setProjectionRange(panel['z_start'], panel['z_end'])

        pil_img = image.renderImage(z, t, compression=1.0)

        # We don't need to render again, so we can close rendering engine.
        image._re.close()

        if orig_name is not None:
            pil_img.save(orig_name)

        # Need to crop around centre before rotating...
        size_x = image.getSizeX()
        size_y = image.getSizeY()
        cx = size_x/2
        cy = size_y/2
        dx = panel['dx']
        dy = panel['dy']

        cx += dx
        cy += dy

        crop_left = 0
        crop_top = 0
        crop_right = size_x
        crop_bottom = size_y

        # We 'inverse crop' to make the image bigger, centred by dx, dy.
        # This is really only needed for rotation, but also gets us centered...
        if dx > 0:
            crop_left = int(dx * -2)
        else:
            crop_right = crop_right - int(dx * 2)
        if dy > 0:
            crop_top = int(dy * -2)
        else:
            crop_bottom = crop_bottom - int(dy * 2)

        # convert to RGBA so we can control background after crop/rotate...
        # See http://stackoverflow.com/questions/5252170/
        mde = pil_img.mode
        pil_img = pil_img.convert('RGBA')
        pil_img = pil_img.crop((crop_left, crop_top, crop_right, crop_bottom))

        # Optional rotation
        if ('rotation' in panel and panel['rotation'] > 0):
            rotation = -int(panel['rotation'])
            pil_img = pil_img.rotate(rotation, Image.BICUBIC)

        # Final crop to size
        panel_size = self.get_crop_region(panel)

        w, h = pil_img.size
        tile_w = panel_size['width']
        tile_h = panel_size['height']
        crop_left = int((w - tile_w) / 2)
        crop_top = int((h - tile_h) / 2)
        crop_right = w - crop_left
        crop_bottom = h - crop_top

        pil_img = pil_img.crop((crop_left, crop_top, crop_right, crop_bottom))

        # ...paste image with transparent blank areas onto white background
        fff = Image.new('RGBA', pil_img.size, (255, 255, 255, 255))
        out = Image.composite(pil_img, fff, pil_img)
        # and convert back to original mode
        out.convert(mde)

        return out

    def draw_panel(self, panel, page, idx):
        """
        Get the image from OMERO, processes (and saves) it then adds it.

        Calls self.paste_image() to add it to PDF or TIFF figure.
        """
        image_id = panel['imageId']
        channels = panel['channels']
        x = panel['x']
        y = panel['y']

        # Handle page offsets
        x = x - page['x']
        y = y - page['y']

        image = self.conn.getObject("Image", image_id)
        if image is None:
            return None, None
        self.apply_rdefs(image, channels)

        # create name to save image
        original_name = image.getName()
        img_name = os.path.basename(original_name)
        img_name = "%s_%s.tiff" % (idx, img_name)

        # get cropped image (saving original)
        orig_name = None
        if self.export_images:
            orig_name = os.path.join(
                self.zip_folder_name, ORIGINAL_DIR, img_name)
        pil_img = self.get_panel_image(image, panel, orig_name)

        # for PDF export, we might have a target dpi
        dpi = 'export_dpi' in panel and panel['export_dpi'] or None

        # Paste the panel to PDF or TIFF image
        self.paste_image(pil_img, img_name, panel, page, dpi)

        return image, pil_img

    def get_thumbnail(self, image_id):
        """Save thumb as local jpg and returns name."""
        conn = self.conn
        image = conn.getObject("Image", image_id)
        if image is None:
            return
        thumb_data = image.getThumbnail(size=(96, 96))
        i = StringIO(thumb_data)
        pil_img = Image.open(i)
        return pil_img

    def add_para_with_thumb(self, text, page_y, style, thumbnail=None):
        """Add paragraph text to point on PDF info page."""
        c = self.figure_canvas
        aw = self.page_width - (inch * 2)
        maxh = self.page_height - inch
        spacer = 10
        imgw = imgh = 25
        # Some html from markdown may not be compatible
        # with adding to PDF.
        try:
            para = Paragraph(text, style)
        except ValueError:
            logger.error("Couldn't add paragraph to PDF: %s" % text)
            text = "[Failed to format paragraph - not shown]"
            para = Paragraph(text, style)
        w, h = para.wrap(aw, page_y)   # find required space
        if thumbnail is not None:
            parah = max(h, imgh)
        else:
            parah = h
        # If there's not enough space, start a new page
        if parah > (page_y - inch):
            c.save()
            page_y = maxh    # reset to top of new page
        indent = inch
        if thumbnail is not None:
            buffer = StringIO()
            thumbnail.save(buffer, 'TIFF')
            buffer.seek(0)
            c.drawImage(ImageReader(buffer), inch, page_y - imgh, imgw, imgh)
            indent = indent + imgw + spacer
        para.drawOn(c, indent, page_y - h)
        return page_y - parah - spacer  # reduce the available height

    def add_read_me_file(self):
        """Add a simple text file into the zip to explain what's there."""
        read_me_path = os.path.join(self.zip_folder_name, "README.txt")
        with open(read_me_path, 'w') as f:
            f.write(README_TXT)

    def add_info_page(self, panels_json):
        """Generate a PDF info page with figure title, links to images etc."""
        script_params = self.script_params
        figure_name = self.figure_name
        base_url = None
        if 'Webclient_URI' in script_params:
            base_url = script_params['Webclient_URI']
        page_height = self.page_height

        # Need to sort panels from top (left) -> bottom of Figure
        panels_json.sort(key=lambda x: int(x['y']) + x['y'] * 0.01)

        img_ids = set()
        styles = getSampleStyleSheet()
        style_n = styles['Normal']
        style_h = styles['Heading1']
        style_h3 = styles['Heading3']

        scalebars = []
        maxh = page_height - inch

        # Start adding at the top, update page_y as we add paragraphs
        page_y = maxh
        page_y = self.add_para_with_thumb(figure_name, page_y, style=style_h)

        if "Figure_URI" in script_params:
            file_url = script_params["Figure_URI"]
            figure_link = ("Link to Figure: <a href='%s' color='blue'>%s</a>"
                           % (file_url, file_url))
            page_y = self.add_para_with_thumb(figure_link, page_y,
                                              style=style_n)

        # Add Figure Legend
        if ('legend' in self.figure_json and
                len(self.figure_json['legend']) > 0):
            page_y = self.add_para_with_thumb("Legend:", page_y,
                                              style=style_h3)
            legend = self.figure_json['legend']
            if markdown_imported:
                # convert markdown to html
                legend = markdown.markdown(legend)
                # insert 'blue' style into any links
                legend = legend.replace("<a href", "<a color='blue' href")
                # Add paragraphs separately
                para_lines = legend.split("<p>")
                for p in para_lines:
                    p = "<p>" + p
                    page_y = self.add_para_with_thumb(p, page_y, style=style_n)
            else:
                page_y = self.add_para_with_thumb(legend, page_y,
                                                  style=style_n)

        page_y = self.add_para_with_thumb(
            "Figure contains the following images:", page_y, style=style_h3)

        # Go through sorted panels, adding paragraph for each unique image
        for p in panels_json:
            iid = p['imageId']
            # list unique scalebar lengths
            if 'scalebar' in p:
                sb_length = p['scalebar']['length']
                symbol = u"\u00B5m"
                if 'pixel_size_x_symbol' in p:
                    symbol = p['pixel_size_x_symbol']
                scalebars.append("%s %s" % (sb_length, symbol))
            if iid in img_ids:
                continue    # ignore images we've already handled
            img_ids.add(iid)
            thumbnail = self.get_thumbnail(iid)
            # thumb = "<img src='%s' width='%s' height='%s' " \
            #         "valign='middle' />" % (thumbSrc, thumbSize, thumbSize)
            lines = []
            lines.append(p['name'])
            img_url = "%s?show=image-%s" % (base_url, iid)
            lines.append(
                "<a href='%s' color='blue'>%s</a>" % (img_url, img_url))
            # addPara([" ".join(line)])
            line = " ".join(lines)
            page_y = self.add_para_with_thumb(
                line, page_y, style=style_n, thumbnail=thumbnail)

        if len(scalebars) > 0:
            scalebars = list(set(scalebars))
            page_y = self.add_para_with_thumb("Scalebars:", page_y,
                                              style=style_h3)
            page_y = self.add_para_with_thumb(
                "Scalebar Lengths: %s" % ", ".join(scalebars),
                page_y, style=style_n)

    def panel_is_on_page(self, panel, page):
        """Return true if panel overlaps with this page."""
        px = panel['x']
        px2 = px + panel['width']
        py = panel['y']
        py2 = py + panel['height']
        cx = page['x']
        cx2 = cx + self.page_width
        cy = page['y']
        cy2 = cy + self.page_height
        # overlap needs overlap on x-axis...
        return px < cx2 and cx < px2 and py < cy2 and cy < py2

    def add_panels_to_page(self, panels_json, image_ids, page):
        """Add panels that are within the bounds of this page."""
        for i, panel in enumerate(panels_json):

            if not self.panel_is_on_page(panel, page):
                continue

            image_id = panel['imageId']
            # draw_panel() creates PIL image then applies it to the page.
            # For TIFF export, draw_panel() also adds shapes to the
            # PIL image before pasting onto the page...
            image, pil_img = self.draw_panel(panel, page, i)
            if image is None:
                continue
            if image.canAnnotate():
                image_ids.add(image_id)
            # ... but for PDF we have to add shapes to the whole PDF page
            self.add_rois(panel, page)  # This does nothing for TIFF export

            # Finally, add scale bar and labels to the page
            self.draw_scalebar(panel, pil_img.size[0], page)
            self.draw_labels(panel, page)

    def get_figure_file_ext(self):
        """Return pdf."""
        return "pdf"

    def create_figure(self):
        """Create a PDF figure. This is overwritten by ExportTiff subclass."""
        if not reportlab_installed:
            raise ImportError(
                "Need to install https://bitbucket.org/rptlab/reportlab")
        if self.zip_folder_name is not None:
            # write to temp dir
            name = os.path.join(self.zip_folder_name, self.get_figure_file_name())
        else:
            name = self.file_object
        self.figure_canvas = canvas.Canvas(
            name, pagesize=(self.page_width, self.page_height))

    def add_page_color(self):
        """Simply draw colored rectangle over whole current page."""
        page_color = self.figure_json.get('page_color')
        if page_color and page_color.lower() != 'ffffff':
            rgb = ShapeToPdfExport.get_rgb('#' + page_color)
            r = float(rgb[0])/255
            g = float(rgb[1])/255
            b = float(rgb[2])/255
            self.figure_canvas.setStrokeColorRGB(r, g, b)
            self.figure_canvas.setFillColorRGB(r, g, b)
            self.figure_canvas.setLineWidth(4)
            self.figure_canvas.rect(0, 0, self.page_width,
                                    self.page_height, fill=1)

    def save_page(self, page=None):
        """Called on completion of each page. Saves page of PDF."""
        self.figure_canvas.showPage()

    def save_figure(self):
        """Complete PDF figure (or info-page PDF for TIFF export)."""
        self.figure_canvas.save()

    def draw_text(self, text, x, y, fontsize, rgb, align="center"):
        """Add text to PDF. Overwritten for TIFF below."""
        if markdown_imported:
            # convert markdown to html
            text = markdown.markdown(text)

        y = self.page_height - y
        c = self.figure_canvas
        # Needs to be wide enough to avoid wrapping
        para_width = self.page_width

        red, green, blue = rgb
        red = float(red)/255
        green = float(green)/255
        blue = float(blue)/255

        alignment = TA_LEFT
        if (align == "center"):
            alignment = TA_CENTER
            x = x - (para_width/2)
        elif (align == "right"):
            alignment = TA_RIGHT
            x = x - para_width
        elif (align == "left"):
            pass
        elif align == 'vertical':
            # Switch axes
            c.rotate(90)
            px = x
            x = y
            y = -px
            # Align center
            alignment = TA_CENTER
            x = x - (para_width/2)

        style_n = getSampleStyleSheet()['Normal']
        style = ParagraphStyle(
            'label',
            parent=style_n,
            alignment=alignment,
            textColor=(red, green, blue),
            fontSize=fontsize)

        para = Paragraph(text, style)
        w, h = para.wrap(para_width, y)   # find required space
        para.drawOn(c, x, y - h + int(fontsize * 0.25))

        # Rotate back again
        if align == 'vertical':
            c.rotate(-90)

    def draw_line(self, x, y, x2, y2, width, rgb):
        """Add line to PDF. Overwritten for TIFF below."""
        red, green, blue = rgb
        red = float(red)/255
        green = float(green)/255
        blue = float(blue)/255

        y = self.page_height - y
        y2 = self.page_height - y2
        c = self.figure_canvas
        c.setLineWidth(width)
        c.setStrokeColorRGB(red, green, blue)
        c.line(x, y, x2, y2,)

    def paste_image(self, pil_img, img_name, panel, page, dpi):
        """Add the PIL image to the PDF figure. Overwritten for TIFFs."""
        x = panel['x']
        y = panel['y']
        width = panel['width']
        height = panel['height']
        # Handle page offsets
        x = x - page['x']
        y = y - page['y']

        if dpi is not None:
            # E.g. target is 300 dpi and width & height is '72 dpi'
            # so we need image to be width * dpi/72 pixels
            target_w = (width * dpi) / 72
            curr_w, curr_h = pil_img.size
            dpi_scale = float(target_w) / curr_w
            target_h = dpi_scale * curr_h
            target_w = int(round(target_w))
            target_h = int(round(target_h))
            if target_w > curr_w:
                if self.export_images:
                    # Save image BEFORE resampling
                    rs_name = os.path.join(
                        self.zip_folder_name, RESAMPLED_DIR, img_name)
                    pil_img.save(rs_name)
                pil_img = pil_img.resize((target_w, target_h), Image.BICUBIC)

        # in the folder to zip
        if self.zip_folder_name is not None:
            img_name = os.path.join(self.zip_folder_name, FINAL_DIR, img_name)
            pil_img.save(img_name)

        buffer = StringIO()
        pil_img.save(buffer, 'TIFF')
        buffer.seek(0)
        # Since coordinate system is 'bottom-up', convert from 'top-down'
        y = self.page_height - height - y
        self.figure_canvas.drawImage(ImageReader(buffer), x, y, width, height)


class TiffExport(FigureExport):
    """
    Subclass to handle export of Figure as TIFFs, 1 per page.

    We only need to overwrite methods that actually put content on
    the TIFF instead of PDF.
    """

    def __init__(self, conn, script_params, export_images=None):
        """Constructor."""
        super(TiffExport, self).__init__(conn, script_params, export_images)

        from omero.gateway import THISPATH
        self.GATEWAYPATH = THISPATH

        self.ns = "omero.web.figure.tiff"
        self.mimetype = "image/tiff"

    def add_rois(self, panel, page):
        """TIFF export doesn't add ROIs to page (does it to panel)."""
        pass

    def get_font(self, fontsize, bold=False, italics=False):
        """Try to load font from known location in OMERO."""
        font_name = "FreeSans.ttf"
        if bold and italics:
            font_name = "FreeSansBoldOblique.ttf"
        elif bold:
            font_name = "FreeSansBold.ttf"
        elif italics:
            font_name = "FreeSansOblique.ttf"
        path_to_font = os.path.join(self.GATEWAYPATH, "pilfonts", font_name)
        try:
            font = ImageFont.truetype(path_to_font, fontsize)
        except:
            font = ImageFont.load(
                '%s/pilfonts/B%0.2d.pil' % (self.GATEWAYPATH, 24))
        return font

    def scale_coords(self, coord):
        """
        Scale coordinalte from 72dpi to 300dpi.

        Original figure coordinates assume 72 dpi figure, but we want to
        export at 300 dpi, so everything needs scaling accordingly
        """
        return (coord * 300)/72

    def get_figure_file_ext(self):
        """Return 'tiff'."""
        return "tiff"

    def create_figure(self):
        """
        Create a new PIL image ready to receive panels, labels etc.

        This is created for each page in the figure.
        """
        tiff_width = self.scale_coords(self.page_width)
        tiff_height = self.scale_coords(self.page_height)
        rgb = (255, 255, 255)
        page_color = self.figure_json.get('page_color')
        if page_color is not None:
            rgb = ShapeToPdfExport.get_rgb('#' + page_color)
        self.tiff_figure = Image.new("RGBA", (tiff_width, tiff_height), rgb)

    def add_page_color(self):
        """ Don't need to do anything for TIFF. Image is already colored."""
        pass

    def paste_image(self, pil_img, img_name, panel, page, dpi=None):
        """Add the PIL image to the current figure page."""
        x = panel['x']
        y = panel['y']
        width = panel['width']
        height = panel['height']

        # Handle page offsets
        x = x - page['x']
        y = y - page['y']

        x = self.scale_coords(x)
        y = self.scale_coords(y)
        width = self.scale_coords(width)
        height = self.scale_coords(height)

        x = int(round(x))
        y = int(round(y))
        width = int(round(width))
        height = int(round(height))

        # Save image BEFORE resampling
        if self.export_images:
            rs_name = os.path.join(self.zip_folder_name, RESAMPLED_DIR,
                                   img_name)
            pil_img.save(rs_name)

        # Resize to our target size to match DPI of figure
        pil_img = pil_img.resize((width, height), Image.BICUBIC)

        if self.export_images:
            img_name = os.path.join(self.zip_folder_name, FINAL_DIR, img_name)
            pil_img.save(img_name)

        # Now at full figure resolution - Good time to add shapes...
        crop = self.get_crop_region(panel)
        ShapeToPilExport(pil_img, panel, crop)

        width, height = pil_img.size
        box = (x, y, x + width, y + height)
        self.tiff_figure.paste(pil_img, box)

    def draw_line(self, x, y, x2, y2, width, rgb):
        """Draw line on the current figure page."""
        draw = ImageDraw.Draw(self.tiff_figure)

        x = self.scale_coords(x)
        y = self.scale_coords(y)
        x2 = self.scale_coords(x2)
        y2 = self.scale_coords(y2)
        width = self.scale_coords(width)

        for l in range(width):
            draw.line([(x, y), (x2, y2)], fill=rgb)
            y += 1
            y2 += 1

    def draw_temp_label(self, text, fontsize, rgb):
        """Return a new PIL image with text. Handles html."""
        tokens = self.parse_html(text)

        widths = []
        heights = []
        for t in tokens:
            font = self.get_font(fontsize, t['bold'], t['italics'])
            txt_w, txt_h = font.getsize(t['text'])
            widths.append(txt_w)
            heights.append(txt_h)

        label_w = sum(widths)
        label_h = max(heights)

        temp_label = Image.new('RGBA', (label_w, label_h), (255, 255, 255, 0))
        textdraw = ImageDraw.Draw(temp_label)

        w = 0
        for t in tokens:
            font = self.get_font(fontsize, t['bold'], t['italics'])
            txt_w, txt_h = font.getsize(t['text'])
            textdraw.text((w, 0), t['text'], font=font, fill=rgb)
            w += txt_w
        return temp_label

    def parse_html(self, html):
        """
        Parse html to give list of tokens with bold or italics.

        Returns list of [{'text': txt, 'bold': true, 'italics': false}]
        """
        in_bold = False
        in_italics = False

        # Remove any <p> tags
        html = html.replace('<p>', '')
        html = html.replace('</p>', '')

        tokens = []
        token = ""
        i = 0
        while i < len(html):
            # look for start / end of b or i elements
            start_bold = html[i:].startswith("<strong>")
            end_bold = html[i:].startswith("</strong>")
            start_ital = html[i:].startswith("<em>")
            end_ital = html[i:].startswith("</em>")

            if start_bold:
                i += len("<strong>")
            elif end_bold:
                i += len("</strong>")
            elif start_ital:
                i += len("<em>")
            elif end_ital:
                i += len("</em>")

            # if style has changed:
            if start_bold or end_bold or start_ital or end_ital:
                # save token with previous style
                tokens.append({'text': token, 'bold': in_bold,
                               'italics': in_italics})
                token = ""
                if start_bold or end_bold:
                    in_bold = start_bold
                elif start_ital or end_ital:
                    in_italics = start_ital
            else:
                token = token + html[i]
                i += 1
        tokens.append({'text': token, 'bold': in_bold, 'italics': in_italics})
        return tokens

    def draw_text(self, text, x, y, fontsize, rgb, align="center"):
        """Add text to the current figure page."""
        x = self.scale_coords(x)
        y = y - 5       # seems to help, but would be nice to fix this!
        y = self.scale_coords(y)
        fontsize = self.scale_coords(fontsize)

        if markdown_imported:
            # convert markdown to html
            text = markdown.markdown(text)

        temp_label = self.draw_temp_label(text, fontsize, rgb)

        if align == "vertical":
            temp_label = temp_label.rotate(90, expand=True)
            y = y - (temp_label.size[1]/2)
        elif align == "center":
            x = x - (temp_label.size[0] / 2)
        elif align == "right":
                x = x - temp_label.size[0]
        x = int(round(x))
        y = int(round(y))
        # Use label as mask, so transparent part is not pasted
        self.tiff_figure.paste(temp_label, (x, y), mask=temp_label)

    def save_page(self, page=None):
        """
        Save the current PIL image page as a TIFF and start a new PIL image.

        New PIL image is created for the next page
        """
        if self.zip_folder_name is not None:
            # write to temp dir
            name = os.path.join(self.zip_folder_name, self.get_figure_file_name())
        else:
            name = self.file_object

        self.tiff_figure.save(name, 'tiff')

        # Create a new blank tiffFigure for subsequent pages
        self.create_figure()

    def add_info_page(self, panels_json):
        """
        Since we need a PDF for the info page, we create one first.

        Then call superclass add_info_page
        """
        # We allow TIFF figure export without reportlab (no Info page)
        if not reportlab_installed:
            return

        full_name = "info_page.pdf"
        if self.zip_folder_name is not None:
            full_name = os.path.join(self.zip_folder_name, full_name)
        self.figure_canvas = canvas.Canvas(
            full_name, pagesize=(self.page_width, self.page_height))

        # Superclass method will call add_para_with_thumb(),
        # to add lines to self.infoLines
        super(TiffExport, self).add_info_page(panels_json)

    def save_figure(self):
        """Complete PDF figure (or info-page PDF for TIFF export)."""
        # We allow TIFF figure export without reportlab (no Info page)
        if not reportlab_installed:
            return
        self.figure_canvas.save()
