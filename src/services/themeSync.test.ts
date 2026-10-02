import { describe, it, expect } from 'vitest';
import { mergeSyncedThemes } from './themeSync';
import type { ThemeConfig } from '../types/theme';

function makeTheme(overrides: Partial<ThemeConfig>): ThemeConfig {
  return {
    id: 'x',
    name: 'X',
    category: 'Community',
    author: 'someone',
    description: '',
    version: '1.0.0',
    createdAt: '',
    updatedAt: '',
    palette: {} as any,
    engine: {} as any,
    background: { type: 'gradient' } as any,
    dark: {} as any,
    light: {} as any,
    ...overrides,
  };
}

const builtIns = [
  makeTheme({ id: 'built-a', name: 'Built A', category: 'Glass' }),
  makeTheme({ id: 'built-kids', name: 'Built Kids', category: 'Kids' }),
];

describe('mergeSyncedThemes', () => {
  it('keeps the built-in themes when the server does not list them', () => {
    const server = [makeTheme({ id: 'server-1', name: 'Server 1' })];
    const merged = mergeSyncedThemes(builtIns, server, builtIns, 0);
    expect(merged.map((t) => t.id)).toEqual(['built-a', 'built-kids', 'server-1']);
  });

  it('lets an installed theme replace the built-in theme with the same id', () => {
    const installed = makeTheme({ id: 'built-a', name: 'Built A', isInstalled: true });
    const merged = mergeSyncedThemes(builtIns, [installed], builtIns, 0);
    expect(merged.filter((t) => t.id === 'built-a')).toHaveLength(1);
    expect(merged.find((t) => t.id === 'built-a')?.isInstalled).toBe(true);
    expect(merged.some((t) => t.id === 'built-kids')).toBe(true);
  });

  it('keeps custom drafts that the server does not know about', () => {
    const draft = makeTheme({ id: 'my-draft', name: 'My Draft', isCustom: true });
    const merged = mergeSyncedThemes([...builtIns, draft], [], builtIns, 0);
    expect(merged.map((t) => t.id)).toEqual(['built-a', 'built-kids', 'my-draft']);
  });

  it('keeps the local copy of a theme edited while the sync was running', () => {
    const local = makeTheme({ id: 'server-1', name: 'Edited', updatedAt: new Date(2000).toISOString() });
    const server = makeTheme({ id: 'server-1', name: 'From server' });
    const merged = mergeSyncedThemes([local], [server], [], 1000);
    expect(merged.find((t) => t.id === 'server-1')?.name).toBe('Edited');
  });

  it('keeps edits made to a built-in theme', () => {
    const edited = { ...builtIns[0], name: 'Renamed built-in' };
    const merged = mergeSyncedThemes([edited, builtIns[1]], [], builtIns, 0);
    expect(merged.find((t) => t.id === 'built-a')?.name).toBe('Renamed built-in');
  });

  it('puts the bundled artwork on the cyberpunk theme but not on an installed copy', () => {
    const bundled = makeTheme({ id: 'flejz-cyberpunk-2077', background: { type: 'image', imageUrl: 'https://example.com/old.jpg' } as any });
    const installed = makeTheme({ id: 'flejz-cyberpunk-2077', isInstalled: true, background: { type: 'image', imageUrl: '/local/old.webp' } as any });
    expect(mergeSyncedThemes([], [bundled], [], 0)[0].background.imageUrl).not.toBe('https://example.com/old.jpg');
    expect(mergeSyncedThemes([], [installed], [], 0)[0].background.imageUrl).toBe('/local/old.webp');
  });
});
