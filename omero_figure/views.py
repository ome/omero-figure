
#
# Copyright (c) 2014 University of Dundee.
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

from django.http import Http404, HttpResponse
from django.conf import settings
from django.shortcuts import render
from datetime import datetime
import json
import time

from omeroweb.webgateway.marshal import imageMarshal
from omeroweb.webgateway.views import _get_prepared_image
from omeroweb.webclient.views import run_script
from django.core.urlresolvers import reverse, NoReverseMatch
from omero.rtypes import wrap, rlong, rstring, unwrap
from omero.model import LengthI
from omero.model.enums import UnitsLength
import omero

from io import BytesIO

from omeroweb.webclient.decorators import login_required

from . import utils
import logging

try:
    from PIL import Image
except ImportError:
    try:
        import Image
    except ImportError:
        pass

logger = logging.getLogger(__name__)

JSON_FILEANN_NS = "omero.web.figure.json"
SCRIPT_PATH = "/omero/figure_scripts/Figure_To_Pdf.py"


def getLengthUnits():
    # Create a dict we can use for scalebar unit conversions
    unit_symbols = {}
    for name in LengthI.SYMBOLS.keys():
        if name in ("PIXEL", "REFERENCEFRAME"):
            continue
        klass = getattr(UnitsLength, name)
        unit = LengthI(1, klass)
        to_microns = LengthI(unit, UnitsLength.MICROMETER)
        unit_symbols[name] = {
            'symbol': unit.getSymbol(),
            'microns': to_microns.getValue()
        }
    return unit_symbols


@login_required()
def index(request, file_id=None, conn=None, **kwargs):
    """
    Single page 'app' for creating a Figure, allowing you to choose images
    and lay them out in canvas by dragging & resizing etc
    """

    script_service = conn.getScriptService()
    sid = script_service.getScriptID(SCRIPT_PATH)
    script_missing = sid <= 0
    user = conn.getUser()
    user_full_name = "%s %s" % (user.firstName, user.lastName)
    max_w, max_h = conn.getMaxPlaneSize()
    max_plane_size = max_w * max_h
    length_units = getLengthUnits()
    is_public_user = False
    if (hasattr(settings, 'PUBLIC_USER')
            and settings.PUBLIC_USER == user.getOmeName()):
        is_public_user = True

    context = {'scriptMissing': script_missing,
               'userFullName': user_full_name,
               'maxPlaneSize': max_plane_size,
               'lengthUnits': json.dumps(length_units),
               'isPublicUser': is_public_user,
               'version': utils.__version__}
    return render(request, "figure/index.html", context)


@login_required()
def img_data_json(request, image_id, conn=None, **kwargs):

    image = conn.getObject("Image", image_id)
    if image is None:
        raise Http404("Image not found")

    # Test if we have Units support (OMERO 5.1)
    px = image.getPrimaryPixels().getPhysicalSizeX()
    pix_size_x = str(px)  # As string E.g. "0.13262 MICROMETER"
    units_support = " " in pix_size_x

    rv = imageMarshal(image)

    if units_support:
        # Add extra parameters with units data
        # NB ['pixel_size']['x'] will have size in MICROMETER
        px = image.getPrimaryPixels().getPhysicalSizeX()
        rv['pixel_size']['valueX'] = px.getValue()
        rv['pixel_size']['symbolX'] = px.getSymbol()
        rv['pixel_size']['unitX'] = str(px.getUnit())
        py = image.getPrimaryPixels().getPhysicalSizeY()
        rv['pixel_size']['valueY'] = py.getValue()
        rv['pixel_size']['symbolY'] = py.getSymbol()
        rv['pixel_size']['unitY'] = str(py.getUnit())
    size_t = image.getSizeT()
    time_list = []
    if size_t > 1:
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
    rv['deltaT'] = time_list

    return HttpResponse(json.dumps(rv), content_type='json')


