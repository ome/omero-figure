from django.http import HttpResponse
from django.shortcuts import render_to_response

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