import React, { useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Palette, 
  Zap, 
  Copy, 
  HardDrive, 
  Sliders, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface ThemeOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  allThemes: ThemeConfig[];
  onSelectTheme: (themeId: string) => void;
  onEditTheme: (themeId: string) => void;
  onApplyTheme: (theme: ThemeConfig) => void;
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
  onDuplicateTheme,
}) => {
  const currentIndex = allThemes.findIndex((t) => t.id === theme.id);
  const hasMultiple = allThemes.length > 1;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      {hasMultiple && (
        <button
          onClick={handlePrev}
          title="Previous Theme (Left Arrow Key)"
          className="absolute left-3 md:left-6 z-50 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/10 shadow-2xl backdrop-blur-lg transition-all hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasMultiple && (
        <button
          onClick={handleNext}
          title="Next Theme (Right Arrow Key)"
          className="absolute right-3 md:right-6 z-50 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/10 shadow-2xl backdrop-blur-lg transition-all hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-3.5 h-3.5 rounded-full shadow" 
              style={{ backgroundColor: palette.primary }} 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{theme.name}</h2>
                {theme.isInstalled && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Installed</span>
                  </span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {theme.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">Created by {theme.author || 'Community'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono hidden sm:inline mr-2">
              {currentIndex + 1} of {allThemes.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl p-6 min-h-[260px] flex flex-col justify-between">
            <div 
              className="absolute inset-0 z-0 pointer-events-none"
              style={bgStyle}
            />
            {customSvgOverlay && customSvgOverlay.trim().startsWith('<svg') && (
              <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(customSvgOverlay)}")`,
                  backgroundRepeat: 'repeat',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <div className="absolute inset-0 z-0 bg-black/25 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div 
                className="p-4 border shadow-lg backdrop-blur-md flex items-center justify-between"
                style={{
                  backgroundColor: engine.glassTint || 'rgba(255,255,255,0.08)',
                  borderRadius: `${engine.cardRadius || 24}px`,
                  borderColor: engine.borderColor || 'rgba(255,255,255,0.2)',
                  borderWidth: `${engine.borderWidth || 1}px`,
                  boxShadow: engine.insetShadow || 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                    style={{ backgroundColor: palette.primary }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">Living Room</h4>
                    <span className="text-[10px] text-slate-300">85% Brightness</span>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: palette.primary }} />
              </div>

              <div 
                className="p-4 border shadow-lg backdrop-blur-md flex items-center justify-between"
                style={{
                  backgroundColor: engine.glassTint || 'rgba(255,255,255,0.08)',
                  borderRadius: `${engine.cardRadius || 24}px`,
                  borderColor: engine.borderColor || 'rgba(255,255,255,0.2)',
                  borderWidth: `${engine.borderWidth || 1}px`,
                  boxShadow: engine.insetShadow || 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                    style={{ backgroundColor: palette.accent || palette.orange }}
                  >
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">Climate</h4>
                    <span className="text-[10px] text-slate-300">Heating • 21.5°C</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">21.5°</span>
              </div>

              <div 
                className="p-4 border shadow-lg backdrop-blur-md flex items-center justify-between sm:col-span-2 md:col-span-1"
                style={{
                  backgroundColor: engine.glassTint || 'rgba(255,255,255,0.08)',
                  borderRadius: `${engine.cardRadius || 24}px`,
                  borderColor: engine.borderColor || 'rgba(255,255,255,0.2)',
                  borderWidth: `${engine.borderWidth || 1}px`,
                  boxShadow: engine.insetShadow || 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                    style={{ backgroundColor: palette.green }}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">Home Shield</h4>
                    <span className="text-[10px] text-emerald-300">Armed Home</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between text-[11px] text-slate-300">
              <span>{theme.description || 'Full Home Assistant glassmorphism theme suite.'}</span>
              <span className="font-mono text-[10px] opacity-75">Radius: {engine.cardRadius}px • Blur: {engine.blurAmount}px</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Theme Color Palette</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Primary', color: palette.primary },
                  { label: 'Accent', color: palette.accent || palette.primary },
                  { label: 'Glow', color: engine.glowColor || palette.primary },
                  { label: 'Purple', color: palette.purple },
                  { label: 'Blue', color: palette.blue },
                  { label: 'Green', color: palette.green },
                  { label: 'Yellow', color: palette.yellow },
                  { label: 'Red', color: palette.red },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.label}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{item.color}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Card & System Integrations</span>
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 font-medium">
                  ✦ Card-Mod 3.0+
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-700/50 font-medium">
                  ★ Mushroom Cards
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-950/70 text-blue-300 border border-blue-700/50 font-medium">
                  ● Bubble Card Ready
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 font-medium">
                  ◆ Layout-Card Support
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Includes seamless fixed sidebar background, card-mod theme variables, and Web-Awesome tokens for Home Assistant 2024-2026.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onDuplicateTheme(theme.id);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEditTheme(theme.id);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit in Designer</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onApplyTheme(theme);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4" />
            <span>{theme.isInstalled ? 'Apply / Save to Home Assistant' : 'Install Directly to Home Assistant'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
