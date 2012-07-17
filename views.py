from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.utils import simplejson

from omeroweb.decorators import login_required


def index(request):
    """
    Just a place-holder while we get started
    """

    return HttpResponse("Welcome to weblabs!")


@login_required()
def fast_image_stack (request, imageId, conn=None, **kwargs):
    """ Load all the planes of image into viewer, so we have them all in hand for fast viewing of stack """
    
    image = conn.getObject("Image", long(imageId))
    z_indices = range(image.getSizeZ())
    return render_to_response('weblabs/image_viewers/fast_image_stack.html', {'image':image, 'z_indices':z_indices})


@login_required()
def max_intensity_indices (request, imageId, theC, conn=None, **kwargs):
    """ 
    Returns a 2D plane (same width and height as the image) where each 'pixel' value is
    the Z-index of the max intensity.
    """
    
    image = conn.getObject("Image", long(imageId))
    w = image.getSizeX()
    h = image.getSizeY()
    miPlane = [[0]*w for x in xrange(h)]
    indexPlane = [[0]*w for x in xrange(h)]
    
    pixels = image.getPrimaryPixels()
    
    c = int(theC)
    
    for z in range(image.getSizeZ()):
        plane = pixels.getPlane(z, c, 0)
        print plane
        for x in range(w):
            for y in range(h):
                if plane[y][x] > miPlane[y][x]:
                    miPlane[y][x] = plane[y][x]
                    indexPlane[y][x] = z

    return HttpResponse(simplejson.dumps(indexPlane), mimetype='application/javascript')