#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright (C) 2017 University of Dundee & Open Microscopy Environment.
# All rights reserved.
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

"""Tools for drawing Shapes to PDF or TIFF figures."""

from PIL import Image, ImageDraw
from math import atan2, atan, sin, cos, sqrt, radians


def scale_to_export_dpi(pixels):
    """
    Scale from 72 to 300 dpi.

    Original figure coordinates assume 72 dpi figure, but we want to
    export at 300 dpi, so everything needs scaling accordingly
    """
    return pixels * 300/72

class ShapeToPdfExport(object):
    """Class for drawing vector shapes onto ReportLab PDF canvas."""

    def __init__(self, canvas, panel, page, crop, page_height):
        """
        Constructor. Takes ReportLab canvas and draws shapes from panel JSON.

        Page specifies which page we're on and crop is {x, y, width, height}.
        """
        self.canvas = canvas
        self.panel = panel
        self.page = page
        # The crop region on the original image coordinates...
        self.crop = crop
        self.page_height = page_height
        # Get a mapping from original coordinates to the actual size of panel
        self.scale = float(panel['width']) / crop['width']

        if "shapes" in panel:
            for shape in panel["shapes"]:
                if shape['type'] == "Arrow":
                    self.draw_arrow(shape)
                elif shape['type'] == "Line":
                    self.draw_line(shape)
                elif shape['type'] == "Rectangle":
                    self.draw_rectangle(shape)
                elif shape['type'] == "Ellipse":
                    self.draw_ellipse(shape)
                elif shape['type'] == "Polygon":
                    self.draw_polygon(shape)
                elif shape['type'] == "Polyline":
                    self.draw_polyline(shape)

    @staticmethod
    def get_rgb(color):
        """Convert from E.g. '#ff0000' to (255, 0, 0)."""
        red = int(color[1:3], 16)
        green = int(color[3:5], 16)
        blue = int(color[5:7], 16)
        return (red, green, blue)

    def panel_to_page_coords(self, shape_x, shape_y):
        """
        Convert coordinate from the image onto the PDF page.

        Handles zoom, offset & rotation of panel, rotating the
        x, y point around the centre of the cropped region
        and scaling appropriately.
        Also includes 'inPanel' key - True if point within
        the cropped panel region
        """
        rotation = self.panel['rotation']
        if rotation != 0:
            # img coords: centre of rotation
            cx = self.crop['x'] + (self.crop['width']/2)
            cy = self.crop['y'] + (self.crop['height']/2)
            dx = cx - shape_x
            dy = cy - shape_y
            # distance of point from centre of rotation
            h = sqrt(dx * dx + dy * dy)
            # and the angle
            angle1 = atan2(dx, dy)

            # Add the rotation to the angle and calculate new
            # opposite and adjacent lengths from centre of rotation
            angle2 = angle1 - radians(rotation)
            newo = sin(angle2) * h
            newa = cos(angle2) * h
            # to give correct x and y within cropped panel
            shape_x = cx - newo
            shape_y = cy - newa

        # convert to coords within crop region
        shape_x = shape_x - self.crop['x']
        shape_y = shape_y - self.crop['y']
        # check if points are within panel
        in_panel = True
        if shape_x < 0 or shape_x > self.crop['width']:
            in_panel = False
        if shape_y < 0 or shape_y > self.crop['height']:
            in_panel = False
        # Handle page offsets
        x = self.panel['x'] - self.page['x']
        y = self.panel['y'] - self.page['y']
        # scale and position on page within panel
        shape_x = (shape_x * self.scale) + x
        shape_y = (shape_y * self.scale) + y
        return {'x': shape_x, 'y': shape_y, 'inPanel': in_panel}

    def draw_rectangle(self, shape):
        """Draw a rectangle shape onto the canvas."""
        top_left = self.panel_to_page_coords(shape['x'], shape['y'])

        # Don't draw if all corners are outside the panel
        top_right = self.panel_to_page_coords(shape['x'] + shape['width'],
                                              shape['y'])
        bottom_left = self.panel_to_page_coords(shape['x'],
                                                shape['y'] + shape['height'])
        bottom_right = self.panel_to_page_coords(shape['x'] + shape['width'],
                                                 shape['y'] + shape['height'])
        if (top_left['inPanel'] is False) and (
                top_right['inPanel'] is False) and (
                bottom_left['inPanel'] is False) and (
                bottom_right['inPanel'] is False):
            return

        width = shape['width'] * self.scale
        height = shape['height'] * self.scale
        x = top_left['x']
        y = self.page_height - top_left['y']    # - height

        rgb = self.get_rgb(shape['strokeColor'])
        r = float(rgb[0])/255
        g = float(rgb[1])/255
        b = float(rgb[2])/255
        self.canvas.setStrokeColorRGB(r, g, b)
        stroke_width = shape.get('strokeWidth', 2)
        self.canvas.setLineWidth(stroke_width)

        rotation = self.panel['rotation'] * -1
        if rotation != 0:
            self.canvas.saveState()
            self.canvas.translate(x, y)
            self.canvas.rotate(rotation)
            # top-left is now at 0, 0
            x = 0
            y = 0

        self.canvas.rect(x, y, width, height * -1, stroke=1)

        if rotation != 0:
            # Restore coordinates, rotation etc.
            self.canvas.restoreState()

    def draw_line(self, shape):
        """Draw a line shape onto the canvas."""
        start = self.panel_to_page_coords(shape['x1'], shape['y1'])
        end = self.panel_to_page_coords(shape['x2'], shape['y2'])
        x1 = start['x']
        y1 = self.page_height - start['y']
        x2 = end['x']
        y2 = self.page_height - end['y']
        # Don't draw if both points outside panel
        if (start['inPanel'] is False) and (end['inPanel'] is False):
            return

        rgb = self.get_rgb(shape['strokeColor'])
        r = float(rgb[0])/255
        g = float(rgb[1])/255
        b = float(rgb[2])/255
        self.canvas.setStrokeColorRGB(r, g, b)
        stroke_width = shape['strokeWidth']
        self.canvas.setLineWidth(stroke_width)

        p = self.canvas.beginPath()
        p.moveTo(x1, y1)
        p.lineTo(x2, y2)
        self.canvas.drawPath(p, fill=1, stroke=1)

    def draw_arrow(self, shape):
        """Draw an arrow shape onto the canvas."""
        start = self.panel_to_page_coords(shape['x1'], shape['y1'])
        end = self.panel_to_page_coords(shape['x2'], shape['y2'])
        x1 = start['x']
        y1 = self.page_height - start['y']
        x2 = end['x']
        y2 = self.page_height - end['y']
        stroke_width = shape['strokeWidth']
        # Don't draw if both points outside panel
        if (start['inPanel'] is False) and (end['inPanel'] is False):
            return

        rgb = self.get_rgb(shape['strokeColor'])
        r = float(rgb[0])/255
        g = float(rgb[1])/255
        b = float(rgb[2])/255
        self.canvas.setStrokeColorRGB(r, g, b)
        self.canvas.setFillColorRGB(r, g, b)

        head_size = (stroke_width * 4) + 5
        dx = x2 - x1
        dy = y2 - y1

        self.canvas.setLineWidth(stroke_width)

        p = self.canvas.beginPath()
        f = -1
        if dy == 0:
            line_angle = radians(90)
            if dx < 0:
                f = 1
        else:
            line_angle = atan(dx / dy)
            if dy < 0:
                f = 1

        # Angle of arrow head is 0.8 radians (0.4 either side of line_angle)
        arrow_point1_x = x2 + (f * sin(line_angle - 0.4) * head_size)
        arrow_point1_y = y2 + (f * cos(line_angle - 0.4) * head_size)
        arrow_point2_x = x2 + (f * sin(line_angle + 0.4) * head_size)
        arrow_point2_y = y2 + (f * cos(line_angle + 0.4) * head_size)
        arrow_point_mid_x = x2 + (f * sin(line_angle) * head_size * 0.5)
        arrow_point_mid_y = y2 + (f * cos(line_angle) * head_size * 0.5)

        # Draw the line (at lineWidth)
        p.moveTo(x1, y1)
        p.lineTo(arrow_point_mid_x, arrow_point_mid_y)
        self.canvas.drawPath(p, fill=1, stroke=1)

        # Draw the arrow head (at lineWidth: 0)
        self.canvas.setLineWidth(0)
        p.moveTo(arrow_point1_x, arrow_point1_y)
        p.lineTo(arrow_point2_x, arrow_point2_y)
        p.lineTo(x2, y2)
        p.lineTo(arrow_point1_x, arrow_point1_y)
        self.canvas.drawPath(p, fill=1, stroke=1)

    def draw_polygon(self, shape, closed=True):
        """Draw a polygon shape onto the canvas."""
        polygon_in_viewport = False
        points = []
        for point in shape['points'].split(" "):
            # Older polygons/polylines may be 'x,y,'
            xy = point.split(",")
            x = xy[0]
            y = xy[1]
            coords = self.panel_to_page_coords(float(x), float(y))
            points.append([coords['x'], self.page_height - coords['y']])
            polygon_in_viewport = polygon_in_viewport or coords['inPanel']

        # Don't draw if all points outside panel viewport
        if not polygon_in_viewport:
            return

        stroke_width = shape['strokeWidth']
        rgb = self.get_rgb(shape['strokeColor'])
        r = float(rgb[0])/255
        g = float(rgb[1])/255
        b = float(rgb[2])/255
        self.canvas.setStrokeColorRGB(r, g, b)
        self.canvas.setLineWidth(stroke_width)

        p = self.canvas.beginPath()
        # Go to start...
        p.moveTo(points[0][0], points[0][1])
        # ...around other points...

        for point in points[1:]:
            p.lineTo(point[0], point[1])
        # ...and back over first line
        if closed:
            for point in points[0:2]:
                p.lineTo(point[0], point[1])
        self.canvas.drawPath(p, fill=0, stroke=1)

    def draw_polyline(self, shape):
        """Draw a polyline shape onto the canvas."""
        self.draw_polygon(shape, False)

    def draw_ellipse(self, shape):
        """Draw an ellipse shape onto the canvas."""
        stroke_width = shape['strokeWidth']
        c = self.panel_to_page_coords(shape['x'], shape['y'])
        cx = c['x']
        cy = self.page_height - c['y']
        rx = shape['radiusX'] * self.scale
        ry = shape['radiusY'] * self.scale
        rotation = (shape['rotation'] + self.panel['rotation']) * -1
        rgb = self.get_rgb(shape['strokeColor'])
        r = float(rgb[0])/255
        g = float(rgb[1])/255
        b = float(rgb[2])/255
        self.canvas.setStrokeColorRGB(r, g, b)
        # Don't draw if centre outside panel
        if c['inPanel'] is False:
            return

        # For rotation, we reset our coordinates around cx, cy
        # so that rotation applies around cx, cy
        self.canvas.saveState()
        self.canvas.translate(cx, cy)
        self.canvas.rotate(rotation)
        # centre is now at 0, 0
        cx = 0
        cy = 0
        height = ry * 2
        width = rx * 2
        left = cx - rx
        bottom = cy - ry

        # Draw ellipse...
        p = self.canvas.beginPath()
        self.canvas.setLineWidth(stroke_width)
        p.ellipse(left, bottom, width, height)
        self.canvas.drawPath(p, stroke=1)

        # Restore coordinates, rotation etc.
        self.canvas.restoreState()


