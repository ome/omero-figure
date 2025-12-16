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
from omero.model.enums import UnitsTime
from omero.model import TimeI
from omero.rtypes import rlong


def get_timestamps(conn, image):

    params = ParametersI()
    params.addLong('pid', image.getPixelsId())
    query = "from PlaneInfo as Info where"\
        " Info.theZ=0 and Info.theC=0 and pixels.id=:pid"
    info_list = conn.getQueryService().findAllByQuery(
        query, params, conn.SERVICE_OPTS)

    if len(info_list) < image.getSizeT():
        # C & Z dimensions are not always filled
        # Remove restriction on c0 z0 to catch all timestamps
        params = ParametersI()
        params.addLong('pid', image.getPixelsId())
        query = """
            from PlaneInfo Info where Info.id in (
                select min(subInfo.id)
                from PlaneInfo subInfo
                where subInfo.pixels.id=:pid
                group by subInfo.theT
            )
        """
        info_list = conn.getQueryService().findAllByQuery(
            query, params, conn.SERVICE_OPTS)

    timemap = {}
    # check if any PlaneInfo was found
    if len(info_list) > 0:
        # get time info from the PlaneInfo
        for info in info_list:
            t_index = info.theT.getValue()
            if info.deltaT is not None:
                # Use wrapper to help unit conversion
                plane_info = PlaneInfoWrapper(conn, info)
                delta_t = plane_info.getDeltaT('SECOND')
                timemap[t_index] = delta_t.getValue()

    # double check to see if timemap actually got populated
    if len(info_list) == 0 or len(timemap) == 0:
        # get time info from the timeIncrement of the Pixels
        time_increment = 0
        converted_value = 0
        try:
            pixels = image.getPrimaryPixels()._obj
            time_increment = pixels.getTimeIncrement()
            secs_unit = getattr(UnitsTime, "SECOND")
            seconds = TimeI(time_increment, secs_unit)
            converted_value = seconds.getValue()

        except Exception as error:
            print(f"An exception occured: {error}\n"
                  "maybe the image has no 'timeIncrement' set")
        if converted_value != 0 and converted_value is not None:
            for i in range(image.getSizeT()):
                timemap[i] = i*converted_value

    time_list = []
    for t in range(image.getSizeT()):
        if t in timemap:
            time_list.append(timemap[t])
        else:
            # Hopefully never gets here, but
            # time_list length MUST match image.sizeT
            time_list.append(0)

    return time_list


def get_wellsample_index(conn, wellsample_id):
    params = ParametersI()
    params.addId(wellsample_id)
    query = """
        SELECT index(ws), ws.plateAcquisition.id, ws.well.id
        FROM Well w
        LEFT OUTER JOIN w.wellSamples as ws
        WHERE ws.id = :id
        """
    qs = conn.getQueryService()
    rsp = qs.projection(query, params, conn.SERVICE_OPTS)

    # increment index by 1, because OMERO returns 0-based index
    ws_idx = rsp[0][0].val + 1
    ws_run_idx = ws_idx  # index of the well sample in the plate

    if rsp[0][1] is not None:
        params = ParametersI()
        params.addId(rsp[0][1].val)
        params.add("wid", rlong(rsp[0][2].val))
        query = """
            SELECT min(index(ws))
            FROM Well w JOIN w.wellSamples ws
            WHERE ws.plateAcquisition.id = :id AND w.id = :wid
        """
        rsp = qs.projection(query, params, conn.SERVICE_OPTS)
        ws_run_idx -= rsp[0][0].val  # index of the well for the run

    return ws_idx, ws_run_idx
