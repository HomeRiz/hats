import { describe, it, expect } from 'vitest';
import { detectRequiresCardMod, detectRequiredIntegrations } from './themeRequirementDetector';

describe('detectRequiresCardMod', () => {
  it('detects card-mod-theme key', () => {
    expect(detectRequiresCardMod({ 'card-mod-theme': 'noctis' })).toBe(true);
  });

  it('detects card-mod-root key', () => {
    expect(detectRequiresCardMod({ 'card-mod-root': '.: |' })).toBe(true);
  });

  it('detects card-mod-card key', () => {
    expect(detectRequiresCardMod({ 'card-mod-card': '.: |' })).toBe(true);
  });

  it('returns false when no card-mod key is present', () => {
    expect(detectRequiresCardMod({ 'primary-color': 'blue' })).toBe(false);
  });

  it('returns false for an empty/null theme object', () => {
    expect(detectRequiresCardMod({})).toBe(false);
    expect(detectRequiresCardMod(null as any)).toBe(false);
  });
});

describe('detectRequiredIntegrations', () => {
  it('finds a domain from a custom_components/<domain>/manifest.json path', () => {
    const paths = [
      'README.md',
      'custom_components/tado/manifest.json',
      'custom_components/tado/__init__.py',
    ];
    const result = detectRequiredIntegrations(paths);
    expect(result).toEqual([{ name: 'tado', domain: 'tado' }]);
  });

  it('finds multiple distinct domains without duplicates', () => {
    const paths = [
      'custom_components/tado/manifest.json',
      'custom_components/tado/const.py',
      'custom_components/fluvy/manifest.json',
    ];
    const result = detectRequiredIntegrations(paths);
    expect(result.map((r) => r.domain).sort()).toEqual(['fluvy', 'tado']);
  });

  it('returns an empty array when there is no custom_components directory', () => {
    expect(detectRequiredIntegrations(['README.md', 'themes/noctis.yaml'])).toEqual([]);
  });

  it('ignores a custom_components path with no manifest.json', () => {
    expect(detectRequiredIntegrations(['custom_components/README.md'])).toEqual([]);
  });
});
