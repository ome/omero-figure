
# This settings.py file will be imported by omero.settings file AFTER it has initialised custom settings.
from django.conf import settings

# We can directly manipulate the settings
# E.g. add links to TOP_LINKS list
settings.TOP_LINKS.append(["OMERO.Figure", "webfigure_index"])
