
#json_data = '[{"imageId":851,"name":"/Users/will/Documents/biology-data/JCB-data-viewer/Posch-Swedlow-Sds22-2010/Figure2/A/25066-Localization of Sds22-GFP through the cell cycle.ome.tiff","width":232,"height":232,"sizeZ":32,"sizeT":1,"channels":[{"color":"FF0000","active":false,"window":{"max":6033,"end":2190,"start":307,"min":6},"emissionWave":617,"label":"617"},{"color":"FF0000","active":true,"window":{"max":1158,"end":363,"start":59,"min":2},"emissionWave":685,"label":"685"},{"color":"00FF00","active":false,"window":{"max":14834,"end":3152,"start":741,"min":0},"emissionWave":528,"label":"528"},{"color":"0000FF","active":true,"window":{"max":4391,"end":3128,"start":219,"min":0},"emissionWave":457,"label":"457"}],"orig_width":384,"orig_height":384,"x":107.80392156862746,"y":178.19607843137254,"zoom":147,"dx":49.152,"dy":-72.19200000000001,"selected":true},{"imageId":852,"name":"/Users/will/Documents/biology-data/JCB-data-viewer/Posch-Swedlow-Sds22-2010/Figure2/A/25067-Localization of Sds22-GFP through the cell cycle.ome.tiff","width":181,"height":250,"sizeZ":32,"sizeT":1,"channels":[{"color":"FF0000","active":true,"window":{"max":5868,"end":1833,"start":293,"min":0},"emissionWave":617,"label":"617"},{"color":"FF0000","active":true,"window":{"max":851,"end":224,"start":44,"min":2},"emissionWave":685,"label":"685"},{"color":"00FF00","active":true,"window":{"max":12412,"end":1396,"start":620,"min":0},"emissionWave":528,"label":"528"},{"color":"0000FF","active":false,"window":{"max":5680,"end":4047,"start":284,"min":0},"emissionWave":457,"label":"457"}],"orig_width":480,"orig_height":480,"x":297,"y":279,"zoom":202,"dx":153.6,"dy":15.359999999999994,"selected":true},{"imageId":853,"name":"/Users/will/Documents/biology-data/JCB-data-viewer/Posch-Swedlow-Sds22-2010/Figure2/A/25068-Localization of Sds22-GFP through the cell cycle.ome.tiff","width":182,"height":182,"sizeZ":36,"sizeT":1,"channels":[{"color":"FF0000","active":true,"window":{"max":21799,"end":5722,"start":1089,"min":0},"emissionWave":617,"label":"617"},{"color":"00FF00","active":true,"window":{"max":445,"end":183,"start":22,"min":0},"emissionWave":528,"label":"528"},{"color":"0000FF","active":true,"window":{"max":1149,"end":588,"start":57,"min":0},"emissionWave":457,"label":"457"}],"orig_width":768,"orig_height":768,"x":365.52941176470586,"y":80.3921568627451,"zoom":100,"dx":0,"dy":0,"selected":true}]'

# json_data = '[{"imageId":851,"name":"/Users/will/Documents/biology-data/JCB-data-viewer/Posch-Swedlow-Sds22-2010/Figure2/A/25066-Localization of Sds22-GFP through the cell cycle.ome.tiff","width":232,"height":232,"sizeZ":32,"sizeT":1,"channels":[{"color":"FF0000","active":false,"window":{"max":6033,"end":2190,"start":307,"min":6},"emissionWave":617,"label":"617"},{"color":"FF0000","active":true,"window":{"max":1158,"end":363,"start":59,"min":2},"emissionWave":685,"label":"685"},{"color":"00FF00","active":false,"window":{"max":14834,"end":3152,"start":741,"min":0},"emissionWave":528,"label":"528"},{"color":"0000FF","active":true,"window":{"max":4391,"end":3128,"start":219,"min":0},"emissionWave":457,"label":"457"}],"orig_width":384,"orig_height":384,"x":107.80392156862746,"y":178.19607843137254,"zoom":203,"dx":198.14399999999998,"dy":198.144,"selected":true},{"imageId":852,"name":"/Users/will/Documents/biology-data/JCB-data-viewer/Posch-Swedlow-Sds22-2010/Figure2/A/25067-Localization of Sds22-GFP through the cell cycle.ome.tiff","width":181,"height":250,"sizeZ":32,"sizeT":1,"channels":[{"color":"FF0000","active":true,"window":{"max":5868,"end":1833,"start":293,"min":0},"emissionWave":617,"label":"617"},{"color":"FF0000","active":true,"window":{"max":851,"end":224,"start":44,"min":2},"emissionWave":685,"label":"685"},{"color":"00FF00","active":true,"window":{"max":12412,"end":1396,"start":620,"min":0},"emissionWave":528,"label":"528"},{"color":"0000FF","active":false,"window":{"max":5680,"end":4047,"start":284,"min":0},"emissionWave":457,"label":"457"}],"orig_width":480,"orig_height":480,"x":355.8235294117647,"y":275.078431372549,"zoom":200,"dx":31.611049723756963,"dy":15.359999999999875,"selected":true},{"imageId":853,"name":"/Users/will/Documents/biology-data/JCB-data-viewer/Posch-Swedlow-Sds22-2010/Figure2/A/25068-Localization of Sds22-GFP through the cell cycle.ome.tiff","width":182,"height":182,"sizeZ":36,"sizeT":1,"channels":[{"color":"FF0000","active":true,"window":{"max":21799,"end":5722,"start":1089,"min":0},"emissionWave":617,"label":"617"},{"color":"00FF00","active":true,"window":{"max":445,"end":183,"start":22,"min":0},"emissionWave":528,"label":"528"},{"color":"0000FF","active":true,"window":{"max":1149,"end":588,"start":57,"min":0},"emissionWave":457,"label":"457"}],"orig_width":768,"orig_height":768,"x":365.52941176470586,"y":80.3921568627451,"zoom":100,"dx":0,"dy":0,"selected":true}]'
import json

