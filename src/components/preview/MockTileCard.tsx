import React from 'react';
import { ThemeConfig } from '../../types/theme';

interface MockTileCardProps {
  theme: ThemeConfig;
  title: string;
  state: string;
  isActive: boolean;
  icon: React.ReactNode;
  activeColor?: string;
  onClick?: () => void;
  previewMode?: 'dark' | 'light';
}

export const MockTileCard: React.FC<MockTileCardProps> = ({
  theme,
  title,
  state,
  isActive,
  icon,
  activeColor,
  onClick,
  previewMode = 'dark',
}) => {
  const { engine, palette } = theme;
  const isLight = previewMode === 'light';
  const color = activeColor || palette.accent || palette.primary || '#f59e0b';

  const cardBg = isLight
    ? (theme.light?.cardBackground || 'rgba(245, 247, 252, 0.55)')
    : (engine.glassTint || 'rgba(255, 255, 255, 0.08)');

  const titleText = isLight ? (theme.light?.textPrimary || '#1e293b') : (theme.dark?.textPrimary || '#FFFFFF');
  const subtitleText = isLight ? (theme.light?.textSecondary || '#64748b') : (theme.dark?.textSecondary || '#94a3b8');

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3.5 px-4 py-3 select-none transition-all duration-200 overflow-hidden ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
      style={{
        borderRadius: `${engine.cardRadius || 24}px`,
        backgroundColor: cardBg,
        border: `${engine.borderWidth || 1}px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : (engine.borderColor || 'rgba(255, 255, 255, 0.12)')}`,
        boxShadow: engine.insetShadow,
      }}
    >
      <div
        className="absolute inset-0 -z-10 pointer-events-none transition-all"
        style={{
          backdropFilter: `blur(${engine.blurAmount || 12}px) saturate(${engine.saturateAmount || 1.2}) brightness(${engine.brightnessAmount || 1})`,
          WebkitBackdropFilter: `blur(${engine.blurAmount || 12}px) saturate(${engine.saturateAmount || 1.2}) brightness(${engine.brightnessAmount || 1})`,
          borderRadius: 'inherit',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none transition-opacity"
        style={{
          background: `linear-gradient(${engine.sheenAngle || 135}deg, rgba(255,255,255,${(engine.sheenOpacity || 0.25)}) 0%, rgba(255,255,255,${(engine.sheenOpacity || 0.25) * 0.25}) 25%, rgba(255,255,255,0) 50%)`,
          mixBlendMode: (engine.sheenBlend || 'overlay') as any,
          borderRadius: 'inherit',
        }}
      />

      {engine.hoverGlow && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `0 0 ${engine.hoverGlowIntensity || 16}px -4px ${engine.glowColor || color}`,
            borderRadius: 'inherit',
          }}
        />
      )}

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 relative z-10"
        style={{
          backgroundColor: isActive ? color : (isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)'),
          color: isActive ? '#FFFFFF' : (isLight ? '#475569' : 'rgba(255, 255, 255, 0.65)'),
          boxShadow: isActive ? `0 0 16px -2px ${color}` : 'none',
        }}
      >
        {icon}
      </div>

      <div className="flex flex-col min-w-0 relative z-10">
        <span 
          className="text-xs sm:text-sm font-bold leading-tight truncate"
          style={{ color: titleText }}
        >
          {title}
        </span>
        <span 
          className="text-[11px] font-medium capitalize truncate mt-0.5"
          style={{ color: subtitleText }}
        >
          {state}
        </span>
      </div>
    </div>
  );
};
