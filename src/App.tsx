import { useState, useMemo } from 'react';
import { createNoise4D } from 'simplex-noise';

// Predefined camo palettes with authentic color ratios
const PRESETS = {
  // PLA Type 07 Variations
  'PLA Type 07 Universal': ['#9C9C98', '#6A6F62', '#867664', '#3E423B'],
  'PLA Type 07 Oceanic': ['#E1E8E6', '#87AEC6', '#497F9A', '#1E4957'],
  'PLA Type 07 09 Aviation': ['#BAC4D1', '#9BA5B1', '#21335A', '#CF9C52', '#2B313D'],
  'PLA Type 07 Urban': ['#C9DFF1', '#7DA8C9', '#195B9A', '#1A2A3A'],
  'PLA Type 07 Special Forces': ['#E2DFD3', '#8A9771', '#4F613E', '#263428'],
  'PLA Type 07 Arid': ['#D5C9B3', '#9D8369', '#786955', '#494035'],
  'PLA Type 07 Woodland': ['#9C9A86', '#59694D', '#36402A', '#161914'],
  // PLA Type 19 (Starry Sky) Variations
  'PLA Type 19 Woodland': ['#A69C82', '#697455', '#4B4F36', '#262420', '#181A16'],
  'PLA Type 19 Jungle': ['#849767', '#566A3D', '#3D4926', '#29321B', '#11150C'],
  'PLA Type 19 Desert': ['#D6C7AE', '#BCA082', '#96785D', '#634E3B', '#382A20'],
  'PLA Type 19 Arid': ['#C1B49A', '#8F8265', '#6D7155', '#474232', '#222019'],
  'PLA Type 19 Urban': ['#B5B8B9', '#8C9194', '#666B6E', '#42464A', '#1C1E20'],
  // US & NATO
  'UCP': ['#D4D2C5', '#9E9F9D', '#7D827A'],
  'MARPAT Woodland': ['#A2A581', '#485A42', '#5B4C3E', '#1A1A1A'],
  'CADPAT TW': ['#9FA887', '#566E3D', '#364929', '#1A1A1A'],
  'NWU Type I': ['#495665', '#2C3A4A', '#8193A5', '#161920'],
  'AOR1 Desert': ['#D9C5A7', '#B89B78', '#8B735A', '#F0E7D2', '#6B5B49'],
  'AOR2 Woodland': ['#C5C6A4', '#76815B', '#4E5D3C', '#2C3728', '#171A14'],
  'M90K Digital': ['#D8C59E', '#AA8F62', '#7B704F', '#4A513B', '#242920'],
  'EMR Digital Flora': ['#9A8E6F', '#6E7654', '#48543A', '#2F3829', '#141812'],
  'MM14 Ukraine': ['#B5B3A3', '#7B8271', '#5F6658', '#3F473C', '#20251F'],
  'DPM Digital Temperate': ['#B4AD86', '#68734D', '#485436', '#3F3429', '#14120F'],
  'Desert Pixel Steppe': ['#D7C6A8', '#B99A75', '#8B6F55', '#62503F', '#F0E4C7'],
  'Snow Digital': ['#F0F2EF', '#CED8DC', '#9EABB2', '#5C6870', '#20272E'],
  // Commercial & Generic
  'Canyon Blue Trail': ['#E6DEC7', '#CBB894', '#A8A98D', '#7C8A7A', '#5D6F72', '#4B6285', '#2E3A4D', '#11161E'],
  'Desert Digital': ['#E1D3B5', '#D2B99B', '#A78C69', '#78624E'],
  'Urban Digital': ['#E0E0E0', '#9E9E9E', '#616161', '#212121'],
};

const PRESET_GROUPS = {
  'PLA Type 07': ['PLA Type 07 Universal', 'PLA Type 07 Oceanic', 'PLA Type 07 09 Aviation', 'PLA Type 07 Urban', 'PLA Type 07 Special Forces', 'PLA Type 07 Arid', 'PLA Type 07 Woodland'],
  'PLA Type 19': ['PLA Type 19 Woodland', 'PLA Type 19 Jungle', 'PLA Type 19 Desert', 'PLA Type 19 Arid', 'PLA Type 19 Urban'],
  'US & NATO': ['UCP', 'MARPAT Woodland', 'CADPAT TW', 'NWU Type I', 'AOR1 Desert', 'AOR2 Woodland'],
  'Global Digital': ['M90K Digital', 'EMR Digital Flora', 'MM14 Ukraine', 'DPM Digital Temperate', 'Desert Pixel Steppe', 'Snow Digital'],
  'Commercial / Generic': ['Canyon Blue Trail', 'Desert Digital', 'Urban Digital']
};

type PresetName = keyof typeof PRESETS;
type DesignMode = 'none' | 'micro-cut' | 'step-cut' | 'block-weave';
type PatternModel = 'fractal' | 'digital-mosaic';
type PatternProfile = {
  scale: number;
  octaves: number;
  edgeRoughness: number;
  clustering: number;
  horizontalCondense: number;
  verticalCondense: number;
  coverageBias: number;
  designMode: DesignMode;
  designAmount: number;
  baseOpacity: number;
  seed: number;
  patternModel: PatternModel;
  colorWeights?: number[];
};

const DEFAULT_PROFILE: PatternProfile = {
  scale: 4.0,
  octaves: 3,
  edgeRoughness: 0.9,
  clustering: 0.65,
  horizontalCondense: 0.55,
  verticalCondense: 1.45,
  coverageBias: 0,
  designMode: 'step-cut',
  designAmount: 0.45,
  baseOpacity: 1,
  seed: 888888,
  patternModel: 'fractal',
};

