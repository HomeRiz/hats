import React from 'react';
import { Sliders, Sparkles, Shield, Eye, Box } from 'lucide-react';
import { ThemeConfig, EngineType } from '../../types/theme';

interface EngineSettingsProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const EngineSettings: React.FC<EngineSettingsProps> = ({ theme, onChange }) => {
  const { engine } = theme;

  const handleEngineTypeChange = (type: EngineType) => {
    if (type === 'glass') {
      onChange({
        engine: {
          ...engine,
          engineType: 'glass',
          blurAmount: 16,
          saturateAmount: 1.45,
          brightnessAmount: 1.0,
          cardRadius: 30,
          borderWidth: 0,
          glassTint: 'rgba(255, 255, 255, 0.06)',
          sheenOpacity: 0.22,
          sheenAngle: 160,
          insetShadow: '3px 3px 0.5px -3.5px rgba(255,255,255,0.35) inset, -2px -2px 0.5px -2px rgba(255,255,255,0.30) inset, 0 0 10px 1px rgba(255,255,255,0.10) inset, 0 8px 24px -12px rgba(0,0,0,0.55)',
          hoverGlow: true,
          scanlines: false,
        }
      });
    } else if (type === 'kids') {
      onChange({
        engine: {
          ...engine,
          engineType: 'kids',
          blurAmount: 18,
          saturateAmount: 1.6,
          brightnessAmount: 1.05,
          cardRadius: 36,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.35)',
          glassTint: 'rgba(255, 255, 255, 0.12)',
          sheenOpacity: 0.35,
          sheenAngle: 145,
          insetShadow: '0 8px 24px -6px rgba(255, 107, 139, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 12px 32px -10px rgba(0,0,0,0.4)',
          hoverGlow: true,
          scanlines: false,
        }
      });
    } else if (type === 'velvet') {
      onChange({
        engine: {
          ...engine,
          engineType: 'velvet',
          blurAmount: 12,
          saturateAmount: 1.15,
          brightnessAmount: 0.95,
          cardRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(205, 214, 244, 0.10)',
          glassTint: 'rgba(49, 50, 68, 0.42)',
          sheenOpacity: 0.12,
          sheenAngle: 160,
          insetShadow: '0 1px 0 0 rgba(205,214,244,0.10) inset, 0 0 0 1px rgba(17,17,27,0.35), 0 10px 26px -14px rgba(0,0,0,0.70)',
          hoverGlow: true,
          scanlines: false,
        }
      });
    } else if (type === 'neon') {
      onChange({
        engine: {
          ...engine,
          engineType: 'neon',
          blurAmount: 10,
          saturateAmount: 1.8,
          brightnessAmount: 0.92,
          cardRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(0, 240, 255, 0.45)',
          glassTint: 'rgba(6, 8, 16, 0.55)',
          sheenOpacity: 0.25,
          sheenAngle: 180,
          insetShadow: '0 0 0 1px rgba(0, 240, 255, 0.30), 0 0 18px -6px rgba(0, 240, 255, 0.55), 0 0 40px -20px rgba(0, 240, 255, 0.80) inset, 0 10px 30px -16px rgba(0,0,0,0.90)',
          hoverGlow: true,
          scanlines: true,
          scanlineIntensity: 0.04,
        }
      });
    }
  };

  const updateEngine = (partial: Partial<typeof engine>) => {
    onChange({
      engine: {
        ...engine,
        ...partial,
      }
    });
  };

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <label className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Core Visual Engine</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {[
            { type: 'glass', label: 'Liquid Glass', desc: 'Deep blur, 30px radii, specular rim' },
            { type: 'kids', label: 'Kids & Playful', desc: 'Bubbly 36px radii, candy glow' },
            { type: 'velvet', label: 'Velvet Matte', desc: 'Soft 12px blur, 18px radii, cozy' },
            { type: 'neon', label: 'Cyber Neon', desc: 'Hard 12px, glowing borders, scanlines' },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleEngineTypeChange(item.type as EngineType)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                engine.engineType === item.type
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="font-semibold text-xs text-white">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
          <Box className="w-3.5 h-3.5 text-indigo-400" />
          <span>Card Geometry & Radii</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Card Border Radius</span>
            <span className="font-mono text-slate-200">{engine.cardRadius}px</span>
          </div>
          <input
            type="range"
            min="4"
            max="48"
            value={engine.cardRadius}
            onChange={(e) => updateEngine({ cardRadius: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Badge & Chip Radius</span>
            <span className="font-mono text-slate-200">{engine.badgeRadius}px</span>
          </div>
          <input
            type="range"
            min="4"
            max="32"
            value={engine.badgeRadius}
            onChange={(e) => updateEngine({ badgeRadius: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Border Width</span>
            <span className="font-mono text-slate-200">{engine.borderWidth}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            value={engine.borderWidth}
            onChange={(e) => updateEngine({ borderWidth: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
          <Eye className="w-3.5 h-3.5 text-pink-400" />
          <span>Glass Character & Blurs</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Backdrop Blur Amount</span>
            <span className="font-mono text-slate-200">{engine.blurAmount}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            value={engine.blurAmount}
            onChange={(e) => updateEngine({ blurAmount: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Specular Rim Sheen Opacity</span>
            <span className="font-mono text-slate-200">{Math.round(engine.sheenOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={engine.sheenOpacity}
            onChange={(e) => updateEngine({ sheenOpacity: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-slate-300 font-medium">Hover Glow Effect</span>
          <input
            type="checkbox"
            checked={engine.hoverGlow}
            onChange={(e) => updateEngine({ hoverGlow: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-300 font-medium">Cyber Scanlines Overlay</span>
          <input
            type="checkbox"
            checked={engine.scanlines}
            onChange={(e) => updateEngine({ scanlines: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
          />
        </div>
      </div>
    </div>
  );
};
