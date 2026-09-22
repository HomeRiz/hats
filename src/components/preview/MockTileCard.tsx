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
}

export const MockTileCard: React.FC<MockTileCardProps> = ({
  theme,
  title,
  state,
  isActive,
  icon,
  activeColor,
  onClick,
}) => {
  const { engine, palette } = theme;
  const color = activeColor || palette.accent || palette.primary || '#f59e0b';

  return (
    <div
      onClick={onClick}
      className="group relative flex items-center gap-3.5 px-4 py-3 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
      style={{
        borderRadius: `${engine.cardRadius || 24}px`,
        backgroundColor: engine.glassTint || 'rgba(255, 255, 255, 0.08)',
        border: `${engine.borderWidth || 1}px solid ${engine.borderColor || 'rgba(255, 255, 255, 0.12)'}`,
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
          backgroundColor: isActive ? color : 'rgba(255, 255, 255, 0.08)',
          color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
          boxShadow: isActive ? `0 0 16px -2px ${color}` : 'none',
        }}
      >
        {icon}
      </div>

      <div className="flex flex-col min-w-0 relative z-10">
        <span className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
          {title}
        </span>
        <span className="text-[11px] font-medium text-slate-400 capitalize truncate mt-0.5">
          {state}
        </span>
      </div>
    </div>
  );
};
