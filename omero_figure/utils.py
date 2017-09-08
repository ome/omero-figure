#
# Copyright (c) 2017 University of Dundee.
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
import os

from PIL import Image
import numpy
import zipfile

__version__ = "3.1.1"


def read_file(fname, content_type=None):
    p = os.path.abspath(fname)
    with open(p) as f:
        if content_type in ('json',):
            data = json.load(f)
        else:
            data = f.read()
    return data

def new_omero_image(conn, image_file, name, dataset=None):
    """Create a new Image in OMERO from the image_file."""

    # Need to specify group for new image
    group_id = conn.getEventContext().groupId
    if dataset is not None:
        group_id = dataset.getDetails().group.id.val
        dataset = dataset._obj      # get the omero.model.DatasetI
    conn.SERVICE_OPTS.setOmeroGroup(group_id)

    description = "Created from OMERO.figure: "
    # url = self.script_params.get("Figure_URI")
    # legend = self.figure_json.get('legend')
    # if url is not None:
    #     description += url
    # if legend is not None:
    #     description = "%s\n\n%s" % (description, legend)

    images = []
    names = []
    print 'Name', name
    if name.endswith('zip'):
        with zipfile.ZipFile(image_file, 'r') as zip_file:
            for i in zip_file.namelist():
                print i
                if i.endswith('tiff'):
                    img = Image.open(zip_file.open(i))
                    img.show()
                    images.append(img)
                    names.append(i)     # TODO: remove .tiff
    else:
        images = [Image.open(image_file)]
        names = [name]

    new_images = []
    for img, n in zip(images, names):

        np_array = numpy.asarray(img)
        red = np_array[::, ::, 0]
        green = np_array[::, ::, 1]
        blue = np_array[::, ::, 2]
        plane_gen = iter([red, green, blue])
        new_image = conn.createImageFromNumpySeq(
            plane_gen,
            name,
            sizeC=3,
            description=description, dataset=dataset)
        new_images.append(new_image)

    # Reset group context
    conn.SERVICE_OPTS.setOmeroGroup(-1)

    return new_images
