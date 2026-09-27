import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { generatePrimaryRamp } from '../../services/colorEngine';
import { HexColorField } from '../common/HexColorField';
import { CustomPalettePreset } from '../../types/customPresets';
import { loadCustomPalettes, saveCustomPalettes } from '../../utils/customPresetsStorage';

interface PaletteEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const PaletteEditor: React.FC<PaletteEditorProps> = ({ theme, onChange }) => {
  const { palette, engine } = theme;
  const primaryRamp = generatePrimaryRamp(palette.primary);

  const [customPalettes, setCustomPalettes] = useState<CustomPalettePreset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPalettePreset | null>(null);
  const [presetNameInput, setPresetNameInput] = useState('');

  useEffect(() => {
    setCustomPalettes(loadCustomPalettes());
  }, []);

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
    { 
      name: 'Apple Glass Violet', 
      primary: '#BF5AF2', 
      accent: '#BF5AF2', 
      blue: '#0A84FF', 
      green: '#32D74B',
      tooltip: 'Apple Glass Violet: Primary #BF5AF2 (Violet), Accent #BF5AF2, Blue #0A84FF, Green #32D74B - modern translucent iOS/visionOS styling'
    },
    { 
      name: 'Kids Playful Candy', 
      primary: '#FF6B8B', 
      accent: '#FFB800', 
      blue: '#4DD0E1', 
      green: '#81C784',
      tooltip: 'Kids Playful Candy: Primary #FF6B8B (Bubblegum Pink), Accent #FFB800 (Warm Amber), Blue #4DD0E1, Green #81C784 - vibrant upbeat colors'
    },
    { 
      name: 'Cyberpunk Neon', 
      primary: '#00F0FF', 
      accent: '#FF2D55', 
      blue: '#00A3FF', 
      green: '#39FF14',
      tooltip: 'Cyberpunk Neon: Primary #00F0FF (Electric Cyan), Accent #FF2D55 (Neon Crimson), Blue #00A3FF, Green #39FF14 (Acid Green)'
    },
    { 
      name: 'Velvet Amber', 
      primary: '#FAB387', 
      accent: '#FAB387', 
      blue: '#89b4fa', 
      green: '#a6e3a1',
      tooltip: 'Velvet Amber: Primary #FAB387 (Peach/Amber), Accent #FAB387, Blue #89b4fa, Green #a6e3a1 - soothing Catppuccin palette'
    },
    { 
      name: 'Emerald Forest', 
      primary: '#2ECC71', 
      accent: '#F1C40F', 
      blue: '#3498DB', 
      green: '#27AE60',
      tooltip: 'Emerald Forest: Primary #2ECC71 (Lush Emerald), Accent #F1C40F (Golden Yellow), Blue #3498DB, Green #27AE60 - organic botanical hues'
    },
    { 
      name: 'Nordic Aurora', 
      primary: '#00FFB2', 
      accent: '#00E5FF', 
      blue: '#0A84FF', 
      green: '#32D74B',
      tooltip: 'Nordic Aurora: Primary #00FFB2 (Mint Teal), Accent #00E5FF (Sky Cyan), Blue #0A84FF, Green #32D74B - cold crisp aurora tones'
    },
    { 
      name: 'Sunset Crimson', 
      primary: '#FF375F', 
      accent: '#FF9F0A', 
      blue: '#5E5CE6', 
      green: '#FFD60A',
      tooltip: 'Sunset Crimson: Primary #FF375F (Vivid Rose), Accent #FF9F0A (Dusk Orange), Blue #5E5CE6, Green #FFD60A - dramatic twilight sunset'
    },
    { 
      name: 'Deep Cobalt', 
      primary: '#0A84FF', 
      accent: '#66D4CF', 
      blue: '#0A84FF', 
      green: '#5AC8F5',
      tooltip: 'Deep Cobalt: Primary #0A84FF (Azure Blue), Accent #66D4CF (Turquoise), Blue #0A84FF, Green #5AC8F5 - classic oceanic tech tones'
    },
  ];

  const handleOpenSaveModal = () => {
    setEditingPreset(null);
    setPresetNameInput(`${theme.name} Custom Palette`);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (preset: CustomPalettePreset) => {
    setEditingPreset(preset);
    setPresetNameInput(preset.name);
    setIsModalOpen(true);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetNameInput.trim()) return;

    if (editingPreset) {
      const updated = customPalettes.map((p) =>
        p.id === editingPreset.id ? { ...p, name: presetNameInput.trim() } : p
      );
      setCustomPalettes(updated);
      saveCustomPalettes(updated);
    } else {
      const newPreset: CustomPalettePreset = {
        id: `palette_${Date.now()}`,
        name: presetNameInput.trim(),
        palette: { ...palette },
        createdAt: Date.now(),
      };
      const updated = [newPreset, ...customPalettes];
      setCustomPalettes(updated);
      saveCustomPalettes(updated);
    }

    setIsModalOpen(false);
    setEditingPreset(null);
    setPresetNameInput('');
  };

  const handleDeletePreset = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete custom palette "${name}"?`)) {
      const updated = customPalettes.filter((p) => p.id !== id);
      setCustomPalettes(updated);
      saveCustomPalettes(updated);
    }
  };

  const handleApplyPreset = (p: CustomPalettePreset) => {
    onChange({
      palette: { ...p.palette },
      engine: {
        ...engine,
        glowColor: p.palette.primary,
      }
    });
  };

  const spectrumLabels = [
    { key: 'red', label: 'Red', tip: 'Red: Used for error states, alarms, high temperatures, and emergency indicators' },
    { key: 'pink', label: 'Pink', tip: 'Pink: Used for media playing badges, feminine ambiance, and playful widgets' },
    { key: 'purple', label: 'Purple', tip: 'Purple: Used for scene selectors, media devices, and decorative elements' },
    { key: 'indigo', label: 'Indigo', tip: 'Indigo: Used for mode toggles, nocturnal scenes, and secondary states' },
    { key: 'blue', label: 'Blue', tip: 'Blue: Used for informational sensors, water leaks, and default system badges' },
    { key: 'cyan', label: 'Cyan', tip: 'Cyan: Used for HVAC cooling mode, air conditioning, and humidity indicators' },
    { key: 'teal', label: 'Teal', tip: 'Teal: Used for eco power modes, smart plugs, and energy efficiency states' },
    { key: 'green', label: 'Green', tip: 'Green: Used for active states, connected devices, normal battery, and security OK' },
    { key: 'yellow', label: 'Yellow', tip: 'Yellow: Used for light bulbs turned ON, warning alerts, and sun elevation' },
    { key: 'orange', label: 'Orange', tip: 'Orange: Used for HVAC heating mode, radiators, thermostats, and fire sensors' },
    { key: 'brown', label: 'Brown', tip: 'Brown: Used for cover blinds, shutters, soil moisture, and garden sensors' },
    { key: 'grey', label: 'Grey', tip: 'Grey: Used for offline devices, disabled entities, and subtle divider accents' },
  ];

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label 
            className="font-semibold text-slate-300 flex items-center gap-1.5"
            title="Pre-configured color palettes tuned for high readability in both dark and light modes"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Curated Palette Presets</span>
          </label>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            title="Save current active color palette into your personal presets library"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Save Current Palette</span>
          </button>
        </div>

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
              title={p.tooltip}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-colors text-left group"
            >
              <span className="font-medium text-slate-300 text-[11px] truncate group-hover:text-white">{p.name}</span>
              <div className="flex gap-1 shrink-0 ml-1.5">
                <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.primary }} />
                <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.accent }} />
                <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: p.blue }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {customPalettes.length > 0 && (
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
          <label 
            className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs"
            title="Your saved custom color presets stored in browser local storage"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>Custom User Palettes</span>
          </label>

          <div className="grid grid-cols-1 gap-1.5">
            {customPalettes.map((cp) => (
              <div
                key={cp.id}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div 
                  onClick={() => handleApplyPreset(cp)}
                  title={`Click to apply "${cp.name}" (Primary: ${cp.palette.primary}, Accent: ${cp.palette.accent})`}
                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer group"
                >
                  <div className="flex gap-1 shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: cp.palette.primary }} />
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: cp.palette.accent }} />
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: cp.palette.blue }} />
                  </div>
                  <span className="font-semibold text-xs text-slate-300 group-hover:text-purple-300 truncate">
                    {cp.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleApplyPreset(cp)}
                    title={`Apply ${cp.name} palette to active theme`}
                    className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-semibold transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cp)}
                    title={`Rename ${cp.name}`}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeletePreset(cp.id, cp.name)}
                    title={`Delete ${cp.name}`}
                    className="p-1 rounded hover:bg-red-950/50 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div 
          className="font-semibold text-slate-300 flex items-center gap-1.5"
          title="Primary and accent colors drive switches, sliders, active icons, and specular card glows"
        >
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span>Primary Accent & Glow</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label 
              className="text-[11px] text-slate-400"
              title="Main theme color (--primary-color, active entity states, tab indicators, toggle switches)"
            >
              Primary Color
            </label>
            <div 
              className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
              title={`Primary color: ${palette.primary}. Controls main switches, sliders, active icons, and primary buttons.`}
            >
              <HexColorField label="Primary color" value={palette.primary} onCommit={(hex) => updatePalette('primary', hex)} />
            </div>
          </div>

          <div className="space-y-1">
            <label 
              className="text-[11px] text-slate-400"
              title="Secondary accent color (--accent-color, badges, highlights, and secondary glow effects)"
            >
              Accent Color
            </label>
            <div 
              className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
              title={`Accent color: ${palette.accent}. Controls secondary buttons, highlights, and badge accents.`}
            >
              <HexColorField label="Accent color" value={palette.accent} onCommit={(hex) => updatePalette('accent', hex)} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex justify-between items-center text-slate-400">
          <span 
            className="font-medium text-[11px]"
            title="Automatically generated 10-step luminance ramp used by Home Assistant UI elements (--ha-color-primary-05 to 95)"
          >
            Home Assistant Primary Ramp (--ha-color-primary-05..95)
          </span>
        </div>

        <div className="flex rounded-lg overflow-hidden h-6 border border-slate-800">
          {primaryRamp.map((step) => (
            <div
              key={step.step}
              title={`--ha-color-primary-${step.step}: ${step.hex} (Click to set as primary)`}
              onClick={() => updatePalette('primary', step.hex)}
              className="flex-1 cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: step.hex }}
            />
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div 
          className="font-semibold text-slate-300 text-xs"
          title="Home Assistant standardized RGB state color tokens used for sensor domains, alerts, lights, and climate states"
        >
          Spectrum Colors (HA RGB Tokens)
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {spectrumLabels.map((item) => (
            <div key={item.key} className="space-y-1">
              <span 
                className="text-[10px] text-slate-400"
                title={item.tip}
              >
                {item.label}
              </span>
              <div 
                className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 hover:border-slate-700"
                title={item.tip}
              >
                <HexColorField
                  size="sm"
                  label={`${item.label} token color`}
                  value={palette[item.key as keyof typeof palette] || '#888888'}
                  onCommit={(hex) => updatePalette(item.key as any, hex)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingPreset ? 'Rename Custom Palette' : 'Save Current Palette'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 text-xs font-semibold">Palette Preset Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder="e.g. Lavender Dream, Cyber Ocean..."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Preview Colors:</span>
                <div className="flex gap-1.5">
                  <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: palette.primary }} title="Primary" />
                  <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: palette.accent }} title="Accent" />
                  <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: palette.blue }} title="Blue" />
                  <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: palette.green }} title="Green" />
                  <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: palette.red }} title="Red" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingPreset ? 'Update Name' : 'Save Preset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
