import React from 'react';
import {
  Palette,
  Layers,
  Users,
  Code,
  Download,
  Upload,
  GitPullRequest,
  Sun,
  Moon,
  Plus,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { HatsLogo } from '../common/HatsLogo';
import { ThemeConfig } from '../../types/theme';
import { ActiveThemeDropdown } from './ActiveThemeDropdown';
import { GithubRepoButton } from './GithubRepoButton';

interface NavbarProps {
  activeTheme: ThemeConfig;
  allThemes?: ThemeConfig[];
  onSelectTheme?: (themeId: string) => void;
  activeTab: 'editor' | 'library' | 'community' | 'code';
  setActiveTab: (tab: 'editor' | 'library' | 'community' | 'code') => void;
  previewMode: 'dark' | 'light';
  setPreviewMode: (mode: 'dark' | 'light') => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenSubmitPr: () => void;
  onNewTheme: () => void;
  onOpenDoctor: () => void;
  needsSetup?: boolean;
  previewOnly?: boolean;
  standalone?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTheme,
  allThemes,
  onSelectTheme,
  activeTab,
  setActiveTab,
  previewMode,
  setPreviewMode,
  onOpenExport,
  onOpenImport,
  onOpenSubmitPr,
  onNewTheme,
  onOpenDoctor,
  needsSetup = false,
  previewOnly = false,
  standalone = false,
}) => {
  const handleOpenNewTab = () => {
    const targetUrl = window.location.href;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white cursor-pointer group"
          onClick={() => setActiveTab('library')}
          title="HATS - Home Assistant Theme Store"
        >
          <HatsLogo size={32} />
          <div className="flex flex-col">
            <span className="leading-none text-base font-extrabold tracking-tight group-hover:text-blue-400 transition-colors">HATS</span>
            <span className="text-[9px] text-slate-400 font-normal leading-none mt-0.5 hidden sm:inline">Home Assistant Theme Store</span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block mx-1" />

        {allThemes && onSelectTheme ? (
          <ActiveThemeDropdown
            activeTheme={activeTheme}
            allThemes={allThemes}
            onSelectTheme={onSelectTheme}
          />
        ) : (
          <button 
            onClick={() => setActiveTab('library')}
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/60 transition-colors"
          >
            <div 
              className="w-2.5 h-2.5 rounded-full shadow-sm" 
              style={{ backgroundColor: activeTheme.palette.primary }}
            />
            <span className="truncate max-w-[140px]">{activeTheme.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900">
              {activeTheme.category}
            </span>
          </button>
        )}
      </div>

      <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80 text-xs font-medium">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            activeTab === 'editor'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Designer</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            activeTab === 'library'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Themes</span>
        </button>

        {!previewOnly && (
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            activeTab === 'community'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Community & PR</span>
        </button>
        )}

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
            activeTab === 'code'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>YAML Code</span>
        </button>
      </nav>

      <div className="flex items-center gap-2">
        {needsSetup && (
          <button
            onClick={onOpenDoctor}
            title="Action required: open HA Doctor to see what is missing in Home Assistant"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-xs bg-amber-950/60 hover:bg-amber-900/70 border-amber-500/60 text-amber-200 shadow-md shadow-amber-500/20 animate-pulse"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Setup Needed</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </button>
        )}

        <button
          onClick={() => setPreviewMode(previewMode === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${previewMode === 'dark' ? 'Light' : 'Dark'} Mode Preview`}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
        >
          {previewMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {!standalone && (
        <button
          onClick={handleOpenNewTab}
          title="Open HATS in a Full New Browser Tab"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-sky-400" />
        </button>
        )}

        <button
          onClick={onNewTheme}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Theme</span>
        </button>

        <GithubRepoButton />

        {!previewOnly && (
        <button
          onClick={onOpenSubmitPr}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-purple-500/25"
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send PR / Issue</span>
        </button>
        )}

        {activeTab === 'editor' && (
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-blue-500/25"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
        )}

        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};
