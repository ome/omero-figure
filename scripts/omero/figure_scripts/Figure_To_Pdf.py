
#
# Copyright (c) 2014-2015 University of Dundee.
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

import json
import unicodedata

from datetime import datetime
import os
from os import path
import zipfile

from omero.model import ImageAnnotationLinkI, ImageI
import omero.scripts as scripts

from cStringIO import StringIO
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import Image
    import ImageDraw

try:
    import markdown
    markdownImported = True
except ImportError:
    markdownImported = False

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph
    reportlabInstalled = True
except ImportError:
    reportlabInstalled = False


from omero.gateway import BlitzGateway
from omero.rtypes import rstring, robject

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
   all panels for export of TIFF figures, or individual panels that have
   a 'dpi' set for export of PDF figures.

 - 3_final: These are the image panels that are inserted into the
   final figure, saved following any cropping, rotation and resampling steps.
"""


def compress(target, base):
    """
    Creates a ZIP recursively from a given base directory.

    @param target:      Name of the zip file we want to write E.g.
                        "folder.zip"
    @param base:        Name of folder that we want to zip up E.g. "folder"
    """
    zip_file = zipfile.ZipFile(target, 'w')
    try:
        for root, dirs, files in os.walk(base):
            archive_root = os.path.relpath(root, base)
            for f in files:
                fullpath = os.path.join(root, f)
                archive_name = os.path.join(archive_root, f)
                zip_file.write(fullpath, archive_name)
    finally:
        zip_file.close()


class FigureExport(object):
    """
    Super class for exporting various figures, such as PDF or TIFF etc.
    """

    def __init__(self, conn, scriptParams, exportImages=False):

        self.conn = conn
        self.scriptParams = scriptParams
        self.exportImages = exportImages

        self.ns = "omero.web.figure.pdf"
        self.mimetype = "application/pdf"

        figure_json_string = scriptParams['Figure_JSON']
        # Since unicode can't be wrapped by rstring
        figure_json_string = figure_json_string.decode('utf8')
        self.figure_json = json.loads(figure_json_string)

        n = datetime.now()
        # time-stamp name by default: Figure_2013-10-29_22-43-53.pdf
        self.figureName = "Figure_%s-%s-%s_%s-%s-%s" % (n.year, n.month, n.day, n.hour, n.minute, n.second)
        if 'figureName' in self.figure_json:
            self.figureName = self.figure_json['figureName']

        # get Figure width & height...
        self.pageWidth = self.figure_json['paper_width']
        self.pageHeight = self.figure_json['paper_height']

    def getZipName(self):

        # file names can't include unicode characters
        name = unicodedata.normalize('NFKD', self.figureName).encode('ascii', 'ignore')
        # in case we have path/to/name.pdf, just use name.pdf
        name = path.basename(name)
        # Remove commas: causes problems 'duplicate headers' in file download
        name = name.replace(",", ".")
        return "%s.zip" % name

    def getFigureFileName(self):
        """
        For PDF export we will only create a single figure file, but
        for TIFF export we may have several pages, so we need unique names
        for each to avoid overwriting.
        This method supports both, simply using different extension
        (pdf/tiff) for each.
        """

        # Extension is pdf or tiff
        fext = self.getFigureFileExt()

        # file names can't include unicode characters
        name = unicodedata.normalize('NFKD', self.figureName).encode('ascii', 'ignore')
        # in case we have path/to/name, just use name
        name = path.basename(name)

        # if ends with E.g. .pdf, remove extension
        if name.endswith("." + fext):
            name = name[0: -len("." + fext)]

        # Name with extension and folder
        fullName = "%s.%s" % (name, fext)
        # Remove commas: causes problems 'duplicate headers' in file download
        fullName = fullName.replace(",", ".")

        index = 1
        if fext == "tiff" and self.page_count > 1:
            fullName = "%s_page_%02d.%s" % (name, index, fext)
        if self.zip_folder_name is not None:
            fullName = os.path.join(self.zip_folder_name, fullName)

        while(os.path.exists(fullName)):
            index += 1
            fullName = "%s_page_%02d.%s" % (name, index, fext)
            if self.zip_folder_name is not None:
                fullName = os.path.join(self.zip_folder_name, fullName)

        # Handy to know what the last created file is:
        self.figureFileName = fullName

        print "getFigureFileName()", fullName
        return fullName

    def buildFigure(self):
        """
        The main building of the figure happens here, independently of format.
        We set up directories as needed, call createFigure() to create
        the PDF or TIFF then iterate through figure pages, adding panels
        for each page.
        Then we add an info page and create a zip of everything if needed.
        Finally the created file or zip is uploaded to OMERO and attached
        as a file annotation to all the images in the figure.
        """

        # test to see if we've got multiple pages
        page_count = 'page_count' in self.figure_json and self.figure_json['page_count'] or 1
        self.page_count = int(page_count)
        paper_spacing = 'paper_spacing' in self.figure_json and self.figure_json['paper_spacing'] or 50
        page_col_count = 'page_col_count' in self.figure_json and self.figure_json['page_col_count'] or 1

        # Create a zip if we have multiple TIFF pages or we're exporting Images
        export_option = self.scriptParams['Export_Option']
        createZip = False
        if self.exportImages:
            createZip = True
        if (self.page_count > 1) and (export_option.startswith("TIFF")):
            createZip = True

        # somewhere to put PDF and images
        self.zip_folder_name = None
        if createZip:
            self.zip_folder_name = "figure"
            curr_dir = os.getcwd()
            zipDir = os.path.join(curr_dir, self.zip_folder_name)
            os.mkdir(zipDir)
            if self.exportImages:
                for d in (ORIGINAL_DIR, RESAMPLED_DIR, FINAL_DIR):
                    imgDir = os.path.join(zipDir, d)
                    os.mkdir(imgDir)
                self.addReadMeFile()

        # Create the figure file(s)
        self.createFigure()

        panels_json = self.figure_json['panels']
        imageIds = set()

        groupId = None
        # We get our group from the first image
        id1 = panels_json[0]['imageId']
        groupId = self.conn.getObject("Image", id1).getDetails().group.id.val

        # For each page, add panels...
        col = 0
        row = 0
        for p in range(self.page_count):
            print "\n------------------------- PAGE ", p + 1, "--------------------------"
            px = col * (self.pageWidth + paper_spacing)
            py = row * (self.pageHeight + paper_spacing)
            page = {'x': px, 'y': py}

            # if export_option == "TIFF":
            #     add_panels_to_tiff(conn, tiffFigure, panels_json, imageIds, page)
            # elif export_option == "PDF":
            self.add_panels_to_page(panels_json, imageIds, page)

            # complete page and save
            self.savePage()

            col = col + 1
            if col >= page_col_count:
                col = 0
                row = row + 1

        # Add thumbnails and links page
        self.addInfoPage(panels_json)

        # Saves the completed  figure file
        self.saveFigure()

        # PDF will get created in this group
        if groupId is None:
            groupId = self.conn.getEventContext().groupId
        self.conn.SERVICE_OPTS.setOmeroGroup(groupId)

        outputFile = self.figureFileName
        ns = self.ns
        mimetype = self.mimetype

        if self.zip_folder_name is not None:
            zipName = self.getZipName()
            # Recursively zip everything up
            compress(zipName, self.zip_folder_name)

            outputFile = zipName
            ns = "omero.web.figure.zip"
            mimetype = "application/zip"

        fileAnn = self.conn.createFileAnnfromLocalFile(
            outputFile,
            mimetype=mimetype,
            ns=ns)

        links = []
        for iid in list(imageIds):
            print "linking to", iid
            link = ImageAnnotationLinkI()
            link.parent = ImageI(iid, False)
            link.child = fileAnn._obj
            links.append(link)
        if len(links) > 0:
            # Don't want to fail at this point due to strange permissions combo
            try:
                links = self.conn.getUpdateService().saveAndReturnArray(
                    links, self.conn.SERVICE_OPTS)
            except:
                print "Failed to attach figure: %s to images %s" % (fileAnn, imageIds)

        return fileAnn

    def applyRdefs(self, image, channels):
        """ Apply the channel levels and colors to the image """
        cIdxs = []
        windows = []
        colors = []

        # OMERO.figure doesn't support greyscale rendering
        image.setColorRenderingModel()

        for i, c in enumerate(channels):
            if c['active']:
                cIdxs.append(i+1)
                windows.append([c['window']['start'], c['window']['end']])
                colors.append(c['color'])

        print "setActiveChannels", cIdxs, windows, colors
        image.setActiveChannels(cIdxs, windows, colors)

    def get_panel_size(self, panel):
        """
        Gets the width and height in points/pixels for a panel in the
        figure. This is at the 'original' figure / PDF coordinates
        (E.g. before scaling for TIFF export)
        """
        zoom = float(panel['zoom'])
        frame_w = panel['width']
        frame_h = panel['height']
        dx = panel['dx']
        dy = panel['dy']
        dx = dx * (zoom/100)
        dy = dy * (zoom/100)
        orig_w = panel['orig_width']
        orig_h = panel['orig_height']

        # need tile_x, tile_y, tile_w, tile_h

        tile_w = orig_w / (zoom/100)
        tile_h = orig_h / (zoom/100)

        print 'zoom', zoom
        print 'frame_w', frame_w, 'frame_h', frame_h, 'orig', orig_w, orig_h
        print "Initial tile w, h", tile_w, tile_h

        orig_ratio = float(orig_w) / orig_h
        wh = float(frame_w) / frame_h

        if abs(orig_ratio - wh) > 0.01:
            # if viewport is wider than orig...
            if (orig_ratio < wh):
                print "viewport wider"
                tile_h = tile_w / wh
            else:
                print "viewport longer"
                tile_w = tile_h * wh

        print 'tile_w', tile_w, 'tile_h', tile_h
        return {'width': tile_w, 'height': tile_h}

    def get_time_label_text(self, deltaT, format):
        """ Gets the text for 'live' time-stamp labels """
        if format == "secs":
            text = "%s secs" % deltaT
        elif format == "mins":
            text = "%s mins" % int(round(float(deltaT) / 60))
        elif format == "hrs:mins":
            h = (deltaT / 3600)
            m = int(round((float(deltaT) % 3600) / 60))
            text = "%s:%02d" % (h, m)
        elif format == "hrs:mins:secs":
            h = (deltaT / 3600)
            m = (deltaT % 3600) / 60
            s = deltaT % 60
            text = "%s:%02d:%02d" % (h, m, s)
        return text

    def drawLabels(self, panel, page):
        """
        Add the panel labels to the page.
        Here we calculate the position of labels but delegate
        to self.drawText() to actually place the labels on PDF/TIFF
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

        print "sorting labels..."
        for l in labels:
            if 'text' not in l:
                print "NO text", 'time' in l, 'deltaT', 'deltaT' in panel
                print panel['theT'], len(panel['deltaT']),
                print panel['theT'] < len(panel['deltaT'])
                if 'deltaT' in panel and panel['theT'] < len(panel['deltaT']):
                    theT = panel['theT']
                    print 'theT', theT
                    dT = panel['deltaT'][theT]
                    print 'dT', dT
                    text = self.get_time_label_text(dT, l['time'])
                    print 'text', text
                    l['text'] = text
                else:
                    continue

            print l
            pos = l['position']
            l['size'] = int(l['size'])   # make sure 'size' is number
            if pos in positions:
                positions[pos].append(l)

        def drawLab(label, lx, ly, align='left'):
            label_h = label['size']
            color = label['color']
            red = int(color[0:2], 16)
            green = int(color[2:4], 16)
            blue = int(color[4:6], 16)
            fontsize = label['size']
            rgb = (red, green, blue)
            text = label['text']

            self.drawText(text, lx, ly, fontsize, rgb, align=align)
            return label_h

        # Render each position:
        for key, labels in positions.items():
            if key == 'topleft':
                lx = x + spacer
                ly = y + spacer
                for l in labels:
                    label_h = drawLab(l, lx, ly)
                    ly += label_h + spacer
            elif key == 'topright':
                lx = x + width - spacer
                ly = y + spacer
                for l in labels:
                    label_h = drawLab(l, lx, ly, align='right')
                    ly += label_h + spacer
            elif key == 'bottomleft':
                lx = x + spacer
                ly = y + height
                labels.reverse()  # last item goes bottom
                for l in labels:
                    ly = ly - l['size'] - spacer
                    drawLab(l, lx, ly)
            elif key == 'bottomright':
                lx = x + width - spacer
                ly = y + height
                labels.reverse()  # last item goes bottom
                for l in labels:
                    ly = ly - l['size'] - spacer
                    drawLab(l, lx, ly, align='right')
            elif key == 'top':
                lx = x + (width/2)
                ly = y
                labels.reverse()
                for l in labels:
                    ly = ly - l['size'] - spacer
                    drawLab(l, lx, ly, align='center')
            elif key == 'bottom':
                lx = x + (width/2)
                ly = y + height + spacer
                for l in labels:
                    label_h = drawLab(l, lx, ly, align='center')
                    ly += label_h + spacer
            elif key == 'left':
                lx = x - spacer
                sizes = [l['size'] for l in labels]
                total_h = sum(sizes) + spacer * (len(labels)-1)
                ly = y + (height-total_h)/2
                for l in labels:
                    label_h = drawLab(l, lx, ly, align='right')
                    ly += label_h + spacer
            elif key == 'right':
                lx = x + width + spacer
                sizes = [l['size'] for l in labels]
                total_h = sum(sizes) + spacer * (len(labels)-1)
                ly = y + (height-total_h)/2
                for l in labels:
                    label_h = drawLab(l, lx, ly)
                    ly += label_h + spacer
            elif key == 'leftvert':
                lx = x - spacer
                ly = y + (height/2)
                labels.reverse()
                for l in labels:
                    lx = lx - l['size'] - spacer
                    drawLab(l, lx, ly, align='vertical')

    def drawScalebar(self, panel, region_width, page):
        """
        Add the scalebar to the page.
        Here we calculate the position of scalebar but delegate
        to self.drawLine() and self.drawText() to actually place
        the scalebar and label on PDF/TIFF
        """
        x = panel['x']
        y = panel['y']
        width = panel['width']
        height = panel['height']

        # Handle page offsets
        x = x - page['x']
        y = y - page['y']

        if not ('scalebar' in panel and 'show' in panel['scalebar']
                and panel['scalebar']['show']):
            return

        if not ('pixel_size_x' in panel and panel['pixel_size_x'] > 0):
            print "Can't show scalebar - pixel_size_x is not defined for panel"
            return

        sb = panel['scalebar']

        spacer = 0.05 * max(height, width)

        color = sb['color']
        red = int(color[0:2], 16)
        green = int(color[2:4], 16)
        blue = int(color[4:6], 16)

        position = 'position' in sb and sb['position'] or 'bottomright'
        print 'scalebar.position', position
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

        print "Adding Scalebar of %s microns." % sb['length'],
        print "Pixel size is %s microns" % panel['pixel_size_x']
        pixels_length = sb['length'] / panel['pixel_size_x']
        scale_to_canvas = panel['width'] / float(region_width)
        canvas_length = pixels_length * scale_to_canvas
        print 'Scalebar length (panel pixels):', pixels_length
        print 'Scale by %s to page ' \
              'coordinate length: %s' % (scale_to_canvas, canvas_length)

        if align == 'left':
            lx_end = lx + canvas_length
        else:
            lx_end = lx - canvas_length

        self.drawLine(lx, ly, lx_end, ly, 2, (red, green, blue))

        if 'show_label' in sb and sb['show_label']:
            # c = self.figureCanvas
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

            self.drawText(label, (lx + lx_end)/2, ly, font_size, (red, green, blue), align="center")

    def getPanelImage(self, image, panel, origName=None):
        """
        Gets the rendered image from OMERO, then crops & rotates as needed.
        Optionally saving original and cropped images as TIFFs.
        Returns image as PIL image.
        """
        z = panel['theZ']
        t = panel['theT']

        if 'z_projection' in panel and panel['z_projection']:
            if 'z_start' in panel and 'z_end' in panel:
                print "Z_projection:", panel['z_start'], panel['z_end']
                image.setProjection('intmax')
                image.setProjectionRange(panel['z_start'], panel['z_end'])

        pilImg = image.renderImage(z, t, compression=1.0)

        # We don't need to render again, so we can close rendering engine.
        image._re.close()

        if origName is not None:
            pilImg.save(origName)

        # Need to crop around centre before rotating...
        sizeX = image.getSizeX()
        sizeY = image.getSizeY()
        cx = sizeX/2
        cy = sizeY/2
        dx = panel['dx']
        dy = panel['dy']

        cx += dx
        cy += dy

        crop_left = 0
        crop_top = 0
        crop_right = sizeX
        crop_bottom = sizeY

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
        mde = pilImg.mode
        pilImg = pilImg.convert('RGBA')
        pilImg = pilImg.crop((crop_left, crop_top, crop_right, crop_bottom))

        # Optional rotation
        if ('rotation' in panel and panel['rotation'] > 0):
            rotation = -int(panel['rotation'])
            pilImg = pilImg.rotate(rotation, Image.BICUBIC)

        # Final crop to size
        panel_size = self.get_panel_size(panel)

        w, h = pilImg.size
        tile_w = panel_size['width']
        tile_h = panel_size['height']
        crop_left = int((w - tile_w) / 2)
        crop_top = int((h - tile_h) / 2)
        crop_right = w - crop_left
        crop_bottom = h - crop_top

        pilImg = pilImg.crop((crop_left, crop_top, crop_right, crop_bottom))

        # ...paste image with transparent blank areas onto white background
        fff = Image.new('RGBA', pilImg.size, (255, 255, 255, 255))
        out = Image.composite(pilImg, fff, pilImg)
        # and convert back to original mode
        out.convert(mde)

        return out

    def drawPanel(self, panel, page, idx):
        """
        Gets the image from OMERO, processes (and saves) it then
        calls self.pasteImage() to add it to PDF or TIFF figure.
        """
        imageId = panel['imageId']
        channels = panel['channels']
        x = panel['x']
        y = panel['y']
        width = panel['width']
        height = panel['height']

        # Handle page offsets
        # pageHeight = self.pageHeight
        x = x - page['x']
        y = y - page['y']

        image = self.conn.getObject("Image", imageId)
        self.applyRdefs(image, channels)

        # create name to save image
        originalName = image.getName()
        imgName = os.path.basename(originalName)
        imgName = "%s_%s.tiff" % (idx, imgName)

        # get cropped image (saving original)
        origName = None
        if self.exportImages:
            origName = os.path.join(self.zip_folder_name, ORIGINAL_DIR, imgName)
            print "Saving original to: ", origName
        pilImg = self.getPanelImage(image, panel, origName)
        tile_width = pilImg.size[0]

        # for PDF export, we might have a target dpi
        dpi = 'export_dpi' in panel and panel['export_dpi'] or None

        # Paste the panel to PDF or TIFF image
        self.pasteImage(pilImg, imgName, x, y, width, height, dpi)

        self.drawScalebar(panel, tile_width, page)

        return image

    def getThumbnail(self, imageId):
        """ Saves thumb as local jpg and returns name """

        conn = self.conn
        image = conn.getObject("Image", imageId)
        thumbData = image.getThumbnail(size=(96, 96))
        i = StringIO(thumbData)
        pilImg = Image.open(i)
        tempName = str(imageId) + "thumb.jpg"
        pilImg.save(tempName)
        return tempName

    def addParaWithThumb(self, text, pageY, style, thumbSrc=None):
        """ Adds paragraph text to point on PDF info page """

        c = self.figureCanvas
        aW = self.pageWidth - (inch * 2)
        maxH = self.pageHeight - inch
        spacer = 10
        imgw = imgh = 25
        # Some html from markdown may not be compatible
        # with adding to PDF.
        try:
            para = Paragraph(text, style)
        except ValueError:
            print "Couldn't add paragraph to PDF:"
            print text
            text = "[Failed to format paragraph - not shown]"
            para = Paragraph(text, style)
        w, h = para.wrap(aW, pageY)   # find required space
        if thumbSrc is not None:
            parah = max(h, imgh)
        else:
            parah = h
        # If there's not enough space, start a new page
        if parah > (pageY - inch):
            print "new page"
            c.save()
            pageY = maxH    # reset to top of new page
        indent = inch
        if thumbSrc is not None:
            c.drawImage(thumbSrc, inch, pageY - imgh, imgw, imgh)
            indent = indent + imgw + spacer
        para.drawOn(c, indent, pageY - h)
        return pageY - parah - spacer  # reduce the available height

    def addReadMeFile(self):
        """ Add a simple text file into the zip to explain what's there """
        readMePath = os.path.join(self.zip_folder_name, "README.txt")
        f = open(readMePath, 'w')
        try:
            f.write(README_TXT)
        finally:
            f.close()

    def addInfoPage(self, panels_json):
        """ Generates a PDF info page with figure title, links to images etc """
        scriptParams = self.scriptParams
        figureName = self.figureName
        base_url = None
        if 'Webclient_URI' in scriptParams:
            base_url = scriptParams['Webclient_URI']
        pageHeight = self.pageHeight
        availHeight = pageHeight-2*inch
        print 'availHeight', availHeight

        # Need to sort panels from top (left) -> bottom of Figure
        panels_json.sort(key=lambda x: int(x['y']) + x['y'] * 0.01)

        imgIds = set()
        styles = getSampleStyleSheet()
        styleN = styles['Normal']
        styleH = styles['Heading1']
        styleH3 = styles['Heading3']

        scalebars = []
        maxH = pageHeight - inch

        # Start adding at the top, update pageY as we add paragraphs
        pageY = maxH
        pageY = self.addParaWithThumb(figureName, pageY, style=styleH)

        if "Figure_URI" in scriptParams:
            fileUrl = scriptParams["Figure_URI"]
            print "Figure URL", fileUrl
            figureLink = "Link to Figure: <a href='%s' color='blue'>%s</a>" % (fileUrl, fileUrl)
            pageY = self.addParaWithThumb(figureLink, pageY, style=styleN)

        # Add Figure Legend
        if 'legend' in self.figure_json and len(self.figure_json['legend']) > 0:
            pageY = self.addParaWithThumb("Legend:", pageY, style=styleH3)
            print "\n--- Adding Figure Legend ---"
            legend = self.figure_json['legend']
            if markdownImported:
                # convert markdown to html
                legend = markdown.markdown(legend)
                # insert 'blue' style into any links
                legend = legend.replace("<a href", "<a color='blue' href")
                # Add paragraphs separately
                paraLines = legend.split("<p>")
                for p in paraLines:
                    p = "<p>" + p
                    pageY = self.addParaWithThumb(p, pageY, style=styleN)
            else:
                print "Markdown not imported. See https://pythonhosted.org/Markdown/install.html"
                pageY = self.addParaWithThumb(legend, pageY, style=styleN)

        pageY = self.addParaWithThumb("Figure contains the following images:", pageY, style=styleH3)

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
            if iid in imgIds:
                continue    # ignore images we've already handled
            imgIds.add(iid)
            thumbSrc = self.getThumbnail(iid)
            # thumb = "<img src='%s' width='%s' height='%s' " \
            #         "valign='middle' />" % (thumbSrc, thumbSize, thumbSize)
            lines = []
            lines.append(p['name'])
            img_url = "%s?show=image-%s" % (base_url, iid)
            lines.append("<a href='%s' color='blue'>%s</a>" % (img_url, img_url))
            # addPara([" ".join(line)])
            line = " ".join(lines)
            pageY = self.addParaWithThumb(line, pageY, style=styleN, thumbSrc=thumbSrc)

        if len(scalebars) > 0:
            scalebars = list(set(scalebars))
            pageY = self.addParaWithThumb("Scalebars:", pageY, style=styleH3)
            pageY = self.addParaWithThumb("Scalebar Lengths: %s" % ", ".join(scalebars),
                                          pageY, style=styleN)

    def panel_is_on_page(self, panel, page):
        """ Return true if panel overlaps with this page """
        px = panel['x']
        px2 = px + panel['width']
        py = panel['y']
        py2 = py + panel['height']
        cx = page['x']
        cx2 = cx + self.pageWidth
        cy = page['y']
        cy2 = cy + self.pageHeight
        #overlap needs overlap on x-axis...
        return px < cx2 and cx < px2 and py < cy2 and cy < py2

    def add_panels_to_page(self, panels_json, imageIds, page):
        """ Add panels that are within the bounds of this page """
        for i, panel in enumerate(panels_json):

            if not self.panel_is_on_page(panel, page):
                print 'Panel', panel['imageId'], 'not on page...'
                continue

            print "\n-------------------------------- "
            imageId = panel['imageId']
            print "Adding PANEL - Image ID:", imageId
            image = self.drawPanel(panel, page, i)
            if image.canAnnotate():
                imageIds.add(imageId)
            self.drawLabels(panel, page)
            print ""

    def getFigureFileExt(self):
        return "pdf"

    def createFigure(self):
        """
        Creates a PDF figure. This is overwritten by ExportTiff subclass.
        """
        if not reportlabInstalled:
            raise ImportError("Need to install https://bitbucket.org/rptlab/reportlab")
        name = self.getFigureFileName()
        self.figureCanvas = canvas.Canvas(name, pagesize=(self.pageWidth, self.pageHeight))

    def savePage(self):
        """ Called on completion of each page. Saves page of PDF """
        self.figureCanvas.showPage()

    def saveFigure(self):
        """ Completes PDF figure (or info-page PDF for TIFF export) """
        self.figureCanvas.save()

    def drawText(self, text, x, y, fontsize, rgb, align="center"):
        """ Adds text to PDF. Overwritten for TIFF below """
        ly = y + fontsize
        ly = self.pageHeight - ly + 5
        c = self.figureCanvas

        red, green, blue = rgb
        red = float(red)/255
        green = float(green)/255
        blue = float(blue)/255
        c.setFont("Helvetica", fontsize)
        c.setFillColorRGB(red, green, blue)
        if (align == "center"):
            c.drawCentredString(x, ly, text)
        elif (align == "right"):
            c.drawRightString(x, ly, text)
        elif (align == "left"):
            c.drawString(x, ly, text)
        elif align == 'vertical':
            c.rotate(90)
            c.drawCentredString(self.pageHeight - y, -(x + fontsize), text)
            c.rotate(-90)

    def drawLine(self, x, y, x2, y2, width, rgb):
        """ Adds line to PDF. Overwritten for TIFF below """
        red, green, blue = rgb
        red = float(red)/255
        green = float(green)/255
        blue = float(blue)/255

        y = self.pageHeight - y
        y2 = self.pageHeight - y2
        c = self.figureCanvas
        c.setLineWidth(width)
        c.setStrokeColorRGB(red, green, blue)
        c.line(x, y, x2, y2,)

    def pasteImage(self, pilImg, imgName, x, y, width, height, dpi):
        """ Adds the PIL image to the PDF figure. Overwritten for TIFFs """

        if dpi is not None:
            print "Resample panel to %s dpi..." % dpi
            # E.g. target is 300 dpi and width & height is '72 dpi'
            # so we need image to be width * dpi/72 pixels
            target_w = (width * dpi) / 72
            curr_w, curr_h = pilImg.size
            dpi_scale = float(target_w) / curr_w
            target_h = dpi_scale * curr_h
            target_w = int(round(target_w))
            target_h = int(round(target_h))
            print "    curr_w, curr_h", curr_w, curr_h
            if target_w > curr_w:
                if self.exportImages:
                    # Save image BEFORE resampling
                    rsName = os.path.join(self.zip_folder_name, RESAMPLED_DIR, imgName)
                    print "Saving pre_resampled to: ", rsName
                    pilImg.save(rsName)
                print "    Resample to target_w, target_h", target_w, target_h
                pilImg = pilImg.resize((target_w, target_h), Image.BICUBIC)
            else:
                print "    Already over %s dpi" % dpi

        # in the folder to zip
        if self.zip_folder_name is not None:
            imgName = os.path.join(self.zip_folder_name, FINAL_DIR, imgName)

        # Save Image to file, then bring into PDF
        pilImg.save(imgName)
        # Since coordinate system is 'bottom-up', convert from 'top-down'
        y = self.pageHeight - height - y
        self.figureCanvas.drawImage(imgName, x, y, width, height)


