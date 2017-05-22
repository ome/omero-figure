
import omero
import omero.scripts as scripts
from omero.gateway import BlitzGateway
from omeroweb.webgateway.marshal import imageMarshal
import json
from cStringIO import StringIO
from omero.rtypes import wrap, rlong, rstring
from omero.gateway import OriginalFileWrapper
import math


JSON_FILEANN_NS = "omero.web.figure.json"


def create_figure_file(figure_json):

    figure_name = figure_json['figureName']
    if len(figure_json['panels']) == 0:
        raise Exception('No Panels')
    first_img_id = figure_json['panels'][0]['imageId']

    # we store json in description field...
    description = {}
    description['name'] = figure_name
    description['imageId'] = first_img_id

    # Try to set Group context to the same as first image
    conn.SERVICE_OPTS.setOmeroGroup('-1')
    i = conn.getObject("Image", first_img_id)
    gid = i.getDetails().getGroup().getId()
    conn.SERVICE_OPTS.setOmeroGroup(gid)

    json_string = json.dumps(figure_json)
    file_size = len(json_string)
    f = StringIO()
    # f.write(figure_json)
    json.dump(figure_json, f)

    update = conn.getUpdateService()
    orig_file = create_original_file_from_file_obj(
        f, '', figure_name, file_size, mimetype="application/json")
    fa = omero.model.FileAnnotationI()
    fa.setFile(omero.model.OriginalFileI(orig_file.getId(), False))
    fa.setNs(wrap(JSON_FILEANN_NS))
    desc = json.dumps(description)
    fa.setDescription(wrap(desc))
    fa = update.saveAndReturnObject(fa, conn.SERVICE_OPTS)
    file_id = fa.getId().getValue()
    print "Figure Created", file_id


def create_original_file_from_file_obj(fo, path, name, file_size, mimetype=None):
    """
    This is derived from the same method from Blitz Gateway, but this takes
    an open file object, so we don't have to save a file to disk
    """
    raw_file_store = conn.createRawFileStore()

    # create original file, set name, path, mimetype
    original_file = omero.model.OriginalFileI()
    original_file.setName(wrap(name))
    original_file.setPath(wrap(path))
    if mimetype:
        original_file.mimetype = wrap(mimetype)
    original_file.setSize(rlong(file_size))
    # set sha1  # ONLY for OMERO-4
    try:
        import hashlib
        hash_sha1 = hashlib.sha1
    except:
        import sha
        hash_sha1 = sha.new
    try:
        fo.seek(0)
        h = hash_sha1()
        h.update(fo.read())
        original_file.setSha1(wrap(h.hexdigest()))
    except:
        pass       # OMERO-5 doesn't need this
    upd = conn.getUpdateService()
    original_file = upd.saveAndReturnObject(original_file, conn.SERVICE_OPTS)

    # upload file
    fo.seek(0)
    raw_file_store.setFileId(original_file.getId().getValue(),
                             conn.SERVICE_OPTS)
    buf = 10000
    for pos in range(0, long(file_size), buf):
        block = None
        if file_size-pos < buf:
            block_size = file_size-pos
        else:
            block_size = buf
        fo.seek(pos)
        block = fo.read(block_size)
        raw_file_store.write(block, pos, block_size, conn.SERVICE_OPTS)
    # https://github.com/openmicroscopy/openmicroscopy/pull/2006
    original_file = raw_file_store.save(conn.SERVICE_OPTS)
    raw_file_store.close()
    return OriginalFileWrapper(conn, original_file)


def get_panel_json(image, x, y, width, height, channel=None):

    px = image.getPrimaryPixels().getPhysicalSizeX()
    py = image.getPrimaryPixels().getPhysicalSizeY()

    rv = imageMarshal(image)

    if channel is not None:
        for idx, ch in enumerate(rv['channels']):
            ch['active'] = idx == channel

    img_json = {
        "labels":[],
        "height": height,
        "channels": rv['channels'],
        # "deltaT":[],
        # "selected":true,
        "width": width,
        "pixel_size_x": px.getValue(),
        "pixel_size_x_unit": str(px.getUnit()),
        "pixel_size_x_symbol": px.getSymbol(),
        "pixel_size_y": py.getValue(),
        "sizeT": rv['size']['t'],
        "sizeZ": rv['size']['z'],
        "dx":0,
        "dy":0,
        "rotation":0,
        "imageId":image.id,
        # "datasetId":1301,
        # "datasetName":"CENPB-siRNAi",
        "name":"438CTR_01_5_R3D_D3D.dv",
        "orig_width": rv['size']['width'],
        "zoom":100,
        "shapes":[],
        "orig_height": rv['size']['height'],
        "theZ": rv['rdefs']['defaultZ'],
        "y": y,
        "x": x,
        "theT": rv['rdefs']['defaultT']
    }
    return img_json


def get_labels_json(panel_json, column, row):

    labels = []

    channels = panel_json['channels']
    if row == 0:
        labels.append({"text":channels[column]['label'],
                       "size":14,
                       "position":"top",
                       "color":"000000"
                     })
    if column == 0:
        labels.append({"text": panel_json['name'],
                       "size":14,
                       "position":"leftvert",
                       "color":"000000"
                     })
    return labels


def create_omero_figure(conn, script_params):
    figure_json = {"version":2,
                   "paper_width":595,
                   "paper_height":842,
                   "page_size":"A4",
                   # "page_count":"1",
                   # "paper_spacing":50,
                   # "page_col_count":"1",
                   # "height_mm":297,
                   # "width_mm":210,
                   # "orientation":"vertical",
                   # "legend":"",
                   # "legend_collapsed":true,
                   "figureName":"from script",
                   # "fileId":32351
                   }


    image_ids = script_params['IDs']

    images = list(conn.getObjects('Image', image_ids, respect_order=True))

    if len(images) == 0:
        return "No images found"

    # column_count = int(math.ceil(math.sqrt(len(images))))

    width = 100
    height = 100
    spacing = width/20

    curr_x = 0
    curr_y = 0

    panels_json = []
    for row, image in enumerate(images):
        curr_y = row * (height + spacing)
        for c in range(image.getSizeC()):
            curr_x = c * (width + spacing)
            j = get_panel_json(image, curr_x, curr_y, width, height, c)
            j['labels'] = get_labels_json(j, c, row)
            panels_json.append(j)


    figure_json['panels'] = panels_json

    create_figure_file(figure_json)

    return "Figure created"


if __name__ == "__main__":
    """
    The main entry point of the script, as called by the client via the
    scripting service, passing the required parameters.
    """

    data_types = [rstring('Image')]

    client = scripts.client(
        'Create_OMERO_figure.py',
        """Create a figure for the OMERO.figure web app.
See http://figure.openmicroscopy.org""",

        # provide 'Data_Type' and 'IDs' parameters so that webclient or Insight
        # auto-populates with currently selected images.
        scripts.String(
            "Data_Type", optional=False, grouping="01",
            description="The data you want to work with.", values=data_types,
            default="Image"),

        scripts.List(
            "IDs", optional=False, grouping="02",
            description="List of Image IDs").ofType(rlong(0)),

        authors=["William Moore", "OME Team"],
        institutions=["University of Dundee"],
        contact="ome-users@lists.openmicroscopy.org.uk",
    )

    try:
        conn = BlitzGateway(client_obj=client)

        script_params = client.getInputs(unwrap=True)

        # call the main script
        message = create_omero_figure(conn, script_params)

        # Return message and file annotation (if applicable) to the client
        client.setOutput("Message", rstring(message))

    finally:
        client.closeSession()
