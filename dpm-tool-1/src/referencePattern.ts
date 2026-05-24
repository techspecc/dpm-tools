export type ReferenceTemplate = {
  width: number;
  height: number;
  palette: string[];
  weights: number[];
  indices: number[];
};

/** Preset name -> local reference tile under /public/references (mostly from Wikimedia Commons). */
export const PRESET_REFERENCE_IMAGES: Record<string, string> = {
  'Canyon Blue Trail': '/references/canyon-blue-trail.png',
  'UCP': '/references/ucp.svg',
  'MARPAT Woodland': '/references/marpat-woodland.png',
  'CADPAT TW': '/references/cadpat-tw.png',
  'NWU Type I': '/references/nwu-type-i.jpg',
  'AOR1 Desert': '/references/aor1-desert.svg',
  'AOR2 Woodland': '/references/aor2-woodland.png',
  'M90K Digital': '/references/m90k-digital.svg',
  'EMR Digital Flora': '/references/emr-digital-flora.svg',
  'MM14 Ukraine': '/references/mm14-ukraine.svg',
  'DPM Digital Temperate': '/references/dpm-digital-temperate.svg',
  'PLA Type 07 Universal': '/references/pla-type-07-universal-crop.jpg',
  'PLA Type 07 Woodland': '/references/pla-type-07-woodland-crop.jpg',
  'PLA Type 07 Oceanic': '/references/pla-type-07-oceanic-crop.jpg',
  'PLA Type 07 Urban': '/references/pla-type-07-urban-crop.jpg',
  'PLA Type 07 Special Forces': '/references/pla-type-07-special-forces-crop.jpg',
  'PLA Type 07 Arid': '/references/pla-type-07-arid-crop.jpg',
  'PLA Type 07 09 Aviation': '/references/pla-type-07-09-aviation-crop.jpg',
  'Desert Digital': '/references/desert-digital.jpg',
  'Snow Digital': '/references/snow-digital.jpg',
};

