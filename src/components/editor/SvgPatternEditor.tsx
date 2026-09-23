import React, { useState, useEffect } from 'react';
import { Shapes, Sparkles, Code2, Trash2, Plus, Edit2, X, Save } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { CustomSvgPreset } from '../../types/customPresets';
import { loadCustomSvgs, saveCustomSvgs } from '../../utils/customPresetsStorage';

interface SvgPatternEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const SvgPatternEditor: React.FC<SvgPatternEditorProps> = ({ theme, onChange }) => {
  const [customSvgs, setCustomSvgs] = useState<CustomSvgPreset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomSvgPreset | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    setCustomSvgs(loadCustomSvgs());
  }, []);

  const svgPresets = [
    {
      name: 'Electric Arc & Pulse',
      desc: 'High-voltage electric lightning paths and energy sparks',
      tooltip: 'Electric Arc & Pulse: Intricate 120x120 repeating high-voltage cyan and magenta lightning paths with energized junction nodes',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="electric-arcs" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M10 20 L40 35 L30 55 L70 75 L55 90 L100 110" fill="none" stroke="#00F0FF" stroke-width="1.2" opacity="0.45" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M70 10 L85 25 L75 40 L110 50" fill="none" stroke="#FF007F" stroke-width="1" opacity="0.35" stroke-linecap="round"/>
      <circle cx="40" cy="35" r="2.5" fill="#00F0FF" opacity="0.8"/>
      <circle cx="70" cy="75" r="2.5" fill="#00F0FF" opacity="0.8"/>
      <circle cx="100" cy="110" r="3" fill="#FFFFFF" opacity="0.9"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#electric-arcs)" />
</svg>`,
    },
    {
      name: 'Harmonic Ocean Waves',
      desc: 'Smooth cascading sine wave flow',
      tooltip: 'Harmonic Ocean Waves: Gentle layered cyan and blue sine waves cascading smoothly across your dashboard background',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="ocean-waves" width="140" height="80" patternUnits="userSpaceOnUse">
      <path d="M0 25 C35 10, 70 40, 105 25 C122 17, 132 20, 140 25" fill="none" stroke="#66D4CF" stroke-width="1.5" opacity="0.35"/>
      <path d="M0 55 C35 40, 70 70, 105 55 C122 47, 132 50, 140 55" fill="none" stroke="#0A84FF" stroke-width="1.2" opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#ocean-waves)" />
</svg>`,
    },
    {
      name: 'Dreamy Fluffy Clouds',
      desc: 'Soft ambient drifting cloud silhouettes',
      tooltip: 'Dreamy Fluffy Clouds: Ambient pastel white and violet cloud cluster silhouettes with soft opacity',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="fluffy-clouds" width="180" height="120" patternUnits="userSpaceOnUse">
      <path d="M30 40 A12 12 0 0 1 50 30 A18 18 0 0 1 80 34 A14 14 0 0 1 96 46 A10 10 0 0 1 90 60 L24 60 A10 10 0 0 1 30 40 Z" fill="#FFFFFF" opacity="0.12"/>
      <path d="M110 85 A10 10 0 0 1 125 78 A14 14 0 0 1 150 80 A12 12 0 0 1 164 90 A8 8 0 0 1 158 102 L105 102 A8 8 0 0 1 110 85 Z" fill="#BF5AF2" opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#fluffy-clouds)" />
</svg>`,
    },
    {
      name: 'Minimal Mountain Peaks',
      desc: 'Crisp geometric alpine ridge silhouettes',
      tooltip: 'Minimal Mountain Peaks: Clean geometric mountain ridges with subtle glowing peak outlines',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="mountain-peaks" width="160" height="100" patternUnits="userSpaceOnUse">
      <polygon points="0,100 40,40 80,100" fill="#32D74B" opacity="0.10"/>
      <polygon points="60,100 110,25 160,100" fill="#0A84FF" opacity="0.14"/>
      <polygon points="120,100 145,60 170,100" fill="#5AC8F5" opacity="0.08"/>
      <polyline points="40,40 30,55 50,55" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.3"/>
      <polyline points="110,25 98,45 122,45" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity="0.4"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#mountain-peaks)" />
</svg>`,
    },
    {
      name: 'Cyberpunk Tech Circuit',
      desc: 'Futuristic PCB circuit traces with micro-nodes',
      tooltip: 'Cyberpunk Tech Circuit: Printed circuit board traces with micro glowing connection nodes in cyan and crimson',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="circuits" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 10 10 L 40 10 L 50 20 L 80 20" fill="none" stroke="#00F0FF" stroke-width="1" opacity="0.25" />
      <circle cx="80" cy="20" r="2.5" fill="#00F0FF" opacity="0.5" />
      <path d="M 20 60 L 60 60 L 70 70 L 90 70" fill="none" stroke="#FF2D55" stroke-width="1" opacity="0.25" />
      <circle cx="20" cy="60" r="2.5" fill="#FF2D55" opacity="0.5" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#circuits)" />
</svg>`,
    },
    {
      name: 'Synthwave Perspective Grid',
      desc: 'Classic neon wireframe digital landscape',
      tooltip: 'Synthwave Perspective Grid: 80s outrun wireframe digital mesh grid pattern',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="synth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00E5FF" stroke-width="0.75" opacity="0.22"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#synth-grid)" />
</svg>`,
    },
    {
      name: 'Kids Playful Stars & Moon',
      desc: 'Cheerful starry constellation with crescent moon',
      tooltip: 'Kids Playful Stars & Moon: Cheerful sparkling golden stars, pastel pink dots, and crescent moons',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="kids-stars" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M20 15 L22 21 L28 22 L23 26 L25 32 L20 28 L15 32 L17 26 L12 22 L18 21 Z" fill="#FFD54F" opacity="0.4"/>
      <circle cx="80" cy="40" r="3" fill="#FF80AB" opacity="0.45"/>
      <circle cx="95" cy="85" r="4" fill="#80D8FF" opacity="0.45"/>
      <path d="M85 70 A10 10 0 0 0 95 85 A12 12 0 1 1 85 70 Z" fill="#FFD54F" opacity="0.35"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#kids-stars)" />
</svg>`,
    },
    {
      name: 'Carbon Hexagon Honeycomb',
      desc: 'High-tech hexagonal tessellation lattice',
      tooltip: 'Carbon Hexagon Honeycomb: High-tech carbon fiber hexagonal lattice grid for a clean structured look',
      code: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="hex-mesh" width="56" height="96" patternUnits="userSpaceOnUse">
      <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z" fill="none" stroke="#FFFFFF" stroke-width="0.8" opacity="0.15"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#hex-mesh)" />
</svg>`,
    },
  ];

  const handleOpenSaveModal = () => {
    setEditingPreset(null);
    setNameInput('');
    setDescInput('');
    setCodeInput(theme.customSvgOverlay || '');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (preset: CustomSvgPreset) => {
    setEditingPreset(preset);
    setNameInput(preset.name);
    setDescInput(preset.desc);
    setCodeInput(preset.code);
    setIsModalOpen(true);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !codeInput.trim()) return;

    if (editingPreset) {
      const updated = customSvgs.map((s) =>
        s.id === editingPreset.id
          ? { ...s, name: nameInput.trim(), desc: descInput.trim(), code: codeInput.trim() }
          : s
      );
      setCustomSvgs(updated);
      saveCustomSvgs(updated);
      if (theme.customSvgOverlay === editingPreset.code) {
        onChange({ customSvgOverlay: codeInput.trim() });
      }
    } else {
      const newPreset: CustomSvgPreset = {
        id: `svg_${Date.now()}`,
        name: nameInput.trim(),
        desc: descInput.trim() || 'Custom user SVG pattern overlay',
        code: codeInput.trim(),
        createdAt: Date.now(),
      };
      const updated = [newPreset, ...customSvgs];
      setCustomSvgs(updated);
      saveCustomSvgs(updated);
    }

    setIsModalOpen(false);
    setEditingPreset(null);
    setNameInput('');
    setDescInput('');
    setCodeInput('');
  };

  const handleDeletePreset = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete custom SVG pattern "${name}"?`)) {
      const updated = customSvgs.filter((s) => s.id !== id);
      setCustomSvgs(updated);
      saveCustomSvgs(updated);
    }
  };

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <label 
          className="font-semibold text-slate-300 flex items-center gap-1.5"
          title="Curated SVG vector patterns that overlay on top of background wallpapers with soft blending"
        >
          <Shapes className="w-3.5 h-3.5 text-purple-400" />
          <span>Preset Vector Overlays & SVG Patterns</span>
        </label>

        <div className="grid grid-cols-1 gap-2">
          {svgPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange({ customSvgOverlay: preset.code })}
              title={preset.tooltip}
              className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90 flex items-center justify-between transition-colors text-left group"
            >
              <div>
                <div className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors">
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</div>
              </div>
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {customSvgs.length > 0 && (
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
          <label 
            className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs"
            title="Custom SVG patterns you have saved to your personal library"
          >
            <Shapes className="w-3.5 h-3.5 text-blue-400" />
            <span>Custom User SVG Patterns</span>
          </label>

          <div className="grid grid-cols-1 gap-1.5">
            {customSvgs.map((cs) => (
              <div
                key={cs.id}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div 
                  onClick={() => onChange({ customSvgOverlay: cs.code })}
                  title={`Click to apply pattern: ${cs.name} (${cs.desc})`}
                  className="flex-1 min-w-0 cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-blue-300 truncate">
                    {cs.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {cs.desc}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onChange({ customSvgOverlay: cs.code })}
                    title={`Apply ${cs.name} to active theme`}
                    className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-semibold transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cs)}
                    title={`Edit ${cs.name} SVG code`}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeletePreset(cs.id, cs.name)}
                    title={`Delete ${cs.name}`}
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

      <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex justify-between items-center text-slate-300 font-semibold">
          <div 
            className="flex items-center gap-1.5"
            title="Paste custom SVG vector code directly to render dynamic overlays in real time"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Custom SVG Code (Live Overlay)</span>
          </div>

          <div className="flex items-center gap-1.5">
            {theme.customSvgOverlay && theme.customSvgOverlay.trim() && (
              <button
                onClick={handleOpenSaveModal}
                title="Save current SVG code into your personal custom pattern library"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-950/50 border border-blue-800/60 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Save as Preset</span>
              </button>
            )}

            {theme.customSvgOverlay && (
              <button
                onClick={() => onChange({ customSvgOverlay: undefined })}
                title="Remove active SVG overlay from theme"
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-red-950/40 border border-red-900/50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        <textarea
          value={theme.customSvgOverlay || ''}
          onChange={(e) => onChange({ customSvgOverlay: e.target.value })}
          placeholder="Paste raw <svg> ... </svg> code here to render custom decorative overlays, stars, clouds, or meshes..."
          title="Paste XML <svg> code here with patterns, gradients or shapes"
          rows={8}
          className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
        />
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Shapes className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingPreset ? 'Edit SVG Pattern Preset' : 'Save SVG Pattern Preset'}
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
              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-semibold">Pattern Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Hex Waveform, Starlight Grid..."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-semibold">Short Description / Tooltip</label>
                <input
                  type="text"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="e.g. High-tech animated neon laser pulse..."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-semibold">SVG Code</label>
                <textarea
                  required
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  rows={6}
                  placeholder="<svg ...> ... </svg>"
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl font-mono text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
                />
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
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingPreset ? 'Update Preset' : 'Save Preset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