@login_required()
def render_scaled_region(request, iid, z, t, conn=None, **kwargs):

    region = request.GET.get('region')
    logger.debug("Rendering region: %s, Image: %s" % (region, iid))

    x, y, width, height = [float(r) for r in region.split(',')]
    max_size = request.GET.get('max_size', 2000)
    max_size = int(max_size)

    pi = _get_prepared_image(request, iid, conn=conn)
    if pi is None:
        raise Http404
    image, compress_quality = pi

    size_x = image.getSizeX()
    size_y = image.getSizeY()

    scale_levels = image.getZoomLevelScaling()
    if scale_levels is None:
        # Not a big image - can load at full size
        level = None
    else:
        # Pick zoom such that returned image is below MAX size
        max_level = len(scale_levels.keys()) - 1
        longest_side = max(width, height)

        # start small, and go until we reach target size
        zm = max_level
        while zm > 0 and scale_levels[zm - 1] * longest_side < max_size:
            zm = zm - 1

        level = max_level - zm

        # We need to use final rendered jpeg coordinates
        # Convert from original image coordinates by scaling
        scale = scale_levels[zm]
        x = int(x * scale)
        y = int(y * scale)
        width = int(width * scale)
        height = int(height * scale)
        size_x = int(size_x * scale)
        size_y = int(size_y * scale)

    canvas = None
    # Coordinates below are all final jpeg coordinates & sizes
    if x < 0 or y < 0 or (x + width) > size_x or (y + height) > size_y:
        # If we're outside the bounds of the image...
        # Need to render reduced region and paste on to full size image
        canvas = Image.new("RGB", (width, height), (221, 221, 221))
        paste_x = 0
        paste_y = 0
        if x < 0:
            paste_x = -x
            width = width + x
            x = 0
        if y < 0:
            paste_y = -y
            height = height + y
            y = 0

    # Render the region...
    jpeg_data = image.renderJpegRegion(z, t, x, y, width, height, level=level,
                                       compression=compress_quality)

    # paste to canvas if needed
    if canvas is not None:
        i = BytesIO(jpeg_data)
        to_paste = Image.open(i)
        canvas.paste(to_paste, (paste_x, paste_y))
        rv = BytesIO()
        canvas.save(rv, 'jpeg', quality=90)
        jpeg_data = rv.getvalue()

    return HttpResponse(jpeg_data, content_type='image/jpeg')


@login_required(setGroupContext=True)
def save_web_figure(request, conn=None, **kwargs):
    """
    Saves 'figureJSON' in POST as an original file. If 'fileId' is specified
    in POST, then we update that file. Otherwise create a new one with
    name 'figureName' from POST.
    """

    update = conn.getUpdateService()
    if not request.method == 'POST':
        return HttpResponse("Need to use POST")

    figure_json = request.POST.get('figureJSON')
    if figure_json is None:
        return HttpResponse("No 'figureJSON' in POST")

    image_ids = []
    first_img_id = None
    try:
        json_data = json.loads(figure_json)
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

    file_id = request.POST.get('fileId')

    if 'figureName' in json_data and len(json_data['figureName']) > 0:
        figure_name = json_data['figureName']
    else:
        n = datetime.now()
        # time-stamp name by default: WebFigure_2013-10-29_22-43-53.json
        figure_name = "Figure_%s-%s-%s_%s-%s-%s.json" % \
            (n.year, n.month, n.day, n.hour, n.minute, n.second)

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

    if file_id is None:
        # Create new file
        # Try to set Group context to the same as first image
        curr_gid = conn.SERVICE_OPTS.getOmeroGroup()
        conn.SERVICE_OPTS.setOmeroGroup('-1')
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
        fa = omero.model.FileAnnotationI()
        fa.setFile(omero.model.OriginalFileI(orig_file.getId(), False))
        fa.setNs(wrap(JSON_FILEANN_NS))
        fa.setDescription(wrap(desc))
        fa = update.saveAndReturnObject(fa, conn.SERVICE_OPTS)
        file_id = fa.getId().getValue()

    else:
        # Update existing Original File
        conn.SERVICE_OPTS.setOmeroGroup('-1')
        # Following seems to work OK with group -1 (regardless of group ctx)
        fa = conn.getObject("FileAnnotation", file_id)
        if fa is None:
            return Http404("Couldn't find FileAnnotation of ID: %s" % file_id)
        conn.SERVICE_OPTS.setOmeroGroup(fa.getDetails().group.id.val)
        # Update description
        fa._obj.setDescription(wrap(desc))
        update.saveAndReturnObject(fa._obj, conn.SERVICE_OPTS)
        orig_file = fa._obj.file
        # Update name and size
        orig_file.setName(rstring(figure_name))
        size = len(figure_json)
        orig_file.setSize(rlong(size))
        orig_file = update.saveAndReturnObject(
            orig_file, conn.SERVICE_OPTS)
        # upload file
        raw_file_store = conn.createRawFileStore()
        raw_file_store.setFileId(orig_file.getId().getValue(),
                                 conn.SERVICE_OPTS)
        raw_file_store.write(figure_json, 0, size, conn.SERVICE_OPTS)
        raw_file_store.truncate(size, conn.SERVICE_OPTS)     # ticket #11751
        # Once #11928 is fixed, these last 2 lines can be replaced with
        # rawFileStore.close(conn.SERVICE_OPTS)
        raw_file_store.save(conn.SERVICE_OPTS)
        raw_file_store.close()

    # Link file annotation to all images (remove from any others)
    link_to_images = False      # Disabled for now
    if link_to_images:
        current_links = conn.getAnnotationLinks("Image", ann_ids=[file_id])
        for l in current_links:
            if l.getParent().getId().getValue() not in image_ids:
                # remove old link
                update.deleteObject(l._obj, conn.SERVICE_OPTS)
            else:
                # we don't need to create links for these
                image_ids.remove(l.getParent().getId().getValue())

        # create new links if necessary
        links = []
        if len(image_ids) > 0:
            for i in conn.getObjects("Image", image_ids):
                if not i.canAnnotate():
                    continue
                link = omero.model.ImageAnnotationLinkI()
                link.parent = omero.model.ImageI(i.getId(), False)
                link.child = omero.model.FileAnnotationI(file_id, False)
                links.append(link)
            # Don't want to fail at this point due to strange permissions combo
            try:
                update.saveArray(links, conn.SERVICE_OPTS)
            except Exception:
                pass

    return HttpResponse(str(file_id))