class TiffExport(FigureExport):
    """
    Subclass to handle export of Figure as TIFFs, 1 per page.
    We only need to overwrite methods that actually put content on
    the TIFF instead of PDF.
    """

    def __init__(self, conn, scriptParams, exportImages=None):

        super(TiffExport, self).__init__(conn, scriptParams, exportImages)

        from omero.gateway import THISPATH
        self.GATEWAYPATH = THISPATH
        self.fontPath = os.path.join(THISPATH, "pilfonts", "FreeSans.ttf")

        self.ns = "omero.web.figure.tiff"
        self.mimetype = "image/tiff"

    def getFont(self, fontsize):
        """ Try to load font from known location in OMERO """
        try:
            font = ImageFont.truetype(self.fontPath, fontsize)
        except:
            font = ImageFont.load('%s/pilfonts/B%0.2d.pil' % (self.GATEWAYPATH, 24))
        return font

    def scaleCoords(self, coord):
        """
        Origianl figure coordinates assume 72 dpi figure, but we want to
        export at 300 dpi, so everything needs scaling accordingly
        """
        return (coord * 300)/72

    def getFigureFileExt(self):
        return "tiff"

    def createFigure(self):
        """
        Creates a new PIL image ready to receive panels, labels etc.
        This is created for each page in the figure.
        """
        tiffWidth = self.scaleCoords(self.pageWidth)
        tiffHeight = self.scaleCoords(self.pageHeight)
        print "TIFF: width, height", tiffWidth, tiffHeight
        self.tiffFigure = Image.new("RGBA", (tiffWidth, tiffHeight), (255, 255, 255))

    def pasteImage(self, pilImg, imgName, x, y, width, height, dpi=None):
        """ Add the PIL image to the current figure page """

        print "pasteImage: x, y, width, height", x, y, width, height
        x = self.scaleCoords(x)
        y = self.scaleCoords(y)
        width = self.scaleCoords(width)
        height = self.scaleCoords(height)
        print "scaleCoords: x, y, width, height", x, y, width, height

        x = int(round(x))
        y = int(round(y))
        width = int(round(width))
        height = int(round(height))

        # Save image BEFORE resampling
        if self.exportImages:
            rsName = os.path.join(self.zip_folder_name, RESAMPLED_DIR, imgName)
            print "Saving pre_resampled to: ", rsName
            pilImg.save(rsName)

        print "resize to: x, y, width, height", x, y, width, height
        pilImg = pilImg.resize((width, height), Image.BICUBIC)

        if self.exportImages:
            imgName = os.path.join(self.zip_folder_name, FINAL_DIR, imgName)
            pilImg.save(imgName)

        width, height = pilImg.size
        box = (x, y, x + width, y + height)
        self.tiffFigure.paste(pilImg, box)

    def drawLine(self, x, y, x2, y2, width, rgb):
        """ Draw line on the current figure page """
        draw = ImageDraw.Draw(self.tiffFigure)

        x = self.scaleCoords(x)
        y = self.scaleCoords(y)
        x2 = self.scaleCoords(x2)
        y2 = self.scaleCoords(y2)
        width = self.scaleCoords(width)

        print "drawLine - TIFF...", x, y, x2, y2

        for l in range(width):
            draw.line([(x, y), (x2, y2)], fill=rgb)
            y += 1
            y2 += 1

    def drawText(self, text, x, y, fontsize, rgb, align="center"):
        """ Add text to the current figure page """
        x = self.scaleCoords(x)
        fontsize = self.scaleCoords(fontsize)

        font = self.getFont(fontsize)
        txt_w, txt_h = font.getsize(text)

        if align == "vertical":
            # write text on temp image (transparent)
            y = self.scaleCoords(y)
            x = int(round(x))
            y = int(round(y))
            tempLabel = Image.new('RGBA', (txt_w, txt_h), (255, 255, 255, 0))
            textdraw = ImageDraw.Draw(tempLabel)
            textdraw.text((0, 0), text, font=font, fill=rgb)
            w = tempLabel.rotate(90)
            # Use label as mask, so transparent part is not pasted
            y = y - (w.size[1]/2)
            self.tiffFigure.paste(w, (x, y), mask=w)
        else:
            y = y - 5       # seems to help, but would be nice to fix this!
            y = self.scaleCoords(y)
            textdraw = ImageDraw.Draw(self.tiffFigure)
            if align == "center":
                x = x - (txt_w / 2)
            elif align == "right":
                x = x - txt_w
            textdraw.text((x, y), text, font=font, fill=rgb)

    def savePage(self):
        """
        Save the current PIL image page as a TIFF and start a new
        PIL image for the next page
        """
        self.figureFileName = self.getFigureFileName()

        self.tiffFigure.save(self.figureFileName)

        # Create a new blank tiffFigure for subsequent pages
        self.createFigure()

    def addInfoPage(self, panels_json):
        """
        Since we need a PDF for the info page, we create one first,
        then call superclass addInfoPage
        """
        # We allow TIFF figure export without reportlab (no Info page)
        if not reportlabInstalled:
            return

        fullName = "info_page.pdf"
        if self.zip_folder_name is not None:
            fullName = os.path.join(self.zip_folder_name, fullName)
        self.figureCanvas = canvas.Canvas(fullName, pagesize=(self.pageWidth, self.pageHeight))

        # Superclass method will call addParaWithThumb(),
        # to add lines to self.infoLines
        super(TiffExport, self).addInfoPage(panels_json)

    def saveFigure(self):
        """ Completes PDF figure (or info-page PDF for TIFF export) """
        # We allow TIFF figure export without reportlab (no Info page)
        if not reportlabInstalled:
            return
        self.figureCanvas.save()


