
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
from django.shortcuts import render
from datetime import datetime
import unicodedata
import json
import time

from omeroweb.webgateway.marshal import imageMarshal
from omeroweb.webclient.views import run_script
from django.core.urlresolvers import reverse
from omero.rtypes import wrap, rlong, rstring, unwrap
import omero
from omero.gateway import OriginalFileWrapper

from cStringIO import StringIO

from omeroweb.webclient.decorators import login_required

# TODO: move this elsewhere if we're not using it as a script any more?
from omero_figure.scripts.omero.figure_scripts.Figure_To_Pdf import FigureExport, TiffExport

from . import settings

try:
    from PIL import Image
except:
    try:
        import Image
    except:
        pass

JSON_FILEANN_NS = "omero.web.figure.json"
SCRIPT_PATH = "/omero/figure_scripts/Figure_To_Pdf.py"


def create_original_file_from_file_obj(
        conn, fo, path, name, file_size, mimetype=None, ns=None):
    """
    This is a copy of the same method from Blitz Gateway, but fixes a bug
    where the conn.SERVICE_OPTS are not passed in the API calls.
    Once this is fixed in OMERO-5 (and we don't need to work with OMERO-4)
    then we can revert to using the BlitzGateway for this method again.
    """
    raw_file_store = conn.createRawFileStore()

    # create original file, set name, path, mimetype
    original_file = omero.model.OriginalFileI()
    original_file.setName(rstring(name))
    original_file.setPath(rstring(path))
    if mimetype:
        original_file.mimetype = rstring(mimetype)
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
        original_file.setSha1(rstring(h.hexdigest()))
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


@login_required()
def index(request, file_id=None, conn=None, **kwargs):
    """
    Single page 'app' for creating a Figure, allowing you to choose images
    and lay them out in canvas by dragging & resizing etc
    """

    version = settings.OMERO_FIGURE_VERSION

    script_service = conn.getScriptService()
    sid = script_service.getScriptID(SCRIPT_PATH)
    script_missing = sid <= 0
    user_full_name = conn.getUser().getFullName()

    context = {'scriptMissing': script_missing,
               'userFullName': user_full_name,
               'version': version}
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
    # See https://github.com/will-moore/figure/issues/16
    figure_json = figure_json.encode('utf8')

    image_ids = []
    first_img_id = None
    try:
        json_data = json.loads(figure_json)
        for panel in json_data['panels']:
            image_ids.append(panel['imageId'])
        if len(image_ids) > 0:
            first_img_id = long(image_ids[0])
        # remove duplicates
        image_ids = list(set(image_ids))
        # pretty-print json
        figure_json = json.dumps(json_data, sort_keys=True,
                                 indent=2, separators=(',', ': '))
    except:
        pass

    file_id = request.POST.get('fileId')

    if file_id is None:
        # Create new file
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

        # Try to set Group context to the same as first image
        curr_gid = conn.SERVICE_OPTS.getOmeroGroup()
        try:
            conn.SERVICE_OPTS.setOmeroGroup('-1')
            i = conn.getObject("Image", first_img_id)
            if i is not None:
                gid = i.getDetails().getGroup().getId().getValue()
                conn.SERVICE_OPTS.setOmeroGroup(gid)
            else:
                # Don't leave as -1
                conn.SERVICE_OPTS.setOmeroGroup(curr_gid)
        except:
            # revert back
            conn.SERVICE_OPTS.setOmeroGroup(curr_gid)
        file_size = len(figure_json)
        f = StringIO()
        f.write(figure_json)
        # Can't use unicode for file name
        figure_name = unicodedata.normalize(
            'NFKD', figure_name).encode('ascii', 'ignore')
        orig_file = create_original_file_from_file_obj(
            conn, f, '', figure_name, file_size, mimetype="application/json")
        fa = omero.model.FileAnnotationI()
        fa.setFile(omero.model.OriginalFileI(orig_file.getId(), False))
        fa.setNs(wrap(JSON_FILEANN_NS))
        desc = json.dumps(description)
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
        orig_file = fa._obj.file
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
                l = omero.model.ImageAnnotationLinkI()
                l.parent = omero.model.ImageI(i.getId(), False)
                l.child = omero.model.FileAnnotationI(file_id, False)
                links.append(l)
            # Don't want to fail at this point due to strange permissions combo
            try:
                update.saveArray(links, conn.SERVICE_OPTS)
            except:
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
    figure_json = "".join(list(file_ann.getFileInChunks()))
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
    except:
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
    # if not request.method == 'POST':
    #     return HttpResponse("Need to use POST")

    figure_json = str(request.POST.get('figureJSON').encode('utf8'))
    # export options e.g. "PDF", "PDF_IMAGES"
    export_option = request.POST.get('exportOption')
    webclient_uri = request.build_absolute_uri(reverse('webindex'))

    input_map = {
        'Figure_JSON': figure_json,
        'Export_Option': export_option,
        'Webclient_URI': webclient_uri}

    # If the figure has been saved, construct URL to it.
    figure_dict = json.loads(figure_json)
    if 'fileId' in figure_dict:
        try:
            figure_url = reverse('load_figure', args=[figure_dict['fileId']])
            figure_url = request.build_absolute_uri(figure_url)
            input_map['Figure_URI'] = figure_url
        except:
            pass

    from io import BytesIO
    from reportlab.pdfgen import canvas

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="somefilename.pdf"'

    buffer = BytesIO()

    if export_option == "PDF":
        fig_export = FigureExport(conn, input_map, file_object=buffer)
        content_type='application/pdf'
    elif export_option == "TIFF":
        fig_export = TiffExport(conn, input_map, file_object=buffer)
        content_type='application/tiff'

    file_ann = fig_export.build_figure()
    filename = fig_export.get_figure_file_name()

    response = HttpResponse(content_type=content_type)
    response['Content-Disposition'] = 'attachment; filename="%s"' % filename

    file_data = buffer.getvalue()
    buffer.close()
    response.write(file_data)
    return response


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

    return HttpResponse(json.dumps(rsp), content_type='json')


def default_thumbnail(size=(120, 120)):
    """ Provide a placeholder thumbnail. Used in urls.py"""
    if isinstance(size, int):
        size = (size, size)
    if len(size) == 1:
        size = (size[0], size[0])
    img = Image.new("RGBA", size, (238, 238, 238))
    f = StringIO()
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
    except ImportError, ex:
        error = ("Failed to import omero.model.enums.UnitsLength."
                 " Requires OMERO 5.1")
    except AttributeError, ex:
        error = ex.message

    if error:
        return HttpResponse(json.dumps({'error': error}), content_type='json')

    from_value = omero.model.LengthI(value, from_unit)
    to_value = omero.model.LengthI(from_value, to_unit)

    rsp = {'value': to_value.getValue(),
           'unit': str(to_value.getUnit()),
           'symbol': to_value.getSymbol()}

    return HttpResponse(json.dumps(rsp), content_type='json')


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