const PRESET_PROFILE_OVERRIDES: Partial<Record<PresetName, Partial<PatternProfile>>> = {
  'PLA Type 07 Universal': { patternModel: 'digital-mosaic', scale: 6.1, octaves: 2, edgeRoughness: 0.45, clustering: 0.95, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -2, designMode: 'none', designAmount: 0.25, seed: 700101, colorWeights: [0.36, 0.28, 0.22, 0.14] },
  'PLA Type 07 Oceanic': { patternModel: 'digital-mosaic', scale: 6.4, octaves: 2, edgeRoughness: 0.42, clustering: 1.02, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -1, designMode: 'none', designAmount: 0.2, seed: 700102, colorWeights: [0.34, 0.3, 0.22, 0.14] },
  'PLA Type 07 09 Aviation': { patternModel: 'digital-mosaic', scale: 5.9, octaves: 2, edgeRoughness: 0.5, clustering: 1.05, horizontalCondense: 1.05, verticalCondense: 1.0, coverageBias: -1, designMode: 'none', designAmount: 0.2, seed: 700103, colorWeights: [0.28, 0.24, 0.2, 0.14, 0.14] },
  'PLA Type 07 Urban': { patternModel: 'digital-mosaic', scale: 6.2, octaves: 2, edgeRoughness: 0.38, clustering: 1.08, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -3, designMode: 'none', designAmount: 0.18, seed: 700104, colorWeights: [0.33, 0.28, 0.24, 0.15] },
  'PLA Type 07 Special Forces': { patternModel: 'digital-mosaic', scale: 5.7, octaves: 2, edgeRoughness: 0.52, clustering: 0.9, horizontalCondense: 0.95, verticalCondense: 1.1, coverageBias: -1, designMode: 'micro-cut', designAmount: 0.35, seed: 700105, colorWeights: [0.3, 0.26, 0.22, 0.22] },
  'PLA Type 07 Arid': { patternModel: 'digital-mosaic', scale: 6.0, octaves: 2, edgeRoughness: 0.4, clustering: 0.9, horizontalCondense: 1.05, verticalCondense: 1.0, coverageBias: 3, designMode: 'none', designAmount: 0.2, seed: 700106, colorWeights: [0.36, 0.28, 0.22, 0.14] },
  'PLA Type 07 Woodland': { patternModel: 'digital-mosaic', scale: 5.8, octaves: 2, edgeRoughness: 0.48, clustering: 0.96, horizontalCondense: 0.95, verticalCondense: 1.05, coverageBias: -1, designMode: 'none', designAmount: 0.22, seed: 700107, colorWeights: [0.32, 0.28, 0.22, 0.18] },

  'PLA Type 19 Woodland': { patternModel: 'digital-mosaic', scale: 6.3, octaves: 2, edgeRoughness: 0.35, clustering: 1.12, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -2, designMode: 'none', designAmount: 0.2, seed: 701101, colorWeights: [0.25, 0.23, 0.2, 0.18, 0.14] },
  'PLA Type 19 Jungle': { patternModel: 'digital-mosaic', scale: 6.0, octaves: 2, edgeRoughness: 0.44, clustering: 1.0, horizontalCondense: 0.95, verticalCondense: 1.05, coverageBias: -2, designMode: 'none', designAmount: 0.22, seed: 701102, colorWeights: [0.24, 0.23, 0.2, 0.18, 0.15] },
  'PLA Type 19 Desert': { patternModel: 'digital-mosaic', scale: 6.2, octaves: 2, edgeRoughness: 0.33, clustering: 0.88, horizontalCondense: 1.08, verticalCondense: 1.0, coverageBias: 3, designMode: 'none', designAmount: 0.18, seed: 701103, colorWeights: [0.32, 0.24, 0.2, 0.15, 0.09] },
  'PLA Type 19 Arid': { patternModel: 'digital-mosaic', scale: 6.0, octaves: 2, edgeRoughness: 0.34, clustering: 0.9, horizontalCondense: 1.05, verticalCondense: 1.0, coverageBias: 2, designMode: 'none', designAmount: 0.18, seed: 701104, colorWeights: [0.3, 0.24, 0.2, 0.16, 0.1] },
  'PLA Type 19 Urban': { patternModel: 'digital-mosaic', scale: 6.3, octaves: 2, edgeRoughness: 0.32, clustering: 1.1, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -4, designMode: 'none', designAmount: 0.15, seed: 701105, colorWeights: [0.3, 0.24, 0.2, 0.16, 0.1] },

  'UCP': { patternModel: 'digital-mosaic', scale: 6.8, octaves: 2, edgeRoughness: 0.28, clustering: 1.18, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -5, designMode: 'none', designAmount: 0.12, seed: 101144, colorWeights: [0.42, 0.34, 0.24] },
  'MARPAT Woodland': { patternModel: 'digital-mosaic', scale: 5.6, octaves: 3, edgeRoughness: 0.55, clustering: 1.0, horizontalCondense: 0.95, verticalCondense: 1.05, coverageBias: -3, designMode: 'micro-cut', designAmount: 0.34, seed: 510312, colorWeights: [0.34, 0.27, 0.22, 0.17] },
  'CADPAT TW': { patternModel: 'digital-mosaic', scale: 5.9, octaves: 3, edgeRoughness: 0.5, clustering: 1.06, horizontalCondense: 0.95, verticalCondense: 1.08, coverageBias: -2, designMode: 'micro-cut', designAmount: 0.36, seed: 381920, colorWeights: [0.34, 0.27, 0.22, 0.17] },
  'NWU Type I': { patternModel: 'digital-mosaic', scale: 6.0, octaves: 2, edgeRoughness: 0.46, clustering: 1.1, horizontalCondense: 1.02, verticalCondense: 1.0, coverageBias: -2, designMode: 'none', designAmount: 0.2, seed: 174220, colorWeights: [0.28, 0.27, 0.24, 0.21] },
  'AOR1 Desert': { patternModel: 'digital-mosaic', scale: 5.8, octaves: 2, edgeRoughness: 0.42, clustering: 0.95, horizontalCondense: 1.06, verticalCondense: 1.0, coverageBias: 2, designMode: 'none', designAmount: 0.2, seed: 456120, colorWeights: [0.3, 0.22, 0.2, 0.16, 0.12] },
  'AOR2 Woodland': { patternModel: 'digital-mosaic', scale: 5.8, octaves: 2, edgeRoughness: 0.48, clustering: 1.0, horizontalCondense: 0.94, verticalCondense: 1.08, coverageBias: -2, designMode: 'none', designAmount: 0.22, seed: 456222, colorWeights: [0.3, 0.22, 0.2, 0.16, 0.12] },
  'M90K Digital': { patternModel: 'digital-mosaic', scale: 6.1, octaves: 2, edgeRoughness: 0.4, clustering: 1.05, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -1, designMode: 'none', designAmount: 0.2, seed: 619090, colorWeights: [0.28, 0.23, 0.2, 0.17, 0.12] },
  'EMR Digital Flora': { patternModel: 'digital-mosaic', scale: 5.7, octaves: 3, edgeRoughness: 0.58, clustering: 1.04, horizontalCondense: 0.92, verticalCondense: 1.1, coverageBias: -2, designMode: 'micro-cut', designAmount: 0.28, seed: 720315, colorWeights: [0.26, 0.24, 0.2, 0.18, 0.12] },
  'MM14 Ukraine': { patternModel: 'digital-mosaic', scale: 6.0, octaves: 2, edgeRoughness: 0.42, clustering: 1.07, horizontalCondense: 0.98, verticalCondense: 1.02, coverageBias: -2, designMode: 'none', designAmount: 0.18, seed: 640114, colorWeights: [0.3, 0.24, 0.2, 0.16, 0.1] },
  'DPM Digital Temperate': { patternModel: 'digital-mosaic', scale: 5.9, octaves: 3, edgeRoughness: 0.56, clustering: 1.0, horizontalCondense: 0.92, verticalCondense: 1.08, coverageBias: -1, designMode: 'micro-cut', designAmount: 0.28, seed: 731415, colorWeights: [0.28, 0.24, 0.2, 0.16, 0.12] },
  'Desert Pixel Steppe': { patternModel: 'digital-mosaic', scale: 6.1, octaves: 2, edgeRoughness: 0.34, clustering: 0.9, horizontalCondense: 1.08, verticalCondense: 1.0, coverageBias: 3, designMode: 'none', designAmount: 0.16, seed: 650301, colorWeights: [0.34, 0.24, 0.18, 0.14, 0.1] },
  'Snow Digital': { patternModel: 'digital-mosaic', scale: 6.6, octaves: 2, edgeRoughness: 0.3, clustering: 1.12, horizontalCondense: 1.04, verticalCondense: 1.0, coverageBias: 6, designMode: 'none', designAmount: 0.14, seed: 711155, colorWeights: [0.38, 0.26, 0.18, 0.12, 0.06] },

  'Desert Digital': { patternModel: 'digital-mosaic', scale: 6.0, octaves: 2, edgeRoughness: 0.34, clustering: 0.9, horizontalCondense: 1.08, verticalCondense: 1.0, coverageBias: 4, designMode: 'none', designAmount: 0.16, seed: 620144, colorWeights: [0.36, 0.28, 0.22, 0.14] },
  'Urban Digital': { patternModel: 'digital-mosaic', scale: 6.4, octaves: 2, edgeRoughness: 0.3, clustering: 1.12, horizontalCondense: 1.0, verticalCondense: 1.0, coverageBias: -5, designMode: 'none', designAmount: 0.14, seed: 620188, colorWeights: [0.36, 0.28, 0.22, 0.14] },
  'Canyon Blue Trail': {
    scale: 5.8,
    octaves: 2,
    edgeRoughness: 0.45,
    clustering: 1.15,
    horizontalCondense: 1.0,
    verticalCondense: 1.0,
    coverageBias: -3,
    designMode: 'none',
    designAmount: 0.25,
    baseOpacity: 1,
    seed: 390271,
    patternModel: 'digital-mosaic',
    // tuned from shoe textile: light base + dark/navy clusters + sparse bright blue
    colorWeights: [0.26, 0.2, 0.16, 0.14, 0.1, 0.08, 0.04, 0.02],
  },
};

