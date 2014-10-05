
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
from django.shortcuts import render_to_response
from datetime import datetime
import unicodedata
import json
import time

from omeroweb.webgateway.marshal import imageMarshal
from omeroweb.webclient.views import run_script
from django.core.urlresolvers import reverse
from omero.rtypes import wrap, rlong, rstring
import omero
from omero.gateway import OriginalFileWrapper

from cStringIO import StringIO

from omeroweb.webclient.decorators import login_required

JSON_FILEANN_NS = "omero.web.figure.json"
SCRIPT_PATH = "/omero/figure_scripts/Figure_To_Pdf.py"


def createOriginalFileFromFileObj(
        conn, fo, path, name, fileSize, mimetype=None, ns=None):
    """
    This is a copy of the same method from Blitz Gateway, but fixes a bug
    where the conn.SERVICE_OPTS are not passed in the API calls.
    Once this is fixed in OMERO-5 (and we don't need to work with OMERO-4)
    then we can revert to using the BlitzGateway for this method again.
    """
    rawFileStore = conn.createRawFileStore()

    # create original file, set name, path, mimetype
    originalFile = omero.model.OriginalFileI()
    originalFile.setName(rstring(name))
    originalFile.setPath(rstring(path))
    if mimetype:
        originalFile.mimetype = rstring(mimetype)
    originalFile.setSize(rlong(fileSize))
    # set sha1 # ONLY for OMERO-4
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
        shaHast = h.hexdigest()
        originalFile.setSha1(rstring(shaHast))
    except:
        pass       # OMERO-5 doesn't need this
    upd = conn.getUpdateService()
    originalFile = upd.saveAndReturnObject(originalFile, conn.SERVICE_OPTS)

    # upload file
    fo.seek(0)
    rawFileStore.setFileId(originalFile.getId().getValue(), conn.SERVICE_OPTS)
    buf = 10000
    for pos in range(0, long(fileSize), buf):
        block = None
        if fileSize-pos < buf:
            blockSize = fileSize-pos
        else:
            blockSize = buf
        fo.seek(pos)
        block = fo.read(blockSize)
        rawFileStore.write(block, pos, blockSize, conn.SERVICE_OPTS)
    # https://github.com/openmicroscopy/openmicroscopy/pull/2006
    originalFile = rawFileStore.save(conn.SERVICE_OPTS)
    rawFileStore.close()
    return OriginalFileWrapper(conn, originalFile)


@login_required()
def index(request, fileId=None, conn=None, **kwargs):
    """
    Single page 'app' for creating a Figure, allowing you to choose images
    and lay them out in canvas by dragging & resizing etc
    """

    scriptService = conn.getScriptService()
    sId = scriptService.getScriptID(SCRIPT_PATH)
    scriptMissing = sId <= 0
    userFullName = conn.getUser().getFullName()

    context = {'scriptMissing': scriptMissing,
            'userFullName': userFullName}
    return render_to_response("figure/index.html", context)


