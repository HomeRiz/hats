import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Check, 
  Upload, 
  Sparkles, 
  Sliders, 
  ExternalLink 
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { parseHomeAssistantThemeYaml } from '../../services/yamlParser';

interface ThemeGalleryProps {
  themes: ThemeConfig[];
  activeThemeId: string;
  onSelectTheme: (id: string) => void;
  onNewTheme: () => void;
  onDuplicateTheme: (id: string) => void;
  onDeleteTheme: (id: string) => void;
  onImportThemes: (imported: ThemeConfig[]) => void;
  onSwitchToEditor: () => void;
}

export const ThemeGallery: React.FC<ThemeGalleryProps> = ({
  themes,
  activeThemeId,
  onSelectTheme,
  onNewTheme,
  onDuplicateTheme,
  onDeleteTheme,
  onImportThemes,
  onSwitchToEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Kids', 'Glass', 'Velvet', 'Neon', 'Retro', 'Nature', 'Community'];

  const filteredThemes = themes.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImportYaml = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const imported = parseHomeAssistantThemeYaml(text);
        if (imported.length > 0) {
          onImportThemes(imported);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Theme Registry & Library</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {themes.length} Themes
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, customize, duplicate, or import Home Assistant themes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import YAML</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImportYaml(e.target.files[0]);
              }
            }}
            accept=".yaml,.yml"
            className="hidden"
          />

          <button
            onClick={onNewTheme}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Theme</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search themes, authors..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredThemes.map((theme) => {
          const isActive = theme.id === activeThemeId;

          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className={`group relative rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'bg-slate-900/90 border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div>
                <div 
                  className="h-24 w-full rounded-xl mb-3 relative overflow-hidden flex items-center justify-center border border-white/10 shadow-inner"
                  style={{
                    background: theme.background.type === 'gradient' 
                      ? theme.background.gradientString 
                      : (theme.background.imageUrl ? `url(${theme.background.imageUrl}) center / cover` : theme.palette.primary),
                  }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div 
                    className="relative z-10 px-3 py-1.5 rounded-xl border border-white/20 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md flex items-center gap-1.5"
                    style={{
                      backgroundColor: theme.engine.glassTint || 'rgba(255,255,255,0.1)',
                      borderRadius: `${Math.min(16, theme.engine.cardRadius / 2)}px`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.palette.primary }} />
                    <span>{theme.name}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                      {theme.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {theme.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {theme.category}
                  </span>
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.palette.primary }} />
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateTheme(theme.id);
                    }}
                    title="Duplicate Theme"
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {theme.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTheme(theme.id);
                      }}
                      title="Delete Theme"
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwitchToEditor();
                      }}
                      className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <span>Edit</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
