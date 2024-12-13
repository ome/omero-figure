
7.2.0 (December 2024)
---------------------

- "Interactive" Inset panels ([#549](https://github.com/ome/omero-figure/pull/549) and [#603](https://github.com/ome/omero-figure/pull/603))
- Use timeIncrement for Time if no plane-info metadata (Thanks to Jens Wendt) ([#589](https://github.com/ome/omero-figure/pull/589))
- Add Hilo Checkbox for LUT Toggling (Thanks to Tehmina Enayat) ([#583](https://github.com/ome/omero-figure/pull/583))
- Support for 'Points' in ROI functionality ([#555](https://github.com/ome/omero-figure/pull/555))
- Add link from Images to Figure in the form of Key-Value pairs (Thanks to Rémy Dornier) ([#584](https://github.com/ome/omero-figure/pull/584))
- Support for ROI Fill Colour (Thanks to Rémy Dornier) ([#577](https://github.com/ome/omero-figure/pull/577))
- Panel Borders (Thanks to Rémy Dornier) ([#578](https://github.com/ome/omero-figure/pull/578))
- Horizontal and Vertical image flipping (Thanks to Tehmina Enayat) ([#591](https://github.com/ome/omero-figure/pull/591))
- Dynamic loading of Look-up Tables (Thanks to Tom Boissonnet) ([#596](https://github.com/ome/omero-figure/pull/596))
- Rotate image panels by 90° (Thanks to Rémy Dornier) ([#595](https://github.com/ome/omero-figure/pull/595))
- File Open filtering by Group and Owner improvements ([#592](https://github.com/ome/omero-figure/pull/592))

Fixes:
- Fix issues with drag sorting of labels (Thanks to Tom Boissonnet) ([#599](https://github.com/ome/omero-figure/pull/599))
- Timestamp loading handles missing planes (Thanks to Tom Boissonnet) ([#598](https://github.com/ome/omero-figure/pull/598))
- Fix Zoom label formatting in PDF export (Thanks to Rémy Dornier) ([#597](https://github.com/ome/omero-figure/pull/597))


7.1.0 (September 2024)
----------------------

- Labels ordering with drag and drop (Thanks to Tehmina Enayat and Tom Boissonnet) ([#575](https://github.com/ome/omero-figure/pull/575))
- Z-projection limits ([#560](https://github.com/ome/omero-figure/pull/560))
- Color-picker behaviour improvements on Chrome (Thanks to Rémy Dornier) ([#576](https://github.com/ome/omero-figure/pull/576))
- Fix formatting of zoom labels (Thanks to Rémy Dornier) ([#581](https://github.com/ome/omero-figure/pull/581))
- Fix panning of Big Images (Thanks to Rémy Dornier) ([#580](https://github.com/ome/omero-figure/pull/580))
- Fix hot-reloading during development (Thanks to Tom Boissonnet) ([#574](https://github.com/ome/omero-figure/pull/574))


7.0.0 (May 2024)
----------------

- Update JavaScript build tools and all JavaScript libraries ([#477](https://github.com/ome/omero-figure/pull/477))
    - This includes an update to the Bootstrap UI framework and Icons library.
	- Please see the PR for more details of the changes
	- Follow-up bug-fix: [#561](https://github.com/ome/omero-figure/pull/561)
- Fix the layering of ROI Shapes so that smaller shapes are always on top and clickable.
    - NB: This was fixed in the separate Shape-Editor repository at [#12](https://github.com/ome/shape-editor/pull/12) (thanks to Rémy Dornier) and this library has now been moved into the omero-figure repository in #477 above.
- Update urls.py to use django.urls.path instead of re_path [#563](https://github.com/ome/shape-editor/pull/563)
- Add script install instructions using webclient (Thanks to Johannes Soltwedel) [#566](https://github.com/ome/shape-editor/pull/566)


6.2.2 (April 2024)
------------------

- Avoid rendering very large planes when exporting Big images ([#553](https://github.com/ome/omero-figure/pull/553))


6.2.1 (April 2024)
------------------

- Fix loss of Zoom data with `Edit ID` feature ([#550](https://github.com/ome/omero-figure/pull/550))
- Fix labels in figures exported as TIFF ([#548](https://github.com/ome/omero-figure/pull/548))


6.2.0 (February 2024)
---------------------

- Labels from Key-Value pairs and Tags on parent objects (Thanks to Tom Boissonnet) ([#525](https://github.com/ome/omero-figure/pull/525))
- Fix enable Save after updating Image IDs (Thanks to Rémy Dornier) ([#544](https://github.com/ome/omero-figure/pull/544))
- Fix cropping of horizontal page layout ([#541](https://github.com/ome/omero-figure/pull/541))
- Integration tests call pytest directly ([#542](https://github.com/ome/omero-figure/pull/542))


6.1.0 (January 2024)
--------------------

Thanks to Rémy Dornier for all the following features:
- Escape label underscores ([#529](https://github.com/ome/omero-figure/pull/529))
- Prevent duplicate labesl ([#530](https://github.com/ome/omero-figure/pull/530))
- Time-index labels support offset ([#524](https://github.com/ome/omero-figure/pull/524))
- Z labels support offset ([#521](https://github.com/ome/omero-figure/pull/521))
- Labels from ALL Key-Value pairs ([#528](https://github.com/ome/omero-figure/pull/528))
- Zoom labels ([#527](https://github.com/ome/omero-figure/pull/527))
- Add Cyan to colour choosers ([#516](https://github.com/ome/omero-figure/pull/516))
- Align panels to right & bottom ([#520](https://github.com/ome/omero-figure/pull/520))
- Right vertical labels ([#519](https://github.com/ome/omero-figure/pull/519))
- Edit ID Z stack ([#518](https://github.com/ome/omero-figure/pull/518))
- Manual Zoom level ([#517](https://github.com/ome/omero-figure/pull/517))

Other changes:
- Avoid font.getSize(), removed in Pillow 10.x ([#523](https://github.com/ome/omero-figure/pull/523))
- Handle image loading errors ([#532](https://github.com/ome/omero-figure/pull/532))

6.0.1 (June 2023)
-----------------

- Make app compatible with Django 4.0.x ([#508](https://github.com/ome/omero-figure/pull/508))

6.0.0 (May 2023)
----------------

- Support scalebar height (Thanks to Julian Hniopek) ([#504](https://github.com/ome/omero-figure/pull/504))
  - This includes an update to the [Figure file format](https://github.com/ome/omero-figure/blob/master/docs/figure_file_format.rst)
- Default file name `YYYY-MM-DD_hh-mm-ss` (Thanks to Tom Boissonnet) ([#497](https://github.com/ome/omero-figure/pull/497))

5.1.0 (November 2022)
---------------------

- Time offset and precision formatting for labels (Thanks to Tom Boissonnet) ([#481](https://github.com/ome/omero-figure/pull/481))

5.0.0 (August 2022)
-------------------

- Support more dynamic label options (Thanks to Tom Boissonnet) ([#472](https://github.com/ome/omero-figure/pull/472))
  - This includes an update to the [Figure file format](https://github.com/ome/omero-figure/blob/master/docs/figure_file_format.rst)
- Add custom gap size between image panels ([#470](https://github.com/ome/omero-figure/pull/470))
- Channel sliders handle floating-point images ([#468](https://github.com/ome/omero-figure/pull/468))
- Fix legend button overlaying right-panel menus ([#474](https://github.com/ome/omero-figure/pull/474))

4.4.3 (March 2022)
------------------

- Make app compatible with Django 1.11.x and 3.2.x ([#456](https://github.com/ome/omero-figure/pull/456))

4.4.2 (March 2022)
------------------

- Pin omero-web version to 5.14.0 ([#458](https://github.com/ome/omero-figure/pull/458))

4.4.1 (October 2021)
--------------------

- Security vulnerability fixes for
  [2021-SV3](https://www.openmicroscopy.org/security/advisories/2021-SV3)

4.4.0 (February 2021)
----------------------

- Move Figures to different Groups in OMERO ([#416](https://github.com/ome/omero-figure/pull/416))
- Fix handling of rotation when cropping panels ([#410](https://github.com/ome/omero-figure/pull/410))
- Handle Save errors and recover from local storage ([#415](https://github.com/ome/omero-figure/pull/415))
- Support loading larger numbers of ROIs from OMERO ([#422](https://github.com/ome/omero-figure/pull/422))
- Fix duplicate labels from Key-Value pairs ([#414](https://github.com/ome/omero-figure/pull/414))
- Show scalebar label by default ([#413](https://github.com/ome/omero-figure/pull/413))
- Fix scalebar units in exported PDF info page ([#412](https://github.com/ome/omero-figure/pull/412))
- Bundle jQuery libraries, independently from webclient ([#417](https://github.com/ome/omero-figure/pull/417))
- Fix figure export error from Rectange strokeWidth ([#426](https://github.com/ome/omero-figure/pull/426))

4.3.2 (September 2020)
----------------------

- Replace cgi.escape by html.escape ([#396](https://github.com/ome/omero-figure/pull/396)). Thanks to 
Damien Goutte-Gattat.
- Re-organise github-pages prior to migraton to master ([#399](https://github.com/ome/omero-figure/pull/399))
- Merge github-pages into master ([#400](https://github.com/ome/omero-figure/pull/400))

4.3.1 (May 2020)
----------------

- Add OMERO.figure JSON documentation ([#391](https://github.com/ome/omero-figure/pull/391))


4.3.0 (May 2020)
----------------

- Add support for timestamps in milliseconds ([#378](https://github.com/ome/omero-figure/pull/378))
- Show other users' files to Public user ([#362](https://github.com/ome/omero-figure/pull/362))
- Fix saving of Figures with no panels ([#363](https://github.com/ome/omero-figure/pull/363))
- Fix enable of Save when nudge panels ([#376](https://github.com/ome/omero-figure/pull/376))
- Fix channel label mismatch between panels ([#377](https://github.com/ome/omero-figure/pull/377))
- PDF Scalebar info ignores hidden scalebars ([#381](https://github.com/ome/omero-figure/pull/381))
- Fix formatting of negative timestamps ([#383](https://github.com/ome/omero-figure/pull/383))

4.2.0 (January 2020)
--------------------

- Drop support for Python 2
- Fix export of rectangles ([#342](https://github.com/ome/omero-figure/pull/342))

4.1.0 (October 2019)
--------------------

- Creation of figure labels from Map Annotations ([#323](https://github.com/ome/omero-figure/pull/323))
- Improve Description of Images created by export of figure ([#329](https://github.com/ome/omero-figure/pull/329))
- Show channel names in the Preview panel ([#333](https://github.com/ome/omero-figure/pull/333))

4.0.2 (October 2018)
--------------------

- Add new functionalities to the script used to export PDF/TIFF so that other tools can use the script. The changes are not yet used by OMERO.figure. Thanks to Andreas Knab ([#306](https://github.com/ome/omero-figure/pull/306))

4.0.1 (August 2018)
-------------------

- Fix rendering of big tiled images using Pillow 4.2 ([#300](https://github.com/ome/omero-figure/pull/300))
- Fix scalebar length on exported TIFF figures for big images ([#304](https://github.com/ome/omero-figure/pull/304))
- Z and T slider usability improvements ([#303](https://github.com/ome/omero-figure/pull/303))
- Fix dropdown choosers for labels on touch-enabled Windows machines ([#301](https://github.com/ome/omero-figure/pull/301))
- Export handles missing dx and dy attributes. Thanks to David Pinto ([#294](https://github.com/ome/omero-figure/pull/294))

4.0.0 (May 2018)
----------------

- Support for big (tiled) Images. This is a major change ([#243](https://github.com/ome/omero-figure/pull/243))
- Allow loading Polygons and Polylines from OMERO to add to Images ([#253](https://github.com/ome/omero-figure/pull/253))
- Open-with Figure and adding Images now preserves the order of Images ([#275](https://github.com/ome/omero-figure/pull/275))
- Support for adding label of T-index to time-lapse Images ([#276](https://github.com/ome/omero-figure/pull/276))
- Show a spinner while loading new Images ([#279](https://github.com/ome/omero-figure/pull/279))
- Stroke-width of ROIs are now based on page points, not on panel pixel sizes ([#281](https://github.com/ome/omero-figure/pull/281))

Developers:

- Use test_infra to test listing of figure files ([#270](https://github.com/ome/omero-figure/pull/270))
- Breaking change in figure JSON model. Stroke-widths changed (see above) and export-dpi renamed to min-export-dpi
- Use shape-editor 4.0.0 to support Polygons and Polylines ([#253](https://github.com/ome/omero-figure/pull/253)) and not scale stroke-width

This release also upgrades the required version of OMERO
to 5.4.0 or newer.

3.2.1 (February 2018)
---------------------

- Fix exporting of unsaved figures ([#269](https://github.com/ome/omero-figure/pull/269))

3.2.0 (January 2018)
--------------------

 - Cropping of the page to fit around image panels ([#252](https://github.com/ome/omero-figure/pull/252))
 - Creation of new labels from Tags on the image ([#254](https://github.com/ome/omero-figure/pull/254))
 - Allow renaming of saved figures ([#251](https://github.com/ome/omero-figure/pull/251))
 - Fix export of multi-page PDF info section with ReportLab 3.4.0 ([#260](https://github.com/ome/omero-figure/pull/260))
 - Fix display of Z and T index ranges in crop dialog ([#258](https://github.com/ome/omero-figure/pull/258))
 - Fix listing of files in the Files > Open dialog when user has middle name ([#247](https://github.com/ome/omero-figure/pull/247))

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

- Add support for italics and bold in panel labels using markdown syntax ([#209](https://github.com/ome/omero-figure/pull/209))
- Allow export of a figure as new OMERO Images (one per page) ([#210](https://github.com/ome/omero-figure/pull/210))
- Allow to change the background colour of the pages ([#211](https://github.com/ome/omero-figure/pull/211))
- Make the json file human readable ([#212](https://github.com/ome/omero-figure/pull/212))
- Fix slider range issue when min pixel intensity is greater than 9999 ([#213](https://github.com/ome/omero-figure/pull/213))
- Allow to script various changes to the figure from the browser devtools console ([#216](https://github.com/ome/omero-figure/pull/216))
- Add support for Reverse Intensity ([#219](https://github.com/ome/omero-figure/pull/219))
- Remove unused dependencies ([#223](https://github.com/ome/omero-figure/pull/223))

3.0.0 (April 2017)
------------------

- Load ROIs from OMERO to add new Shapes to your figure ([#190](https://github.com/ome/omero-figure/pull/190))
- Shapes can be selected to add to the image within the figure
- Set an explicit x, y, width and height for selected panels ([#169](https://github.com/ome/omero-figure/pull/169))
- When resizing panels, you can enforce the current aspect ratio ([#193](https://github.com/ome/omero-figure/pull/193))
- Choose look-up tables from those provided by OMERO
- Can render each channel with a different look-up table
- Additional look-up tables can be added to the OMERO.server
- Support for the new 'open-with' functionality
- Rendering setting inputs for channels allow entering of numbers instead of only using sliders ([#166](https://github.com/ome/omero-figure/pull/166))
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

- Faster listing of files in File > Open dialog [#145](https://github.com/ome/omero-figure/pull/145)
- Improved filtering of listed files by name [#147](https://github.com/ome/omero-figure/pull/147)
- Fix a bug in rotating labels when exporting as TIFF [#140](https://github.com/ome/omero-figure/pull/140)
- Fix pixel sizes for images with custom pixel size units (not microns) [#144](https://github.com/ome/omero-figure/pull/144)

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