def export_figure(conn, scriptParams):

    # make sure we can find all images
    conn.SERVICE_OPTS.setOmeroGroup(-1)

    exportOption = scriptParams['Export_Option']
    print 'exportOption', exportOption

    if exportOption == 'PDF':
        figExport = FigureExport(conn, scriptParams)
    elif exportOption == 'PDF_IMAGES':
        figExport = FigureExport(conn, scriptParams, exportImages=True)
    elif exportOption == 'TIFF':
        figExport = TiffExport(conn, scriptParams)
    elif exportOption == 'TIFF_IMAGES':
        figExport = TiffExport(conn, scriptParams, exportImages=True)

    return figExport.buildFigure()


def runScript():
    """
    The main entry point of the script, as called by the client
    via the scripting service, passing the required parameters.
    """

    exportOptions = [rstring('PDF'), rstring('PDF_IMAGES'),
                     rstring('TIFF'), rstring('TIFF_IMAGES')]

    client = scripts.client(
        'Figure_To_Pdf.py',
        """Used by web.figure to generate pdf figures from json data""",

        scripts.String("Figure_JSON", optional=False,
                       description="All figure info as json stringified"),

        scripts.String("Export_Option", values=exportOptions,
                       default="PDF"),

        scripts.String("Webclient_URI", grouping="4",
                       description="webclient URL for adding links to images"),

        scripts.String("Figure_Name", grouping="4",
                       description="Name of the Pdf Figure"),

        scripts.String("Figure_URI", description="URL to the Figure")
    )

    try:
        scriptParams = {}

        conn = BlitzGateway(client_obj=client)

        # process the list of args above.
        for key in client.getInputKeys():
            if client.getInput(key):
                scriptParams[key] = client.getInput(key, unwrap=True)
        print scriptParams

        # call the main script - returns a file annotation wrapper
        fileAnnotation = export_figure(conn, scriptParams)

        # return this fileAnnotation to the client.
        client.setOutput("Message", rstring("Pdf Figure created"))
        if fileAnnotation is not None:
            client.setOutput(
                "File_Annotation",
                robject(fileAnnotation._obj))

    finally:
        client.closeSession()

if __name__ == "__main__":
    runScript()
