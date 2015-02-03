
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
from os import path

from omero.model import ImageAnnotationLinkI, ImageI
import omero.scripts as scripts

from cStringIO import StringIO
try:
    from PIL import Image  # see ticket:2597
except ImportError:
    import Image

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
# conn = BlitzGateway('will', 'ome')
# conn.connect()


def applyRdefs(image, channels):

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


def get_panel_size(panel):

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

    # img_x = 0
    # img_y = 0
    # img_w = frame_w * (zoom/100)
    # img_h = frame_h * (zoom/100)

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
    # print 'dx', dx, 'dy', dy
    # print 'orig_w - tile_w', orig_w - tile_w

    # tile_x = (orig_w - tile_w)/2 - (dx / (zoom/100))
    # tile_y = (orig_h - tile_h)/2 - (dy / (zoom/100))

    return {'width': tile_w, 'height': tile_h}


def get_time_label_text(deltaT, format):

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


def drawLabels(conn, c, panel, page):

    labels = panel['labels']
    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']

    # Handle page offsets
    pageHeight = page['height']
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
                text = get_time_label_text(dT, l['time'])
                print 'text', text
                l['text'] = text
            else:
                continue

        print l
        pos = l['position']
        l['size'] = int(l['size'])   # make sure 'size' is number
        if pos in positions:
            positions[pos].append(l)

    def drawLab(c, label, lx, ly, align='left'):
        label_h = label['size']
        c.setFont("Helvetica", label_h)
        color = label['color']
        red = int(color[0:2], 16)
        green = int(color[2:4], 16)
        blue = int(color[4:6], 16)
        c.setFillColorRGB(red, green, blue)
        if align == 'left':
            c.drawString(lx, pageHeight - label_h - ly, label['text'])
        elif align == 'right':
            c.drawRightString(lx, pageHeight - label_h - ly, label['text'])
        elif align == 'center':
            c.drawCentredString(lx, pageHeight - label_h - ly, label['text'])
        elif align == 'vertical':
            c.rotate(90)
            c.drawCentredString(pageHeight - ly, -(lx + label_h),
                                label['text'])
            c.rotate(-90)

        return label_h

    # Render each position:
    for key, labels in positions.items():
        if key == 'topleft':
            lx = x + spacer
            ly = y + spacer
            for l in labels:
                label_h = drawLab(c, l, lx, ly)
                ly += label_h + spacer
        elif key == 'topright':
            lx = x + width - spacer
            ly = y + spacer
            for l in labels:
                label_h = drawLab(c, l, lx, ly, align='right')
                ly += label_h + spacer
        elif key == 'bottomleft':
            lx = x + spacer
            ly = y + height
            labels.reverse()  # last item goes bottom
            for l in labels:
                ly = ly - l['size'] - spacer
                drawLab(c, l, lx, ly)
        elif key == 'bottomright':
            lx = x + width - spacer
            ly = y + height
            labels.reverse()  # last item goes bottom
            for l in labels:
                ly = ly - l['size'] - spacer
                drawLab(c, l, lx, ly, align='right')
        elif key == 'top':
            lx = x + (width/2)
            ly = y
            labels.reverse()
            for l in labels:
                ly = ly - l['size'] - spacer
                drawLab(c, l, lx, ly, align='center')
        elif key == 'bottom':
            lx = x + (width/2)
            ly = y + height + spacer
            for l in labels:
                label_h = drawLab(c, l, lx, ly, align='center')
                ly += label_h + spacer
        elif key == 'left':
            lx = x - spacer
            sizes = [l['size'] for l in labels]
            total_h = sum(sizes) + spacer * (len(labels)-1)
            ly = y + (height-total_h)/2
            for l in labels:
                label_h = drawLab(c, l, lx, ly, align='right')
                ly += label_h + spacer
        elif key == 'right':
            lx = x + width + spacer
            sizes = [l['size'] for l in labels]
            total_h = sum(sizes) + spacer * (len(labels)-1)
            ly = y + (height-total_h)/2
            for l in labels:
                label_h = drawLab(c, l, lx, ly)
                ly += label_h + spacer
        elif key == 'leftvert':
            lx = x - spacer
            ly = y + (height/2)
            labels.reverse()
            for l in labels:
                lx = lx - l['size'] - spacer
                drawLab(c, l, lx, ly, align='vertical')


def drawScalebar(c, panel, region_width, page):

    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']

    # Handle page offsets
    pageHeight = page['height']
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

    c.setLineWidth(2)
    color = sb['color']
    red = int(color[0:2], 16)
    green = int(color[2:4], 16)
    blue = int(color[4:6], 16)
    c.setStrokeColorRGB(red, green, blue)


    position = 'position' in sb and sb['position'] or 'bottomright'
    print 'scalebar.position', position
    align='left'

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
    ly = pageHeight - ly
    if align == 'left':
        lx_end = lx + canvas_length
    else:
        lx_end = lx - canvas_length
    c.line(lx, ly, lx_end, ly)

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
        c.setFont("Helvetica", font_size)
        label_y = ly - font_size
        if 'bottom' in position:
            label_y = ly + 5
        c.setFillColorRGB(red, green, blue)
        c.drawCentredString((lx + lx_end)/2, label_y, label)

