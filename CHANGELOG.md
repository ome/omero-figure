4.0.2 (September 2018)
----------------------

- Add new functionalities to the script used to export PDF/TIFF so that other tools can use the script. The changes are not yet used by OMERO.figure. Thanks to Andreas Knab (PR #306)

4.0.1 (August 2018)
-------------------

- Fix rendering of big tiled images using Pillow 4.2 (PR #300)
- Fix scalebar length on exported TIFF figures for big images (PR #304)
- Z and T slider usability improvements (PR #303)
- Fix dropdown choosers for labels on touch-enabled Windows machines (PR #301)
- Export handles missing dx and dy attributes. Thanks to David Pinto (PR #294)

4.0.0 (May 2018)
----------------

- Support for big (tiled) Images. This is a major change (PR #243)
- Allow loading Polygons and Polylines from OMERO to add to Images (PR #253)
- Open-with Figure and adding Images now preserves the order of Images (PR #275)
- Support for adding label of T-index to time-lapse Images (PR #276)
- Show a spinner while loading new Images (PR #279)
- Stroke-width of ROIs are now based on page points, not on panel pixel sizes (PR #281)

Developers:

- Use test_infra to test listing of figure files (PR #270)
- Breaking change in figure JSON model. Stroke-widths changed (see above) and export-dpi renamed to min-export-dpi
- Use shape-editor 4.0.0 to support Polygons and Polylines (PR #253) and not scale stroke-width

This release also upgrades the required version of OMERO
to 5.4.0 or newer.

3.2.1 (February 2018)
---------------------

- Fix exporting of unsaved figures (PR #269)

3.2.0 (January 2018)
--------------------

 - Cropping of the page to fit around image panels (PR #252)
 - Creation of new labels from Tags on the image (PR #254)
 - Allow renaming of saved figures (PR #251)
 - Fix export of multi-page PDF info section with ReportLab 3.4.0 (PR #260)
 - Fix display of Z and T index ranges in crop dialog (PR #258)
 - Fix listing of files in the Files > Open dialog when user has middle name (PR #247)

3.1.2 (October 2017)
--------------------

- Fix display of channel buttons in IE11
- Add IDR figure to demo
- Remove extra computation when converting radians and degrees (thanks to https://github.com/carandraug)

3.1.1 (July 2017)
-----------------

- Fix export of figures created before the introduction of the Reverse Intensity feature in OMERO 5.3.0
- Fix label of channels with LUT assigned. This fixes the failure when exporting the figure
- Set the background color of all pages when exporting a figure on multiple pages

3.1.0 (June 2017)
-----------------

- Add support for italics and bold in panel labels using markdown syntax (PR #209)
- Allow export of a figure as new OMERO Images (one per page) (PR #210)
- Allow to change the background colour of the pages (PR #211)
- Make the json file human readable (PR #212)
- Fix slider range issue when min pixel intensity is greater than 9999 (PR #213)
- Allow to script various changes to the figure from the browser devtools console (PR #216)
- Add support for Reverse Intensity (PR #219)
- Remove unused dependencies (PR #223)

3.0.0 (April 2017)
------------------

- Load ROIs from OMERO to add new Shapes to your figure (PR #190)
- Shapes can be selected to add to the image within the figure
- Set an explicit x, y, width and height for selected panels (PR #169)
- When resizing panels, you can enforce the current aspect ratio (PR #193)
- Choose look-up tables from those provided by OMERO
- Can render each channel with a different look-up table
- Additional look-up tables can be added to the OMERO.server
- Support for the new 'open-with' functionality
- Rendering setting inputs for channels allow entering of numbers instead of only using sliders (PR #166)
- flake8 and pep8 compatible
- Use valid SPDX license expression

2.0.1 (September 2016)
----------------------

- Fix in app distribution from PyPI

2.0.0 (September 2016)
----------------------

- Rename repository
- Reorganize packages
- Set up distribution from Python Package Index PyPI

1.2.1 (April 2016)
------------------

- Faster listing of files in File > Open dialog #145
- Improved filtering of listed files by name #147
- Fix a bug in rotating labels when exporting as TIFF #140
- Fix pixel sizes for images with custom pixel size units (not microns) #144

1.2.0 (November 2015)
---------------------

Introduce support for illustrative ROIs on figure panels.
ROIs drawn in OMERO.figure cannot yet be saved as new ROIs on the OMERO server
and it is not yet possible to load ROIs from OMERO to use in OMERO.figure.

- ROIs can be drawn on individual panels
- Currently supports rectangle, line, arrow and ellipse
- ROIs can be copied and pasted between panels
- Rectangles can be pasted as a crop region on another panel

Known Issues:

- The ROI viewer for drawing and editing ROIs does not support rotated image panels. Therefore, rotated panels are displayed without rotation while adding ROIs in the ROI viewer
- Rectangle ROIs cannot be rotated. Therefore, crop regions from rotated images will lose their rotation when pasted to create ROI rectangles
- ROIs extending outside of panels are not cropped to the panel when exported to PDF
- Some of these issues are demonstrated in the video above

1.1.1 (May 2015)
----------------

- Fix a bug with exporting a figure before saving it
- Fix a bug with layout of newly-added big images
- Figure legend can now be accessed under menu: ‘File’ > ‘Add Figure Legend’
- Add a README.txt file to zip files when exporting figure with panels as separate images
- Crop dialog is initially populated with the current crop region
- Slight increase in scalebar thickness to improve visibility

1.1.0 (April 2015)
------------------

Multiple page figures:

- Under File > Page Setup you can choose up to 10 pages for the figure
- Pages are laid out in a grid on the canvas and image panels can be dragged across the canvas onto the chosen page
- Export will generate a multi-page PDF document or multiple TIFF images

Crop to region or ROI:

- A crop button beside the panel zoom slider launches a crop dialog
- The crop region can be manually chosen by dragging to select an area of the displayed image
- Alternatively, existing Rectangular ROIs on the image will be loaded from OMERO and can be picked as a crop region

Set dpi of panel images:

- On the ‘Info’ tab, you can set a minimum resolution for image panels when they are embedded within the PDF figure on export. For example, 300 dpi is required by many journals
- The Info tab will then display the ‘current’ dpi in the figure alongside the export dpi
- When the figure is exported as PDF, the resolution of these panels will be boosted if it is less than the chosen export dpi
- Additional pixels will be created in the image and the data resampled using a bicubic filter

Export of figures as TIFFs:

- You can now choose to export the figure as a TIFF image at 300 dpi
- This matches the submission format for many journals and allows easy embedding in presentations
- Images are resampled using a bicubic filter to match the final figure dpi
- Multi-page figures will be exported as multiple TIFFs in a zip file
- A PDF info page is also included if your export is in a zip

Export of panel images alongside figure:

	- An additional export option allows the constituant images within a figure to be exported alongside the figure as TIFFs.
	- For each image panel, the full sized TIFF of the image is exported, as well as the cropped and rotated TIFF that is embedded within the PDF or TIFF figure.
	- If images are resampled to increase their dpi, they will be saved before and after resampling.
	- This provides greater clarity as to the processing steps used in generating the figure and the TIFF images could also be used for creating figures in other applications.

Figure legend:

- Legends can be added to figures and will be included in the info PDF page when the figure is exported
- You can use Markdown syntax to add simple formatting, such as bold and italics. Other formatting is supported in the web view, but may not be displayed properly in the exported PDF info page

Other features:

- When multiple panels are selected, they can be automatically resized to “Align their Magnification” such that features appear the same size in all panels
- Labels can be added to Scalebars to indicate their length.
- A color picker allows any color to be chosen for image channels and labels.
- Units support: If used with OMERO 5.1, the pixel size units in imported images will be used for scale bar labels
- Unicode support: Figures can now contain special characters.
- Figure export errors are now handled with an error button which displays the error in a new browser tab.

Bug fixes:
- Fix label & scalebar colors in PDF figure export

1.0.1 (April 2015)
------------------

Version compatible with OMERO 5.1.0

1.0.0 (October 2014)
--------------------

- Initial Release