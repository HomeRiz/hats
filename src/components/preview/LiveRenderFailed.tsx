import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ThemeConfig } from '../../types/theme';

interface LiveRenderFailedProps {
  theme: ThemeConfig;
  onRetry: () => void;
}

export const LiveRenderFailed: React.FC<LiveRenderFailedProps> = ({ theme, onRetry }) => {
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
      <div className="absolute inset-0 z-[1] bg-black/50" />
      <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
        <span className="text-sm font-medium text-white/90">Live preview didn&apos;t load in time</span>
        <span className="text-xs text-white/60 max-w-xs">
          It may still be booting in the background. Try again, or reload the page.
        </span>
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
};