import omero.scripts as scripts

from cStringIO import StringIO
try:
    from PIL import Image # see ticket:2597
except ImportError:
    import Image

from reportlab.pdfgen import canvas
# from reportlab.lib.pagesizes import letter, A4


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
            windows.append( [c['window']['start'], c['window']['end']] )
            colors.append( c['color'] )

    print "setActiveChannels", cIdxs, windows, colors
    image.setActiveChannels(cIdxs, windows, colors)


def get_vp_img_css (panel):

    zoom = panel['zoom']
    frame_w = panel['width']
    frame_h = panel['height']
    dx = panel['dx']
    dy = panel['dy']
    orig_w = panel['orig_width']
    orig_h = panel['orig_height']

    # need tile_x, tile_y, tile_w, tile_h

    # img_x = 0
    # img_y = 0
    # img_w = frame_w * (zoom/100)
    # img_h = frame_h * (zoom/100)

    tile_w = orig_w / (zoom/100)
    tile_h = orig_h / (zoom/100)

    print " ---------------- "
    print "IMAGE", panel['imageId']

    print 'zoom', zoom
    print 'frame_w', frame_w, 'frame_h',frame_h, 'orig', orig_w, orig_h
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

    return {'x':tile_x, 'y':tile_y, 'width':tile_w, 'height':tile_h}


def drawLabels(conn, c, panel, pageHeight):

    labels = panel['labels']
    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']

    spacer = 5

    # group by 'position':
    positions = {'top':[], 'bottom':[], 'left':[], 'right':[],
        'topleft':[], 'topright':[], 'bottomleft':[], 'bottomright':[]}

    print "sorting labels..."
    for l in labels:
        print l
        pos = l['position']
        if pos in positions:
            positions[pos].append(l)

    def drawLab(c, label, lx, ly, align='left'):
        label_h = label['size']
        c.setFont("Helvetica", label_h)
        color = label['color']
        red = int(color[0:2],16)
        green = int(color[2:4],16)
        blue = int(color[4:6],16)
        c.setFillColorRGB(red, green, blue)
        if align == 'left':
            c.drawString(lx, pageHeight - label_h - ly, label['text'])
        elif align == 'right':
            c.drawRightString(lx, pageHeight - label_h - ly, label['text'])
        elif align == 'center':
            c.drawCentredString(lx, pageHeight - label_h - ly, label['text'])

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


def drawPanel(conn, c, panel, pageHeight, idx):

    imageId = panel['imageId']
    channels = panel['channels']
    x = panel['x']
    y = panel['y']
    width = panel['width']
    height = panel['height']

    # Since coordinate system is 'bottom-up', convert from 'top-down'
    y = pageHeight - height - y;

    image = conn.getObject("Image", imageId)
    applyRdefs(image, channels)

    tile = get_vp_img_css (panel)

    print "TILE", tile

    z = image._re.getDefaultZ()
    t = image._re.getDefaultT()

    # pilImg = image.renderImage(z, t)
    imgData = image.renderJpegRegion (z, t, tile['x'], tile['y'], tile['width'], tile['height'], compression=1.0)
    i = StringIO(imgData)
    pilImg = Image.open(i)
    tempName = str(idx) + ".jpg"
    pilImg.save(tempName)

    c.drawImage(tempName, x, y, width, height) 


def create_pdf(conn, scriptParams):

    pageWidth = scriptParams['Page_Width']
    pageHeight = scriptParams['Page_Height']
    figureName = scriptParams['Figure_Name']
    if not figureName.endswith('.pdf'):
        figureName = "%s.pdf" % figureName

    c = canvas.Canvas(figureName, pagesize=(pageWidth, pageHeight))

    panels_json_string = scriptParams['Panels_JSON']
    panels_json = json.loads(panels_json_string)

    for i, panel in enumerate(panels_json):

        drawPanel(conn, c, panel, pageHeight, i)
        drawLabels(conn, c, panel, pageHeight)

    # complete page and save
    c.showPage()
    c.save()

    ns = "omero.web.figure.pdf"
    fileAnn = conn.createFileAnnfromLocalFile (figureName, mimetype="application/pdf", ns=ns, desc=panels_json_string)
    return fileAnn


def runScript():
    """
    The main entry point of the script, as called by the client via the scripting service, passing the required parameters. 
    """

    client = scripts.client('Figure_To_Pdf.py', """Used by web.figure to generate pdf figures from json data""",

    scripts.Int("Page_Width", optional=False, grouping="1", default=612),

    scripts.Int("Page_Height", optional=False, grouping="2", default=792),

    scripts.String("Panels_JSON", optional=False, grouping="3", 
        description="All Panel Data as json stringified"),

    scripts.String("Figure_Name", optional=False, grouping="4", 
        description="Name of the Pdf Figure", default="WebFigure.pdf"),
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

