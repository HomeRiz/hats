import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../../types/theme';
import { sanitizeThemeCss, sanitizeSvgCode } from '../../services/themeSecurityValidator';
import { useLiveDashboardData } from '../../services/useLiveDashboardData';
import { useLiveRenderPreview } from '../../contexts/LiveRenderPreviewContext';
import { themeToCssVars } from '../../services/themeToCssVars';
import { MockHeader } from './MockHeader';
import { MockSidebar } from './MockSidebar';
import { SmartHomeDashboard } from './SmartHomeDashboard';

interface DashboardPreviewProps {
  theme: ThemeConfig;
  previewMode?: 'dark' | 'light';
  activeView?: 'home' | 'climate' | 'media' | 'security';
  setActiveView?: (view: any) => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  theme,
  previewMode = 'dark',
}) => {
  const live = useLiveDashboardData();
  const [sidebarItem, setSidebarItem] = useState('Smart Home');
  const { ready, timedOut, registerSlot, applyTheme } = useLiveRenderPreview();

  const useLiveRender = ready && !timedOut;

  useEffect(() => {
    if (!useLiveRender) return;
    const { name, vars } = themeToCssVars(theme, previewMode);
    applyTheme(name, vars);
  }, [useLiveRender, theme, previewMode, applyTheme]);

  useEffect(() => {
    if (!useLiveRender) return;
    return () => registerSlot(null);
  }, [useLiveRender, registerSlot]);

  if (useLiveRender) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <div ref={registerSlot} data-testid="live-render-slot" className="w-full h-full" />
      </div>
    );
  }

  const { background, engine } = theme;

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

  const safeSvg = theme.customSvgOverlay ? sanitizeSvgCode(theme.customSvgOverlay) : null;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      {theme.customCss && (
        <style dangerouslySetInnerHTML={{ __html: sanitizeThemeCss(theme.customCss) }} />
      )}

      <div 
        className="absolute inset-0 z-0 transition-all duration-300"
        style={bgStyle}
      />

      {safeSvg && safeSvg.valid && safeSvg.sanitized && (
        <div 
          className="absolute inset-0 z-[1] pointer-events-none opacity-40 mix-blend-screen overflow-hidden"
          dangerouslySetInnerHTML={{ __html: safeSvg.sanitized }}
        />
      )}

      <div 
        className="absolute inset-0 z-[2] pointer-events-none transition-colors"
        style={{ 
          background: previewMode === 'light'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(240,243,250,0.70) 100%)'
            : (engine.backgroundScrim || 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.30) 100%)')
        }}
      />

      {engine.scanlines && (
        <div className="absolute inset-0 z-[3] scanlines-overlay opacity-80 pointer-events-none" />
      )}

      <MockHeader
        theme={theme}
        activeView={live.activeViewId ?? 'home'}
        setActiveView={live.setActiveViewId}
        previewMode={previewMode}
        liveViewTabs={live.available ? live.viewNavItems : undefined}
      />

      {!live.loading && !live.available && (
        <div className="px-3 py-1 text-[11px] text-center text-amber-300/80 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          Showing example preview — couldn't reach your live Home Assistant data.
        </div>
      )}
      {!live.loading && live.available && live.viewNavItems.length === 0 && (
        <div className="px-3 py-1 text-[11px] text-center text-amber-300/80 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          Example navigation tabs — couldn't read your dashboard views.
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative z-10">
        <MockSidebar
          theme={theme}
          activeItem={sidebarItem}
          onSelectItem={setSidebarItem}
          previewMode={previewMode}
          livePanels={live.available ? live.panels : undefined}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <SmartHomeDashboard
            theme={theme}
            previewMode={previewMode}
            liveGroups={live.available ? live.tileGroups : undefined}
          />
        </main>
      </div>
    </div>
  );
};
