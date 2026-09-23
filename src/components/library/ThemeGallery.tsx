import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Copy, 
  Trash2, 
  Upload, 
  Search, 
  Sparkles, 
  Sliders, 
  Check, 
  Layers, 
  Puzzle,
  ShieldCheck, 
  RefreshCw, 
  HardDrive,
  Github,
  CheckSquare,
  Square,
  X,
  Zap,
  CheckCircle2,
  HardDriveDownload,
  Eye
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { parseHomeAssistantThemeYaml } from '../../services/yamlParser';
import { ThemeOverviewModal } from './ThemeOverviewModal';
import { DuplicateInfoModal } from '../common/DuplicateInfoModal';
import { GitHubImportModal } from '../github/GitHubImportModal';
import { 
  applyThemeDirectlyToHa, 
  deleteHaTheme, 
  reloadHomeAssistantThemes 
} from '../../services/haService';

interface ThemeGalleryProps {
  themes: ThemeConfig[];
  activeThemeId: string;
  onSelectTheme: (id: string) => void;
  onNewTheme: () => void;
  onDuplicateTheme: (id: string) => void;
  onDeleteTheme: (id: string) => void;
  onImportThemes: (imported: ThemeConfig[]) => void;
  onSwitchToEditor: () => void;
  onOpenDoctor?: () => void;
  onSyncHaThemes?: () => Promise<void> | void;
  isDoctorReady?: boolean;
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
  onOpenDoctor,
  onSyncHaThemes,
  isDoctorReady = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'available' | 'installed' | 'kids'>('available');
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [overviewThemeId, setOverviewThemeId] = useState<string | null>(null);

  const [isGitHubImportOpen, setIsGitHubImportOpen] = useState(false);