@login_required()
def load_web_figure(request, file_id, conn=None, **kwargs):
    """
    Loads the json stored in the file, identified by file annotation ID
    """

    file_ann = conn.getObject("FileAnnotation", file_id)
    if file_ann is None:
        raise Http404("Figure File-Annotation %s not found" % file_id)
    figure_json = b"".join(list(file_ann.getFileInChunks()))
    figure_json = figure_json.decode('utf8')
    json_file = file_ann.getFile()
    owner_id = json_file.getDetails().getOwner().getId()
    try:
        # parse the json, so we can add info...
        json_data = json.loads(figure_json)
        json_data['canEdit'] = owner_id == conn.getUserId()
        # Figure name may not be populated: check in description...
        if 'figureName' not in json_data:
            desc = file_ann.getDescription()
            description = json.loads(desc)
            if 'name' in description:
                json_data['figureName'] = description['name']
            else:
                json_data['figureName'] = json_file.getName()
    except ValueError:
        # If the json failed to parse, return the string anyway
        return HttpResponse(figure_json, content_type='json')

    return HttpResponse(json.dumps(json_data), content_type='json')


@login_required(setGroupContext=True)
def make_web_figure(request, conn=None, **kwargs):
    """
    Uses the scripting service to generate pdf via json etc in POST data.
    Script will show up in the 'Activities' for users to monitor and
    download result etc.
    """
    if not request.method == 'POST':
        return HttpResponse("Need to use POST")

    script_service = conn.getScriptService()
    sid = script_service.getScriptID(SCRIPT_PATH)

    figure_json = request.POST.get('figureJSON')
    # export options e.g. "PDF", "PDF_IMAGES"
    export_option = request.POST.get('exportOption')
    webclient_uri = request.build_absolute_uri(reverse('webindex'))

    input_map = {
        'Figure_JSON': wrap(figure_json),
        'Export_Option': wrap(str(export_option)),
        'Webclient_URI': wrap(webclient_uri)}

    # If the figure has been saved, construct URL to it.
    figure_dict = json.loads(figure_json)
    if 'fileId' in figure_dict:
        try:
            figure_url = reverse('load_figure', args=[figure_dict['fileId']])
            figure_url = request.build_absolute_uri(figure_url)
            input_map['Figure_URI'] = wrap(figure_url)
        except NoReverseMatch:
            pass

    rsp = run_script(request, conn, sid, input_map, scriptName='Figure.pdf')
    return HttpResponse(json.dumps(rsp), content_type='json')


