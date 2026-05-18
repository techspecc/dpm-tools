import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, RefreshCw, Settings2 } from 'lucide-react';
import { createNoise4D } from 'simplex-noise';

// Predefined camo palettes with authentic color ratios
const PRESETS = {
  'Type 07 Oceanic (PLA)': ['#E1E8E6', '#87AEC6', '#497F9A', '#1E4957'],
  'Type 07 09 Aviation (PLA)': ['#BAC4D1', '#9BA5B1', '#21335A', '#CF9C52', '#2B313D'],
  'Type 07 Urban/Air Force (PLA)': ['#C9DFF1', '#7DA8C9', '#195B9A', '#1A2A3A'],
  'Type 07 Universal (PLA)': ['#9C9C98', '#6A6F62', '#867664', '#3E423B'],
  'Type 07 Special Forces (PLA)': ['#E2DFD3', '#8A9771', '#4F613E', '#263428'],
  'Type 07 Arid/Desert (PLA)': ['#D5C9B3', '#9D8369', '#786955', '#494035'],
  'Type 07 Woodland (PLA)': ['#9C9A86', '#59694D', '#36402A', '#161914'],
  'UCP (USA)': ['#D4D2C5', '#9E9F9D', '#7D827A'],
  'MARPAT Woodland': ['#A2A581', '#485A42', '#5B4C3E', '#1A1A1A'],
  'CADPAT TW': ['#9FA887', '#566E3D', '#364929', '#1A1A1A'],
  'NWU Type I (Navy)': ['#495665', '#2C3A4A', '#8193A5', '#161920'],
  'Salomon Desert Blue': ['#D2C4A3', '#7C8B60', '#283645', '#1963B5', '#1C1D1C'],
  'Desert Digital': ['#E1D3B5', '#D2B99B', '#A78C69', '#78624E'],
  'Urban Digital': ['#E0E0E0', '#9E9E9E', '#616161', '#212121'],
};

const PRESET_GROUPS = {
  'Chinese PLA (Type 07)': ['Type 07 Oceanic (PLA)', 'Type 07 09 Aviation (PLA)', 'Type 07 Urban/Air Force (PLA)', 'Type 07 Universal (PLA)', 'Type 07 Special Forces (PLA)', 'Type 07 Arid/Desert (PLA)', 'Type 07 Woodland (PLA)'],
  'US & NATO': ['UCP (USA)', 'MARPAT Woodland', 'CADPAT TW', 'NWU Type I (Navy)'],
  'Commercial & Generic': ['Salomon Desert Blue', 'Desert Digital', 'Urban Digital']
};

function generateDigitalCamoGrid(width, height, scale, seed, presetName, customColors, octaves, edgeRoughness, coverageBias, clustering) {
  const randomFunc = () => {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  };
  const rGen = randomFunc();

  const colors = presetName === 'Custom' ? customColors : PRESETS[presetName as keyof typeof PRESETS];

  // A very low-frequency noise layer used to cluster patterns.
  // This causes variation in denseness, so some areas have heavy patterning
  // and other areas are more sparse.
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
        const r1 = freq / (Math.PI * 2);
        const u = Math.cos(angleX) * r1;
        const v = Math.sin(angleX) * r1;
        const w = Math.cos(angleY) * r1;
        const z = Math.sin(angleY) * r1;
        return noiseFunc(u, v, w, z);
      };

      // Get the slow-moving cluster value for this pixel
      // We keep the frequency very low (~25% of the macro scale) to create large regions
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

        // Add clustering parameter.
        // This shifts the noise values up and down across the map in large slow waves,
        // which creates the clumpy/dense regions vs sparse regions.
        const combined = macroVal + (microVal * edgeRoughness) + (clusterVal * clustering);

        let baseCoverage = 0.45 - (i * 0.12) + (coverageBias / 100);
        const threshold = (0.5 - baseCoverage) * 2.0;

        if (combined > threshold) {
          grid[y][x] = colors[i + 1];
        }
      }
    }
  }

  return grid;
}

