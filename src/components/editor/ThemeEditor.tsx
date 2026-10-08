import React, { useState, Suspense, lazy } from 'react';
import { Sliders, Palette, Image as ImageIcon, Shapes, Code, Info, Zap, Edit3, Puzzle } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { EngineSettings } from './EngineSettings';
import { ComponentsEditor } from './ComponentsEditor';
import { useStandalone } from '../../state/useStandalone';
import { IS_HOSTED } from '../../runtime';
const PaletteEditor = lazy(() => import('./PaletteEditor').then((m) => ({ default: m.PaletteEditor })));
const BackgroundStudio = lazy(() => import('./BackgroundStudio').then((m) => ({ default: m.BackgroundStudio })));
const SvgPatternEditor = lazy(() => import('./SvgPatternEditor').then((m) => ({ default: m.SvgPatternEditor })));
const CustomCssEditor = lazy(() => import('./CustomCssEditor').then((m) => ({ default: m.CustomCssEditor })));

const SubTabLoading: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
  </div>
);

interface ThemeEditorProps {
  theme: ThemeConfig;
  onChange: (updates: Partial<ThemeConfig>) => void;
  onOpenExport?: () => void;
  onEditCopy?: () => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ theme, onChange, onOpenExport, onEditCopy }) => {
  const standalone = useStandalone();
  const [activeSubTab, setActiveSubTab] = useState<'engine' | 'palette' | 'background' | 'svg' | 'components' | 'css' | 'info'>('engine');

  const tabs = [
    {
      id: 'engine',
      label: 'Engine',
      icon: <Sliders className="w-3.5 h-3.5" />,
      tooltip: 'Engine: Core visual styles, card corner radii, frosted glass blur, specular sheen, and sidebar translucency'
    },
    {
      id: 'palette',
      label: 'Palette',
      icon: <Palette className="w-3.5 h-3.5" />,
      tooltip: 'Palette: Primary accents, glow colors, Home Assistant color ramps, and RGB tokens'
    },
    {
      id: 'background',
      label: 'Artwork',
      icon: <ImageIcon className="w-3.5 h-3.5" />,
      tooltip: 'Artwork: Upload wallpaper, choose atmospheric gradients, and fine-tune image post-processing'
    },
    {
      id: 'svg',
      label: 'SVG Patterns',
      icon: <Shapes className="w-3.5 h-3.5" />,
      tooltip: 'SVG Patterns: Vector overlays, electric arcs, ocean waves, cloud silhouettes, and circuit traces'
    },
    {
      id: 'components',
      label: 'Cards',
      icon: <Puzzle className="w-3.5 h-3.5" />,
      tooltip: 'Cards: Turn theme support on or off for UIX / card-mod, Mushroom, Bubble Card, Layout Card, Button Card and Stack-in-Card'
    },
    {
      id: 'css',
      label: 'Custom CSS',
      icon: <Code className="w-3.5 h-3.5" />,
      tooltip: 'Custom CSS: UIX / card-mod custom stylesheet rules, keyframe animations, and shadow DOM styling'
    },
    {
      id: 'info',
      label: 'Info',
      icon: <Info className="w-3.5 h-3.5" />,
      tooltip: 'Info: Author details, GitHub handle, and theme mood description'
    },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950/80 border-r border-slate-800/80 overflow-hidden">
      {theme.rawTheme && (
        <div className="px-3.5 py-2 bg-emerald-950/40 border-b border-emerald-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold shrink-0">From GitHub</span>
            <a
              href={`https://github.com/${theme.rawTheme.source}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-xs truncate"
            >
              {theme.rawTheme.source}
            </a>
          </div>
          {onEditCopy && (
            <button
              onClick={onEditCopy}
              title="Create an editable copy (rebuilds from extracted colors and settings)"
              className="shrink-0 px-2 py-1 text-[11px] font-semibold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
            >
              Copy
            </button>
          )}
        </div>
      )}
      <div className="p-3.5 border-b border-slate-800/80 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2.5">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={theme.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Theme Name..."
              title="Click to edit theme name. This name will appear in Home Assistant theme picker."
              className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-blue-500/60 focus:border-blue-500 font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-xl pl-3 pr-7 py-1.5 transition-all shadow-inner"
            />
            <div
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-400 transition-colors"
              title="Click box to edit theme name"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </div>
          </div>

          <span
            className="text-[11px] text-slate-400 font-medium shrink-0 truncate max-w-[120px]"
            title={`Created by ${theme.author}`}
          >
            by {theme.author}
          </span>
        </div>

        {onOpenExport && !IS_HOSTED && (
          <div className="flex justify-center">
            <button
              onClick={onOpenExport}
              title={standalone
                ? 'Save this theme to your HATS themes folder'
                : theme.isInstalled ? "Save Changes to Home Assistant /config/themes" : "Install and Activate Theme in Home Assistant"}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                theme.isInstalled 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{standalone ? 'Save theme' : theme.isInstalled ? 'Save to HA' : 'Install to HA'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-2.5 border-b border-slate-800/80 shrink-0 select-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            title={tab.tooltip}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeSubTab === tab.id
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-sm'
                : 'text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-700'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeSubTab === 'engine' && <EngineSettings theme={theme} onChange={onChange} />}
        {activeSubTab === 'palette' && (
          <Suspense fallback={<SubTabLoading />}>
            <PaletteEditor theme={theme} onChange={onChange} />
          </Suspense>
        )}
        {activeSubTab === 'background' && (
          <Suspense fallback={<SubTabLoading />}>
            <BackgroundStudio theme={theme} onChange={onChange} />
          </Suspense>
        )}
        {activeSubTab === 'svg' && (
          <Suspense fallback={<SubTabLoading />}>
            <SvgPatternEditor theme={theme} onChange={onChange} />
          </Suspense>
        )}
        {activeSubTab === 'components' && <ComponentsEditor theme={theme} onChange={onChange} />}
        {activeSubTab === 'css' && (
          <Suspense fallback={<SubTabLoading />}>
            <CustomCssEditor theme={theme} onChange={onChange} />
          </Suspense>
        )}
        {activeSubTab === 'info' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="space-y-1">
              <label 
                className="text-slate-400 font-medium"
                title="Author or designer name displayable in theme previews"
              >
                Author Name / Handle
              </label>
              <input
                type="text"
                value={theme.author}
                onChange={(e) => onChange({ author: e.target.value })}
                placeholder="Author Name..."
                title="Author or designer name displayable in theme previews"
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label 
                className="text-slate-400 font-medium"
                title="GitHub handle for attribution in Community & PR sharing"
              >
                GitHub Username
              </label>
              <input
                type="text"
                value={theme.authorGithub || ''}
                onChange={(e) => onChange({ authorGithub: e.target.value })}
                placeholder="e.g. your_github_username"
                title="GitHub handle for attribution in Community & PR sharing"
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label 
                className="text-slate-400 font-medium"
                title="Detailed summary of the theme aesthetic, lighting vibe, and recommended use case"
              >
                Theme Description & Mood
              </label>
              <textarea
                value={theme.description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={4}
                placeholder="Describe your theme's design concept and visual feel..."
                title="Detailed summary of the theme aesthetic, lighting vibe, and recommended use case"
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200 resize-none focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