function profileForPreset(preset: PresetName): PatternProfile {
  return {
    ...DEFAULT_PROFILE,
    ...PRESET_PROFILE_OVERRIDES[preset],
  };
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let v = Math.imul(t ^ (t >>> 15), 1 | t);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizedWeights(count: number, source?: number[]) {
  if (!source || source.length === 0) {
    return new Array(count).fill(1 / count);
  }
  const out = new Array(count).fill(0).map((_, idx) => source[idx] ?? source[source.length - 1] ?? 1);
  const total = out.reduce((sum, n) => sum + Math.max(0.0001, n), 0);
  return out.map((n) => Math.max(0.0001, n) / total);
}

function weightedPick(weights: number[], rand: () => number) {
  const target = rand();
  let acc = 0;
  for (let i = 0; i < weights.length; i += 1) {
    acc += weights[i];
    if (target <= acc) return i;
  }
  return weights.length - 1;
}

type Snapshot = {
  gridSize: number;
  pixelSize: number;
  scale: number;
  octaves: number;
  edgeRoughness: number;
  clustering: number;
  horizontalCondense: number;
  verticalCondense: number;
  coverageBias: number;
  baseOpacity: number;
  hueShift: number;
  previewRepeat: boolean;
  previewGrid9: boolean;
  shuffleColorsEnabled: boolean;
  designMode: DesignMode;
  designAmount: number;
  patternModel: PatternModel;
  colorWeights: number[];
  seed: number;
  preset: PresetName;
  currentColors: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / delta + 2;
    if (max === b) h = (r - g) / delta + 4;
    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const value = l * 255;
    return { r: value, g: value, b: value };
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hueToRgb(p, q, h + 1 / 3) * 255,
    g: hueToRgb(p, q, h) * 255,
    b: hueToRgb(p, q, h - 1 / 3) * 255,
  };
}

