import * as zarr from "zarrita";
import * as omezarr from "ome-zarr.js";
import { slice } from "@zarrita/indexing";
import _ from 'underscore';

const ZARRITA_ARRAY_CACHE = {};
const ZARR_DATA_CACHE = {};

export async function loadZarrForPanel(zarrUrl) {
  let store = new zarr.FetchStore(zarrUrl);

  // we load smallest array. Only need it for min/max values if not in 'omero' metadata
  let datasetIndex = -1;
  const  {arr, shapes, multiscale, omero, scales, zarr_version} = await omezarr.getMultiscaleWithArray(store, datasetIndex);
  console.log({arr, shapes, multiscale, omero, scales, zarr_version})
  let zarrName = zarrUrl.split("/").pop();
  console.log("multiscale", multiscale);
  if (!multiscale) {
    alert(`Failed to load multiscale from ${zarrUrl}`);
    return;
  }

  let imgName = multiscale.name || zarrName;
  let axes = multiscale.axes;
  let axesNames = axes?.map((axis) => axis.name) || ["t", "c", "z", "y", "x"];

  let datasets = multiscale.datasets;
  let zarrays = {};
  // 'consolidate' the metadata for all arrays
  for (let ds of datasets) {
    let path = ds.path;
    let zarray = await fetch(`${zarrUrl}/${path}/.zarray`).then((rsp) =>
      rsp.json()
    );
    zarrays[path] = zarray;
  }
  // store under 'arrays' key
  let zarr_attrs = {
    multiscales: [multiscale],
  }
  zarr_attrs["arrays"] = zarrays;

  let zarray = zarrays[0];
  console.log("zarray", zarray);

  let dtype = zarray.dtype;
  let shape = zarray.shape;
  let dims = shape.length;
  let sizeX = shape[dims - 1];
  let sizeY = shape[dims - 2];
  let sizeZ = 1;
  let sizeT = 1;
  let sizeC = 1;
  if (axesNames.includes("z")) {
    sizeZ = shape[axesNames.indexOf("z")];
  }
  let defaultZ = parseInt(sizeZ / 2);
  if (axesNames.includes("t")) {
    sizeT = shape[axesNames.indexOf("t")];
  }
  let defaultT = parseInt(sizeT / 2);
  if (axesNames.includes("c")) {
    sizeC = shape[axesNames.indexOf("c")];
  }

  // channels...
  // if no omero data, need to construct channels!
  let default_colors = [
    "FF0000",
    "00FF00",
    "0000FF",
    "FFFF00",
    "00FFFF",
    "FFFFFF",
  ];
  let channels = omero?.channels;
  if (!channels) {
    // load smallest array to get min/max values for every channel
    let slices = omezarr.getSlices(_.range(sizeC), shape, axesNames, {});
    let promises = slices.map((chSlice) => zarr.get(arr, chSlice));
    let ndChunks = await Promise.all(promises);

    channels = _.range(sizeC).map((idx) => {
      let mm = omezarr.getMinMaxValues(ndChunks[idx]);
      return {
        label: "Ch" + idx,
        active: true,
        color: default_colors[idx],
        window: {
          min: mm[0],
          max: mm[1],
          start: mm[0],
          end: mm[1],
        },
      };
    });
  }

  let panelX = 0;
  let panelY = 0;
  let coords = {scale: 1};

  // ****** This is the Data Model ******
  //-------------------------------------
  // Any changes here will create a new version
  // of the model and will also have to be applied
  // to the 'version_transform()' function so that
  // older files can be brought up to date.
  // Also check 'previewSetId()' for changes.
  var n = {
    imageId: zarrUrl,
    name: imgName,
    width: sizeX * coords.scale,
    height: sizeY * coords.scale,
    sizeZ: sizeZ,
    theZ: defaultZ,
    sizeT: sizeT,
    theT: defaultT,
    rdefs: { model: "-" },
    channels: channels,
    orig_width: sizeX,
    orig_height: sizeY,
    x: panelX,
    y: panelY,
    // 'datasetName': data.meta.datasetName,
    // 'datasetId': data.meta.datasetId,
    // 'pixel_size_x': data.pixel_size.valueX,
    // 'pixel_size_y': data.pixel_size.valueY,
    // 'pixel_size_z': data.pixel_size.valueZ,
    // 'pixel_size_x_symbol': data.pixel_size.symbolX,
    // 'pixel_size_z_symbol': data.pixel_size.symbolZ,
    // 'pixel_size_x_unit': data.pixel_size.unitX,
    // 'pixel_size_z_unit': data.pixel_size.unitZ,
    // 'deltaT': data.deltaT,
    pixelsType: dtypeToPixelsType(dtype),
    // 'pixel_range': data.pixel_range,
    // let's dump the zarr data into the panel
    zarr: zarr_attrs,
  };
  console.log("Zarr Panel Model", n);

  return n;
}