class ShapeToPilExport(object):
    """
    Class for drawing panel shapes onto a PIL image.

    We get a PIL image, the panel dict, and crop coordinates
    """

    def __init__(self, pil_img, panel, crop):
        """Constructor. Takes PIL image draws shapes from panel JSON."""
        self.pil_img = pil_img
        self.panel = panel
        # The crop region on the original image coordinates...
        self.crop = crop
        self.scale = pil_img.size[0] / crop['width']
        self.draw = ImageDraw.Draw(pil_img)

        if "shapes" in panel:
            for shape in panel["shapes"]:
                if shape['type'] == "Arrow":
                    self.draw_arrow(shape)
                elif shape['type'] == "Line":
                    self.draw_line(shape)
                elif shape['type'] == "Rectangle":
                    self.draw_rectangle(shape)
                elif shape['type'] == "Ellipse":
                    self.draw_ellipse(shape)
                elif shape['type'] == "Polygon":
                    self.draw_polygon(shape)
                elif shape['type'] == "Polyline":
                    self.draw_polyline(shape)

    def get_panel_coords(self, shape_x, shape_y):
        """
        Convert coordinate from the image onto the panel.

        Handles zoom, offset & rotation of panel, rotating the
        x, y point around the centre of the cropped region
        and scaling appropriately
        """
        rotation = self.panel['rotation']
        if rotation != 0:
            # img coords: centre of rotation
            cx = self.crop['x'] + (self.crop['width']/2)
            cy = self.crop['y'] + (self.crop['height']/2)
            dx = cx - shape_x
            dy = cy - shape_y
            # distance of point from centre of rotation
            h = sqrt(dx * dx + dy * dy)
            # and the angle
            angle1 = atan2(dx, dy)

            # Add the rotation to the angle and calculate new
            # opposite and adjacent lengths from centre of rotation
            angle2 = angle1 - radians(rotation)
            newo = sin(angle2) * h
            newa = cos(angle2) * h
            # to give correct x and y within cropped panel
            shape_x = cx - newo
            shape_y = cy - newa

        # convert to coords within crop region
        shape_x = (shape_x - self.crop['x']) * self.scale
        shape_y = (shape_y - self.crop['y']) * self.scale

        return {'x': shape_x, 'y': shape_y}

    def draw_arrow(self, shape):
        """Draw an arrow onto the image."""
        start = self.get_panel_coords(shape['x1'], shape['y1'])
        end = self.get_panel_coords(shape['x2'], shape['y2'])
        x1 = start['x']
        y1 = start['y']
        x2 = end['x']
        y2 = end['y']
        head_size = ((shape['strokeWidth'] * 4) + 5)
        head_size = scale_to_export_dpi(head_size)
        stroke_width = scale_to_export_dpi(shape.get('strokeWidth', 2))
        rgb = ShapeToPdfExport.get_rgb(shape['strokeColor'])

        # Do some trigonometry to get the line angle can calculate arrow points
        dx = x2 - x1
        dy = y2 - y1
        if dy == 0:
            line_angle = radians(90)
        else:
            line_angle = atan(dx / dy)
        f = -1
        if dy < 0:
            f = 1
        # Angle of arrow head is 0.8 radians (0.4 either side of line_angle)
        arrow_point1_x = x2 + (f * sin(line_angle - 0.4) * head_size)
        arrow_point1_y = y2 + (f * cos(line_angle - 0.4) * head_size)
        arrow_point2_x = x2 + (f * sin(line_angle + 0.4) * head_size)
        arrow_point2_y = y2 + (f * cos(line_angle + 0.4) * head_size)
        arrow_point_mid_x = x2 + (f * sin(line_angle) * head_size * 0.5)
        arrow_point_mid_y = y2 + (f * cos(line_angle) * head_size * 0.5)

        points = ((x2, y2),
                  (arrow_point1_x, arrow_point1_y),
                  (arrow_point2_x, arrow_point2_y),
                  (x2, y2)
                  )

        # Draw Line of arrow - to midpoint of head at full stroke width
        self.draw.line([(x1, y1), (arrow_point_mid_x, arrow_point_mid_y)],
                       fill=rgb, width=int(stroke_width))
        # Draw Arrow head, up to tip at x2, y2
        self.draw.polygon(points, fill=rgb, outline=rgb)

    def draw_polygon(self, shape, closed=True):
        """Draw a polygon onto the image."""
        points = []
        for point in shape['points'].split(" "):
            # Older polygons/polylines may be 'x,y,'
            xy = point.split(",")
            x = xy[0]
            y = xy[1]
            coords = self.get_panel_coords(float(x), float(y))
            points.append((coords['x'], coords['y']))

        if closed:
            points.append(points[0])

        stroke_width = scale_to_export_dpi(shape.get('strokeWidth', 2))
        rgb = ShapeToPdfExport.get_rgb(shape['strokeColor'])
        # Draw all the lines (NB: polygon doesn't handle line width)
        self.draw.line(points, fill=rgb, width=int(round(stroke_width)))
        # Draw ellipse at each corner
        # see https://stackoverflow.com/questions/33187698/
        r = (stroke_width/2) * 0.9    # seems to look OK with this size
        if closed:
            corners = points[:]
        else:
            corners = points[1: -1]
        for point in corners:
            self.draw.ellipse((point[0] - r, point[1] - r,
                               point[0] + r, point[1] + r), fill=rgb)

    def draw_polyline(self, shape):
        """Draw a polyline onto the image."""
        self.draw_polygon(shape, False)

    def draw_line(self, shape):
        """Draw a line onto the image."""
        start = self.get_panel_coords(shape['x1'], shape['y1'])
        end = self.get_panel_coords(shape['x2'], shape['y2'])
        x1 = start['x']
        y1 = start['y']
        x2 = end['x']
        y2 = end['y']
        stroke_width = scale_to_export_dpi(shape.get('strokeWidth', 2))
        rgb = ShapeToPdfExport.get_rgb(shape['strokeColor'])

        self.draw.line([(x1, y1), (x2, y2)], fill=rgb, width=int(stroke_width))

    def draw_rectangle(self, shape):
        """Draw a rectangle onto the image."""
        # clockwise list of corner points on the OUTSIDE of thick line
        w = scale_to_export_dpi(shape.get('strokeWidth', 2))
        cx = shape['x'] + (shape['width']/2)
        cy = shape['y'] + (shape['height']/2)
        rotation = self.panel['rotation'] * -1

        # Centre of rect rotation in PIL image
        centre = self.get_panel_coords(cx, cy)
        cx = centre['x']
        cy = centre['y']
        scale_w = w
        rgb = ShapeToPdfExport.get_rgb(shape['strokeColor'])

        # To support rotation, draw rect on temp canvas, rotate and paste
        width = int((shape['width'] * self.scale) + w)
        height = int((shape['height'] * self.scale) + w)
        temp_rect = Image.new('RGBA', (width, height), (255, 255, 255, 0))
        rect_draw = ImageDraw.Draw(temp_rect)

        # Draw outer rectangle, then remove inner rect with full opacity
        rect_draw.rectangle((0, 0, width, height), fill=rgb)
        rgba = (255, 255, 255, 0)
        rect_draw.rectangle((scale_w, scale_w, width-scale_w, height-scale_w),
                            fill=rgba)
        temp_rect = temp_rect.rotate(rotation, resample=Image.BICUBIC,
                                     expand=True)
        # Use rect as mask, so transparent part is not pasted
        paste_x = cx - (temp_rect.size[0]/2)
        paste_y = cy - (temp_rect.size[1]/2)
        self.pil_img.paste(temp_rect, (int(paste_x), int(paste_y)),
                           mask=temp_rect)

    def draw_ellipse(self, shape):
        """Draw an ellipse onto the image."""
        w = int(scale_to_export_dpi(shape.get('strokeWidth', 2)))
        ctr = self.get_panel_coords(shape['x'], shape['y'])
        cx = ctr['x']
        cy = ctr['y']
        rx = self.scale * shape['radiusX']
        ry = self.scale * shape['radiusY']
        rotation = (shape['rotation'] + self.panel['rotation']) * -1
        rgb = ShapeToPdfExport.get_rgb(shape['strokeColor'])

        width = int((rx * 2) + w)
        height = int((ry * 2) + w)
        temp_ellipse = Image.new('RGBA', (width + 1, height + 1),
                                 (255, 255, 255, 0))
        ellipse_draw = ImageDraw.Draw(temp_ellipse)
        # Draw outer ellipse, then remove inner ellipse with full opacity
        ellipse_draw.ellipse((0, 0, width, height), fill=rgb)
        rgba = (255, 255, 255, 0)
        ellipse_draw.ellipse((w, w, width - w, height - w), fill=rgba)
        temp_ellipse = temp_ellipse.rotate(rotation, resample=Image.BICUBIC,
                                           expand=True)
        # Use ellipse as mask, so transparent part is not pasted
        paste_x = cx - (temp_ellipse.size[0]/2)
        paste_y = cy - (temp_ellipse.size[1]/2)
        self.pil_img.paste(temp_ellipse, (int(paste_x), int(paste_y)),
                           mask=temp_ellipse)