  const [duplicateTargetTheme, setDuplicateTargetTheme] = useState<ThemeConfig | null>(null);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedThemeIds, setSelectedThemeIds] = useState<Set<string>>(new Set());
  const [isBatchInstalling, setIsBatchInstalling] = useState(false);
  const [batchInstallStatus, setBatchInstallStatus] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    theme: ThemeConfig;
  } | null>(null);

  const totalAvailableCount = themes.length;
  const totalInstalledCount = themes.filter((t) => t.isInstalled).length;
  const kidsAvailableCount = themes.filter((t) => t.category === 'Kids').length;
  const kidsInstalledCount = themes.filter((t) => t.category === 'Kids' && t.isInstalled).length;

  const filteredThemes = themes.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = true;
    if (selectedFilter === 'installed') {
      matchesCategory = Boolean(t.isInstalled);
    } else if (selectedFilter === 'kids') {
      matchesCategory = t.category === 'Kids';
    }
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleCloseMenu();
    });
    return () => {
      window.removeEventListener('click', handleCloseMenu);
    };
  }, []);

  const handleSyncFromHa = async () => {
    if (!onSyncHaThemes) return;
    setIsSyncing(true);
    try {
      await onSyncHaThemes();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

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

  const triggerDuplicate = (theme: ThemeConfig) => {
    const isSuppressed = localStorage.getItem('hats_suppress_duplicate_modal') === 'true';
    if (isSuppressed) {
      onDuplicateTheme(theme.id);
      onSwitchToEditor();
    } else {
      setDuplicateTargetTheme(theme);
    }
  };

  const handleConfirmDuplicate = () => {
    if (duplicateTargetTheme) {
      onDuplicateTheme(duplicateTargetTheme.id);
      setDuplicateTargetTheme(null);
      onSwitchToEditor();
    }
  };

  const handleUninstallFromHa = async (theme: ThemeConfig) => {
    try {
      await deleteHaTheme(theme.id);
      await reloadHomeAssistantThemes();
      if (onSyncHaThemes) {
        await onSyncHaThemes();
      }
    } catch (e) {
      console.warn('Failed to uninstall theme from HA:', e);
    }
  };

  const handleApplySingleTheme = async (theme: ThemeConfig) => {
    try {
      await applyThemeDirectlyToHa(theme);
      if (onSyncHaThemes) {
        await onSyncHaThemes();
      }
    } catch (e) {
      console.warn('Failed to apply theme to HA:', e);
    }
  };

  const toggleSelectTheme = (id: string) => {
    setSelectedThemeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedThemeIds(new Set(filteredThemes.map((t) => t.id)));
  };

  const clearSelection = () => {
    setSelectedThemeIds(new Set());
  };

  const handleBatchInstall = async () => {
    const toInstall = themes.filter((t) => selectedThemeIds.has(t.id));
    if (toInstall.length === 0) return;

    setIsBatchInstalling(true);
    setBatchInstallStatus(`Installing ${toInstall.length} themes to Home Assistant...`);

    let successCount = 0;
    for (let i = 0; i < toInstall.length; i++) {
      const theme = toInstall[i];
      setBatchInstallStatus(`Installing (${i + 1}/${toInstall.length}): ${theme.name}...`);
      try {
        await applyThemeDirectlyToHa(theme);
        successCount++;
      } catch (err) {
        console.warn(`Failed installing ${theme.name}:`, err);
      }
    }

    await reloadHomeAssistantThemes();
    if (onSyncHaThemes) {
      await onSyncHaThemes();
    }

    setIsBatchInstalling(false);
    setBatchInstallStatus(`Successfully installed ${successCount} theme(s) to Home Assistant!`);
    setTimeout(() => {
      setBatchInstallStatus(null);
      setIsSelectMode(false);
      clearSelection();
    }, 2500);
  };

  const overviewTargetTheme = themes.find((t) => t.id === overviewThemeId) || null;

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto max-w-7xl mx-auto space-y-6 relative select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Theme Registry & Library</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {themes.length} Themes
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Left-click any theme for live dashboard overview. Right-click for options or batch install.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) clearSelection();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSelectMode
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{isSelectMode ? 'Exit Select Mode' : 'Select'}</span>
          </button>

          {onSyncHaThemes && (
            <button
              onClick={handleSyncFromHa}
              disabled={isSyncing}
              title="Sync and read all theme files directly from /config/themes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync HA'}</span>
            </button>
          )}

          <button
            onClick={() => setIsGitHubImportOpen(true)}
            title="Import themes from any public GitHub repo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Github className="w-3.5 h-3.5 text-blue-400" />
            <span>Import GitHub</span>
          </button>

          {onOpenDoctor && (
            <button
              onClick={onOpenDoctor}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isDoctorReady 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-600/60 animate-pulse'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isDoctorReady ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{isDoctorReady ? 'HA Doctor' : 'HA Setup Needed'}</span>
            </button>
          )}

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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-blue-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search themes, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedFilter('available')}
            title={`All available themes in the registry (${totalAvailableCount} total)`}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedFilter === 'available'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>Available</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedFilter === 'available' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalAvailableCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('installed')}
            title={`Themes currently installed in Home Assistant (${totalInstalledCount} installed)`}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedFilter === 'installed'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <HardDrive className={`w-3 h-3 ${selectedFilter === 'installed' ? 'text-white' : 'text-emerald-400'}`} />
            <span>Installed</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedFilter === 'installed' ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-950/80 text-emerald-300'
            }`}>
              {totalInstalledCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('kids')}
            title="Kids have their own themes (NO ADULTS ALLOWED!)"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
              selectedFilter === 'kids'
                ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white border-pink-400 shadow-sm font-bold'
                : 'bg-slate-900 border-pink-900/40 text-pink-300/90 hover:text-pink-200 hover:border-pink-500/50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Kids</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedFilter === 'kids' ? 'bg-black/30 text-amber-200' : 'bg-pink-950/80 text-pink-300'
            }`}>
              {kidsInstalledCount}/{kidsAvailableCount}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
        {filteredThemes.map((theme) => {
          const isActive = theme.id === activeThemeId;
          const isSelected = selectedThemeIds.has(theme.id);
          const requiresCardMod = theme.requirements?.requiresCardMod ?? (theme.category === 'Glass' || theme.category === 'Kids' || theme.category === 'Neon');

          return (
            <div
              key={theme.id}
              onClick={() => {
                if (isSelectMode) {
                  toggleSelectTheme(theme.id);
                } else {
                  setOverviewThemeId(theme.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  x: Math.min(e.clientX, window.innerWidth - 220),
                  y: Math.min(e.clientY, window.innerHeight - 240),
                  theme,
                });
              }}
              className={`group relative rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-xl'
                  : isActive
                  ? 'bg-slate-900/90 border-blue-500/80 ring-1 ring-blue-500/20 shadow-lg'
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
                  
                  {isSelectMode && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectTheme(theme.id);
                      }}
                      className="absolute top-2 left-2 z-20 p-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/20 text-white"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  )}

                  {theme.isInstalled && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 text-[9px] font-mono border border-emerald-600/50 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Installed</span>
                    </div>
                  )}

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

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {requiresCardMod && (
                    <span 
                      onClick={(e) => {
                        if (onOpenDoctor) {
                          e.stopPropagation();
                          onOpenDoctor();
                        }
                      }}
                      title="Requires lovelace-card-mod for blur and styling"
                      className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/60 text-purple-300 font-medium flex items-center gap-1 hover:bg-purple-900/80 cursor-pointer transition-colors"
                    >
                      <Puzzle className="w-2.5 h-2.5" />
                      card-mod
                    </span>
                  )}

                  {theme.requirements?.recommendedCards && theme.requirements.recommendedCards.length > 0 ? (
                    theme.requirements.recommendedCards.map((card, idx) => (
                      <span
                        key={idx}
                        onClick={(e) => {
                          if (onOpenDoctor) {
                            e.stopPropagation();
                            onOpenDoctor();
                          }
                        }}
                        title={`${card.name}: ${card.description}`}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700/60 bg-slate-800/80 text-slate-300 font-medium flex items-center gap-1 cursor-pointer hover:bg-slate-700/80 transition-colors"
                      >
                        {card.name}
                      </span>
                    ))
                  ) : (
                    <>
                      {theme.category === 'Kids' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 font-medium">
                          Mushroom
                        </span>
                      )}
                      {(theme.category === 'Glass' || theme.category === 'Neon') && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800/60 text-blue-300 font-medium">
                          Bubble Card
                        </span>
                      )}
                    </>
                  )}
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
                      setOverviewThemeId(theme.id);
                    }}
                    title="Live Overview Modal (Left-Click)"
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDuplicate(theme);
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
                        if (window.confirm(`Delete theme "${theme.name}"?`)) {
                          onDeleteTheme(theme.id);
                        }
                      }}
                      title="Delete Theme"
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTheme(theme.id);
                      onSwitchToEditor();
                    }}
                    title="Edit in Designer"
                    className="px-2.5 py-1 rounded-md bg-blue-600/80 hover:bg-blue-600 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isSelectMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl px-5 py-3 flex items-center gap-4 animate-fade-in text-xs">
          <div className="flex items-center gap-2 font-semibold text-white">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>{selectedThemeIds.size} selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={selectAllFiltered}
            className="text-slate-300 hover:text-white font-medium hover:underline"
          >
            Select All ({filteredThemes.length})
          </button>

          <button
            onClick={clearSelection}
            className="text-slate-400 hover:text-slate-200 font-medium"
          >
            Clear
          </button>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={handleBatchInstall}
            disabled={selectedThemeIds.size === 0 || isBatchInstalling}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            {isBatchInstalling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Installing...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Install Selected to HA</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsSelectMode(false);
              clearSelection();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Close Multi-Select"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {batchInstallStatus && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-emerald-900/95 border border-emerald-500/60 text-emerald-100 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{batchInstallStatus}</span>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 w-52 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 text-xs space-y-1 animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-300 truncate">
            {contextMenu.theme.name}
          </div>

          <button
            onClick={() => {
              setIsSelectMode(true);
              toggleSelectTheme(contextMenu.theme.id);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 text-left transition-colors font-medium"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Select (Multi-select)</span>
          </button>

          <button
            onClick={() => {
              onSelectTheme(contextMenu.theme.id);
              onSwitchToEditor();
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 text-left transition-colors font-medium"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit in Designer</span>
          </button>

          <button
            onClick={() => {
              const target = contextMenu.theme;
              setContextMenu(null);
              triggerDuplicate(target);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 text-left transition-colors font-medium"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicate Theme</span>
          </button>

          <button
            onClick={async () => {
              const target = contextMenu.theme;
              setContextMenu(null);
              await handleApplySingleTheme(target);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 text-left transition-colors font-medium"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{contextMenu.theme.isInstalled ? 'Apply / Save to HA' : 'Install Directly to HA'}</span>
          </button>

          {contextMenu.theme.isInstalled && (
            <button
              onClick={async () => {
                const target = contextMenu.theme;
                setContextMenu(null);
                if (window.confirm(`Uninstall "${target.name}" from Home Assistant /config/themes?`)) {
                  await handleUninstallFromHa(target);
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-950/50 text-left transition-colors font-medium"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
              <span>Uninstall from HA</span>
            </button>
          )}

          {contextMenu.theme.isCustom && (
            <button
              onClick={() => {
                const target = contextMenu.theme;
                setContextMenu(null);
                if (window.confirm(`Delete theme "${target.name}"?`)) {
                  onDeleteTheme(target.id);
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/50 text-left transition-colors font-medium"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Theme</span>
            </button>
          )}
        </div>
      )}

      {overviewTargetTheme && (
        <ThemeOverviewModal
          isOpen={Boolean(overviewTargetTheme)}
          onClose={() => setOverviewThemeId(null)}
          theme={overviewTargetTheme}
          allThemes={filteredThemes.length > 0 ? filteredThemes : themes}
          onSelectTheme={(newId) => setOverviewThemeId(newId)}
          onEditTheme={(id) => {
            onSelectTheme(id);
            onSwitchToEditor();
          }}
          onApplyTheme={handleApplySingleTheme}
          onDuplicateTheme={(id) => {
            const t = themes.find((item) => item.id === id);
            if (t) triggerDuplicate(t);
          }}
        />
      )}

      {duplicateTargetTheme && (
        <DuplicateInfoModal
          isOpen={Boolean(duplicateTargetTheme)}
          onClose={() => setDuplicateTargetTheme(null)}
          onConfirm={handleConfirmDuplicate}
          themeName={duplicateTargetTheme.name}
        />
      )}

      <GitHubImportModal
        isOpen={isGitHubImportOpen}
        onClose={() => setIsGitHubImportOpen(false)}
        onThemesImported={(imported) => {
          onImportThemes(imported);
          if (onSyncHaThemes) onSyncHaThemes();
        }}
      />
    </div>
  );
};
