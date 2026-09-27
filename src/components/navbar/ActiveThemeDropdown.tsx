import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface ActiveThemeDropdownProps {
  activeTheme: ThemeConfig;
  allThemes: ThemeConfig[];
  onSelectTheme: (themeId: string) => void;
}

export const ActiveThemeDropdown: React.FC<ActiveThemeDropdownProps> = ({
  activeTheme,
  allThemes,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = allThemes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/80 shadow-sm transition-all group"
        title="Select Active Theme"
      >
        <div
          className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0 transition-transform group-hover:scale-110"
          style={{ backgroundColor: activeTheme.palette.primary }}
        />
        <span className="truncate max-w-[130px] font-semibold text-white">{activeTheme.name}</span>
        
        {activeTheme.isInstalled ? (
          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[9px] border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Installed</span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hidden sm:inline">
            {activeTheme.category}
          </span>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 max-h-80 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search 150+ themes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-1.5 space-y-1 max-h-60">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No themes found matching "{search}"
              </div>
            ) : (
              filtered.map((t) => {
                const isCurrent = t.id === activeTheme.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                      isCurrent
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: t.palette.primary }}
                      />
                      <span className="truncate">{t.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {t.isInstalled ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-mono border border-emerald-700/40" title="Installed in Home Assistant">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>HA</span>
                        </span>
                      ) : null}

                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                        {t.category}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-500 flex justify-between items-center shrink-0">
            <span>{filtered.length} themes</span>
            <span>{allThemes.filter(t => t.isInstalled).length} installed in HA</span>
          </div>
        </div>
      )}
    </div>
  );
};