def getPanelImage(image, panel):

    z = panel['theZ']
    t = panel['theT']

    if 'z_projection' in panel and panel['z_projection']:
        if 'z_start' in panel and 'z_end' in panel:
            print "Z_projection:", panel['z_start'], panel['z_end']
            image.setProjection('intmax')
            image.setProjectionRange(panel['z_start'], panel['z_end'])

    pilImg = image.renderImage(z, t, compression=1.0)

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
    pilImg = pilImg.crop((crop_left, crop_top, crop_right, crop_bottom))

    # Optional rotation
    if ('rotation' in panel and panel['rotation'] > 0):
        rotation = -int(panel['rotation'])
        pilImg = pilImg.rotate(rotation, Image.BICUBIC)

    # Final crop to size
    panel_size = get_panel_size(panel)

    w, h = pilImg.size
    tile_w = panel_size['width']
    tile_h = panel_size['height']
    crop_left = int((w - tile_w) / 2)
    crop_top = int((h - tile_h) / 2)
    crop_right = w - crop_left
    crop_bottom = h - crop_top

    pilImg = pilImg.crop((crop_left, crop_top, crop_right, crop_bottom))

    return pilImg


def drawPanel(conn, c, panel, page, idx):

    imageId = panel['imageId']
    channels = panel['channels']
    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']

    # Handle page offsets
    pageHeight = page['height']
    x = x - page['x']
    y = y - page['y']

    # Since coordinate system is 'bottom-up', convert from 'top-down'
    y = pageHeight - height - y

    image = conn.getObject("Image", imageId)
    applyRdefs(image, channels)

    pilImg = getPanelImage(image, panel)
    tile_width = pilImg.size[0]

    tempName = str(idx) + ".jpg"
    pilImg.save(tempName)

    c.drawImage(tempName, x, y, width, height)

    drawScalebar(c, panel, tile_width, page)

    return image


def getThumbnail(conn, imageId):
    """ Saves thumb as local jpg and returns name """

    image = conn.getObject("Image", imageId)
    thumbData = image.getThumbnail(size=(96, 96))
    i = StringIO(thumbData)
    pilImg = Image.open(i)
    tempName = str(imageId) + "thumb.jpg"
    pilImg.save(tempName)
    return tempName


def addInfoPage(conn, scriptParams, c, panels_json, figureName):

    base_url = None
    if 'Webclient_URI' in scriptParams:
        base_url = scriptParams['Webclient_URI']
    pageWidth = scriptParams['Page_Width']
    pageHeight = scriptParams['Page_Height']
    availHeight = pageHeight-2*inch
    print 'availHeight', availHeight

    # Need to sort panels from top (left) -> bottom of Figure
    panels_json.sort(key=lambda x: int(x['y']) + x['y'] * 0.01)

    imgIds = set()
    styles = getSampleStyleSheet()
    styleN = styles['Normal']
    styleH = styles['Heading1']
    styleH2 = styles['Heading2']


    scalebars = []
    thumbSize = 25
    spacer = 10
    aW = pageWidth - (inch * 2)
    maxH = pageHeight - inch
    imgw = imgh = thumbSize

    # Start adding at the top, update pageY as we add paragraphs
    pageY = maxH

    def addParaWithThumb(text, pageY, style=styleN, thumbSrc=None):
        """ Adds paragraph text to point on page """

        para=Paragraph(text, style)
        w,h = para.wrap(aW, pageY) # find required space
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
        return pageY - parah - spacer # reduce the available height


    pageY = addParaWithThumb(figureName, pageY, style=styleH)

    if "Figure_URI" in scriptParams:
        fileUrl = scriptParams["Figure_URI"]
        print "Figure URL", fileUrl
        figureLink = "Link to Figure: <a href='%s' color='blue'>%s</a>" % (fileUrl, fileUrl)
        pageY = addParaWithThumb(figureLink, pageY)

    pageY = addParaWithThumb("Figure contains the following images:", pageY, style=styleH2)


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
        thumbSrc = getThumbnail(conn, iid)
        # thumb = "<img src='%s' width='%s' height='%s' " \
        #         "valign='middle' />" % (thumbSrc, thumbSize, thumbSize)
        lines = []
        lines.append(p['name'])
        img_url = "%s?show=image-%s" % (base_url, iid)
        lines.append("<a href='%s' color='blue'>%s</a>" % (img_url, img_url))
        # addPara([" ".join(line)])
        line = " ".join(lines)
        pageY = addParaWithThumb(line, pageY, thumbSrc=thumbSrc)

    if len(scalebars) > 0:
        scalebars = list(set(scalebars))
        pageY = addParaWithThumb("Scalebars", pageY, style=styleH2)
        pageY = addParaWithThumb("Scalebars: %s" % ", ".join(scalebars), pageY)


