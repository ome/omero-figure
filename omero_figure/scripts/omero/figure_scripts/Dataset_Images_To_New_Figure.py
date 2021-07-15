
import json
from io import BytesIO

from omero.gateway import BlitzGateway
from omero.model import FileAnnotationI, OriginalFileI
from omero.rtypes import wrap, rstring, rlong
import omero.scripts as scripts

# For each Panel in a Figure (File Annotation ID) find an Image with the same
# name is the Dataset (ID), replace the ID in the figure JSON.
# Then save as a new Figure (in the same group as the Images)
# Usage: python Dataset_Images_To_New_Figure.py DATASET_ID FIGURE_ID

JSON_FILEANN_NS = "omero.web.figure.json"


def save_web_figure(conn, json_data):
    """
    Saves 'figureJSON' in POST as an original file. If 'fileId' is specified
    in POST, then we update that file. Otherwise create a new one with
    name 'figureName' from POST.
    """
    image_ids = []
    first_img_id = None
    try:
        for panel in json_data['panels']:
            image_ids.append(panel['imageId'])
        if len(image_ids) > 0:
            first_img_id = int(image_ids[0])
        # remove duplicates
        image_ids = list(set(image_ids))
        # pretty-print json
        figure_json = json.dumps(json_data, sort_keys=True,
                                 indent=2, separators=(',', ': '))
    except Exception:
        pass

    # See https://github.com/will-moore/figure/issues/16
    figure_json = figure_json.encode('utf8')

    if 'figureName' in json_data and len(json_data['figureName']) > 0:
        figure_name = json_data['figureName']
    else:
        print("No figure name found")
        return

    # we store json in description field...
    description = {}
    if first_img_id is not None:
        # We duplicate the figure name here for quicker access when
        # listing files
        # (use this instead of file name because it supports unicode)
        description['name'] = figure_name
        description['imageId'] = first_img_id
        if 'baseUrl' in panel:
            description['baseUrl'] = panel['baseUrl']
    desc = json.dumps(description)

    # Create new file
    # Try to set Group context to the same as first image
    curr_gid = conn.SERVICE_OPTS.getOmeroGroup()
    i = None
    if first_img_id:
        i = conn.getObject("Image", first_img_id)
    if i is not None:
        gid = i.getDetails().getGroup().getId()
        conn.SERVICE_OPTS.setOmeroGroup(gid)
    else:
        # Don't leave as -1
        conn.SERVICE_OPTS.setOmeroGroup(curr_gid)
    file_size = len(figure_json)
    f = BytesIO()
    f.write(figure_json)
    orig_file = conn.createOriginalFileFromFileObj(
        f, '', figure_name, file_size, mimetype="application/json")
    fa = FileAnnotationI()
    fa.setFile(OriginalFileI(orig_file.getId(), False))
    fa.setNs(wrap(JSON_FILEANN_NS))
    fa.setDescription(wrap(desc))

    update = conn.getUpdateService()
    fa = update.saveAndReturnObject(fa, conn.SERVICE_OPTS)
    ann_id = fa.getId().getValue()
    return ann_id


def dataset_images_to_new_figure(conn, params):
    figure_ids = params["Figure_IDs"]
    dataset_id = params["IDs"][0]

    # Get Images by Name from Dataset
    dataset = conn.getObject("Dataset", dataset_id)
    images_by_name = {}
    duplicate_names = []
    for image in dataset.listChildren():
        if image.name in images_by_name:
            duplicate_names.append(image.name)
        else:
            images_by_name[image.name] = image.id
    print("images_by_name", images_by_name)
    if len(duplicate_names) > 0:
        print("Multiple images with these names: %s" % duplicate_names)
        print("Can't identify these images by name")

    ann_ids = []
    failed_to_replace = 0
    for figure_id in figure_ids:
        conn.SERVICE_OPTS.setOmeroGroup(-1)
        file_ann = conn.getObject("FileAnnotation", figure_id)
        if file_ann is None:
            print("Figure File-Annotation %s not found" % figure_id)
            continue
        figure_json = b"".join(list(file_ann.getFileInChunks()))
        figure_json = figure_json.decode('utf8')
        json_data = json.loads(figure_json)
        print("Processing figure", figure_id)

        # For each panel, get the name and update the ID
        for p in json_data.get("panels"):
            name = p['name']
            if name in duplicate_names:
                print("Multiple images with name: %s. NOT replaced" % name)
                failed_to_replace += 1
                continue
            if name not in images_by_name:
                print("Could not find Image %s. NOT replaced" % name)
                failed_to_replace += 1
                continue
            new_id = images_by_name[name]
            p["imageId"] = new_id

        # Save new Figure, in the appropriate group
        ann_ids.append(save_web_figure(conn, json_data))

    msg = "Created %s new Figure%s" % (len(ann_ids),
                                       "s" if len(ann_ids) else "")
    if failed_to_replace:
        print("Failed to replace %s images" % failed_to_replace)
        msg += ". See info for warnings"
    return msg


def run_script():
    """
    The main entry point of the script, as called by the client
    via the scripting service, passing the required parameters.
    """

    client = scripts.client(
        'Dataset_Images_To_New_Figure.py',
        """Use Images from a Dataset to replace those in a Figure and
        save the result as a new Figure, in the same group as the Images""",

        scripts.String(
            "Data_Type", optional=False, grouping="1",
            description="Only support Dataset", values=[rstring("Dataset")],
            default="Dataset"),

        scripts.List(
            "IDs", optional=False, grouping="2",
            description="Dataset ID. Only 1 supported").ofType(rlong(0)),

        scripts.List("Figure_IDs", optional=False, grouping="3",
                     description="Figure ID").ofType(rlong(0)),
    )

    try:
        conn = BlitzGateway(client_obj=client)
        params = client.getInputs(unwrap=True)

        msg = dataset_images_to_new_figure(conn, params)
        client.setOutput("Message", rstring(msg))

    finally:
        client.closeSession()


if __name__ == "__main__":
    run_script()
