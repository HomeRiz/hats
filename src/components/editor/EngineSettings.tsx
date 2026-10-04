import React from 'react';
import { Sliders, Box, Menu, Eye } from 'lucide-react';
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
          badgeRadius: 24,
          mushRadius: 24,
          borderWidth: 0,
          glassTint: 'rgba(255, 255, 255, 0.06)',
          sheenOpacity: 0.22,
          sheenAngle: 160,
          insetShadow: '3px 3px 0.5px -3.5px rgba(255,255,255,0.35) inset, -2px -2px 0.5px -2px rgba(255,255,255,0.30) inset, 0 0 10px 1px rgba(255,255,255,0.10) inset, 0 8px 24px -12px rgba(0,0,0,0.55)',
          hoverGlow: true,
          scanlines: false,
          sidebarStyle: 'translucent',
          sidebarOpacity: 0.45,
          sidebarBlur: 20,
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
          badgeRadius: 28,
          mushRadius: 28,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.35)',
          glassTint: 'rgba(255, 255, 255, 0.12)',
          sheenOpacity: 0.35,
          sheenAngle: 145,
          insetShadow: '0 8px 24px -6px rgba(255, 107, 139, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.4) inset, 0 12px 32px -10px rgba(0,0,0,0.4)',
          hoverGlow: true,
          scanlines: false,
          sidebarStyle: 'translucent',
          sidebarOpacity: 0.55,
          sidebarBlur: 24,
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
          badgeRadius: 16,
          mushRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(205, 214, 244, 0.10)',
          glassTint: 'rgba(49, 50, 68, 0.42)',
          sheenOpacity: 0.12,
          sheenAngle: 160,
          insetShadow: '0 1px 0 0 rgba(205,214,244,0.10) inset, 0 0 0 1px rgba(17,17,27,0.35), 0 10px 26px -14px rgba(0,0,0,0.70)',
          hoverGlow: true,
          scanlines: false,
          sidebarStyle: 'opaque',
          sidebarOpacity: 0.95,
          sidebarBlur: 0,
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
          badgeRadius: 10,
          mushRadius: 10,
          borderWidth: 1,
          borderColor: 'rgba(0, 240, 255, 0.45)',
          glassTint: 'rgba(6, 8, 16, 0.55)',
          sheenOpacity: 0.25,
          sheenAngle: 180,
          insetShadow: '0 0 0 1px rgba(0, 240, 255, 0.30), 0 0 18px -6px rgba(0, 240, 255, 0.55), 0 0 40px -20px rgba(0, 240, 255, 0.80) inset, 0 10px 30px -16px rgba(0,0,0,0.90)',
          hoverGlow: true,
          scanlines: true,
          scanlineIntensity: 0.04,
          sidebarStyle: 'translucent',
          sidebarOpacity: 0.65,
          sidebarBlur: 16,
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
        <label 
          className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs"
          title="Choose a baseline visual physics engine preset for shadows, blurs, and corner curvature"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Core Visual Engine</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {[
            { 
              type: 'glass', 
              label: 'Liquid Glass', 
              desc: 'Deep blur, 30px radii, specular rim',
              tooltip: 'Liquid Glass: Apple Vision Pro inspired frosted glass with 16px blur, 30px card radius, specular reflections, and translucent sidebar'
            },
            { 
              type: 'kids', 
              label: 'Kids & Playful', 
              desc: 'Bubbly 36px radii, candy glow',
              tooltip: 'Kids & Playful: Ultra-rounded 36px pillowy radii, high color saturation, playful glowing borders, and bouncy feel'
            },
            { 
              type: 'velvet', 
              label: 'Velvet Matte', 
              desc: 'Soft 12px blur, 18px radii, cozy',
              tooltip: 'Velvet Matte: Minimalist frosted dark matte aesthetic, 18px radii, soft ambient shadows, and solid high-contrast sidebar'
            },
            { 
              type: 'neon', 
              label: 'Cyber Neon', 
              desc: 'Hard 12px, glowing borders, scanlines',
              tooltip: 'Cyber Neon: Cyberpunk holographic aesthetic, crisp 12px radii, electric accent border glows, and CRT scanlines'
            },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleEngineTypeChange(item.type as EngineType)}
              title={item.tooltip}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                engine.engineType === item.type
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="font-semibold text-xs text-white flex items-center justify-between">
                <span>{item.label}</span>
                {engine.engineType === item.type && (
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div 
          className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs"
          title="Configure card corner curvature and outline border widths"
        >
          <Box className="w-3.5 h-3.5 text-indigo-400" />
          <span>Card Geometry & Radii</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Controls the border-radius for standard Lovelace cards (--ha-card-border-radius)">
              Card Border Radius
            </span>
            <span className="font-mono text-slate-200">{engine.cardRadius}px</span>
          </div>
          <input
            type="range"
            min="4"
            max="48"
            value={engine.cardRadius}
            onChange={(e) => updateEngine({ cardRadius: parseInt(e.target.value) })}
            title={`Card border radius: ${engine.cardRadius}px. Controls how rounded card corners are in Home Assistant.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Sets the corner radius for mushroom chips, info badges, and pill tags">
              Badge & Chip Radius
            </span>
            <span className="font-mono text-slate-200">{engine.badgeRadius}px</span>
          </div>
          <input
            type="range"
            min="4"
            max="32"
            value={engine.badgeRadius}
            onChange={(e) => updateEngine({ badgeRadius: parseInt(e.target.value) })}
            title={`Badge radius: ${engine.badgeRadius}px. Controls curvature for mushroom chips and status badges.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Sets the stroke border width in pixels around cards (--ha-card-border-width)">
              Border Width
            </span>
            <span className="font-mono text-slate-200">{engine.borderWidth}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            value={engine.borderWidth}
            onChange={(e) => updateEngine({ borderWidth: parseInt(e.target.value) })}
            title={`Border width: ${engine.borderWidth}px. Set to 0 for borderless glass or 1-2px for outline styling.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div className="font-semibold text-slate-300 flex items-center justify-between text-xs">
          <div 
            className="flex items-center gap-1.5"
            title="Configure how the Home Assistant left navigation sidebar renders against your theme background"
          >
            <Menu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sidebar Menu Glass & Opacity</span>
          </div>
          <span 
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono capitalize border border-slate-700"
            title={`Active sidebar style mode: ${engine.sidebarStyle || 'translucent'}`}
          >
            {engine.sidebarStyle || 'translucent'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            {
              id: 'translucent',
              label: 'Translucent',
              tooltip: 'Translucent: a properly frosted glass sidebar - clicking applies a frosted default (50% opacity, 8px blur), then the sliders below fine-tune it',
              autoOpacity: 0.50,
              autoBlur: 8,
            },
            {
              id: 'opaque',
              label: 'Opaque',
              tooltip: 'Opaque: solid high-contrast background sidebar, ideal for maximum legibility and reduced GPU load',
            },
            {
              id: 'transparent',
              label: 'Ultra Clear',
              tooltip: 'Ultra Clear: true see-through - clicking sets 2% opacity and 0px blur, then the sliders below fine-tune it',
              autoOpacity: 0.02,
              autoBlur: 0,
            },
            {
              id: 'frosted',
              label: 'Frosted Glass',
              tooltip: 'Frosted Glass: fully transparent background but heavily blurred - clicking sets 0% opacity and 32px blur, then the sliders below fine-tune it',
              autoOpacity: 0,
              autoBlur: 32,
            },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => updateEngine({
                sidebarStyle: mode.id as any,
                ...(mode.autoOpacity !== undefined ? { sidebarOpacity: mode.autoOpacity, sidebarBlur: mode.autoBlur } : {}),
              })}
              title={mode.tooltip}
              className={`py-1.5 px-2 rounded-lg text-center text-xs font-semibold transition-all border ${
                (engine.sidebarStyle || 'translucent') === mode.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {engine.sidebarStyle !== 'opaque' && (
          <>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span title="Controls the background alpha transparency of the Home Assistant sidebar">
                  Sidebar Glass Opacity
                </span>
                <span className="font-mono text-slate-200">{Math.round((engine.sidebarOpacity ?? 0.45) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.01"
                value={engine.sidebarOpacity ?? 0.45}
                onChange={(e) => updateEngine({ sidebarOpacity: parseFloat(e.target.value) })}
                title={`Sidebar opacity: ${Math.round((engine.sidebarOpacity ?? 0.45) * 100)}%. This is the real alpha used in the theme - lower values are more transparent.`}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span title="Controls the backdrop blur filter applied behind the navigation sidebar">
                  Sidebar Backdrop Blur
                </span>
                <span className="font-mono text-slate-200">{engine.sidebarBlur ?? 20}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={engine.sidebarBlur ?? 20}
                onChange={(e) => updateEngine({ sidebarBlur: parseInt(e.target.value) })}
                title={`Sidebar backdrop blur: ${engine.sidebarBlur ?? 20}px. Higher blur diffuses background artwork.`}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div 
          className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs"
          title="Configure card backdrop frosted glass filters, specular rim sheen, and interactive hover effects"
        >
          <Eye className="w-3.5 h-3.5 text-pink-400" />
          <span>Glass Character & Blurs</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Backdrop filter blur in pixels applied under cards (--ha-card-backdrop-filter)">
              Backdrop Blur Amount
            </span>
            <span className="font-mono text-slate-200">{engine.blurAmount}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            value={engine.blurAmount}
            onChange={(e) => updateEngine({ blurAmount: parseInt(e.target.value) })}
            title={`Card blur: ${engine.blurAmount}px. Renders frosted glass diffusion behind card contents.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span title="Controls the intensity of the simulated top-edge specular glass reflection">
              Specular Rim Sheen Opacity
            </span>
            <span className="font-mono text-slate-200">{Math.round(engine.sheenOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={engine.sheenOpacity}
            onChange={(e) => updateEngine({ sheenOpacity: parseFloat(e.target.value) })}
            title={`Sheen opacity: ${Math.round(engine.sheenOpacity * 100)}%. Simulates physical glass rim reflections.`}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div 
          className="flex items-center justify-between pt-2 cursor-pointer"
          title="When enabled, cards glow with the theme's primary accent color when the cursor hovers over them"
        >
          <span className="text-slate-300 font-medium">Hover Glow Effect</span>
          <input
            type="checkbox"
            checked={engine.hoverGlow}
            onChange={(e) => updateEngine({ hoverGlow: e.target.checked })}
            title="When enabled, cards glow with the theme's primary accent color when the cursor hovers over them"
            className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 cursor-pointer"
          />
        </div>

        <div 
          className="flex items-center justify-between pt-1 cursor-pointer"
          title="Toggles CRT / Cyberpunk holographic horizontal scanlines overlay across the dashboard"
        >
          <span className="text-slate-300 font-medium">Cyber Scanlines Overlay</span>
          <input
            type="checkbox"
            checked={engine.scanlines}
            onChange={(e) =>
              updateEngine({
                scanlines: e.target.checked,
                ...(e.target.checked && !engine.scanlineIntensity ? { scanlineIntensity: 0.05 } : {}),
              })
            }
            title="Toggles CRT / Cyberpunk holographic horizontal scanlines overlay across the dashboard"
            className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 cursor-pointer"
          />
        </div>

        {engine.scanlines && (
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span title="How dark the scanlines are. Needs UIX / card-mod support turned on in the Cards tab.">Scanline Intensity</span>
              <span className="font-mono text-slate-200">{Math.round((engine.scanlineIntensity ?? 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={engine.scanlineIntensity ?? 0.04}
              onChange={(e) => updateEngine({ scanlineIntensity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
