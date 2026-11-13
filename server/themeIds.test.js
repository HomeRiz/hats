import { describe, it, expect } from 'vitest';
import path from 'path';
import { cleanThemeId, resolveInside } from './themeIds.js';

describe('cleanThemeId', () => {
  it('lowercases, replaces unsafe characters and trims dashes', () => {
    expect(cleanThemeId('  My Theme!! ')).toBe('my-theme');
    expect(cleanThemeId('--a--b--')).toBe('a--b');
    expect(cleanThemeId('../../etc/passwd')).toBe('etc-passwd');
  });

  it('falls back to theme when nothing is left', () => {
    expect(cleanThemeId('')).toBe('theme');
    expect(cleanThemeId('----')).toBe('theme');
    expect(cleanThemeId(undefined)).toBe('theme');
  });

  it('handles a very long run of dashes quickly', () => {
    const started = Date.now();
    expect(cleanThemeId('-'.repeat(200000) + 'x')).toBe('x');
    expect(Date.now() - started).toBeLessThan(500);
  });
});

describe('resolveInside', () => {
  const base = path.resolve('/tmp/hats-base');

  it('returns paths inside the folder', () => {
    expect(resolveInside(base, 'a.yaml')).toBe(path.join(base, 'a.yaml'));
    expect(resolveInside(base, 'a', 'default.webp')).toBe(path.join(base, 'a', 'default.webp'));
  });

  it('refuses paths that leave the folder', () => {
    expect(() => resolveInside(base, '../x.yaml')).toThrow('Path escapes its folder');
    expect(() => resolveInside(base, '..', 'other')).toThrow();
    expect(() => resolveInside(base, '/etc/passwd')).toThrow();
    expect(() => resolveInside(base, '../hats-base-evil/x')).toThrow();
  });
});
