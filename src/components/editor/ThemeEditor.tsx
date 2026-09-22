import React, { useState } from 'react';
import { Sliders, Palette, Image as ImageIcon, Shapes, Code, Info } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { EngineSettings } from './EngineSettings';
import { PaletteEditor } from './PaletteEditor';
import { BackgroundStudio } from './BackgroundStudio';
import { SvgPatternEditor } from './SvgPatternEditor';
import { CustomCssEditor } from './CustomCssEditor';

interface ThemeEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ theme, onChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'engine' | 'palette' | 'background' | 'svg' | 'css' | 'info'>('engine');

  const tabs = [
    { id: 'engine', label: 'Engine', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'palette', label: 'Palette', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'background', label: 'Artwork', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'svg', label: 'SVG Patterns', icon: <Shapes className="w-3.5 h-3.5" /> },
    { id: 'css', label: 'Custom CSS', icon: <Code className="w-3.5 h-3.5" /> },
    { id: 'info', label: 'Info', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950/80 border-r border-slate-800/80 overflow-hidden">
      <div className="p-4 border-b border-slate-800/80 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={theme.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Theme Name..."
            className="bg-transparent font-bold text-base text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={theme.category}
            onChange={(e) => onChange({ category: e.target.value as any })}
            className="bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 rounded-md px-2 py-1 focus:outline-none"
          >
            <option value="Kids">Kids & Playful</option>
            <option value="Glass">Liquid Glass</option>
            <option value="Velvet">Velvet Matte</option>
            <option value="Neon">Cyber Neon</option>
            <option value="Retro">Retro / Synthwave</option>
            <option value="Nature">Nature / Solarpunk</option>
            <option value="Minimal">Minimal</option>
            <option value="Community">Community</option>
          </select>

          <span className="text-[11px] text-slate-500">by {theme.author}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 p-2 border-b border-slate-800/80 overflow-x-auto shrink-0 select-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeSubTab === tab.id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeSubTab === 'engine' && <EngineSettings theme={theme} onChange={onChange} />}
        {activeSubTab === 'palette' && <PaletteEditor theme={theme} onChange={onChange} />}
        {activeSubTab === 'background' && <BackgroundStudio theme={theme} onChange={onChange} />}
        {activeSubTab === 'svg' && <SvgPatternEditor theme={theme} onChange={onChange} />}
        {activeSubTab === 'css' && <CustomCssEditor theme={theme} onChange={onChange} />}
        {activeSubTab === 'info' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Author Name / Handle</label>
              <input
                type="text"
                value={theme.author}
                onChange={(e) => onChange({ author: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">GitHub Username</label>
              <input
                type="text"
                value={theme.authorGithub || ''}
                onChange={(e) => onChange({ authorGithub: e.target.value })}
                placeholder="e.g. your-github-username"
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Theme Description & Mood</label>
              <textarea
                value={theme.description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
