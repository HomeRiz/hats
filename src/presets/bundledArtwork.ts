import type { ThemeConfig } from '../types/theme';
import cyberpunk2077 from '../assets/backgrounds/cyberpunk-2077.jpg';

const BUNDLED_ARTWORK: Record<string, { imageUrl: string; imageFileName: string }> = {
  'flejz-cyberpunk-2077': { imageUrl: cyberpunk2077, imageFileName: 'cyberpunk-2077.jpg' },
};

export function withBundledArtwork(theme: ThemeConfig): ThemeConfig {
  const artwork = BUNDLED_ARTWORK[theme.id];
  if (!artwork || theme.isInstalled) return theme;
  return {
    ...theme,
    background: { ...theme.background, type: 'image', imageUrl: artwork.imageUrl, imageFileName: artwork.imageFileName },
  };
}
