import { describe, it, expect } from 'vitest';
import { MOD_SOURCES, resolveModUrl } from './modSources';

describe('modSources', () => {
  it('includes the three curated mod cards', () => {
    for (const slug of ['card-mod', 'bubble-card', 'mushroom-cards']) {
      expect(MOD_SOURCES[slug]).toMatch(/^\/mock-mods\//);
    }
  });

  it('resolveModUrl returns null for an unknown slug', () => {
    expect(resolveModUrl('not-a-real-mod')).toBeNull();
  });

  it('resolveModUrl returns the local path for a known slug', () => {
    expect(resolveModUrl('card-mod')).toBe(MOD_SOURCES['card-mod']);
  });
});
