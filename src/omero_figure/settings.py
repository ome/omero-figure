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

# This settings.py file will be imported by omero.settings file AFTER it has
# initialised custom settings.
# See "App Settings" on
# https://www.openmicroscopy.org/
#   site/support/omero5.3/developers/Web/CreateApp.html

from . import utils
import warnings

warnings.warn("Deprecated. utils.__version__", DeprecationWarning)
OMERO_FIGURE_VERSION = utils.__version__
