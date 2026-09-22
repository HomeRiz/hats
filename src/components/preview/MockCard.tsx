import React from 'react';
import { ThemeConfig } from '../../types/theme';

interface MockCardProps {
  theme: ThemeConfig;
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  previewMode?: 'dark' | 'light';
}

export const MockCard: React.FC<MockCardProps> = ({
  theme,
  children,
  className = '',
  glowOnHover = true,
  previewMode = 'dark',
}) => {
  const { engine } = theme;
  const isLight = previewMode === 'light';

  const sheenGradient = `linear-gradient(${engine.sheenAngle}deg, rgba(255,255,255,${engine.sheenOpacity}) 0%, rgba(255,255,255,${engine.sheenOpacity * 0.25}) 22%, rgba(255,255,255,0) 45%)`;

  const cardBg = isLight
    ? (theme.light?.cardBackground || 'rgba(245, 247, 252, 0.55)')
    : (engine.glassTint || 'rgba(255, 255, 255, 0.08)');

  return (
    <div
      className={`relative group transition-all duration-200 overflow-hidden ${className}`}
      style={{
        borderRadius: `${engine.cardRadius}px`,
        border: `${engine.borderWidth}px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : engine.borderColor}`,
        backgroundColor: cardBg,
        boxShadow: engine.insetShadow,
      }}
    >
      <div
        className="absolute inset-0 -z-10 pointer-events-none transition-all"
        style={{
          backdropFilter: `blur(${engine.blurAmount}px) saturate(${engine.saturateAmount}) brightness(${engine.brightnessAmount})`,
          WebkitBackdropFilter: `blur(${engine.blurAmount}px) saturate(${engine.saturateAmount}) brightness(${engine.brightnessAmount})`,
          borderRadius: 'inherit',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none transition-opacity"
        style={{
          background: sheenGradient,
          mixBlendMode: engine.sheenBlend as any,
          borderRadius: 'inherit',
        }}
      />

      {engine.hoverGlow && glowOnHover && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `0 0 ${engine.hoverGlowIntensity}px -4px ${engine.glowColor}`,
            borderRadius: 'inherit',
          }}
        />
      )}

      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
};
