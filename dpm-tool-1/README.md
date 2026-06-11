# DPM Tool 1

> **Work in progress** — experimental camo generator, not production-ready.

Electron desktop app for generating digital camouflage patterns. Pick from reference-backed military presets (PLA Type 07, MARPAT, UCP, CADPAT, and more), tune density and variation, and export SVG tiles.

See the [repo README](../README.md) for a UI preview screenshot.

## Development

```bash
npm install
npm run dev
```

Modular window layout:

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
- simplex-noise

## References

Preset pattern tiles live in `public/references/` (mostly [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:SVG_military_camouflage_patterns)). When a preset has a reference, the generator samples that tile for palette + pixel layout.