def panel_is_on_page(panel, page):
    """ Return true if panel overlaps with this page """

    px = panel['x']
    px2 = px + panel['width']
    py = panel['y']
    py2 = py + panel['height']
    cx = page['x']
    cx2 = cx + page['width']
    cy = page['y']
    cy2 = cy + page['height']
    #overlap needs overlap on x-axis...
    return px < cx2 and cx < px2 and py < cy2 and cy < py2


def add_panels_to_page(conn, c, panels_json, imageIds, page):
    """ Add panels that are within the bounds of this page """

    for i, panel in enumerate(panels_json):

        if not panel_is_on_page(panel, page):
            print 'Panel', panel['imageId'], 'not on page...'
            continue

        print "\n-------------------------------- "
        imageId = panel['imageId']
        print "Adding PANEL - Image ID:", imageId
        image = drawPanel(conn, c, panel, page, i)
        if image.canAnnotate():
            imageIds.add(imageId)
        drawLabels(conn, c, panel, page)
        print ""


def create_pdf(conn, scriptParams):

    # make sure we can find all images
    conn.SERVICE_OPTS.setOmeroGroup(-1)

    figure_json_string = scriptParams['Figure_JSON']
    # Since unicode can't be wrapped by rstring
    figure_json_string = figure_json_string.decode('utf8')
    figure_json = json.loads(figure_json_string)

    n = datetime.now()
    # time-stamp name by default: Figure_2013-10-29_22-43-53.pdf
    figureName = "Figure_%s-%s-%s_%s-%s-%s." \
        "pdf" % (n.year, n.month, n.day, n.hour, n.minute, n.second)
    if 'figureName' in figure_json:
        figureName = figure_json['figureName']


    # get Figure width & height...
    pageWidth = figure_json['paper_width']
    pageHeight = figure_json['paper_height']
    # add to scriptParams for convenience
    scriptParams['Page_Width'] = pageWidth
    scriptParams['Page_Height'] = pageHeight

    pdfName = unicodedata.normalize('NFKD', figureName).encode('ascii','ignore')
    if not pdfName.endswith('.pdf'):
        pdfName = "%s.pdf" % pdfName

    # in case we have path/to/pdfName.pdf, just use pdfName.pdf
    pdfName = path.basename(pdfName)

    c = canvas.Canvas(pdfName, pagesize=(pageWidth, pageHeight))

    panels_json = figure_json['panels']
    imageIds = set()

    groupId = None
    # We get our group from the first image
    id1 = panels_json[0]['imageId']
    conn.getObject("Image", id1).getDetails().group.id.val

    # test to see if we've got multiple pages
    page_count = 'page_count' in figure_json and figure_json['page_count'] or 1
    page_count = int(page_count)
    paper_spacing = 'paper_spacing' in figure_json and figure_json['paper_spacing'] or 50
    page_col_count = 'page_col_count' in figure_json and figure_json['page_col_count'] or 1

    # For each page, add panels...
    col = 0
    row = 0
    for p in range(page_count):
        print "\n------------------------- PAGE ", p + 1, "--------------------------"
        px = col * (pageWidth + paper_spacing)
        py = row * (pageHeight + paper_spacing)
        page = {'x': px, 'y': py, 'width': pageWidth, 'height': pageHeight}
        add_panels_to_page(conn, c, panels_json, imageIds, page)

        # complete page and save
        c.showPage()
        col = col + 1
        if col >= page_col_count:
            col = 0
            row = row + 1

    # Add thumbnails and links page
    addInfoPage(conn, scriptParams, c, panels_json, figureName)

    c.save()


    # PDF will get created in this group
    if groupId is None:
        groupId = conn.getEventContext().groupId
    conn.SERVICE_OPTS.setOmeroGroup(groupId)

    ns = "omero.web.figure.pdf"
    fileAnn = conn.createFileAnnfromLocalFile(
        pdfName,
        mimetype="application/pdf",
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
            links = conn.getUpdateService().saveAndReturnArray(
                links, conn.SERVICE_OPTS)
        except:
            print "Failed to attach figure: %s to images %s" % (fileAnn, imageIds)

    return fileAnn


def runScript():
    """
    The main entry point of the script, as called by the client
    via the scripting service, passing the required parameters.
    """

    client = scripts.client(
        'Figure_To_Pdf.py',
        """Used by web.figure to generate pdf figures from json data""",

        scripts.String("Figure_JSON", optional=False,
                       description="All figure info as json stringified"),

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

        if not reportlabInstalled:
            client.setOutput(
                "Message",
                rstring("Install https://bitbucket.org/rptlab/reportlab"))
        else:
            # call the main script - returns a file annotation wrapper
            fileAnnotation = create_pdf(conn, scriptParams)

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
