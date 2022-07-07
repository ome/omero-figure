
#
# Copyright (c) 2022 University of Dundee.
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

import sys

from omeroweb.settings import process_custom_settings, report_settings

# load settings
FIGURE_SETTINGS_MAPPING = {

    "omero.web.figure.max_rendered_region":
        ["MAX_RENDERED_REGION",
         25000000,
         int,
         ("Maximum pixel count for render_scaled_region. If the"
          " rendered region of the smallest pyramid resolution is"
          " larger than this limit, then a thumbnail will be used as"
          " a placeholder")],
}

process_custom_settings(sys.modules[__name__], 'FIGURE_SETTINGS_MAPPING')
report_settings(sys.modules[__name__])
