
import omero
import omero.scripts as scripts
from omero.gateway import BlitzGateway
from omeroweb.webgateway.marshal import imageMarshal
import json
import copy
from cStringIO import StringIO
from omero.rtypes import wrap, rlong, rstring
from omero.gateway import OriginalFileWrapper


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


class FigureBuilder(object):

    def __init__(self, conn):

        self.conn = conn
        self.figure_json = {"version":2,
                            "paper_width":595,
                            "paper_height":842,
                            "page_size":"A4",
                            "figureName":"from script",
                            "panels": [],
                            }

    def get_default_panel_width(self):
        return 100;

    def get_default_panel_height(self):
        return self.get_default_panel_width();

    def add_images(self, image_ids):

        images = list(self.conn.getObjects('Image', image_ids, respect_order=True))

        if len(images) == 0:
            return "No images found"

        for idx, image in enumerate(images):
            panel_json = self.get_panel_json(image)
            self.add_image(image, panel_json, idx)


    def get_panel_json(self, image):

        width = self.get_default_panel_width()
        height = self.get_default_panel_height()

        px = image.getPrimaryPixels().getPhysicalSizeX()
        py = image.getPrimaryPixels().getPhysicalSizeY()

        rv = imageMarshal(image)

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
            "name": rv['meta']['imageName'],
            "orig_width": rv['size']['width'],
            "zoom":100,
            "shapes":[],
            "orig_height": rv['size']['height'],
            "theZ": rv['rdefs']['defaultZ'],
            "y": 0,
            "x": 0,
            "theT": rv['rdefs']['defaultT']
        }

        time_list = []
        if rv['size']['t'] > 1:
            params = omero.sys.ParametersI()
            params.addLong('pid', image.getPixelsId())
            query = "from PlaneInfo as Info where"\
                " Info.theZ=0 and Info.theC=0 and pixels.id=:pid"
            info_list = conn.getQueryService().findAllByQuery(
                query, params, conn.SERVICE_OPTS)
            timemap = {}
            for info in info_list:
                t_index = info.theT.getValue()
                if info.deltaT is not None:
                    # planeInfo.deltaT gives number only (no units)
                    # Therefore compatible with OMERO 5.0 and 5.1
                    delta_t = int(round(info.deltaT.getValue()))
                    timemap[t_index] = delta_t
            for t in range(image.getSizeT()):
                if t in timemap:
                    time_list.append(timemap[t])
        img_json['deltaT'] = time_list

        return img_json


    def add_image(self, image, panel_json, idx):

        self.figure_json['panels'].append(panel_json)


class SplitViewFigureBuilder(FigureBuilder):

    def add_image(self, image, panel_json, idx):

        width = self.get_default_panel_width()
        height = self.get_default_panel_height()
        spacing = width/20
        curr_x = 0
        curr_y = idx * (height + spacing)

        # Add one panel per channel in a row
        for c in range(image.getSizeC()):
            j = copy.deepcopy(panel_json)
            curr_x = c * (width + spacing)
            j['x'] = curr_x
            j['y'] = curr_y
            for idx, ch in enumerate(j['channels']):
                ch['active'] = idx == c
            j['labels'] = self.get_labels_json(j)
            self.figure_json['panels'].append(j)

        # Add 'merged' panel with all channels
        j = copy.deepcopy(panel_json)
        curr_x = image.getSizeC() * (width + spacing)
        j['x'] = curr_x
        j['y'] = curr_y
        for idx, ch in enumerate(j['channels']):
            ch['active'] = True
        j['labels'] = self.get_labels_json(j)
        self.figure_json['panels'].append(j)


    def get_labels_json(self, panel_json):

        labels = []

        # First row, add labels for active channels
        if panel_json['y'] == 0:
            for ch in panel_json['channels']:
                if ch['active']:
                    labels.append({"text": ch['label'],
                                   "size": 14,
                                   "position": "top",
                                   "color": ch['color']
                                 })
        # First column, add image name
        if panel_json['x'] == 0:
            labels.append({"text": panel_json['name'],
                           "size":14,
                           "position":"leftvert",
                           "color":"000000"
                         })
        return labels


class MovieFigureBuilder(FigureBuilder):

    def add_image(self, image, panel_json, idx):

        width = self.get_default_panel_width()
        height = self.get_default_panel_height()
        spacing = width/20
        curr_x = 0
        curr_y = idx * (height + spacing)

        # Add one panel per Time-point in a row
        for t in range(5):
            j = copy.deepcopy(panel_json)
            curr_x = t * (width + spacing)
            j['x'] = curr_x
            j['y'] = curr_y
            j['theT'] = t
            self.figure_json['panels'].append(j)


def create_omero_figure(conn, script_params):


    if script_params['Figure_Type'] == 'Split View Figure':
        figure_builder = SplitViewFigureBuilder(conn)
    elif script_params['Figure_Type'] == 'Movie Figure':
        figure_builder = MovieFigureBuilder(conn)

    figure_builder.add_images(script_params['IDs'])
    create_figure_file(figure_builder.figure_json)

    return "Figure created"


if __name__ == "__main__":
    """
    The main entry point of the script, as called by the client via the
    scripting service, passing the required parameters.
    """

    data_types = [rstring('Image')]
    figure_types = [rstring('Split View Figure'),
                    rstring('Movie Figure')]

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

        scripts.String(
            "Figure_Type", optional=False, grouping="03",
            description="Type of figure to create.", values=figure_types,
            default="Split View Figure"),

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
