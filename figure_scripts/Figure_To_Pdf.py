

import json

from datetime import datetime

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
    from reportlab.platypus import Paragraph, Frame
    # from reportlab.lib.pagesizes import letter, A4
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

    for i, c in enumerate(channels):
        if c['active']:
            cIdxs.append(i+1)
            windows.append([c['window']['start'], c['window']['end']])
            colors.append(c['color'])

    print "setActiveChannels", cIdxs, windows, colors
    image.setActiveChannels(cIdxs, windows, colors)


def get_panel_region_xywh(panel):

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

    print "ratios", wh, orig_ratio

    if abs(orig_ratio - wh) > 0.01:
        # if viewport is wider than orig...
        if (orig_ratio < wh):
            print "viewport wider"
            # tile_w = orig_ratio
            tile_h = tile_w / wh
        else:
            print "viewport longer"
            tile_w = tile_h * wh

    print 'tile_w', tile_w, 'tile_h', tile_h

    print 'dx', dx, 'dy', dy

    print 'orig_w - tile_w', orig_w - tile_w

    tile_x = (orig_w - tile_w)/2 - (dx / (zoom/100))
    tile_y = (orig_h - tile_h)/2 - (dy / (zoom/100))

    return {'x': tile_x, 'y': tile_y, 'width': tile_w, 'height': tile_h}


def get_time_label_text(deltaT, format):

    if format == "secs":
        text = "%s secs" % deltaT
    elif format == "mins":
        text = "%s mins" % round(deltaT / 60)
    elif format == "hrs:mins":
        h = (deltaT / 3600)
        m = round((float(deltaT) % 3600) / 60)
        text = "%s:%02d" % (h, m)
    elif format == "hrs:mins:secs":
        h = (deltaT / 3600)
        m = (deltaT % 3600) / 60
        s = deltaT % 60
        text = "%s:%02d:%02d" % (h, m, s)
    return text


def drawLabels(conn, c, panel, pageHeight):

    labels = panel['labels']
    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']

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
            c.drawCentredString(pageHeight - ly, -(lx + label_h), label['text'])
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
            total_h = sum([l['size'] for l in labels]) + spacer * (len(labels)-1)
            ly = y + (height-total_h)/2
            for l in labels:
                label_h = drawLab(c, l, lx, ly, align='right')
                ly += label_h + spacer
        elif key == 'right':
            lx = x + width + spacer
            total_h = sum([l['size'] for l in labels]) + spacer * (len(labels)-1)
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


def drawScalebar(c, panel, region_width, pageHeight):

    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']
    if not ('scalebar' in panel and 'show' in panel['scalebar']
            and panel['scalebar']['show']):
        return

    if not ('pixel_size' in panel and panel['pixel_size'] > 0):
        print "Can't show scalebar - pixel_size is not defined for panel"

    sb = panel['scalebar']

    spacer = 0.05 * max(height, width)

    c.setLineWidth(2)
    color = sb['color']
    red = int(color[0:2], 16)
    green = int(color[2:4], 16)
    blue = int(color[4:6], 16)
    c.setStrokeColorRGB(red, green, blue)

    def draw_sb(sb_x, sb_y, align='left'):

        print "Adding Scalebar of %s microns. Pixel size is %s microns" % (sb['length'], panel['pixel_size'])
        pixels_length = sb['length'] / panel['pixel_size']
        scale_to_canvas = panel['width'] / region_width
        canvas_length = pixels_length * scale_to_canvas
        print 'Scalebar length (panel pixels):', pixels_length
        print 'Scale by %s to page coordinate length: %s' % (scale_to_canvas, canvas_length)
        sb_y = pageHeight - sb_y
        if align == 'left':
            c.line(sb_x, sb_y, sb_x + canvas_length, sb_y)
        else:
            c.line(sb_x, sb_y, sb_x - canvas_length, sb_y)

    position = sb['position']
    print 'position', position

    if position == 'topleft':
        lx = x + spacer
        ly = y + spacer
        draw_sb(lx, ly)
    elif position == 'topright':
        lx = x + width - spacer
        ly = y + spacer
        draw_sb(lx, ly, align="right")
    elif position == 'bottomleft':
        lx = x + spacer
        ly = y + height - spacer
        draw_sb(lx, ly)
    elif position == 'bottomright':
        lx = x + width - spacer
        ly = y + height - spacer
        draw_sb(lx, ly, align="right")


def drawPanel(conn, c, panel, pageHeight, idx):

    imageId = panel['imageId']
    channels = panel['channels']
    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']

    # Since coordinate system is 'bottom-up', convert from 'top-down'
    y = pageHeight - height - y

    image = conn.getObject("Image", imageId)
    applyRdefs(image, channels)

    tile = get_panel_region_xywh(panel)

    print "TILE", tile

    z = panel['theZ']     # image._re.getDefaultZ()
    t = panel['theT']     # image._re.getDefaultT()

    # pilImg = image.renderImage(z, t)
    imgData = image.renderJpegRegion(z, t, tile['x'], tile['y'], tile['width'], tile['height'], compression=1.0)
    i = StringIO(imgData)
    pilImg = Image.open(i)
    tempName = str(idx) + ".jpg"
    pilImg.save(tempName)

    c.drawImage(tempName, x, y, width, height)

    drawScalebar(c, panel, tile['width'], pageHeight)


def getThumbnail(conn, imageId):
    """ Saves thumb as local jpg and returns name """

    image = conn.getObject("Image", imageId)
    thumbData = image.getThumbnail(size=(96, 96))
    i = StringIO(thumbData)
    pilImg = Image.open(i)
    tempName = str(imageId) + "thumb.jpg"
    pilImg.save(tempName)
    return tempName