// e.g. "<u1" -> "uint8"
function dtypeToPixelsType(dtype) {
  let dt = "";
  if (dtype.includes("u")) {
    dt += "uint";
  } else if (dtype.includes("i")) {
    dt += "int";
  } else if (dtype.includes("f")) {
    dt += "float";
  }
  if (dtype.includes("8")) {
    dt += "64";
  } else if (dtype.includes("4")) {
    dt += "32";
  } else if (dtype.includes("2")) {
    dt += "16";
  } else if (dtype.includes("1")) {
    dt += "8";
  }
  return dt;
};

export async function renderZarrToSrc(source, attrs, theZ, theT, channels) {
  let paths = attrs.multiscales[0].datasets.map((d) => d.path);
  let axes = attrs.multiscales[0].axes?.map((a) => a.name) || [
    "t",
    "c",
    "z",
    "y",
    "x",
  ];
  let zarrays = attrs.arrays;

  // Pick first resolution that is below a max size...
  const MAX_SIZE = 2000;
  console.log("Zarr pick size to render...");
  let path;
  for (let p of paths) {
    let arrayAttrs = zarrays[p];
    console.log(path, arrayAttrs);
    let shape = arrayAttrs.shape;
    if (shape.at(-1) * shape.at(-2) < MAX_SIZE * MAX_SIZE) {
      path = p;
      break;
    }
  }

  if (!path) {
    console.error(
      `Lowest resolution too large for rendering: > ${MAX_SIZE} x ${MAX_SIZE}`
    );
    return;
  }

  console.log("Init zarr.FetchStore:", source + "/" + path);
  let storeArrayPath = source + "/" + path;
  let arr;
  if (ZARRITA_ARRAY_CACHE[storeArrayPath]) {
    arr = ZARRITA_ARRAY_CACHE[storeArrayPath];
  } else {
    let store = new zarr.FetchStore(source + "/" + path);
    arr = await zarr.open(store, { kind: "array" });
    ZARRITA_ARRAY_CACHE[storeArrayPath] = arr;
  }

  let chDim = axes.indexOf("c");
  let shape = zarrays[path].shape;
  let dims = shape.length;

  let activeChIndicies = [];
  let colors = [];
  let minMaxValues = [];
  let luts = [];
  let inverteds = [];
  channels.forEach((ch, index) => {
    if (ch.active) {
      activeChIndicies.push(index);
      colors.push(hexToRGB(ch.color));
      minMaxValues.push([ch.window.start, ch.window.end]);
      luts.push(ch.color.endsWith(".lut") ? ch.color : undefined);
      inverteds.push(ch.reverseIntensity);
    }
  });
  console.log("activeChIndicies", activeChIndicies);
  console.log("colors", colors);
  console.log("minMaxValues", minMaxValues);

  let promises = activeChIndicies.map((chIndex) => {
    let sliceKey = [];
    let slices = shape.map((dimSize, index) => {
      // channel
      if (index == chDim) {
        sliceKey.push("" + chIndex);
        return chIndex;
      }
      // x and y
      if (index >= dims - 2) {
        sliceKey.push(`${0}:${dimSize}`);
        return slice(0, dimSize);
      }
      // z
      if (axes[index] == "z") {
        sliceKey.push("" + theZ);
        return theZ;
      }
      if (axes[index] == "t") {
        sliceKey.push("" + theT);
        return theT;
      }
      return 0;
    });
    let cacheKey = `${source}/${path}/${sliceKey.join(",")}`;
    console.log("cacheKey", cacheKey);
    console.log("Zarr chIndex slices:", chIndex, "" + slices);
    console.log("Zarr chIndex shape:", chIndex, shape);
    // TODO: add controller: { opts: { signal: controller.signal } }
    // check cache!
    if (ZARR_DATA_CACHE[cacheKey]) {
      console.log("RETURN cache!", ZARR_DATA_CACHE[cacheKey]);
      return ZARR_DATA_CACHE[cacheKey];
    }

    return zarr.get(arr, slices).then((data) => {
      console.log("populate cache...");
      ZARR_DATA_CACHE[cacheKey] = data;
      return data;
    });
  });

  let ndChunks = await Promise.all(promises);
  console.log(
    "renderTo8bitArray ndChunks, minMaxValues, colors, luts, inverteds",
    ndChunks,
    minMaxValues,
    colors,
    luts,
    inverteds
  );
  let rbgData = omezarr.renderTo8bitArray(
    ndChunks,
    minMaxValues,
    colors,
    luts,
    inverteds
  );

  let width = shape.at(-1);
  let height = shape.at(-2);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.putImageData(new ImageData(rbgData, width, height), 0, 0);
  let dataUrl = canvas.toDataURL("image/png");
  return dataUrl;
}

export function hexToRGB(hex) {
  if (hex.startsWith("#")) hex = hex.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}
