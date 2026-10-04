import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Download,
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';
import { sanitizeThemeCss } from '../../services/themeSecurityValidator';
import { groupThemesIntoPacks, locateInPacks } from '../../services/themePacks';
import { LiveRenderBooting } from '../preview/LiveRenderBooting';
import { LiveRenderFailed } from '../preview/LiveRenderFailed';
import { useLiveRenderPreview } from '../../contexts/LiveRenderPreviewContext';
import { themeToCssVars } from '../../services/themeToCssVars';

interface ThemeOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  allThemes: ThemeConfig[];
  onSelectTheme: (themeId: string) => void;
  onEditTheme: (themeId: string) => void;
  onApplyTheme: (theme: ThemeConfig) => void | Promise<void>;
  onDownloadTheme?: (theme: ThemeConfig) => void | Promise<void>;
  standalone?: boolean;
  onUninstallTheme?: (theme: ThemeConfig) => void;
  onDuplicateTheme: (themeId: string) => void;
}

export const ThemeOverviewModal: React.FC<ThemeOverviewModalProps> = ({
  isOpen,
  onClose,
  theme,
  allThemes,
  onSelectTheme,
  onEditTheme,
  onApplyTheme,
  onDownloadTheme,
  standalone = false,
  onUninstallTheme,
  onDuplicateTheme,
}) => {
  const { ready: liveRenderReady, timedOut: liveRenderTimedOut, registerSlot, applyTheme, retry } = useLiveRenderPreview();
  const useLiveRender = isOpen && liveRenderReady;
  const isBooting = isOpen && !liveRenderReady && !liveRenderTimedOut;

  useEffect(() => {
    if (!useLiveRender) return;
    const { name, vars } = themeToCssVars(theme);
    applyTheme(name, vars);
  }, [useLiveRender, theme, applyTheme]);

  const [showSpecsDrawer, setShowSpecsDrawer] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await (standalone && onDownloadTheme ? onDownloadTheme(theme) : onApplyTheme(theme));
    } finally {
      setInstalling(false);
    }
  };

  const packs = useMemo(() => groupThemesIntoPacks(allThemes), [allThemes]);
  const position = useMemo(() => locateInPacks(packs, theme.id), [packs, theme.id]);
  const hasMultiple = allThemes.length > 1;
  const packVariants = position?.pack.variants ?? [theme];
  const isPackPreview = packVariants.length > 1;
  const prevTheme = hasMultiple ? position?.prev ?? null : null;
  const nextTheme = hasMultiple ? position?.next ?? null : null;

  const handleNext = useCallback(() => {
    if (nextTheme) onSelectTheme(nextTheme.id);
  }, [nextTheme, onSelectTheme]);

  const handlePrev = useCallback(() => {
    if (prevTheme) onSelectTheme(prevTheme.id);
  }, [prevTheme, onSelectTheme]);

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

  const { palette, engine } = theme;

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
                {theme.isInstalled && !standalone ? (
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
              <p className="text-[11px] text-slate-400">
                By {theme.author || 'Community Designer'}
                {theme.sourceUrl && (
                  <>
                    {' · '}
                    <a
                      href={theme.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      View source
                    </a>
                  </>
                )}
              </p>
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
              {isPackPreview ? (position?.variantIndex ?? 0) + 1 : (position?.packIndex ?? 0) + 1} / {isPackPreview ? packVariants.length : packs.length}
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

          {isPackPreview && (
            <div className="w-44 shrink-0 h-full overflow-y-auto border-r border-slate-800 bg-slate-950/80 py-2">
              {packVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => onSelectTheme(variant.id)}
                  title={variant.name}
                  className={`w-full text-left px-3 py-2 text-xs truncate transition-colors border-l-2 ${
                    variant.id === theme.id
                      ? 'border-blue-500 bg-blue-950/40 text-white font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {variant.name}
                  {variant.isInstalled && !standalone && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {useLiveRender ? (
              <div ref={registerSlot} data-testid="live-render-slot" className="w-full h-full" />
            ) : isBooting ? (
              <LiveRenderBooting theme={theme} />
            ) : (
              <LiveRenderFailed theme={theme} onRetry={retry} />
            )}
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
            {theme.isInstalled && onUninstallTheme && !standalone && (
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
              onClick={handleInstallClick}
              disabled={installing}
              className="flex items-center justify-center gap-2 px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait disabled:hover:scale-100"
            >
              {standalone ? <Download className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              <span>
                {standalone
                  ? installing ? 'Preparing...' : 'Download'
                  : installing ? 'Installing...' : theme.isInstalled ? 'Apply / Save to HA' : 'Install'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
