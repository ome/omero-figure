
# This settings.py file will be imported by omero.settings file AFTER it has initialised custom settings.
from django.conf import settings

# ********* WARNING! ***********
# We can directly manipulate the settings here,
# but this is a hack and not a robust technique.
# The recommended way of installing web apps is to use manual
# configuration as described at
# https://www.openmicroscopy.org/site/support/omero4/developers/Web/WebclientPlugin.html#plugin-installation

# Don't want this script to show up in the webclient scripts menu
settings.SCRIPTS_TO_IGNORE.append("/figure_scripts/Figure_To_Pdf.py")
