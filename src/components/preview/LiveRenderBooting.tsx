import React from 'react';
import { ThemeConfig } from '../../types/theme';

interface LiveRenderBootingProps {
  theme: ThemeConfig;
}

export const LiveRenderBooting: React.FC<LiveRenderBootingProps> = ({ theme }) => {
  const { background } = theme;
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
    bgStyle = { backgroundImage: background.gradientString, backgroundPosition: 'center', backgroundSize: 'cover' };
  } else if (background.type === 'solid' && background.solidColor) {
    bgStyle = { backgroundColor: background.solidColor };
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0" style={bgStyle} />
      <div className="absolute inset-0 z-[1] bg-black/40" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: theme.palette.accent || theme.palette.primary }}
        />
        <span className="text-xs font-medium text-white/80">Loading live preview&hellip;</span>
      </div>
    </div>
  );
};
