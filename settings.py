
# This settings.py file will be imported by omero.settings file AFTER it has
# initialised custom settings.
# See "App Settings" on
# https://www.openmicroscopy.org/
#   site/support/omero5.2/developers/Web/CreateApp.html


def identity(x):
    return x


# import json
CUSTOM_SETTINGS_MAPPINGS = {
    "omero.web.figure.version":
    ["OMERO_FIGURE_VERSION", "1.2.0", identity, None]
}
