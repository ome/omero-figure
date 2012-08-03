
# This settings.py file will be imported by omero.settings file AFTER it has initialised custom settings.
from django.conf import settings

# We can directly manipulate the settings
# E.g. add plugins to RIGHT_PLUGINS list
settings.RIGHT_PLUGINS.append(["3D", "weblabs/webclient_plugins/right_plugin.rotation_3d.js.html", "rotation_3d_tab"])
