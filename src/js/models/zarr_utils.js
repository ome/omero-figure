
import * as zarr from "zarrita";
import * as omezarr from "ome-zarr.js";
import { slice } from "@zarrita/indexing";

const ZARRITA_ARRAY_CACHE = {};
const ZARR_DATA_CACHE = {};

export async function renderZarrToSrc(source, attrs, theZ, theT, channels) {
  let paths = attrs.multiscales[0].datasets.map((d) => d.path);
  let axes = attrs.multiscales[0].axes.map((a) => a.name);
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
    console.error(`Lowest resolution too large for rendering: > ${MAX_SIZE} x ${MAX_SIZE}`);
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

    return zarr.get(arr, slices).then(data => {
      console.log("populate cache...");
      ZARR_DATA_CACHE[cacheKey] = data;
      return data;
    });
  });

  let ndChunks = await Promise.all(promises);
  let rbgData = omezarr.renderTo8bitArray(ndChunks, minMaxValues, colors, luts, inverteds);

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
