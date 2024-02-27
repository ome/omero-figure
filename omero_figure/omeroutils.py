#
# Copyright (c) 2020 University of Dundee.
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

from omero.sys import ParametersI
from omero.gateway import PlaneInfoWrapper


def get_timestamps(conn, image):

    params = ParametersI()
    params.addLong('pid', image.getPixelsId())
    query = "from PlaneInfo as Info where"\
        " Info.theZ=0 and Info.theC=0 and pixels.id=:pid"
    info_list = conn.getQueryService().findAllByQuery(
        query, params, conn.SERVICE_OPTS)
    timemap = {}
    for info in info_list:
        t_index = info.theT.getValue()
        if info.deltaT is not None:
            # Use wrapper to help unit conversion
            plane_info = PlaneInfoWrapper(conn, info)
            delta_t = plane_info.getDeltaT('SECOND')
            timemap[t_index] = delta_t.getValue()
    time_list = []
    for t in range(image.getSizeT()):
        if t in timemap:
            time_list.append(timemap[t])
    return time_list


def get_wellsample_index(conn, wellsample_id):
    params = ParametersI()
    params.addId(wellsample_id)
    query = """select index(wellSamples) from Well well
        left outer join well.wellSamples as wellSamples
        where wellSamples.id = :id
        """
    qs = conn.getQueryService()
    rsp = qs.projection(query, params, conn.SERVICE_OPTS)
    return rsp[0][0].val