def addInfoPage(conn, scriptParams, c, panels_json):

    base_url = None
    if 'Webclient_URI' in scriptParams:
        base_url = scriptParams['Webclient_URI']
    pageWidth = scriptParams['Page_Width']
    pageHeight = scriptParams['Page_Height']

    # Need to sort panels from top (left) -> bottom of Figure
    panels_json.sort(key=lambda x: int(x['y']) + x['y'] * 0.01)

    imgIds = set()
    styles = getSampleStyleSheet()
    styleN = styles['Normal']
    styleH = styles['Heading1']
    story = []
    scalebars = []

    story.append(Paragraph("Figure Images", styleH))

    def addPara(lines):
        text = "<br />".join(lines)
        attrs = "spaceBefore='15' spaceAfter='15'"
        para = "<para %s>%s</para>" % (attrs, text)
        story.append(Paragraph(para, styleN))

    # Go through sorted panels, adding paragraph for each unique image
    for p in panels_json:
        iid = p['imageId']
        # list unique scalebar lengths
        if 'scalebar' in p and p['scalebar']['length'] not in scalebars:
            scalebars.append(p['scalebar']['length'])
        if iid in imgIds:
            continue    # ignore images we've already handled
        imgIds.add(iid)
        thumbSrc = getThumbnail(conn, iid)
        thumb = "<img src='%s' width='25' height='25' valign='middle' />" % thumbSrc
        line = [thumb]
        line.append(p['name'])
        img_url = "%s?show=image-%s" % (base_url, iid)
        line.append("<a href='%s' color='blue'>%s</a>" % (img_url, img_url))
        addPara([" ".join(line)])

    if len(scalebars) > 0:
        story.append(Paragraph("Scalebars", styleH))
        sbs = [str(s) for s in scalebars]
        addPara(["Scalebars: %s microns" % " microns, ".join(sbs)])

    f = Frame(inch, inch, pageWidth-2*inch, pageHeight-2*inch)
    f.addFromList(story, c)
    c.save()

    #c.showPage()


def create_pdf(conn, scriptParams):

    figure_json_string = scriptParams['Figure_JSON']
    figure_json = json.loads(figure_json_string)

    n = datetime.now()
    # time-stamp name by default: Figure_2013-10-29_22-43-53.pdf (tried : but they get replaced)
    figureName = "Figure_%s-%s-%s_%s-%s-%s.pdf" % (n.year, n.month, n.day, n.hour, n.minute, n.second)

    # get Figure width & height...
    pageWidth = figure_json['paper_width']
    pageHeight = figure_json['paper_height']
    # add to scriptParams for convenience
    scriptParams['Page_Width'] = pageWidth
    scriptParams['Page_Height'] = pageHeight

    if 'Figure_Name' in scriptParams:
        figureName = scriptParams['Figure_Name']
    if not figureName.endswith('.pdf'):
        figureName = "%s.pdf" % figureName

    c = canvas.Canvas(figureName, pagesize=(pageWidth, pageHeight))

    panels_json = figure_json['panels']
    imageIds = set()

    for i, panel in enumerate(panels_json):

        print "\n---------------- "
        imageId = panel['imageId']
        print "IMAGE", i, imageId
        imageIds.add(imageId)
        drawPanel(conn, c, panel, pageHeight, i)
        drawLabels(conn, c, panel, pageHeight)

    # complete page and save
    c.showPage()

    if True:
        addInfoPage(conn, scriptParams, c, panels_json)

    c.save()

    ns = "omero.web.figure.pdf"
    fileAnn = conn.createFileAnnfromLocalFile(
        figureName,
        mimetype="application/pdf",
        ns=ns,
        desc=figure_json_string)

    links = []
    for iid in list(imageIds):
        print "linking to", iid
        link = ImageAnnotationLinkI()
        link.parent = ImageI(iid, False)
        link.child = fileAnn._obj
        links.append(link)
    print len(links)
    if len(links) > 0:
        links = conn.getUpdateService().saveAndReturnArray(links, conn.SERVICE_OPTS)

    return fileAnn


def runScript():
    """
    The main entry point of the script, as called by the client via the scripting service, passing the required parameters.
    """

    client = scripts.client(
        'Figure_To_Pdf.py', """Used by web.figure to generate pdf figures from json data""",

        scripts.String("Figure_JSON", optional=False,
                       description="All figure info as json stringified"),

        scripts.String("Webclient_URI", grouping="4",
                       description="Base URL for adding links to images in webclient"),

        scripts.String("Figure_Name", grouping="4", description="Name of the Pdf Figure")
    )

    try:
        session = client.getSession()
        scriptParams = {}

        conn = BlitzGateway(client_obj=client)

        # process the list of args above.
        for key in client.getInputKeys():
            if client.getInput(key):
                scriptParams[key] = client.getInput(key, unwrap=True)
        print scriptParams

        if not reportlabInstalled:
            client.setOutput("Message", rstring("Need to install https://bitbucket.org/rptlab/reportlab"))
        else:
            # call the main script - returns a file annotation wrapper
            fileAnnotation = create_pdf(conn, scriptParams)

            # return this fileAnnotation to the client.
            client.setOutput("Message", rstring("Pdf Figure created"))
            if fileAnnotation is not None:
                client.setOutput("File_Annotation", robject(fileAnnotation._obj))

    finally:
        client.closeSession()

if __name__ == "__main__":
    runScript()
