# DPM Tool

Electron desktop app for generating digital camouflage patterns. Pick from military preset palettes (PLA Type 07/19, MARPAT, UCP, CADPAT, and more), tune density and variation, and export SVG tiles.

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