/** Wikimedia Commons source pages for attribution. */
export const PRESET_REFERENCE_SOURCES: Record<string, string> = {
  'Canyon Blue Trail': 'User export (shoe digi-camo textile)',
  'UCP': 'https://commons.wikimedia.org/wiki/File:UCP_pattern.svg',
  'MARPAT Woodland': 'https://commons.wikimedia.org/wiki/File:Swatch_of_woodland_MARPAT_with_no_black_pixels,_used_for_sewing_nametapes.png',
  'CADPAT TW': 'https://commons.wikimedia.org/wiki/File:Temperate_CADPAT_camouflage_pattern_swatch.png',
  'NWU Type I': 'https://commons.wikimedia.org/wiki/File:NWU_Type_I_camouflage_pattern_swatch.jpg',
  'AOR1 Desert': 'https://commons.wikimedia.org/wiki/File:NWU_Type_II_AOR_1.svg',
  'AOR2 Woodland': 'https://commons.wikimedia.org/wiki/File:NWU_Type_III_camouflage_pattern_swatch,_AOR-2.png',
  'M90K Digital': 'https://commons.wikimedia.org/wiki/File:Sweden_M90_pattern.svg',
  'EMR Digital Flora': 'https://commons.wikimedia.org/wiki/File:EMR_camouflage_pattern_swatch.svg',
  'MM14 Ukraine': 'https://commons.wikimedia.org/wiki/File:Ukrainian_military_vehicle_pixel_camouflage,_2015_pattern.svg',
  'DPM Digital Temperate': 'https://commons.wikimedia.org/wiki/File:US_Woodland_pattern.svg',
  'PLA Type 07 Universal': 'https://commons.wikimedia.org/wiki/File:Variants_of_Chinese_Type_07_camouflage_patterns..jpg',
  'PLA Type 07 Woodland': 'https://commons.wikimedia.org/wiki/File:Variants_of_Chinese_Type_07_camouflage_patterns..jpg',
  'PLA Type 07 Oceanic': 'https://commons.wikimedia.org/wiki/File:Variants_of_Chinese_Type_07_camouflage_patterns..jpg',
  'PLA Type 07 Urban': 'https://commons.wikimedia.org/wiki/File:Variants_of_Chinese_Type_07_camouflage_patterns..jpg',
  'PLA Type 07 Special Forces': 'https://commons.wikimedia.org/wiki/File:Variants_of_Chinese_Type_07_camouflage_patterns..jpg',
  'PLA Type 07 Arid': 'https://commons.wikimedia.org/wiki/File:Variants_of_Chinese_Type_07_camouflage_patterns..jpg',
  'PLA Type 07 09 Aviation': 'https://commons.wikimedia.org/wiki/File:Variants_of_Chinese_Type_07_camouflage_patterns..jpg',
  'Desert Digital': 'https://commons.wikimedia.org/wiki/File:Desert_MARPAT_camouflage_pattern_swatch.jpg',
  'Snow Digital': 'https://commons.wikimedia.org/wiki/File:MARPAT_winter.jpg',
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load reference image: ${url}`));
    img.src = url;
  });
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function nearestPaletteIndex(r: number, g: number, b: number, palette: Array<[number, number, number]>) {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < palette.length; i += 1) {
    const [pr, pg, pb] = palette[i];
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export async function loadReferenceTemplate(url: string, targetSize = 192): Promise<ReferenceTemplate> {
  const img = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas unavailable for reference sampling');

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, targetSize, targetSize);
  const { data } = ctx.getImageData(0, 0, targetSize, targetSize);

  const counts = new Map<string, number>();
  const rgbSamples: Array<[number, number, number]> = [];
  for (let i = 0; i < data.length; i += 4) {
    const rgb: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
    rgbSamples.push(rgb);
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  const palette = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);
  const paletteRgb = palette.map((hex) => {
    const value = Number.parseInt(hex.slice(1), 16);
    return [value >> 16, (value >> 8) & 255, value & 255] as [number, number, number];
  });

  const total = targetSize * targetSize;
  const weights = palette.map((hex) => (counts.get(hex) ?? 0) / total);
  const indices = rgbSamples.map(([r, g, b]) => nearestPaletteIndex(r, g, b, paletteRgb));

  return { width: targetSize, height: targetSize, palette, weights, indices };
}

export function resampleTemplateIndices(template: ReferenceTemplate, size: number) {
  if (template.width === size && template.height === size) return template.indices;

  const out: number[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = Math.min(template.width - 1, Math.floor((x * template.width) / size));
      const sy = Math.min(template.height - 1, Math.floor((y * template.height) / size));
      out.push(template.indices[sy * template.width + sx]);
    }
  }
  return out;
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

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
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

function hexLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b).l;
}

function lockGridSeams(grid: string[][], seamWidth = 2) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const locked = grid.map((row) => [...row]);
  const band = Math.min(seamWidth, Math.floor(Math.min(width, height) / 2));

  for (let y = 0; y < height; y += 1) {
    for (let offset = 0; offset < band; offset += 1) {
      locked[y][width - 1 - offset] = locked[y][offset];
    }
  }

  for (let x = 0; x < width; x += 1) {
    for (let offset = 0; offset < band; offset += 1) {
      locked[height - 1 - offset][x] = locked[offset][x];
    }
  }

  return locked;
}

function mapReferenceColors(template: ReferenceTemplate, colors: string[]) {
  const refSorted = template.palette
    .map((hex, index) => ({ index, l: hexLuminance(hex) }))
    .sort((a, b) => a.l - b.l);
  const colorSorted = colors
    .map((hex, index) => ({ index, l: hexLuminance(hex) }))
    .sort((a, b) => a.l - b.l);

  return refSorted.map((ref, rank) => colors[colorSorted[Math.min(rank, colorSorted.length - 1)].index]);
}

export function generateFromReferenceTemplate(
  template: ReferenceTemplate,
  size: number,
  seed: number,
  colors: string[],
) {
  const width = size;
  const height = size;
  const indices = resampleTemplateIndices(template, size);
  const mappedColors = mapReferenceColors(template, colors);
  const rand = mulberry32(seed);
  const shiftX = Math.floor(rand() * width);
  const shiftY = Math.floor(rand() * height);

  const grid = new Array(height).fill(0).map(() => new Array(width).fill(colors[0]));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcX = (x + shiftX) % width;
      const srcY = (y + shiftY) % height;
      const refIdx = indices[srcY * width + srcX];
      grid[y][x] = mappedColors[refIdx] ?? colors[0];
    }
  }

  const swaps = Math.floor(width * height * 0.015 * (0.35 + rand()));
  for (let i = 0; i < swaps; i += 1) {
    const x = Math.floor(rand() * width);
    const y = Math.floor(rand() * height);
    const nx = (x + 1 + Math.floor(rand() * 4)) % width;
    const ny = (y + 1 + Math.floor(rand() * 4)) % height;
    const tmp = grid[y][x];
    grid[y][x] = grid[ny][nx];
    grid[ny][nx] = tmp;
  }

  return lockGridSeams(grid, 3);
}
