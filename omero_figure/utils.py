#
# Copyright (c) 2017-2020 University of Dundee.
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


import json
import os

__version__ = "4.2.1.dev0"


def read_file(fname, content_type=None):
    p = os.path.abspath(fname)
    with open(p) as f:
        if content_type in ('json',):
            data = json.load(f)
        else:
            data = f.read()
    return data
