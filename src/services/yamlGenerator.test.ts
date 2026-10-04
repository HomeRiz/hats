import { describe, expect, it } from 'vitest';
import { defaultGlassTheme } from '../presets/defaultThemes';
import { generateHomeAssistantThemeYaml, generatePerViewSnippet } from './yamlGenerator';

describe('per-view background', () => {
  it('lets a view override the background through --hats-view-background', () => {
    const yaml = generateHomeAssistantThemeYaml(defaultGlassTheme, 'local');
    expect(yaml).toContain('hui-view::before');
    expect(yaml).toContain('background-image: var(--hats-view-background, none);');
  });

  it('points the snippet at the installed image, never at embedded data', () => {
    const theme = {
      ...defaultGlassTheme,
      id: 'night',
      background: { ...defaultGlassTheme.background, type: 'image' as const, imageUrl: 'data:image/png;base64,AAAA' },
    };
    const snippet = generatePerViewSnippet(theme);
    expect(snippet).toContain("--hats-view-background: url('/local/hats/backgrounds/night/default.webp');");
    expect(snippet).not.toContain('data:image');
  });

  it('keeps a remote image address', () => {
    const theme = {
      ...defaultGlassTheme,
      background: { ...defaultGlassTheme.background, type: 'image' as const, imageUrl: 'https://example.com/bg.webp' },
    };
    expect(generatePerViewSnippet(theme)).toContain("url('https://example.com/bg.webp')");
  });

  it('returns an imported snippet unchanged', () => {
    const theme = { ...defaultGlassTheme, viewSnippet: '- title: Home\n  path: home\n' };
    expect(generatePerViewSnippet(theme)).toBe('- title: Home\n  path: home\n');
  });
});

describe('sidebar selection', () => {
  const selected = (yaml: string) => /sidebar-selected-icon-color: "([^"]+)"/.exec(yaml)?.[1];

  it('uses the readable color on the primary pill when card-mod draws it', () => {
    const theme = { ...defaultGlassTheme, components: { 'card-mod': true } };
    expect(selected(generateHomeAssistantThemeYaml(theme, 'local'))).not.toBe(defaultGlassTheme.palette.primary);
  });

  it('uses the primary color when card-mod is off so the selected item stays visible', () => {
    const theme = { ...defaultGlassTheme, components: { 'card-mod': false } };
    const yaml = generateHomeAssistantThemeYaml(theme, 'local');
    expect(selected(yaml)).toBe(defaultGlassTheme.palette.primary);
    expect(yaml).toContain(`sidebar-selected-text-color: "${defaultGlassTheme.palette.primary}"`);
  });
});
