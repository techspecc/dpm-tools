# DPM Tool

> **Work in progress** — DPM tooling is experimental and not production-ready. Pattern fidelity, presets, and export workflows are still being tuned; expect rough edges.

Electron desktop app for generating digital camouflage patterns. Pick from military preset palettes (PLA Type 07/19, MARPAT, UCP, CADPAT, and more), tune density and variation, and export SVG tiles.

The modular layout runs as separate floating windows — controls on the left, live preview on the right:

![DPM Tool modular windows — controls panel and camo preview floating over a dark workspace](docs/ui-preview.png)

## Development

```bash
npm install
npm run dev
```

Modular window layout (separate preview and controls panels):

```bash
MODULAR_WINDOWS=1 npm run dev
```

## Build

```bash
npm run build
```

## Stack

- React + TypeScript + Vite
- Electron
- Tailwind CSS
- simplex-noise for procedural pattern generation

## Preview assets

- `docs/ui-preview.svg` — editable composite of the floating window layout
- `docs/sample-camo.svg` — exported pattern tile used in the preview
- `public/references/` — preset reference tiles (mostly [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:SVG_military_camouflage_patterns) SVGs/photos). When a preset has a reference, the generator samples that tile for palette + pixel layout instead of the generic mosaic algorithm.

Presets with reference tiles: UCP, MARPAT, CADPAT, NWU, AOR, M90, EMR, MM14, DPM, PLA Type 07 variants, Desert/Snow digital, and Canyon Blue Trail. Presets without a reference image are omitted from the dropdown.
