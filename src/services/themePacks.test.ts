import { describe, it, expect } from 'vitest';
import { groupThemesIntoPacks, locateInPacks } from './themePacks';
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
    background: {} as any,
    dark: {} as any,
    light: {} as any,
    ...overrides,
  };
}

describe('groupThemesIntoPacks', () => {
  it('groups themes sharing the same sourceUrl into one pack', () => {
    const themes = [
      makeTheme({ id: 'catppuccin-mocha', name: 'Catppuccin Mocha', sourceUrl: 'https://github.com/catppuccin/home-assistant' }),
      makeTheme({ id: 'catppuccin-latte', name: 'Catppuccin Latte', sourceUrl: 'https://github.com/catppuccin/home-assistant' }),
      makeTheme({ id: 'catppuccin-frappe', name: 'Catppuccin Frappe', sourceUrl: 'https://github.com/catppuccin/home-assistant' }),
    ];
    const packs = groupThemesIntoPacks(themes);
    expect(packs).toHaveLength(1);
    expect(packs[0].variants).toHaveLength(3);
  });

  it('picks the shortest-id variant as the representative', () => {
    const themes = [
      makeTheme({ id: 'wessamlauf-frosted-glass-dark-lite', sourceUrl: 'https://github.com/wessamlauf/x' }),
      makeTheme({ id: 'wessamlauf-frosted-glass', sourceUrl: 'https://github.com/wessamlauf/x' }),
      makeTheme({ id: 'wessamlauf-frosted-glass-dark', sourceUrl: 'https://github.com/wessamlauf/x' }),
    ];
    const packs = groupThemesIntoPacks(themes);
    expect(packs[0].representative.id).toBe('wessamlauf-frosted-glass');
  });

  it('keeps a theme with no sourceUrl as its own singleton pack', () => {
    const themes = [makeTheme({ id: 'amberlight', name: 'Amberlight' })];
    const packs = groupThemesIntoPacks(themes);
    expect(packs).toHaveLength(1);
    expect(packs[0].variants).toHaveLength(1);
    expect(packs[0].representative.id).toBe('amberlight');
  });

  it('keeps a lone theme with a sourceUrl (no siblings) as its own singleton pack', () => {
    const themes = [makeTheme({ id: 'solo-theme', sourceUrl: 'https://github.com/solo/repo' })];
    const packs = groupThemesIntoPacks(themes);
    expect(packs).toHaveLength(1);
    expect(packs[0].variants).toHaveLength(1);
  });

  it('preserves overall theme order via the first-seen position of each pack', () => {
    const themes = [
      makeTheme({ id: 'a', sourceUrl: 'https://github.com/a/a' }),
      makeTheme({ id: 'b', sourceUrl: 'https://github.com/b/b' }),
      makeTheme({ id: 'a2', sourceUrl: 'https://github.com/a/a' }),
    ];
    const packs = groupThemesIntoPacks(themes);
    expect(packs.map((p) => p.variants[0].sourceUrl)).toEqual([
      'https://github.com/a/a',
      'https://github.com/b/b',
    ]);
  });
});

describe('locateInPacks', () => {
  const themes = [
    makeTheme({ id: 'a-blue', sourceUrl: 'https://github.com/a/a' }),
    makeTheme({ id: 'a-green', sourceUrl: 'https://github.com/a/a' }),
    makeTheme({ id: 'a-pink', sourceUrl: 'https://github.com/a/a' }),
    makeTheme({ id: 'solo', sourceUrl: 'https://github.com/b/b' }),
    makeTheme({ id: 'c-light', sourceUrl: 'https://github.com/c/c' }),
    makeTheme({ id: 'c-dark', sourceUrl: 'https://github.com/c/c' }),
  ];
  const packs = groupThemesIntoPacks(themes);

  it('steps through the variants of a pack in order', () => {
    expect(locateInPacks(packs, 'a-blue')?.next.id).toBe('a-green');
    expect(locateInPacks(packs, 'a-green')?.next.id).toBe('a-pink');
  });

  it('moves to the first variant of the next pack after the last variant', () => {
    expect(locateInPacks(packs, 'a-pink')?.next.id).toBe('solo');
    expect(locateInPacks(packs, 'solo')?.next.id).toBe('c-light');
  });

  it('moves to the last variant of the previous pack before the first variant', () => {
    expect(locateInPacks(packs, 'c-light')?.prev.id).toBe('solo');
    expect(locateInPacks(packs, 'solo')?.prev.id).toBe('a-pink');
  });

  it('wraps around from the last pack to the first and back', () => {
    expect(locateInPacks(packs, 'c-dark')?.next.id).toBe('a-blue');
    expect(locateInPacks(packs, 'a-blue')?.prev.id).toBe('c-dark');
  });

  it('reports the position inside the pack and among the packs', () => {
    const position = locateInPacks(packs, 'c-dark');
    expect(position?.variantIndex).toBe(1);
    expect(position?.pack.variants).toHaveLength(2);
    expect(position?.packIndex).toBe(2);
    expect(position?.packCount).toBe(3);
  });

  it('returns null for an unknown theme', () => {
    expect(locateInPacks(packs, 'missing')).toBeNull();
  });
});
