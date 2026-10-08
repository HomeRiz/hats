import { describe, expect, it } from 'vitest';
import { copyIdForPreview, dedupeIdenticalThemes } from './themeDedupe';
import { defaultGlassTheme } from '../presets/defaultThemes';

const make = (id: string, over: Record<string, unknown> = {}, updatedAt = '2026-10-01T00:00:00Z') =>
  ({ ...defaultGlassTheme, id, name: 'ios-dark-mode', updatedAt, ...over }) as typeof defaultGlassTheme;

describe('dedupeIdenticalThemes', () => {
  it('keeps one of several identical copies, the newest', () => {
    const out = dedupeIdenticalThemes([make('a', {}, '2026-10-01T00:00:00Z'), make('b', {}, '2026-10-05T00:00:00Z'), make('c', {}, '2026-10-02T00:00:00Z')]);
    expect(out.map((t) => t.id)).toEqual(['b']);
  });

  it('keeps copies that differ', () => {
    const out = dedupeIdenticalThemes([make('a'), make('b', { description: 'edited' })]);
    expect(out.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('keeps order of first appearance', () => {
    const out = dedupeIdenticalThemes([make('a', { name: 'x' }), make('b', { name: 'y' }), make('c', { name: 'x' })]);
    expect(out.map((t) => t.name)).toEqual(['x', 'y']);
  });
});

describe('copyIdForPreview', () => {
  it('is stable for the same source and name', () => {
    expect(copyIdForPreview('basnijholt/lovelace-ios-dark-mode-theme', 'ios-dark-mode')).toBe(copyIdForPreview('basnijholt/lovelace-ios-dark-mode-theme', 'ios-dark-mode'));
    expect(copyIdForPreview('a/b', 'One')).not.toBe(copyIdForPreview('a/b', 'Two'));
  });
});
