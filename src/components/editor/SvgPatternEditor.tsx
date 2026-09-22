import React from 'react';
import { Shapes, Sparkles, Code2, Trash2 } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface SvgPatternEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const SvgPatternEditor: React.FC<SvgPatternEditorProps> = ({ theme, onChange }) => {
  const svgPresets = [
    {
      name: 'Kids Playful Stars & Clouds',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="kids-stars" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M20 15 L22 21 L28 22 L23 26 L25 32 L20 28 L15 32 L17 26 L12 22 L18 21 Z" fill="#FFD54F" opacity="0.35"/>
      <circle cx="80" cy="40" r="3" fill="#FF80AB" opacity="0.4"/>
      <circle cx="95" cy="85" r="4" fill="#80D8FF" opacity="0.4"/>
      <path d="M70 70 Q75 60, 85 65 T100 70" stroke="#B388FF" stroke-width="2" fill="none" opacity="0.3"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#kids-stars)" />
</svg>`,
    },
    {
      name: 'Synthwave Geometric Grid',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="synth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00E5FF" stroke-width="0.75" opacity="0.2"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#synth-grid)" />
</svg>`,
    },
    {
      name: 'Cyberpunk Tech Circuit',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="circuits" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 10 10 L 40 10 L 50 20 L 80 20" fill="none" stroke="#00F0FF" stroke-width="1" opacity="0.25" />
      <circle cx="80" cy="20" r="2.5" fill="#00F0FF" opacity="0.4" />
      <path d="M 20 60 L 60 60 L 70 70 L 90 70" fill="none" stroke="#FF2D55" stroke-width="1" opacity="0.25" />
      <circle cx="20" cy="60" r="2.5" fill="#FF2D55" opacity="0.4" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#circuits)" />
</svg>`,
    },
  ];

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Shapes className="w-3.5 h-3.5 text-purple-400" />
          <span>Preset Vector Overlays & SVG Patterns</span>
        </label>

        <div className="grid grid-cols-1 gap-2">
          {svgPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange({ customSvgOverlay: preset.code })}
              className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 flex items-center justify-between transition-colors text-left"
            >
              <span className="font-semibold text-xs text-white">{preset.name}</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex justify-between items-center text-slate-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Custom SVG Code (Live Overlay)</span>
          </div>
          {theme.customSvgOverlay && (
            <button
              onClick={() => onChange({ customSvgOverlay: undefined })}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <textarea
          value={theme.customSvgOverlay || ''}
          onChange={(e) => onChange({ customSvgOverlay: e.target.value })}
          placeholder="Paste raw <svg> ... </svg> code here to render custom decorative overlays, stars, clouds, or meshes..."
          rows={8}
          className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
        />
      </div>
    </div>
  );
};
