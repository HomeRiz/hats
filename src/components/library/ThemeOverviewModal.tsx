import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Palette,
  Zap,
  Copy,
  CheckCircle2,
  Sliders,
  HardDriveDownload,
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import type { LiveDashboardData } from '../../services/useLiveDashboardData';
import { sanitizeThemeCss, sanitizeSvgCode } from '../../services/themeSecurityValidator';
import { MockHeader } from '../preview/MockHeader';
import { MockSidebar } from '../preview/MockSidebar';
import { SmartHomeDashboard } from '../preview/SmartHomeDashboard';

interface ThemeOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  liveDashboardData: LiveDashboardData;
  allThemes: ThemeConfig[];
  onSelectTheme: (themeId: string) => void;
  onEditTheme: (themeId: string) => void;
  onApplyTheme: (theme: ThemeConfig) => void;
  onUninstallTheme?: (theme: ThemeConfig) => void;
  onDuplicateTheme: (themeId: string) => void;
}

export const ThemeOverviewModal: React.FC<ThemeOverviewModalProps> = ({
  isOpen,
  onClose,
  theme,
  liveDashboardData,
  allThemes,
  onSelectTheme,
  onEditTheme,
  onApplyTheme,
  onUninstallTheme,
  onDuplicateTheme,
}) => {
  const [sidebarItem, setSidebarItem] = useState('Smart Home');
  const [showSpecsDrawer, setShowSpecsDrawer] = useState(false);

  const currentIndex = allThemes.findIndex((t) => t.id === theme.id);
  const hasMultiple = allThemes.length > 1;
  const prevTheme = hasMultiple ? allThemes[(currentIndex - 1 + allThemes.length) % allThemes.length] : null;
  const nextTheme = hasMultiple ? allThemes[(currentIndex + 1) % allThemes.length] : null;

  const handleNext = useCallback(() => {
    if (!hasMultiple) return;
    const nextIdx = (currentIndex + 1) % allThemes.length;
    onSelectTheme(allThemes[nextIdx].id);
  }, [currentIndex, allThemes, hasMultiple, onSelectTheme]);

  const handlePrev = useCallback(() => {
    if (!hasMultiple) return;
    const prevIdx = (currentIndex - 1 + allThemes.length) % allThemes.length;
    onSelectTheme(allThemes[prevIdx].id);
  }, [currentIndex, allThemes, hasMultiple, onSelectTheme]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  const { palette, engine, background, customSvgOverlay } = theme;

  let bgStyle: React.CSSProperties = {};
  if (background.type === 'image' && background.imageUrl) {
    bgStyle = {
      backgroundImage: `url(${background.imageUrl})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      filter: `brightness(${1 - (background.darken || 0)}) blur(${background.blur || 0}px) saturate(${background.saturation || 1})`,
    };
  } else if (background.type === 'gradient' && background.gradientString) {
    bgStyle = {
      backgroundImage: background.gradientString,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    };
  } else if (background.type === 'solid' && background.solidColor) {
    bgStyle = {
      backgroundColor: background.solidColor,
    };
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none cursor-pointer"
      onClick={onClose}
    >
      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          title={`Previous Theme: ${prevTheme?.name} (Left Arrow Key)`}
          className="absolute left-2 sm:left-4 md:left-8 z-50 p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 shadow-2xl backdrop-blur-lg transition-all hover:scale-110 active:scale-95 group cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          title={`Next Theme: ${nextTheme?.name} (Right Arrow Key)`}
          className="absolute right-2 sm:right-4 md:right-8 z-50 p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 shadow-2xl backdrop-blur-lg transition-all hover:scale-110 active:scale-95 group cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <div 
        className="relative w-full max-w-6xl h-[92vh] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-3.5 h-3.5 rounded-full shadow" 
              style={{ backgroundColor: palette.primary }} 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{theme.name}</h2>
                {theme.isInstalled ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Installed in HA</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {theme.category}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">By {theme.author || 'Community Designer'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSpecsDrawer(!showSpecsDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                showSpecsDrawer 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showSpecsDrawer ? 'Hide Details' : 'Theme Specs & Palette'}</span>
            </button>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
              {currentIndex + 1} / {allThemes.length}
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {theme.customCss && (
            <style dangerouslySetInnerHTML={{ __html: sanitizeThemeCss(theme.customCss) }} />
          )}

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div 
              className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
              style={bgStyle}
            />
            {customSvgOverlay && sanitizeSvgCode(customSvgOverlay).valid && (
              <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-35"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(sanitizeSvgCode(customSvgOverlay).sanitized)}")`,
                  backgroundRepeat: 'repeat',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <div 
              className="absolute inset-0 z-0 pointer-events-none transition-colors"
              style={{ background: engine.backgroundScrim || 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.30) 100%)' }}
            />

            {engine.scanlines && (
              <div className="absolute inset-0 z-[1] scanlines-overlay opacity-80 pointer-events-none" />
            )}

            <MockHeader
              theme={theme}
              activeView={liveDashboardData.activeViewId ?? 'home'}
              setActiveView={liveDashboardData.setActiveViewId}
              liveViewTabs={liveDashboardData.available ? liveDashboardData.viewNavItems : undefined}
            />

            <div className="flex-1 flex overflow-hidden relative z-10">
              <MockSidebar 
                theme={theme} 
                activeItem={sidebarItem}
                onSelectItem={(label) => setSidebarItem(label)}
              />

              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <SmartHomeDashboard
                  theme={theme}
                  liveTiles={liveDashboardData.available ? liveDashboardData.tiles : undefined}
                />
              </main>
            </div>
          </div>

          {showSpecsDrawer && (
            <div className="w-80 h-full border-l border-slate-800 bg-slate-950/95 backdrop-blur-xl p-5 overflow-y-auto space-y-5 animate-fade-in z-20 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  <span>Theme Specifications</span>
                </h3>
                <button
                  onClick={() => setShowSpecsDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Colors</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Primary', color: palette.primary },
                    { label: 'Accent', color: palette.accent || palette.primary },
                    { label: 'Red', color: palette.red },
                    { label: 'Green', color: palette.green },
                    { label: 'Blue', color: palette.blue },
                    { label: 'Purple', color: palette.purple },
                    { label: 'Yellow', color: palette.yellow },
                    { label: 'Orange', color: palette.orange },
                  ].map((c, i) => (
                    <div key={i} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-[10px]">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow" style={{ backgroundColor: c.color }} />
                      <span className="font-semibold text-slate-300 truncate">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3 text-[11px]">
                <span className="font-bold text-slate-400 uppercase">Glass Tokens</span>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span>Card Radius:</span>
                    <span className="font-mono text-white">{engine.cardRadius}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backdrop Blur:</span>
                    <span className="font-mono text-white">{engine.blurAmount}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturation:</span>
                    <span className="font-mono text-white">{engine.saturateAmount}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brightness:</span>
                    <span className="font-mono text-white">{engine.brightnessAmount}x</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                <p>{theme.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasMultiple && prevTheme && (
              <button
                onClick={handlePrev}
                className="flex-1 sm:flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title={`Previous: ${prevTheme.name}`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">{prevTheme.name}</span>
              </button>
            )}

            {hasMultiple && nextTheme && (
              <button
                onClick={handleNext}
                className="flex-1 sm:flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title={`Next: ${nextTheme.name}`}
              >
                <span className="truncate max-w-[100px]">{nextTheme.name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onDuplicateTheme(theme.id);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {theme.isInstalled && onUninstallTheme && (
              <button
                onClick={() => {
                  onClose();
                  onUninstallTheme(theme);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-semibold border border-amber-800/60 transition-colors flex items-center gap-1.5"
                title="Uninstall this theme from /config/themes in Home Assistant"
              >
                <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
                <span>Uninstall from HA</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEditTheme(theme.id);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit in Designer</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onApplyTheme(theme);
              }}
              className="flex items-center justify-center gap-2 px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              <span>{theme.isInstalled ? 'Apply / Save to HA' : 'Install Directly to Home Assistant'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