@login_required()
def imgData_json(request, imageId, conn=None, **kwargs):

    image = conn.getObject("Image", imageId)
    if image is None:
        raise Http404("Image not found")
    rv = imageMarshal(image)

    sizeT = image.getSizeT()
    timeList = []
    if sizeT > 1:
        params = omero.sys.ParametersI()
        params.addLong('pid', image.getPixelsId())
        query = "from PlaneInfo as Info where"\
            " Info.theZ=0 and Info.theC=0 and pixels.id=:pid"
        infoList = conn.getQueryService().findAllByQuery(
            query, params, conn.SERVICE_OPTS)
        timeMap = {}
        for info in infoList:
            tIndex = info.theT.getValue()
            if info.deltaT is not None:
                deltaT = int(info.deltaT.getValue())
                timeMap[tIndex] = deltaT
        for t in range(image.getSizeT()):
            if t in timeMap:
                timeList.append(timeMap[t])
    rv['deltaT'] = timeList

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

    figureJSON = request.POST.get('figureJSON')
    if figureJSON is None:
        return HttpResponse("No 'figureJSON' in POST")
    # See https://github.com/will-moore/figure/issues/16
    figureJSON = unicodedata.normalize('NFKD', figureJSON).encode('ascii','ignore')

    imageIds = []
    firstImgId = None
    try:
        json_data = json.loads(figureJSON)
        for panel in json_data['panels']:
            imageIds.append(panel['imageId'])
        if len(imageIds) > 0:
            firstImgId = long(imageIds[0])
        # remove duplicates
        imageIds = list(set(imageIds))
    except:
        pass

    fileId = request.POST.get('fileId')

    if fileId is None:
        # Create new file
        figureName = request.POST.get('figureName')
        if figureName is None:
            n = datetime.now()
            # time-stamp name by default: WebFigure_2013-10-29_22-43-53.json
            figureName = "Figure_%s-%s-%s_%s-%s-%s.json" % \
                (n.year, n.month, n.day, n.hour, n.minute, n.second)
        else:
            figureName = str(figureName)
        # we store json in description field...
        description = {}
        if firstImgId is not None:
            description['imageId'] = firstImgId
            if 'baseUrl' in panel:
                description['baseUrl'] = panel['baseUrl']

        # Try to set Group context to the same as first image
        currGid = conn.SERVICE_OPTS.getOmeroGroup()
        try:
            conn.SERVICE_OPTS.setOmeroGroup('-1')
            i = conn.getObject("Image", firstImgId)
            if i is not None:
                gid = i.getDetails().group.id.val
                conn.SERVICE_OPTS.setOmeroGroup(gid)
            else:
                # Don't leave as -1
                conn.SERVICE_OPTS.setOmeroGroup(currGid)
        except:
            # revert back
            conn.SERVICE_OPTS.setOmeroGroup(currGid)
        fileSize = len(figureJSON)
        f = StringIO()
        f.write(figureJSON)
        origF = createOriginalFileFromFileObj(
            conn, f, '', figureName, fileSize, mimetype="application/json")
        fa = omero.model.FileAnnotationI()
        fa.setFile(omero.model.OriginalFileI(origF.getId(), False))
        fa.setNs(wrap(JSON_FILEANN_NS))
        desc = json.dumps(description)
        fa.setDescription(wrap(desc))
        fa = update.saveAndReturnObject(fa, conn.SERVICE_OPTS)
        fileId = fa.id.val

    else:
        # Update existing Original File
        conn.SERVICE_OPTS.setOmeroGroup('-1')
        # Following seems to work OK with group -1 (regardless of group ctx)
        fa = conn.getObject("FileAnnotation", fileId)
        if fa is None:
            return Http404("Couldn't find FileAnnotation of ID: %s" % fileId)
        conn.SERVICE_OPTS.setOmeroGroup(fa.getDetails().group.id.val)
        origFile = fa._obj.file
        size = len(figureJSON)
        origFile.setSize(rlong(size))
        origFile = update.saveAndReturnObject(
            origFile, conn.SERVICE_OPTS)
        # upload file
        rawFileStore = conn.createRawFileStore()
        rawFileStore.setFileId(origFile.getId().getValue(), conn.SERVICE_OPTS)
        rawFileStore.write(figureJSON, 0, size, conn.SERVICE_OPTS)
        rawFileStore.truncate(size, conn.SERVICE_OPTS)     # ticket #11751
        # Once #11928 is fixed, these last 2 lines can be replaced with
        # awFileStore.close(conn.SERVICE_OPTS)
        rawFileStore.save(conn.SERVICE_OPTS)
        rawFileStore.close()

    # Link file annotation to all images (remove from any others)
    LINK_TO_IMAGES = False      # Disabled for now
    if LINK_TO_IMAGES:
        currentLinks = conn.getAnnotationLinks("Image", ann_ids=[fileId])
        for l in currentLinks:
            if l.parent.id.val not in imageIds:
                # remove old link
                update.deleteObject(l._obj, conn.SERVICE_OPTS)
            else:
                # we don't need to create links for these
                imageIds.remove(l.parent.id.val)

        # create new links if necessary
        links = []
        if len(imageIds) > 0:
            for i in conn.getObjects("Image", imageIds):
                if not i.canAnnotate():
                    continue
                l = omero.model.ImageAnnotationLinkI()
                l.parent = omero.model.ImageI(i.getId(), False)
                l.child = omero.model.FileAnnotationI(fileId, False)
                links.append(l)
            # Don't want to fail at this point due to strange permissions combo
            try:
                update.saveArray(links, conn.SERVICE_OPTS)
            except:
                pass

    return HttpResponse(str(fileId))


