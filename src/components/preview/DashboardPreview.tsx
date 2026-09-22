import React, { useState } from 'react';
import { ThemeConfig } from '../../types/theme';
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
  const [activeHeaderView, setActiveHeaderView] = useState('home');
  const [sidebarItem, setSidebarItem] = useState('Smart Home');

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

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      {theme.customCss && (
        <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />
      )}

      <div 
        className="absolute inset-0 z-0 transition-all duration-300"
        style={bgStyle}
      />

      {theme.customSvgOverlay && (
        <div 
          className="absolute inset-0 z-[1] pointer-events-none opacity-40 mix-blend-screen overflow-hidden"
          dangerouslySetInnerHTML={{ __html: theme.customSvgOverlay }}
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
        activeView={activeHeaderView} 
        setActiveView={setActiveHeaderView} 
        previewMode={previewMode}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <MockSidebar 
          theme={theme} 
          activeItem={sidebarItem}
          onSelectItem={setSidebarItem}
          previewMode={previewMode}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <SmartHomeDashboard theme={theme} previewMode={previewMode} />
        </main>
      </div>
    </div>
  );
};
