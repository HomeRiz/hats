import React from 'react';
import { 
  Palette, 
  Layers, 
  Users, 
  Code, 
  Download, 
  GitPullRequest, 
  Sun, 
  Moon, 
  Plus, 
  Sparkles,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface NavbarProps {
  activeTheme: ThemeConfig;
  activeTab: 'editor' | 'library' | 'community' | 'code';
  setActiveTab: (tab: 'editor' | 'library' | 'community' | 'code') => void;
  previewMode: 'dark' | 'light';
  setPreviewMode: (mode: 'dark' | 'light') => void;
  onOpenExport: () => void;
  onOpenSubmitPr: () => void;
  onNewTheme: () => void;
  onOpenDoctor: () => void;
  isDoctorReady?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTheme,
  activeTab,
  setActiveTab,
  previewMode,
  setPreviewMode,
  onOpenExport,
  onOpenSubmitPr,
  onNewTheme,
  onOpenDoctor,
  isDoctorReady = true,
}) => {
  const handleOpenNewTab = () => {
    const targetUrl = window.location.href;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-base">HATS</span>
            <span className="text-[9px] text-slate-400 font-normal leading-none mt-0.5 hidden sm:inline">Home Assistant Theme Store</span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block mx-1" />

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
        <button
          onClick={onOpenDoctor}
          title="HA Environment & Prerequisites Doctor"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors text-xs"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${isDoctorReady ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="hidden xl:inline">HA Setup</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isDoctorReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
        </button>

        <button
          onClick={() => setPreviewMode(previewMode === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${previewMode === 'dark' ? 'Light' : 'Dark'} Mode Preview`}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
        >
          {previewMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        <button
          onClick={handleOpenNewTab}
          title="Open HATS in a Full New Browser Tab"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-sky-400" />
        </button>

        <button
          onClick={onNewTheme}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Theme</span>
        </button>

        <button
          onClick={onOpenSubmitPr}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-purple-500/25"
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Submit PR</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-blue-500/25"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