function shiftHexHue(hex: string, degrees: number) {
  if (!/^#[0-9a-f]{6}$/i.test(hex) || degrees === 0) return hex;
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shifted = hslToRgb((hsl.h + degrees / 360 + 1) % 1, hsl.s, hsl.l);
  return rgbToHex(shifted.r, shifted.g, shifted.b);
}

function lockGridSeams(grid: string[][], seamWidth = 2) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const locked = grid.map((row) => [...row]);
  const band = Math.min(seamWidth, Math.floor(Math.min(width, height) / 2));

  for (let y = 0; y < height; y++) {
    for (let offset = 0; offset < band; offset++) {
      locked[y][width - 1 - offset] = locked[y][offset];
    }
  }

  for (let x = 0; x < width; x++) {
    for (let offset = 0; offset < band; offset++) {
      locked[height - 1 - offset][x] = locked[offset][x];
    }
  }

  return locked;
}

function generateDigitalCamoGrid(
  width: number,
  height: number,
  scale: number,
  seed: number,
  colors: string[],
  octaves: number,
  edgeRoughness: number,
  coverageBias: number,
  clustering: number,
  horizontalCondense: number,
  verticalCondense: number
) {
  const randomFunc = () => {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  };
  const rGen = randomFunc();
  const clusterNoise = createNoise4D(rGen);

  const layers = [];
  for (let i = 1; i < colors.length; i++) {
    layers.push({
      macroNoise: createNoise4D(rGen),
      microNoise: createNoise4D(rGen),
      layerScaleModifier: 1.0 + (i * 0.15)
    });
  }

  const grid = new Array(height).fill(0).map(() => new Array(width).fill(colors[0]));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let nx = x / width;
      let ny = y / height;

      const angleX = nx * Math.PI * 2;
      const angleY = ny * Math.PI * 2;

      const getNoise = (noiseFunc: any, freq: number) => {
        const rx = (freq * horizontalCondense) / (Math.PI * 2);
        const ry = (freq * verticalCondense) / (Math.PI * 2);
        const u = Math.cos(angleX) * rx;
        const v = Math.sin(angleX) * rx;
        const w = Math.cos(angleY) * ry;
        const z = Math.sin(angleY) * ry;
        return noiseFunc(u, v, w, z);
      };

      const clusterFreq = Math.max(1, scale * 0.25);
      const clusterVal = getNoise(clusterNoise, clusterFreq);

      for (let i = 0; i < layers.length; i++) {
        const { macroNoise, microNoise, layerScaleModifier } = layers[i];

        let macroVal = 0;
        let amp = 1;
        let freq = scale * layerScaleModifier;
        let maxAmp = 0;

        for (let o = 0; o < octaves; o++) {
          macroVal += getNoise(macroNoise, freq) * amp;
          maxAmp += amp;
          amp *= 0.5;
          freq *= 2.0;
        }
        macroVal /= maxAmp;

        const microFreq = scale * Math.pow(2, octaves + 1);
        const microVal = getNoise(microNoise, microFreq);

        const combined = macroVal + (microVal * edgeRoughness) + (clusterVal * clustering);

        let baseCoverage = 0.45 - (i * 0.12) + (coverageBias / 100);
        const threshold = (0.5 - baseCoverage) * 2.0;

        if (combined > threshold) {
          grid[y][x] = colors[i + 1];
        }
      }
    }
  }

  return lockGridSeams(grid, 3);
}

function generateDigitalMosaicGrid(
  width: number,
  height: number,
  seed: number,
  colors: string[],
  colorWeights?: number[],
) {
  const rand = mulberry32(seed);
  const weights = normalizedWeights(colors.length, colorWeights);
  const grid = new Array(height).fill(0).map(() => new Array(width).fill(colors[0]));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      grid[y][x] = colors[weightedPick(weights, rand)];
    }
  }

  // Lay down stepped rectangular "digital" patches to mimic woven pixel camo panels.
  const patches = Math.floor((width * height) / 24);
  for (let i = 0; i < patches; i += 1) {
    const color = colors[weightedPick(weights, rand)];
    const x0 = Math.floor(rand() * width);
    const y0 = Math.floor(rand() * height);
    const blockW = 1 + Math.floor(rand() * 4);
    const blockH = 1 + Math.floor(rand() * 4);
    const steps = 1 + Math.floor(rand() * 4);

    for (let s = 0; s < steps; s += 1) {
      const ox = x0 + (s * (rand() > 0.5 ? 1 : -1));
      const oy = y0 + (s * (rand() > 0.5 ? 1 : -1));
      for (let yy = 0; yy < blockH; yy += 1) {
        for (let xx = 0; xx < blockW; xx += 1) {
          const x = ((ox + xx) % width + width) % width;
          const y = ((oy + yy) % height + height) % height;
          grid[y][x] = color;
        }
      }
    }
  }

  // Majority clean-up while preserving block corners.
  for (let pass = 0; pass < 2; pass += 1) {
    const next = grid.map((row) => [...row]);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const counts = new Map<string, number>();
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const xx = (x + dx + width) % width;
            const yy = (y + dy + height) % height;
            const c = grid[yy][xx];
            counts.set(c, (counts.get(c) ?? 0) + 1);
          }
        }
        let best = grid[y][x];
        let bestCount = -1;
        counts.forEach((count, c) => {
          if (count > bestCount) {
            best = c;
            bestCount = count;
          }
        });
        if (rand() > 0.25) next[y][x] = best;
      }
    }
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        grid[y][x] = next[y][x];
      }
    }
  }

  return lockGridSeams(grid, 3);
}

