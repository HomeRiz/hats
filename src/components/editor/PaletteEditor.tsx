import React from 'react';
import { Palette, Sparkles, RefreshCw } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { generatePrimaryRamp } from '../../services/colorEngine';

interface PaletteEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const PaletteEditor: React.FC<PaletteEditorProps> = ({ theme, onChange }) => {
  const { palette, engine } = theme;
  const primaryRamp = generatePrimaryRamp(palette.primary);

  const updatePalette = (key: keyof typeof palette, value: string) => {
    onChange({
      palette: {
        ...palette,
        [key]: value,
      },
      engine: key === 'primary' || key === 'accent' ? {
        ...engine,
        glowColor: value,
      } : engine,
    });
  };

  const presetPalettes = [
    { name: 'Apple Glass Violet', primary: '#BF5AF2', accent: '#BF5AF2', blue: '#0A84FF', green: '#32D74B' },
    { name: 'Kids Playful Candy', primary: '#FF6B8B', accent: '#FFB800', blue: '#4DD0E1', green: '#81C784' },
    { name: 'Cyberpunk Neon', primary: '#00F0FF', accent: '#FF2D55', blue: '#00A3FF', green: '#39FF14' },
    { name: 'Velvet Amber', primary: '#FAB387', accent: '#FAB387', blue: '#89b4fa', green: '#a6e3a1' },
    { name: 'Emerald Forest', primary: '#2ECC71', accent: '#F1C40F', blue: '#3498DB', green: '#27AE60' },
    { name: 'Nordic Aurora', primary: '#00FFB2', accent: '#00E5FF', blue: '#0A84FF', green: '#32D74B' },
    { name: 'Sunset Crimson', primary: '#FF375F', accent: '#FF9F0A', blue: '#5E5CE6', green: '#FFD60A' },
    { name: 'Deep Cobalt', primary: '#0A84FF', accent: '#66D4CF', blue: '#0A84FF', green: '#5AC8F5' },
  ];

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Palette Presets</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presetPalettes.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange({
                  palette: {
                    ...palette,
                    primary: p.primary,
                    accent: p.accent,
                    blue: p.blue,
                    green: p.green,
                  },
                  engine: {
                    ...engine,
                    glowColor: p.primary,
                  }
                });
              }}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition-colors"
            >
              <span className="font-medium text-slate-300 text-[11px] truncate">{p.name}</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accent }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.blue }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span>Primary Accent & Glow</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Primary Color</label>
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <input
                type="color"
                value={palette.primary}
                onChange={(e) => updatePalette('primary', e.target.value)}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-slate-300 uppercase">{palette.primary}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Accent Color</label>
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <input
                type="color"
                value={palette.accent}
                onChange={(e) => updatePalette('accent', e.target.value)}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-slate-300 uppercase">{palette.accent}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex justify-between items-center text-slate-400">
          <span className="font-medium text-[11px]">Home Assistant Primary Ramp (--ha-color-primary-05..95)</span>
        </div>

        <div className="flex rounded-lg overflow-hidden h-6 border border-slate-800">
          {primaryRamp.map((step) => (
            <div
              key={step.step}
              title={`--ha-color-primary-${step.step}: ${step.hex}`}
              className="flex-1 cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: step.hex }}
            />
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div className="font-semibold text-slate-300 text-xs">Spectrum Colors (HA RGB Tokens)</div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { key: 'red', label: 'Red' },
            { key: 'pink', label: 'Pink' },
            { key: 'purple', label: 'Purple' },
            { key: 'indigo', label: 'Indigo' },
            { key: 'blue', label: 'Blue' },
            { key: 'cyan', label: 'Cyan' },
            { key: 'teal', label: 'Teal' },
            { key: 'green', label: 'Green' },
            { key: 'yellow', label: 'Yellow' },
            { key: 'orange', label: 'Orange' },
            { key: 'brown', label: 'Brown' },
            { key: 'grey', label: 'Grey' },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <span className="text-[10px] text-slate-400">{item.label}</span>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <input
                  type="color"
                  value={palette[item.key as keyof typeof palette] || '#888888'}
                  onChange={(e) => updatePalette(item.key as any, e.target.value)}
                  className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-[10px] text-slate-300 uppercase truncate">
                  {palette[item.key as keyof typeof palette]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
