import React, { useState, useEffect } from 'react';
import { Code, Sparkles, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { CustomCssPreset } from '../../types/customPresets';
import { loadCustomCss, saveCustomCss } from '../../utils/customPresetsStorage';

interface CustomCssEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const CustomCssEditor: React.FC<CustomCssEditorProps> = ({ theme, onChange }) => {
  const [customCssList, setCustomCssList] = useState<CustomCssPreset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CustomCssPreset | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [cssInput, setCssInput] = useState('');

  useEffect(() => {
    setCustomCssList(loadCustomCss());
  }, []);

  const cssSnippets = [
    {
      name: 'Pulsing Card Neon Glow',
      desc: 'Smooth breathing keyframe pulse animation around all ha-card elements',
      tooltip: 'Pulsing Card Neon Glow: Injects @keyframes neonPulse and assigns infinite breathing animation to ha-card shadow roots',
      css: `@keyframes neonPulse {
  0% { box-shadow: 0 0 15px var(--hats-glow-color, var(--ultimate-glow-color, var(--primary-color))); }
  50% { box-shadow: 0 0 35px var(--hats-glow-color, var(--ultimate-glow-color, var(--primary-color))); }
  100% { box-shadow: 0 0 15px var(--hats-glow-color, var(--ultimate-glow-color, var(--primary-color))); }
}
ha-card {
  animation: neonPulse 3s infinite ease-in-out;
}`,
    },
    {
      name: 'Rounded Gradient Border',
      desc: 'Gradient stroke rim effect with padding-box background clip',
      tooltip: 'Rounded Gradient Border: Creates multi-layer 2px gradient stroke around ha-card elements with crisp clipping',
      css: `ha-card {
  border: 2px solid transparent !important;
  background-clip: padding-box, border-box !important;
  background-origin: padding-box, border-box !important;
}`,
    },
    {
      name: 'Playful Storybook Font Injection',
      desc: 'Imports Google Font "Fredoka" and applies across Lovelace views',
      tooltip: 'Playful Storybook Font Injection: Loads Google Fonts Fredoka and applies playful typography to cards, header, and views',
      css: `@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');
ha-card, app-header, hui-view {
  font-family: 'Fredoka', 'Inter', sans-serif !important;
}`,
    },
    {
      name: 'Frosted Glass Sub-Cards',
      desc: 'Deep multi-level glassmorphism on nested mushroom & tile cards',
      tooltip: 'Frosted Glass Sub-Cards: Forces 16px backdrop-filter blur and subtle border strokes on inner nested cards',
      css: `ha-card hui-card, ha-card mushroom-card, ha-card hui-tile-card {
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  background: rgba(255, 255, 255, 0.04) !important;
  border-radius: 20px !important;
}`,
    },
  ];

  const handleOpenSaveModal = () => {
    setEditingSnippet(null);
    setNameInput('');
    setDescInput('');
    setCssInput(theme.customCss || '');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (snippet: CustomCssPreset) => {
    setEditingSnippet(snippet);
    setNameInput(snippet.name);
    setDescInput(snippet.description);
    setCssInput(snippet.css);
    setIsModalOpen(true);
  };

  const handleSaveSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !cssInput.trim()) return;

    if (editingSnippet) {
      const updated = customCssList.map((s) =>
        s.id === editingSnippet.id
          ? { ...s, name: nameInput.trim(), description: descInput.trim(), css: cssInput.trim() }
          : s
      );
      setCustomCssList(updated);
      saveCustomCss(updated);
    } else {
      const newSnippet: CustomCssPreset = {
        id: `css_${Date.now()}`,
        name: nameInput.trim(),
        description: descInput.trim() || 'Custom user CSS snippet',
        css: cssInput.trim(),
        createdAt: Date.now(),
      };
      const updated = [newSnippet, ...customCssList];
      setCustomCssList(updated);
      saveCustomCss(updated);
    }

    setIsModalOpen(false);
    setEditingSnippet(null);
    setNameInput('');
    setDescInput('');
    setCssInput('');
  };

  const handleDeleteSnippet = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete custom snippet "${name}"?`)) {
      const updated = customCssList.filter((s) => s.id !== id);
      setCustomCssList(updated);
      saveCustomCss(updated);
    }
  };

  const handleAppendSnippet = (name: string, css: string) => {
    const existing = theme.customCss ? `${theme.customCss}\n\n` : '';
    onChange({ customCss: `${existing}/* ${name} */\n${css}` });
  };

  return (
    <div className="space-y-6 text-slate-200 text-xs">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label 
            className="font-semibold text-slate-300 flex items-center gap-1.5"
            title="Pre-composed card-mod CSS snippets for keyframe animations, fonts, and sub-card styling"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Curated CSS Snippets</span>
          </label>

          <button
            type="button"
            onClick={handleOpenSaveModal}
            title="Save custom CSS code as a reusable snippet preset"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Save Snippet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {cssSnippets.map((snip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAppendSnippet(snip.name, snip.css)}
              title={snip.tooltip}
              className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90 flex items-center justify-between transition-colors text-left group"
            >
              <div>
                <div className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">
                  {snip.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{snip.desc}</div>
              </div>
              <span className="text-[11px] text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 shrink-0 ml-2">
                + Append
              </span>
            </button>
          ))}
        </div>
      </div>

      {customCssList.length > 0 && (
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
          <label 
            className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs"
            title="Your saved custom CSS snippets with custom tooltips and rules"
          >
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>Custom User CSS Snippets</span>
          </label>

          <div className="grid grid-cols-1 gap-1.5">
            {customCssList.map((cs) => (
              <div
                key={cs.id}
                title={`Snippet: ${cs.name} • ${cs.description}`}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div 
                  onClick={() => handleAppendSnippet(cs.name, cs.css)}
                  className="flex-1 min-w-0 cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-blue-300 truncate">
                    {cs.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {cs.description}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleAppendSnippet(cs.name, cs.css)}
                    title={`Append ${cs.name} to custom CSS`}
                    className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-semibold transition-colors"
                  >
                    + Append
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cs)}
                    title={`Edit ${cs.name}`}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteSnippet(cs.id, cs.name)}
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
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-1.5 font-semibold text-slate-300"
            title="Custom CSS injected via card-mod into Home Assistant Lovelace card shadow roots"
          >
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>Custom card-mod Injected CSS</span>
          </div>

          {theme.customCss && theme.customCss.trim() && (
            <button
              onClick={handleOpenSaveModal}
              title="Save current custom CSS as a reusable snippet preset"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-950/50 border border-blue-800/60 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Save as Snippet</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Write custom CSS rules injected directly into Home Assistant's Lovelace cards shadow roots:
        </p>

        <textarea
          value={theme.customCss || ''}
          onChange={(e) => onChange({ customCss: e.target.value })}
          placeholder={`ha-card {\n  /* Custom shadow, animation or border override */\n}`}
          title="Custom CSS editor - writes styles executed live in the preview sandbox and injected in HA"
          rows={10}
          className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingSnippet ? 'Edit CSS Snippet' : 'Save Custom CSS Snippet'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSnippet} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-semibold">Snippet Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Glowing Neon Border, Custom Font..."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-semibold">Tooltip / Brief Description</label>
                <input
                  type="text"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="e.g. Adds pulsing cyan glow around temperature gauges..."
                  className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 text-xs font-semibold">CSS Code</label>
                <textarea
                  required
                  value={cssInput}
                  onChange={(e) => setCssInput(e.target.value)}
                  rows={6}
                  placeholder={`ha-card {\n  /* CSS rules */\n}`}
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
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingSnippet ? 'Update Snippet' : 'Save Snippet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
