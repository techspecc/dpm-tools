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