export default function App() {
  const [gridSize, setGridSize] = useState(160); // Increased default size
  const [pixelSize, setPixelSize] = useState(4);
  const [scale, setScale] = useState(5.5);
  const [octaves, setOctaves] = useState(3);
  const [edgeRoughness, setEdgeRoughness] = useState(0.85);
  const [clustering, setClustering] = useState(0.7); // New param
  const [coverageBias, setCoverageBias] = useState(0);
  const [seed, setSeed] = useState(Date.now());
  const [preset, setPreset] = useState<keyof typeof PRESETS | 'Custom'>('Type 07 Oceanic (PLA)');

  const [customColors, setCustomColors] = useState<string[]>(['#E1E8E6', '#87AEC6', '#497F9A', '#1E4957']);

  const svgRef = useRef<SVGSVGElement>(null);

  const grid = useMemo(() => {
    return generateDigitalCamoGrid(gridSize, gridSize, scale, seed, preset, customColors, octaves, edgeRoughness, coverageBias, clustering);
  }, [gridSize, scale, seed, preset, customColors, octaves, edgeRoughness, coverageBias, clustering]);

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `camo-${preset.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${seed}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const colorsToUse = preset === 'Custom' ? customColors : PRESETS[preset as keyof typeof PRESETS];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 flex flex-col md:flex-row gap-8">
      {/* Controls Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-6 bg-neutral-800 p-6 rounded-xl border border-neutral-700 h-fit flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xl font-bold">Authentic Digital Camo</h1>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-400">Pattern Preset</label>
          <select
            className="bg-neutral-900 border border-neutral-700 rounded-md p-2 text-sm focus:border-emerald-500 outline-none"
            value={preset}
            onChange={(e) => setPreset(e.target.value as any)}
          >
            {Object.entries(PRESET_GROUPS).map(([groupName, presets]) => (
              <optgroup key={groupName} label={groupName}>
                {presets.map(p => <option key={p} value={p}>{p}</option>)}
              </optgroup>
            ))}
            <optgroup label="Custom">
              <option value="Custom">Custom Selection</option>
            </optgroup>
          </select>
        </div>

        {preset === 'Custom' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-400">Custom Colors (Base to Top Layer)</label>
            <div className="flex flex-wrap gap-2">
              {customColors.map((col, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <input
                    type="color"
                    value={col}
                    onChange={(e) => {
                      const newColors = [...customColors];
                      newColors[idx] = e.target.value;
                      setCustomColors(newColors);
                    }}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <button
                    onClick={() => setCustomColors(customColors.filter((_, i) => i !== idx))}
                    className="text-xs text-red-400 hover:text-red-300"
                    disabled={customColors.length <= 2}
                  >
                    Del
                  </button>
                </div>
              ))}
              {customColors.length < 6 && (
                <button
                  onClick={() => setCustomColors([...customColors, '#000000'])}
                  className="w-8 h-8 rounded border border-dashed border-neutral-500 flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  +
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-neutral-400">Clustering (Denseness)</label>
            <span className="text-sm text-neutral-500">{clustering.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0" max="2" step="0.05"
            value={clustering} onChange={e => setClustering(parseFloat(e.target.value))}
            className="accent-emerald-500"
          />
          <p className="text-xs text-neutral-500">Creates dense clumpy areas vs sparse empty areas so it doesn't look repeating.</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-neutral-400">Macro Scale</label>
            <span className="text-sm text-neutral-500">{scale.toFixed(1)}</span>
          </div>
          <input
            type="range" min="1" max="15" step="0.5"
            value={scale} onChange={e => setScale(parseFloat(e.target.value))}
            className="accent-emerald-500"
          />
          <p className="text-xs text-neutral-500">Changes size of the main individual blotches.</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-neutral-400">Edge Scatter (Roughness)</label>
            <span className="text-sm text-neutral-500">{edgeRoughness.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0" max="2" step="0.05"
            value={edgeRoughness} onChange={e => setEdgeRoughness(parseFloat(e.target.value))}
            className="accent-emerald-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-neutral-400">Coverage Bias</label>
            <span className="text-sm text-neutral-500">{coverageBias}%</span>
          </div>
          <input
            type="range" min="-30" max="30" step="1"
            value={coverageBias} onChange={e => setCoverageBias(parseInt(e.target.value))}
            className="accent-emerald-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-neutral-400">Detail Level (Octaves)</label>
            <span className="text-sm text-neutral-500">{octaves}</span>
          </div>
          <input
            type="range" min="1" max="5" step="1"
            value={octaves} onChange={e => setOctaves(parseInt(e.target.value))}
            className="accent-emerald-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-neutral-400">Grid Resolution</label>
            <span className="text-sm text-neutral-500">{gridSize}x{gridSize}</span>
          </div>
          <input
            type="range" min="64" max="256" step="16"
            value={gridSize} onChange={e => setGridSize(parseInt(e.target.value))}
            className="accent-emerald-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-neutral-400">Output Pixel Size</label>
            <span className="text-sm text-neutral-500">{pixelSize}px</span>
          </div>
          <input
            type="range" min="2" max="16" step="1"
            value={pixelSize} onChange={e => setPixelSize(parseInt(e.target.value))}
            className="accent-emerald-500"
          />
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Randomize
          </button>
          <button
            onClick={handleExportSVG}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export SVG
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-neutral-950 p-8 rounded-xl border border-neutral-800 overflow-hidden relative"
           style={{
             backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }}>

        <div className="flex flex-col gap-2 w-full max-w-4xl max-h-full overflow-auto items-center">
          <div className="bg-neutral-800 p-2 rounded border border-neutral-700 shadow-xl"
               style={{ width: gridSize * pixelSize + 16 }}>
            <svg
              ref={svgRef}
              width={gridSize * pixelSize}
              height={gridSize * pixelSize}
              viewBox={`0 0 ${gridSize * pixelSize} ${gridSize * pixelSize}`}
              xmlns="http://www.w3.org/2000/svg"
              className="block"
              style={{ background: colorsToUse[0] }}
            >
              {(() => {
                const rects = [];
                for (let y = 0; y < gridSize; y++) {
                  let startX = 0;
                  let currentColor = grid[y][0];
                  let span = 1;

                  for (let x = 1; x <= gridSize; x++) {
                    if (x < gridSize && grid[y][x] === currentColor) {
                      span++;
                    } else {
                      if (currentColor !== colorsToUse[0]) {
                        rects.push(
                          <rect
                            key={`${x}-${y}`}
                            x={startX * pixelSize}
                            y={y * pixelSize}
                            width={span * pixelSize}
                            height={pixelSize}
                            fill={currentColor}
                            stroke={currentColor}
                            strokeWidth="0.5"
                          />
                        );
                      }

                      if (x < gridSize) {
                        startX = x;
                        currentColor = grid[y][x];
                        span = 1;
                      }
                    }
                  }
                }
                return rects;
              })()}
            </svg>
          </div>
          <div className="text-neutral-500 text-sm mt-4 text-center">
            Preview is a single seamless tile ({gridSize * pixelSize}x{gridSize * pixelSize}px). <br/>
            Export as SVG to use it as a repeating pattern in your projects.
          </div>
        </div>
      </div>
    </div>
  );
}