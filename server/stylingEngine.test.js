import { describe, it, expect } from 'vitest';
import { detectStylingEngine, hasUixConfigEntry, removeCardModFromConfig } from './stylingEngine.js';

describe('detectStylingEngine', () => {
  it('reports none when neither is present', () => {
    const r = detectStylingEngine({ cardModActive: false, uixOnDisk: false, uixConfigured: false });
    expect(r).toMatchObject({ engine: 'none', hasStylingEngine: false, conflict: false, uixActive: false });
  });

  it('reports card-mod alone', () => {
    const r = detectStylingEngine({ cardModActive: true, uixOnDisk: false, uixConfigured: false });
    expect(r).toMatchObject({ engine: 'card-mod', hasStylingEngine: true, conflict: false });
  });

  it('reports uix alone', () => {
    const r = detectStylingEngine({ cardModActive: false, uixOnDisk: true, uixConfigured: true });
    expect(r).toMatchObject({ engine: 'uix', uixActive: true, uixNeedsSetup: false, hasStylingEngine: true });
  });

  it('flags uix on disk but not added as a service', () => {
    const r = detectStylingEngine({ cardModActive: false, uixOnDisk: true, uixConfigured: false });
    expect(r).toMatchObject({ engine: 'none', uixNeedsSetup: true, hasStylingEngine: false });
  });

  it('flags a conflict when both are active', () => {
    const r = detectStylingEngine({ cardModActive: true, uixOnDisk: true, uixConfigured: true });
    expect(r).toMatchObject({ engine: 'both', conflict: true });
  });
});

describe('hasUixConfigEntry', () => {
  it('finds the uix domain in core.config_entries', () => {
    const raw = JSON.stringify({ data: { entries: [{ domain: 'hacs' }, { domain: 'uix' }] } });
    expect(hasUixConfigEntry(raw)).toBe(true);
  });

  it('is false without the entry or on bad input', () => {
    expect(hasUixConfigEntry(JSON.stringify({ data: { entries: [{ domain: 'hacs' }] } }))).toBe(false);
    expect(hasUixConfigEntry('not json')).toBe(false);
    expect(hasUixConfigEntry('{}')).toBe(false);
  });
});

describe('removeCardModFromConfig', () => {
  it('removes the card-mod url but keeps other modules', () => {
    const input = 'frontend:\n  themes: !include_dir_merge_named themes\n  extra_module_url:\n    - /hacsfiles/other/other.js\n    - /hacsfiles/lovelace-card-mod/card-mod.js?hacstag=1\n';
    const out = removeCardModFromConfig(input);
    expect(out).not.toContain('card-mod');
    expect(out).toContain('/hacsfiles/other/other.js');
    expect(out).toContain('extra_module_url:');
  });

  it('drops an extra_module_url key left empty', () => {
    const input = 'frontend:\n  themes: !include_dir_merge_named themes\n  extra_module_url:\n    - /hacsfiles/lovelace-card-mod/card-mod.js\nlight:\n';
    const out = removeCardModFromConfig(input);
    expect(out).not.toContain('extra_module_url');
    expect(out).toContain('themes: !include_dir_merge_named themes');
    expect(out).toContain('light:');
  });

  it('leaves a config without card-mod untouched', () => {
    const input = 'frontend:\n  themes: !include_dir_merge_named themes\n';
    expect(removeCardModFromConfig(input)).toBe(input);
  });
});