@login_required()
def load_web_figure(request, fileId, conn=None, **kwargs):
    """
    Loads the json stored in the file, identified by file annotation ID
    """

    fileAnn = conn.getObject("FileAnnotation", fileId)
    if fileAnn is None:
        raise Http404("Figure File-Annotation %s not found" % fileId)
    figureJSON = "".join(list(fileAnn.getFileInChunks()))
    jsonFile = fileAnn.getFile()
    ownerId = jsonFile.getDetails().getOwner().getId()
    try:
        # parse the json, so we can add info...
        json_data = json.loads(figureJSON)
        json_data['canEdit'] = ownerId == conn.getUserId()
        json_data['figureName'] = jsonFile.getName()
    except:
        # If the json failed to parse, return the string anyway
        return HttpResponse(json_data, content_type='json')

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

    scriptService = conn.getScriptService()
    sId = scriptService.getScriptID(SCRIPT_PATH)

    figureJSON = request.POST.get('figureJSON')
    # see https://github.com/will-moore/figure/issues/16
    figureJSON = unicodedata.normalize('NFKD', figureJSON).encode('ascii','ignore')
    webclient_uri = request.build_absolute_uri(reverse('webindex'))

    figure_dict = json.loads(figureJSON)

    inputMap = {
        'Figure_JSON': wrap(figureJSON),
        'Webclient_URI': wrap(webclient_uri)}

    # If the figure has been saved, construct URL to it...
    if 'fileId' in figure_dict:
        try:
            figureUrl = reverse('load_figure', args=[figure_dict['fileId']])
            figureUrl = request.build_absolute_uri(figureUrl)
            inputMap['Figure_URI'] = wrap(figureUrl)
        except:
            pass

    rsp = run_script(request, conn, sId, inputMap, scriptName='Figure.pdf')
    return HttpResponse(json.dumps(rsp), content_type='json')


@login_required()
def list_web_figures(request, conn=None, **kwargs):

    fileAnns = list(conn.getObjects(
        "FileAnnotation", attributes={'ns': JSON_FILEANN_NS}))
    #fileAnns.sort(key=lambda x: x.creationEventDate(), reverse=True)

    rsp = []
    for fa in fileAnns:
        owner = fa.getDetails().getOwner()
        cd = fa.creationEventDate()

        figFile = {
            'id': fa.id,
            'name': fa.getFile().getName(),
            'creationDate': time.mktime(cd.timetuple()),
            'ownerFullName': owner.getFullName(),
            'canEdit': fa.getFile().canEdit()
        }

        # We use the 'description' field to store json - try to validate...
        try:
            desc = fa.getDescription()
            description = json.loads(desc)
            figFile['description'] = description
        except:
            pass

        rsp.append(figFile)

    rsp.sort(key=lambda x: x['name'].lower())

    return HttpResponse(json.dumps(rsp), content_type='json')


@login_required()
def delete_web_figure(request, conn=None, **kwargs):
    """ POST 'fileId' to delete the FileAnnotation """

    if request.method != 'POST':
        return HttpResponse("Need to POST 'fileId' to delete")

    fileId = request.POST.get('fileId')
    # fileAnn = conn.getObject("FileAnnotation", fileId)
    conn.deleteObjects("Annotation", [fileId])
    return HttpResponse("Deleted OK")
