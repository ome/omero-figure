
OMERO.figure files
==================

OMERO.figure files are JSON data, stored in OMERO as OriginalFiles linked to FileAnnotations.

File Annotations
----------------

The FileAnnotations are identified as OMERO.figure files using the namespace ``omero.web.figure.json``.

The description of the FileAnnotation can be used to specify an Image to show as a thumbnail
in the File > Open listing of files::

    {
        "imageId": 123,
        // only needed if image comes from a different server
        "baseUrl": "demo.openmicroscopy.org",
    }

In general, OMERO.figure FileAnnotations are *not* linked to any Images because this would
display them in the client UI alongside a delete button, allowing the user to accidentally delete
the file, particularly since they may not recognize the file.

JSON format
-----------

The JSON data format consists of a single object that represents the figure and contains a list of ``panels``.
There are a number of versions of the format, with minor differences between them. If you
open an older version in the OMERO.figure app, it will handle the update and the file will
be saved using the latest version.
However, the figure export script may not handle older versions.

This is an example of a minimal OMERO.figure JSON file::


    {
    // see older versions below
    "version": 7,
    "panels": [
        {
            // position of the panel on the page
            "x": 200.0,
            "y": 200.0,
            "width": 150,
            "height": 100,
            // Z and T index
            "theZ": 0,
            "theT": 0,
            // channel info & rendering settings
            "channels": [
                {
                    "label": "528.0",
                    "color": "00FF00",
                    "window": {
                        "min": 0,
                        "max": 1542.5,
                        "start": 0,
                        "end": 1542.5
                    },
                    "active": true
                }
            ],
            // Image metadata
            "imageId": 1267,
            "name": "U20S-RCC1.11_R3D_FRAP.dv",
            "sizeZ": 1,
            "sizeT": 64,
            "orig_width": 200,
            "orig_height": 200,
        }
    ],
    }


Optional settings for each panel::

    // pixel size x allows user to add scalebar
    "pixel_size_x": 0.107,
    "pixel_size_y": 0.107,          // not used yet
    "pixel_size_x_symbol": 'µm',    // µm by default
    // options are omero.model.LengthI.SYMBOLS.keys()
    "pixel_size_x_unit": 'MICROMETER',

    // pixel size z to show z position in labels
    "pixel_size_z": 0.32,
    "pixel_size_z_symbol": 'µm',    // µm by default
    "pixel_size_z_unit": 'MICROMETER',

    // show a scalebar
    "scalebar": {
        "show": true,
        "length": 10,
        "height": 3,
        "units": "MICROMETER",
        "position": "bottomright",  // topright, topleft, bottomleft
        "color": "FFFFFF",
        "show_label": true,
        "font_size": "14"
    },

    // Timestamps in seconds, 1 per T-index. Used for time-stamp labels and T-slider
    "deltaT": [
        -0.94, -0.61, -0.28, 0.05, 0.33, 0.65
    ],

    // labels on the panel
    // positions are: top, left, right, leftvert, rightvert, bottom, topleft, topright, bottomleft, bottomright
    "labels": [
        {
            "text": "GFP-INCENP",
            "size": 12,
            "position": "top",
            "color": "00FF00"
        },
        {
            // Dynamic properties: text in labels in the form '[property.format]'
            // are dynamically replaced by the specified values

            // for 'time' property, 'format' one of: index (show 1-based T index), milliseconds,
            // secs, mins:secs, mins, hrs:mins, hrs:mins:secs,
            "text": "[time.milliseconds]",
            "size": "12",
            "position": "topleft",
            "color": "FFFFFF"
        },
        {
            // for 'x' and 'y' property, 'format' one of: pixel, unit
            "text": "X: [x.pixel] - Y: [y.pixel]",
            "size": "12",
            "position": "topright",
            "color": "FFFFFF"
        },
        {
            // for 'time', 'x', 'y', 'width' and 'height', decimal precision
            // parameter can be passed (here 2)
            // 'time' can also be passed an offset parameter (relative to a frame, here n°3)
            "text": "Time (s): [time.secs; precision=2; offset=3]",
            "size": "12",
            "position": "topright",
            "color": "FFFFFF"
        }
    ],

    // Shapes on the image. More details below
    "shapes": [
        {
            "type": "Rectangle",
            "x": 54.1,
            "y": 89.4,
            "width": 64.3,
            "height": 58.18,
            "strokeWidth": 2,
            "strokeColor": "#FFFF00",
        }
    ],

    // viewport percent zoom and offset from centre
    zoom: 100,
    dx: 0,
    dy: 0,

    // panel rotation in degrees clockwise
    rotation: 0,
    // rotation symbol to display in label
    rotation_symbol:'°',


