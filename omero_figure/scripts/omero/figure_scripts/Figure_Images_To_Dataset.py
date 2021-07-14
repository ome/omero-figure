
import json

import omero.scripts as scripts
from omero.gateway import BlitzGateway
from omero.model import DatasetImageLinkI, DatasetI, ImageI
from omero.rtypes import rstring, rlong, robject

# For an Figure (File Annotation ID) add all Images to a Dataset

def images_to_dataset(conn, params):
    figure_ids = params["Figure_IDs"]
    dataset_id = params["IDs"][0]

    dataset = conn.getObject("Dataset", dataset_id)
    if dataset is None:
        return "Dataset %s not found" % dataset_id, dataset

    gid = dataset.getDetails().group.id.val
    print("Dataset: %s, Group: %s", (dataset.name, gid))    

    update = conn.getUpdateService()
    conn.SERVICE_OPTS.setOmeroGroup(-1)

    image_ids = []
    for figure_id in figure_ids:
        file_ann = conn.getObject("FileAnnotation", figure_id)
        if file_ann is None:
            print("Figure File-Annotation %s not found" % figure_id)
        figure_json = b"".join(list(file_ann.getFileInChunks()))
        figure_json = figure_json.decode('utf8')
        json_data = json.loads(figure_json)

        image_ids.extend([p["imageId"] for p in json_data.get("panels")])

    image_ids = list(set(image_ids))
    if len(image_ids) == 0:
        return "No Images found", dataset
    print("Image IDs: %s" % image_ids)

    conn.SERVICE_OPTS.setOmeroGroup(gid)

    added_count = 0
    for image_id in image_ids:
        link = DatasetImageLinkI()
        link.parent = DatasetI(dataset_id, False)
        link.child = ImageI(image_id, False)
        try:
            update.saveObject(link, conn.SERVICE_OPTS)
            added_count += 1
        except:
            print("Failed to link Image %s to Dataset. Link exists or permissions failed" % image_id)
    return "Added %s images to Dataset" % added_count, dataset


def run_script():
    """
    The main entry point of the script, as called by the client
    via the scripting service, passing the required parameters.
    """

    client = scripts.client(
        'Figure_Images_To_Dataset.py',
        """Add all Images from one or more Figure(s) into the specified Dataset.
        (this does not remove the Images from any other Datasets)""",

        scripts.String(
            "Data_Type", optional=False, grouping="2",
            description="Only support Dataset", values=[rstring("Dataset")],
            default="Dataset"),

        scripts.List(
            "IDs", optional=False, grouping="3",
            description="Dataset ID. Only 1 supported").ofType(rlong(0)),
        
        scripts.List("Figure_IDs", optional=False, grouping="1",
                     description="Figure IDs").ofType(rlong(0)),
    )

    try:
        conn = BlitzGateway(client_obj=client)
        params = client.getInputs(unwrap=True)

        msg, dataset = images_to_dataset(conn, params)
        client.setOutput("Message", rstring(msg))
        
        if dataset is not None:
            client.setOutput("Dataset", robject(dataset._obj))

    finally:
        client.closeSession()


if __name__ == "__main__":
    run_script()
