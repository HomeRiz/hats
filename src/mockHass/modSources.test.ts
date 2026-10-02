import { describe, it, expect } from 'vitest';
import { CURATED_MOD_SLUGS, MOD_SOURCES, resolveModUrl } from './modSources';

describe('modSources', () => {
  it('includes every curated mod card', () => {
    const slugs = ['card-mod', 'bubble-card', 'mushroom-cards', 'layout-card', 'button-card', 'stack-in-card'];
    expect(CURATED_MOD_SLUGS).toEqual(slugs);
    for (const slug of slugs) {
      expect(MOD_SOURCES[slug]).toMatch(/^\.\.\/mock-mods\//);
    }
  });

  it('resolveModUrl returns null for an unknown slug', () => {
    expect(resolveModUrl('not-a-real-mod')).toBeNull();
  });

  it('resolveModUrl returns the local path for a known slug', () => {
    expect(resolveModUrl('card-mod')).toBe(MOD_SOURCES['card-mod']);
  });
});