Optional settings for the top-level figure object. If not specified,
the following defaults will be used::

    // options: A0, A1, A2, A3, A4, letter, mm - used for paper setup menu
    'page_size': 'A4',
    // define the actual size (should correspond to 'page_size')
    // These are used unless page_size is 'mm'
    'paper_width': 595,
    'paper_height': 842,
    'page_color': 'FFFFFF',
    'page_count': 1,
    'orientation': 'vertical',
    // If using page_size mm, 
    'width_mm': 210,
    'height_mm': 297,
    'legend': '',       // Figure legend in markdown format.
    'legend_collapsed': true,   // collapse or expand legend

NB: Sizes in mm should correspond to page_size.
A4: 210 x 297, A3: 297 x 420, A2: 420 x 594, A1: 594 x 841,
A0: 841 x 1189, letter: 216 x 280.
To convert mm to points (for paper_width and paper_height) multiply by 72 (dpi) / 25.4 (mm per inch).


Shapes on a panel use the Image coordinates. However, ``strokeWidth`` uses Page units (points), so
that lines will not appear thicker on a panel when it is zoomed in. Supported Shapes are::

    {
        "type": "Rectangle",
        "x": 54.1,
        "y": 89.4,
        "width": 64.3,
        "height": 58.18,
        "strokeWidth": 2,
        "strokeColor": "#FFFFFF",
    },
    {
        "type", "Ellipse",
        "x": 23.8,
        "y": 181.0,
        "radiusX": 45.5,
        "radiusY": 65.4,
    },
    {
        "type": "Line",
        "x1": 126.3,
        "x2": 144.9,
        "y1": 84.0,
        "y2": 122.6,
    },
    {
        "type": "Arrow",
        "x1": 88.0,
        "x2": 48.2,
        "y1": 142.0,
        "y2": 110.9,
    },
        "type": "Polyline",
        "points": "75.1,95.8 130.5,82.7 144.1,119.4 19.2,146.6",
    },
    {
        "type": "Polygon",
        "points": "105.4,63.1 98.2,85.1 117.2,109.2 165.4,97.7",
    }


Version history
----------------

New in version 7:

- `scalebar`: added 'height': <integer>

New in version 6:

- 'label': 'time':'seconds' changed to 'text':'[time.seconds]' (for all timestamp formats)
- 'panel': z pixel properties added ('pixel_size_z', 'pixel_size_z_symbol', 'pixel_size_z_unit')

New in version 5:

- `scalebar`: added 'pixel_size_x_unit': "MICROMETER". 
- 'panel': `deltaT` values loaded with rounding to integer seconds

New in version 4:

- 'shape': 'lineWidth' renamed to 'strokeWidth'

New in version 3:

- 'panel': rename 'export_dpi' attr to 'min_export_dpi'
- 'shape': 'strokeWidth' defined in 'page' units, not in panel pixel units.
      This means that zooming a panel doesn't change the thickness of shape
      lines on the page.

New in version 2:

- 'shape': Ellipse uses x, y, radiusX, radiusY, instead of cx, cy, rx, ry.

New in version 1:

- 'panel': uses 'pixel_size_x' and 'pixel_size_y', instead of only 'pixel_size'.