@login_required()
def list_web_figures(request, conn=None, **kwargs):

    params = omero.sys.ParametersI()
    params.addString('ns', rstring(JSON_FILEANN_NS))
    q = """select new map(obj.id as id,
                obj.description as desc,
                o.firstName as firstName,
                o.lastName as lastName,
                e.time as time,
                f.name as name,
                obj as obj_details_permissions)
            from FileAnnotation obj
            join obj.details.owner as o
            join obj.details.creationEvent as e
            join obj.file.details as p
            join obj.file as f where obj.ns=:ns"""

    qs = conn.getQueryService()
    file_anns = qs.projection(q, params, conn.SERVICE_OPTS)
    rsp = []
    for file_ann in file_anns:
        fa = unwrap(file_ann[0])
        date = datetime.fromtimestamp(unwrap(fa['time'])/1000)
        first_name = unwrap(fa['firstName'])
        last_name = unwrap(fa['lastName'])
        fig_file = {
            'id': unwrap(fa['id']),
            'name': unwrap(fa['name']),
            'description': unwrap(fa['desc']),
            'ownerFullName': "%s %s" % (first_name, last_name),
            'creationDate': time.mktime(date.timetuple()),
            'canEdit': fa['obj_details_permissions'].get('canEdit')
        }
        rsp.append(fig_file)

    return HttpResponse(json.dumps(rsp), content_type='application/json')


def default_thumbnail(size=(120, 120)):
    """ Provide a placeholder thumbnail. Used in urls.py"""
    if isinstance(size, int):
        size = (size, size)
    if len(size) == 1:
        size = (size[0], size[0])
    img = Image.new("RGB", size, (238, 238, 238))
    f = BytesIO()
    img.save(f, "PNG")
    f.seek(0)
    return f.read()


@login_required()
def delete_web_figure(request, conn=None, **kwargs):
    """ POST 'fileId' to delete the FileAnnotation """

    if request.method != 'POST':
        return HttpResponse("Need to POST 'fileId' to delete")

    file_id = request.POST.get('fileId')
    conn.deleteObjects("Annotation", [file_id])
    return HttpResponse("Deleted OK")


def unit_conversion(request, value, from_unit, to_unit, conn=None, **kwargs):
    """
    OMERO 5.1 only: Converts Lengths of value in 'from_unit' to 'to_unit'.
    E.g. unit_conversion/1.12/MICROMETER/ANGSTROM/.
    Returns result as json with keys of 'value', 'unit' and 'symbol'
    """

    error = None
    try:
        from omero.model.enums import UnitsLength
        from_unit = getattr(UnitsLength, str(from_unit))
        to_unit = getattr(UnitsLength, str(to_unit))
        value = float(value)
    except ImportError as ex:
        error = ("Failed to import omero.model.enums.UnitsLength."
                 " Requires OMERO 5.1")
    except AttributeError as ex:
        error = ex.message

    if error:
        return HttpResponse(json.dumps({'error': error}), content_type='json')

    from_value = omero.model.LengthI(value, from_unit)
    to_value = omero.model.LengthI(from_value, to_unit)

    rsp = {'value': to_value.getValue(),
           'unit': str(to_value.getUnit()),
           'symbol': to_value.getSymbol()}

    return HttpResponse(json.dumps(rsp), content_type='application/json')


@login_required()
def roi_count(request, image_id, conn=None, **kwargs):
    """
    Get the counts of ROIs and Shapes on the image
    """
    count_shapes = request.GET.get('shapes', False)
    params = omero.sys.ParametersI()
    params.addLong('image_id', image_id)
    query = 'select count(*) from Roi as roi ' \
            'where roi.image.id = :image_id'
    count = conn.getQueryService().projection(
        query, params, conn.SERVICE_OPTS)
    roi_count = count[0][0].getValue()
    rv = {'roi': roi_count}

    if count_shapes:
        query = 'select count(shape) from Shape as shape ' \
                'left outer join shape.roi as roi ' \
                'where roi.image.id = :imageId'
        count = conn.getQueryService().projection(
            query, params, conn.SERVICE_OPTS)
        shape_count = count[0][0].getValue()
        rv['shape'] = shape_count
    return HttpResponse(json.dumps(rv), content_type="application/json")
