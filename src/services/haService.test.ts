import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ThemeConfig } from '../types/theme';

const processBackgroundImage = vi.fn();
vi.mock('./imageProcessor', () => ({ processBackgroundImage: (...args: unknown[]) => processBackgroundImage(...args) }));

import { embedBundledBackground } from './haService';

function themeWithBackground(background: Record<string, unknown>): ThemeConfig {
  return { id: 't', name: 'T', background: { darken: 0.2, ...background } } as unknown as ThemeConfig;
}

describe('embedBundledBackground', () => {
  beforeEach(() => {
    processBackgroundImage.mockReset();
    processBackgroundImage.mockResolvedValue({ dataUrl: 'data:image/webp;base64,AAAA', avgColor: '#123456' });
  });

  it('turns a bundled image path into an uploadable data URL', async () => {
    const result = await embedBundledBackground(themeWithBackground({ type: 'image', imageUrl: '/assets/kids-123.jpg' }));
    expect(processBackgroundImage).toHaveBeenCalledWith('/assets/kids-123.jpg', 1920, 1080, 0.2);
    expect(result.background.imageUrl).toBe('data:image/webp;base64,AAAA');
    expect(result.background.avgColor).toBe('#123456');
  });

  it.each([
    ['a data URL', 'data:image/png;base64,BBBB'],
    ['a remote image', 'https://example.com/a.jpg'],
    ['a path already on Home Assistant', '/local/hats/backgrounds/t/default.webp'],
  ])('leaves %s untouched', async (_label, imageUrl) => {
    const theme = themeWithBackground({ type: 'image', imageUrl });
    expect(await embedBundledBackground(theme)).toBe(theme);
    expect(processBackgroundImage).not.toHaveBeenCalled();
  });

  it('leaves themes without an image background untouched', async () => {
    const theme = themeWithBackground({ type: 'gradient', gradientString: 'linear-gradient(red, blue)' });
    expect(await embedBundledBackground(theme)).toBe(theme);
    expect(processBackgroundImage).not.toHaveBeenCalled();
  });
});