export default function App() {
  const BASE_PREVIEW_PIXEL_SIZE = 5;
  const INITIAL_PRESET: PresetName = 'Canyon Blue Trail';
  const initialProfile = profileForPreset(INITIAL_PRESET);
  const [gridSize, setGridSize] = useState(160);
  const [pixelSize, setPixelSize] = useState(5);
  const [scale, setScale] = useState(initialProfile.scale);
  const [octaves, setOctaves] = useState(initialProfile.octaves);
  const [edgeRoughness, setEdgeRoughness] = useState(initialProfile.edgeRoughness);
  const [clustering, setClustering] = useState(initialProfile.clustering);
  const [horizontalCondense, setHorizontalCondense] = useState(initialProfile.horizontalCondense);
  const [verticalCondense, setVerticalCondense] = useState(initialProfile.verticalCondense);
  const [coverageBias, setCoverageBias] = useState(initialProfile.coverageBias);
  const [baseOpacity, setBaseOpacity] = useState(initialProfile.baseOpacity);
  const [hueShift, setHueShift] = useState(0);
  const [previewRepeat, setPreviewRepeat] = useState(true);
  const [previewGrid9, setPreviewGrid9] = useState(false);
  const [shuffleColorsEnabled, setShuffleColorsEnabled] = useState(false);
  const [designMode, setDesignMode] = useState<DesignMode>(initialProfile.designMode);
  const [designAmount, setDesignAmount] = useState(initialProfile.designAmount);
  const [patternModel, setPatternModel] = useState<PatternModel>(initialProfile.patternModel);
  const [colorWeights, setColorWeights] = useState<number[]>([...(initialProfile.colorWeights ?? [])]);
  const [seed, setSeed] = useState(initialProfile.seed);

  const [showPalette, setShowPalette] = useState(false);
  const [history, setHistory] = useState<Snapshot[]>([]);

  const [preset, setPreset] = useState<PresetName>(INITIAL_PRESET);
  const [currentColors, setCurrentColors] = useState<string[]>([...PRESETS[INITIAL_PRESET]]);

  const renderedColors = useMemo(() => {
    return currentColors.map((color) => shiftHexHue(color, hueShift));
  }, [currentColors, hueShift]);

  const grid = useMemo(() => {
    if (patternModel === 'digital-mosaic') {
      return generateDigitalMosaicGrid(gridSize, gridSize, seed, renderedColors, colorWeights);
    }
    return generateDigitalCamoGrid(gridSize, gridSize, scale, seed, renderedColors, octaves, edgeRoughness, coverageBias, clustering, horizontalCondense, verticalCondense);
  }, [patternModel, gridSize, scale, seed, renderedColors, octaves, edgeRoughness, coverageBias, clustering, horizontalCondense, verticalCondense, colorWeights]);

  const svgDataUrl = useMemo(() => {
    if (!grid) return '';
    let rects = '';

    for (let y = 0; y < gridSize; y++) {
      let startX = 0;
      let currentColor = grid[y][0];
      let span = 1;

      for (let x = 1; x <= gridSize; x++) {
        if (x < gridSize && grid[y][x] === currentColor) {
          span++;
        } else {
          if (currentColor !== renderedColors[0]) {
            rects += `<rect x="${startX * pixelSize}" y="${y * pixelSize}" width="${span * pixelSize}" height="${pixelSize}" fill="${currentColor}"/>`;
          }
          if (x < gridSize) {
            startX = x;
            currentColor = grid[y][x];
            span = 1;
          }
        }
      }
    }

    const tileSize = gridSize * pixelSize;
    let designRects = '';
    const seededRandom = (salt: number) => {
      let value = seed + salt;
      return () => {
        value = Math.sin(value) * 10000;
        return value - Math.floor(value);
      };
    };

    const wrapRect = (x: number, y: number, width: number, height: number, fill: string, opacity = 1) => {
      const xs = [x];
      const ys = [y];

      if (x < 0) xs.push(x + tileSize);
      if (x + width > tileSize) xs.push(x - tileSize);
      if (y < 0) ys.push(y + tileSize);
      if (y + height > tileSize) ys.push(y - tileSize);

      for (const drawX of xs) {
        for (const drawY of ys) {
          designRects += `<rect x="${drawX}" y="${drawY}" width="${width}" height="${height}" fill="${fill}" fill-opacity="${opacity}"/>`;
        }
      }
    };

    if (designMode !== 'none') {
      const random = seededRandom(9101);
      const steps = Math.floor(gridSize * designAmount);

      for (let i = 0; i < steps; i++) {
        const color = renderedColors[1 + Math.floor(random() * Math.max(1, renderedColors.length - 1))] || renderedColors[0];
        const x = Math.floor(random() * gridSize) * pixelSize;
        const y = Math.floor(random() * gridSize) * pixelSize;

        if (designMode === 'micro-cut') {
          const width = (1 + Math.floor(random() * 3)) * pixelSize;
          const height = pixelSize;
          wrapRect(x, y, width, height, color, 0.9);
        }

        if (designMode === 'step-cut') {
          const arm = (2 + Math.floor(random() * 4)) * pixelSize;
          const thickness = pixelSize;
          wrapRect(x, y, arm, thickness, color, 0.92);
          wrapRect(x, y, thickness, arm, color, 0.92);
        }

        if (designMode === 'block-weave') {
          const width = (2 + Math.floor(random() * 5)) * pixelSize;
          const height = (1 + Math.floor(random() * 3)) * pixelSize;
          wrapRect(x, y, width, height, color, 0.78);
        }
      }
    }

    const svgStr = `<svg width="${tileSize}" height="${tileSize}" viewBox="0 0 ${tileSize} ${tileSize}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${renderedColors[0]}" fill-opacity="${baseOpacity}"/>${rects}${designRects}</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
  }, [grid, gridSize, pixelSize, renderedColors, baseOpacity, seed, designMode, designAmount]);

  const previewTileSize = gridSize * BASE_PREVIEW_PIXEL_SIZE;

  const handleExportSVG = () => {
    const svgData = decodeURIComponent(svgDataUrl.replace('data:image/svg+xml;utf8,', ''));
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `camo-${seed}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const makeSnapshot = (): Snapshot => ({
    gridSize,
    pixelSize,
    scale,
    octaves,
    edgeRoughness,
    clustering,
    horizontalCondense,
    verticalCondense,
    coverageBias,
    baseOpacity,
    hueShift,
    previewRepeat,
    previewGrid9,
    shuffleColorsEnabled,
    designMode,
    designAmount,
    patternModel,
    colorWeights: [...colorWeights],
    seed,
    preset,
    currentColors: [...currentColors],
  });

  const pushHistory = () => {
    const snapshot = makeSnapshot();
    setHistory((items) => [...items.slice(-19), snapshot]);
  };

  const restoreSnapshot = (snapshot: Snapshot) => {
    setGridSize(snapshot.gridSize);
    setPixelSize(snapshot.pixelSize);
    setScale(snapshot.scale);
    setOctaves(snapshot.octaves);
    setEdgeRoughness(snapshot.edgeRoughness);
    setClustering(snapshot.clustering);
    setHorizontalCondense(snapshot.horizontalCondense);
    setVerticalCondense(snapshot.verticalCondense);
    setCoverageBias(snapshot.coverageBias);
    setBaseOpacity(snapshot.baseOpacity);
    setHueShift(snapshot.hueShift);
    setPreviewRepeat(snapshot.previewRepeat);
    setPreviewGrid9(snapshot.previewGrid9);
    setShuffleColorsEnabled(snapshot.shuffleColorsEnabled);
    setDesignMode(snapshot.designMode);
    setDesignAmount(snapshot.designAmount);
    setPatternModel(snapshot.patternModel);
    setColorWeights([...snapshot.colorWeights]);
    setSeed(snapshot.seed);
    setPreset(snapshot.preset);
    setCurrentColors([...snapshot.currentColors]);
  };

  const goBack = () => {
    setHistory((items) => {
      const previous = items[items.length - 1];
      if (previous) {
        restoreSnapshot(previous);
      }
      return items.slice(0, -1);
    });
  };

  const generateNext = () => {
    pushHistory();
    setSeed(Date.now());
  };

  const applyPresetProfile = (nextPreset: PresetName) => {
    const profile = profileForPreset(nextPreset);
    setPreset(nextPreset);
    setCurrentColors([...PRESETS[nextPreset]]);
    setScale(profile.scale);
    setOctaves(profile.octaves);
    setEdgeRoughness(profile.edgeRoughness);
    setClustering(profile.clustering);
    setHorizontalCondense(profile.horizontalCondense);
    setVerticalCondense(profile.verticalCondense);
    setCoverageBias(profile.coverageBias);
    setBaseOpacity(profile.baseOpacity);
    setDesignMode(profile.designMode);
    setDesignAmount(profile.designAmount);
    setPatternModel(profile.patternModel);
    setColorWeights([...(profile.colorWeights ?? [])]);
    setSeed(profile.seed);
  };

  const random01 = () => {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi?.getRandomValues) {
      const arr = new Uint32Array(1);
      cryptoApi.getRandomValues(arr);
      return arr[0] / 4294967296;
    }
    return Math.random();
  };

  const generateShuffledColors = (count: number) => {
    const camoHexFromHsl = (h: number, s: number, l: number) => {
      const rgb = hslToRgb(h, s, l);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    };

    // Randomly pick a palette archetype so repeated shuffles feel less formulaic.
    const archetypes = [
      // [hue center, hue spread, sat min, sat max, light min, light max]
      [0.26, 0.11, 0.14, 0.52, 0.12, 0.66], // woodland
      [0.10, 0.09, 0.12, 0.45, 0.18, 0.72], // desert
      [0.58, 0.08, 0.12, 0.50, 0.14, 0.62], // naval/blue-gray
      [0.00, 1.00, 0.03, 0.18, 0.20, 0.82], // urban neutral mix
      [0.52, 0.16, 0.08, 0.35, 0.58, 0.90], // snow/washed tones
    ] as const;

    const picked = archetypes[Math.floor(random01() * archetypes.length)];
    const [hCenter, hSpread, sMin, sMax, lMin, lMax] = picked;

    const colors = new Array(count).fill(0).map(() => {
      const hue = (hCenter + (random01() * 2 - 1) * hSpread + 1) % 1;
      const sat = sMin + random01() * (sMax - sMin);
      const light = lMin + random01() * (lMax - lMin);
      return camoHexFromHsl(hue, sat, light);
    });

    // Ensure usable contrast in every shuffled palette.
    const darkHue = (hCenter + (random01() * 2 - 1) * hSpread + 1) % 1;
    const lightHue = (hCenter + (random01() * 2 - 1) * hSpread + 1) % 1;
    colors[0] = camoHexFromHsl(darkHue, sMin + random01() * (sMax * 0.7), 0.09 + random01() * 0.12);
    colors[colors.length - 1] = camoHexFromHsl(lightHue, sMin + random01() * (sMax * 0.8), 0.72 + random01() * 0.18);

    return colors;
  };

  const shuffleSeed = () => {
    const rand = (min: number, max: number, step = 0.01) => {
      const steps = Math.round((max - min) / step);
      const value = min + Math.floor(random01() * (steps + 1)) * step;
      return Number(value.toFixed(4));
    };

    const pick = <T,>(values: T[]): T => values[Math.floor(random01() * values.length)];

    pushHistory();
    setScale(rand(1.2, 10, 0.1));
    setOctaves(Math.round(rand(1, 5, 1)));
    setEdgeRoughness(rand(0, 2, 0.05));
    setClustering(rand(0, 2, 0.05));
    setHorizontalCondense(rand(0.25, 3, 0.05));
    setVerticalCondense(rand(0.25, 3, 0.05));
    setCoverageBias(Math.round(rand(-30, 30, 1)));
    const nextModel = pick<PatternModel>(['fractal', 'digital-mosaic']);
    setPatternModel(nextModel);
    setDesignMode(nextModel === 'digital-mosaic' ? 'none' : pick<DesignMode>(['none', 'micro-cut', 'step-cut', 'block-weave']));
    setDesignAmount(rand(0, 1.5, 0.05));
    if (nextModel === 'digital-mosaic') {
      const raw = currentColors.map(() => 0.2 + random01());
      const total = raw.reduce((sum, value) => sum + value, 0);
      setColorWeights(raw.map((value) => value / total));
    } else {
      setColorWeights([]);
    }
    if (shuffleColorsEnabled) {
      setCurrentColors(generateShuffledColors(currentColors.length));
    }
    setGridSize(Math.round(rand(64, 256, 16)));
    setPixelSize(Math.round(rand(2, 16, 1)));
    setSeed(Math.floor(random01() * 1000000));
  };

  const handleColorChange = (index: number, newHex: string) => {
    const updated = [...currentColors];
    updated[index] = newHex;
    setCurrentColors(updated);
  };

  const addColor = () => {
    if (currentColors.length < 8) {
      setCurrentColors([...currentColors, '#000000']);
    }
  };

  const removeColor = (index: number) => {
    if (currentColors.length > 2) {
      setCurrentColors(currentColors.filter((_, i) => i !== index));
    }
  };

  const panelParam = new URLSearchParams(window.location.search).get('panel');
  const modularPanelMode = panelParam === 'preview' || panelParam === 'controls';
  const purePreviewWindow = panelParam === 'preview';
  const showPreviewPanel = panelParam !== 'controls';
  const showControlsPanel = panelParam !== 'preview';

  return (
    <div className="fixed inset-0 w-full h-full font-mono text-[11px] uppercase tracking-wider text-white overflow-hidden bg-transparent">

      {/* Title bar drag area for Electron */}
      {!purePreviewWindow && (
      <div className="absolute top-0 left-0 w-full h-12 z-30" style={{ WebkitAppRegion: 'drag' } as any} />
      )}

      {/* Clean rear glass layer. No camo is rendered here. */}
      {!purePreviewWindow && (
      <div className="absolute inset-0 z-0 bg-white/5 backdrop-blur-[2px]" />
      )}

      {/* Floating preview panel */}
      {showPreviewPanel && (
      <div className={`${modularPanelMode ? 'absolute inset-0 z-10' : 'absolute left-[360px] right-6 top-10 bottom-10 z-10'} ${modularPanelMode ? 'bg-transparent border-0 rounded-none shadow-none backdrop-blur-0' : 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.35)] rounded-xl'} overflow-hidden`}>
        {previewGrid9 ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-8">
            <div
              className="grid grid-cols-3 border border-white/20"
              style={{
                width: `min(calc(100% - 2rem), ${previewTileSize * 3}px)`,
                aspectRatio: `${gridSize * pixelSize} / ${gridSize * pixelSize}`,
              }}
            >
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="border border-white/10"
                  style={{
                    backgroundImage: `url("${svgDataUrl}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '100% 100%',
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("${svgDataUrl}")`,
              backgroundRepeat: previewRepeat ? 'repeat' : 'no-repeat',
              backgroundPosition: previewRepeat ? 'top left' : 'center',
              // Keep preview tile footprint stable so pixel-size changes adjust pattern blocks
              // instead of feeling like a plain zoom.
              backgroundSize: `${previewTileSize}px ${previewTileSize}px`
            }}
          />
        )}
      </div>
      )}

      {/* Floating controls panel */}
      {showControlsPanel && (
      <div className={`${modularPanelMode ? 'absolute inset-6 w-auto' : 'absolute left-6 top-10 bottom-10 w-[320px]'} flex flex-col z-20 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden`}>

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <span className="font-bold tracking-widest text-white/90">CMGEN // 0.1</span>
          <span className="text-white/40">SEED {seed}</span>
        </div>

        {/* Global Actions */}
        <div className="flex border-b border-white/10 bg-white/5">
          <button
            onClick={goBack}
            disabled={history.length === 0}
            className="flex-1 py-3 border-r border-white/10 hover:bg-white/10 transition-none text-center cursor-pointer text-white/80 disabled:opacity-25"
          >
            BACK
          </button>
          <button
            onClick={generateNext}
            className="flex-1 py-3 border-r border-white/10 hover:bg-white/10 transition-none text-center cursor-pointer text-white/80"
          >
            GENERATE
          </button>
          <button
            onClick={shuffleSeed}
            className="flex-1 py-3 border-r border-white/10 hover:bg-white/10 transition-none text-center cursor-pointer text-white/80"
          >
            SHUFFLE
          </button>
          <button
            onClick={() => {
              pushHistory();
              setShuffleColorsEnabled((enabled) => !enabled);
            }}
            className="flex-1 py-3 border-r border-white/10 hover:bg-white/10 transition-none text-center cursor-pointer text-white/80"
          >
            AUTO COLORS {shuffleColorsEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleExportSVG}
            className="flex-1 py-3 hover:bg-white hover:text-black transition-none text-center cursor-pointer font-bold"
          >
            EXPORT SVG
          </button>
        </div>

        {/* Scrollable Settings */}
        <div className="p-4 flex flex-col gap-6 overflow-y-auto">

          <div className="flex flex-col gap-2">
            <div className="text-white/50 mb-1">PRESET</div>
            <div className="relative">
              <select
                className="w-full bg-transparent border border-white/10 text-white p-2 pr-8 rounded-none outline-none focus:border-white/40 uppercase cursor-pointer appearance-none"
                value={preset}
                onChange={(e) => {
                  pushHistory();
                  applyPresetProfile(e.target.value as PresetName);
                }}
              >
                {Object.entries(PRESET_GROUPS).map(([groupName, presets]) => (
                  <optgroup key={groupName} label={groupName} className="bg-[#111] text-white/50">
                    {presets.map(p => <option key={p} value={p} className="text-white">{p}</option>)}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">▼</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 -mx-1"
              onClick={() => setShowPalette(!showPalette)}
            >
              <span className="text-white/50">PALETTE</span>
              <div className="flex items-center gap-2">
                <span className="text-white/40">{currentColors.length} LAYERS</span>
                <span className="text-white/30 text-[9px]">{showPalette ? '[-]' : '[+]'}</span>
              </div>
            </div>

            {showPalette && (
              <div className="flex flex-col gap-2">
                {currentColors.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-4 text-white/40 text-right">{idx}</span>
                    <div className="relative w-6 h-6 border border-white/10 shrink-0">
                      <input
                        type="color"
                        value={col}
                        onChange={(e) => handleColorChange(idx, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full pointer-events-none" style={{ backgroundColor: col }} />
                    </div>
                    <input
                      type="text"
                      value={col.toUpperCase()}
                      onChange={(e) => handleColorChange(idx, e.target.value)}
                      className="flex-1 bg-transparent border border-white/10 p-1 text-white outline-none focus:border-white/40 uppercase"
                      maxLength={7}
                    />
                    <button
                      onClick={() => removeColor(idx)}
                      disabled={currentColors.length <= 2}
                      className="w-6 h-6 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {currentColors.length < 8 && (
                  <button
                    onClick={addColor}
                    className="w-full mt-1 border border-dashed border-white/20 py-2 hover:border-white/50 text-white/50 hover:text-white transition-none cursor-pointer"
                  >
                    + ADD LAYER
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="h-[1px] w-full bg-white/10 my-2" />

          <div className="flex flex-col gap-2">
            <div className="text-white/50 mb-1">SVG DETAIL</div>
            <select
              className="w-full bg-transparent border border-white/10 text-white p-2 pr-8 rounded-none outline-none focus:border-white/40 uppercase cursor-pointer appearance-none"
              value={designMode}
              onChange={(e) => {
                pushHistory();
                setDesignMode(e.target.value as DesignMode);
              }}
            >
              <option className="bg-[#111] text-white" value="none">None</option>
              <option className="bg-[#111] text-white" value="micro-cut">Micro Cut</option>
              <option className="bg-[#111] text-white" value="step-cut">Step Cut</option>
              <option className="bg-[#111] text-white" value="block-weave">Block Weave</option>
            </select>
          </div>

          <button
            onClick={() => {
              pushHistory();
              setPreviewRepeat(!previewRepeat);
              setPreviewGrid9(false);
            }}
            className="w-full border border-white/10 py-2 text-white/70 hover:bg-white/10 hover:text-white"
          >
            PREVIEW TILE {previewRepeat ? 'REPEAT' : 'SINGLE'}
          </button>

          <button
            onClick={() => {
              pushHistory();
              setPreviewGrid9(!previewGrid9);
            }}
            className="w-full border border-white/10 py-2 text-white/70 hover:bg-white/10 hover:text-white"
          >
            3X3 SEAM GRID {previewGrid9 ? 'ON' : 'OFF'}
          </button>

          {/* Sliders */}
          {[
            { label: 'SCALE', val: scale, min: 1, max: 15, step: 0.5, set: setScale, display: scale.toFixed(1) },
            { label: 'DENSENESS', val: clustering, min: 0, max: 2, step: 0.05, set: setClustering, display: clustering.toFixed(2) },
            { label: 'H CONDENSE', val: horizontalCondense, min: 0.25, max: 3, step: 0.05, set: setHorizontalCondense, display: horizontalCondense.toFixed(2) },
            { label: 'V CONDENSE', val: verticalCondense, min: 0.25, max: 3, step: 0.05, set: setVerticalCondense, display: verticalCondense.toFixed(2) },
            { label: 'ROUGHNESS', val: edgeRoughness, min: 0, max: 2, step: 0.05, set: setEdgeRoughness, display: edgeRoughness.toFixed(2) },
            { label: 'BIAS', val: coverageBias, min: -30, max: 30, step: 1, set: setCoverageBias, display: coverageBias > 0 ? '+' + coverageBias : coverageBias },
            { label: 'HUE', val: hueShift, min: -180, max: 180, step: 1, set: setHueShift, display: String(hueShift) + 'deg' },
            { label: 'OCTAVES', val: octaves, min: 1, max: 5, step: 1, set: setOctaves, display: octaves },
            { label: 'BASE OPACITY', val: baseOpacity, min: 0, max: 1, step: 0.05, set: setBaseOpacity, display: String(Math.round(baseOpacity * 100)) + '%' },
            { label: 'DETAIL AMOUNT', val: designAmount, min: 0, max: 1.5, step: 0.05, set: setDesignAmount, display: designAmount.toFixed(2) },
            { label: 'RESOLUTION', val: gridSize, min: 64, max: 256, step: 16, set: setGridSize, display: gridSize },
            { label: 'PX SIZE', val: pixelSize, min: 2, max: 16, step: 1, set: setPixelSize, display: pixelSize },
          ].map((param) => (
            <div key={param.label} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <label className="text-white/50">{param.label}</label>
                <span className="text-white/90">{param.display}</span>
              </div>
              <input
                type="range" min={param.min} max={param.max} step={param.step}
                onPointerDown={pushHistory}
                value={param.val} onChange={e => param.set(parseFloat(e.target.value))}
              />
            </div>
          ))}

        </div>
      </div>
      )}
    </div>
  );
}
