"use strict";
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Ascii3D = api;
})(typeof self !== "undefined" ? self : this, function () {

  const GLYPH_WEIGHTS = { ":": 0.3, ";": 0.3, "+": 0.4, "x": 0.5, "X": 0.6, "$": 0.8, "&": 1.0 };

  const DEFAULTS = {
    cols: 60,
    depth: 7,
    speed: 0.9,
    aspect: 0.5,
    light: [-0.45, -0.65, 0.85],
    ramp: ".,-~:;=!*#$@",
    ambient: 0.16,
    diffuse: 0.6,
    specular: 0.4,
    shininess: 10,
  };

  function parseArt(text) {
    const lines = text.replace(/\r/g, "").split("\n");
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    while (lines.length && lines[0].trim() === "") lines.shift();
    const h = lines.length;
    const w = Math.max(...lines.map((l) => l.length));
    const weights = new Float32Array(w * h);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < lines[row].length; col++) {
        weights[row * w + col] = GLYPH_WEIGHTS[lines[row][col]] || 0;
      }
    }
    return { w, h, weights };
  }

  function blurPass(src, w, h, horizontal) {
    const kernel = [1, 4, 6, 4, 1];
    const out = new Float32Array(w * h);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        let sum = 0;
        let weight = 0;
        for (let k = -2; k <= 2; k++) {
          const r = horizontal ? row : row + k;
          const c = horizontal ? col + k : col;
          if (r < 0 || r >= h || c < 0 || c >= w) continue;
          const kw = kernel[k + 2];
          sum += src[r * w + c] * kw;
          weight += kw;
        }
        out[row * w + col] = sum / weight;
      }
    }
    return out;
  }

  function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function buildModel(art, options) {
    const opts = Object.assign({}, DEFAULTS, options);
    const { w, h, weights } = art;
    const height = blurPass(blurPass(weights, w, h, true), w, h, false);
    let max = 0;
    for (const v of height) if (v > max) max = v;
    const at = (row, col) => {
      if (row < 0 || row >= h || col < 0 || col >= w) return 0;
      return height[row * w + col] / max;
    };
    const yUnit = 1 / opts.aspect;
    const points = [];
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (weights[row * w + col] === 0) continue;
        const hv = at(row, col);
        const gx = (at(row, col + 1) - at(row, col - 1)) / 2;
        const gy = (at(row + 1, col) - at(row - 1, col)) / (2 * yUnit);
        const n = normalize([-opts.depth * gx, -opts.depth * gy, 1]);
        const px = col - (w - 1) / 2;
        const py = (row - (h - 1) / 2) * yUnit;
        const pz = hv * opts.depth;
        points.push({ x: px, y: py, z: pz, nx: n[0], ny: n[1], nz: n[2] });
        points.push({ x: px, y: py, z: -pz, nx: n[0], ny: n[1], nz: -n[2] });
      }
    }
    const maxAbsX = (w - 1) / 2;
    const radius = Math.hypot(maxAbsX, opts.depth);
    const scale = (2 * radius * 1.04) / opts.cols;
    const rows = Math.ceil((h - 1) / scale) + 1;
    return { points, opts, scale, rows, yUnit };
  }

  function renderFrame(model, t) {
    const { points, opts, scale, rows, yUnit } = model;
    const cols = opts.cols;
    const angle = t * opts.speed;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const L = normalize(opts.light);
    const half = normalize([L[0], L[1], L[2] + 1]);
    const ramp = opts.ramp;
    const size = cols * rows;
    const zbuf = new Float32Array(size).fill(-Infinity);
    const lum = new Float32Array(size);
    const hit = new Uint8Array(size);
    for (const p of points) {
      const x = p.x * ca + p.z * sa;
      const z = -p.x * sa + p.z * ca;
      const c = Math.round(x / scale + (cols - 1) / 2);
      const r = Math.round(p.y / (scale * yUnit) + (rows - 1) / 2);
      if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
      const i = r * cols + c;
      if (z <= zbuf[i]) continue;
      zbuf[i] = z;
      const nx = p.nx * ca + p.nz * sa;
      const nz = -p.nx * sa + p.nz * ca;
      const diff = Math.max(0, nx * L[0] + p.ny * L[1] + nz * L[2]);
      const spec = Math.pow(Math.max(0, nx * half[0] + p.ny * half[1] + nz * half[2]), opts.shininess);
      lum[i] = Math.min(1, opts.ambient + opts.diffuse * diff + opts.specular * spec);
      hit[i] = 1;
    }
    const out = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!hit[i]) {
          line += " ";
          continue;
        }
        const idx = Math.min(ramp.length - 1, Math.floor(lum[i] * ramp.length));
        line += ramp[idx];
      }
      out.push(line);
    }
    return out.join("\n");
  }

  return { parseArt, buildModel, renderFrame, DEFAULTS };
});
