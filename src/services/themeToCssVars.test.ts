import { describe, it, expect } from 'vitest';
import { themeToCssVars, isLightTheme } from './themeToCssVars';
import type { ThemeConfig } from '../types/theme';

const minimalTheme = {
  id: 't1',
  name: 'Candidate Theme',
  category: 'Minimal',
  author: 'x',
  description: '',
  palette: {
    primary: '#3366ff', accent: '#ff6633', red: '#f00', pink: '#f0f', purple: '#90f', indigo: '#33f',
    blue: '#06f', lightBlue: '#6cf', cyan: '#0ff', teal: '#0fa', green: '#0f0', yellow: '#ff0',
    orange: '#fa0', brown: '#840', grey: '#888',
  },
  engine: {
    sidebarStyle: 'translucent', sidebarOpacity: 0.45, sidebarBlur: 20, saturateAmount: 1.4,
    sheenAngle: 120, sheenOpacity: 0.1, cardRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    glassTint: 'rgba(255,255,255,0.05)', blurAmount: 20, insetShadow: 'none', glowColor: '#fff',
    hoverGlow: false, hoverGlowIntensity: 20, backgroundScrim: '',
  },
  background: { type: 'solid', solidColor: '#000', darken: 0, blur: 0, saturation: 1, vignette: 0, headerTintAuto: true },
  dark: {
    primaryBackground: '#111', secondaryBackground: '#222', cardBackground: '#181818',
    textPrimary: '#fff', textSecondary: '#ccc',
  },
  light: {
    primaryBackground: '#fff', secondaryBackground: '#eee', cardBackground: '#fafafa',
    textPrimary: '#000', textSecondary: '#333',
  },
  customSvgOverlay: '',
  customCss: '',
} as unknown as ThemeConfig;

describe('themeToCssVars', () => {
  it('extracts a flat vars map keyed by the theme name, with core colors present', () => {
    const { name, vars } = themeToCssVars(minimalTheme, 'dark');
    expect(name).toBe('Candidate Theme');
    expect(vars['primary-color']?.toLowerCase()).toBe('#3366ff');
    expect(vars['accent-color']?.toLowerCase()).toBe('#ff6633');
  });

  it('merges the requested mode (dark/light) overrides on top of the flat vars', () => {
    const darkResult = themeToCssVars(minimalTheme, 'dark');
    const lightResult = themeToCssVars(minimalTheme, 'light');
    expect(darkResult.vars['primary-background-color']).toBe('#111');
    expect(lightResult.vars['primary-background-color']).toBe('#fff');
  });

  it('never includes the nested modes object itself as a var value', () => {
    const { vars } = themeToCssVars(minimalTheme, 'dark');
    expect(vars.modes).toBeUndefined();
  });
});

describe('isLightTheme', () => {
  const withBackground = (primaryBackground: string) =>
    ({ ...minimalTheme, dark: { ...minimalTheme.dark, primaryBackground } }) as ThemeConfig;

  it('is true for light hex and rgb backgrounds', () => {
    expect(isLightTheme(withBackground('#e5e5ea'))).toBe(true);
    expect(isLightTheme(withBackground('#fff'))).toBe(true);
    expect(isLightTheme(withBackground('rgb(245, 245, 245)'))).toBe(true);
    expect(isLightTheme(withBackground('rgba(250, 250, 250, 0.9)'))).toBe(true);
  });

  it('is false for dark backgrounds', () => {
    expect(isLightTheme(withBackground('#2c2c2e'))).toBe(false);
    expect(isLightTheme(withBackground('rgb(14, 14, 20)'))).toBe(false);
  });

  it('is false when the background cannot be read', () => {
    expect(isLightTheme(withBackground('transparent'))).toBe(false);
    expect(isLightTheme(withBackground(''))).toBe(false);
  });
});

describe('themeToCssVars light themes', () => {
  const lightTheme = {
    ...minimalTheme,
    dark: { ...minimalTheme.dark, primaryBackground: '#e5e5ea', textPrimary: '#222222' },
    light: { ...minimalTheme.light, primaryBackground: '#e5e5ea', textPrimary: '#222222' },
  } as ThemeConfig;

  it('picks light mode for a light theme when no mode is given', () => {
    const { vars } = themeToCssVars(lightTheme);
    expect(vars['mdc-theme-surface']).toBe('#ffffff');
    expect(vars['mdc-theme-on-surface']).toBe('#212121');
  });

  it('keeps the theme values on top of the light base', () => {
    const { vars } = themeToCssVars(lightTheme);
    expect(vars['primary-background-color']).toBe('#e5e5ea');
    expect(vars['primary-color']?.toLowerCase()).toBe('#3366ff');
  });

  it('does not add the light base to a dark theme', () => {
    const { vars } = themeToCssVars(minimalTheme);
    expect(vars['mdc-theme-surface']).not.toBe('#ffffff');
  });

  it('uses the light base when light mode is requested explicitly and none when dark is', () => {
    expect(themeToCssVars(minimalTheme, 'light').vars['mdc-theme-surface']).toBe('#ffffff');
    expect(themeToCssVars(lightTheme, 'dark').vars['mdc-theme-surface']).not.toBe('#ffffff');
  });

  it('uses black text in light mode so it stays readable over translucent cards', () => {
    const { vars } = themeToCssVars(lightTheme);
    expect(vars['primary-text-color']).toBe('#000000');
    expect(vars['secondary-text-color']).toBe('rgba(0, 0, 0, 0.72)');
  });

  it('keeps the theme text colours in dark mode', () => {
    const { vars } = themeToCssVars(minimalTheme, 'dark');
    expect(vars['primary-text-color']).not.toBe('#000000');
  });
});

describe('themeToCssVars wallpapers', () => {
  const withBackground = (background: Record<string, unknown>) =>
    ({ ...minimalTheme, id: 'photo-theme', background: { ...minimalTheme.background, ...background } }) as ThemeConfig;

  it('points a bundled picture at its absolute address so the preview frame can load it', () => {
    const { vars } = themeToCssVars(withBackground({ type: 'image', imageUrl: './assets/forest-abc123.jpg' }));
    expect(vars['background-image']).toContain('http://localhost/assets/forest-abc123.jpg');
    expect(vars['hats-background']).toContain('http://localhost/assets/forest-abc123.jpg');
    expect(vars['lovelace-background']).toBe('var(--background-image)');
    expect(vars['background-image']).not.toContain('cdn.jsdelivr.net');
  });

  it('handles a bundled picture that the build resolved to a full address on the app origin', () => {
    const { vars } = themeToCssVars(withBackground({ type: 'image', imageUrl: 'http://localhost/api/hassio_ingress/abc/assets/forest-abc123.jpg' }));
    expect(vars['background-image']).toContain('http://localhost/api/hassio_ingress/abc/assets/forest-abc123.jpg');
    expect(vars['background-image']).not.toContain('cdn.jsdelivr.net');
  });

  it('keeps an embedded picture as it is', () => {
    const { vars } = themeToCssVars(withBackground({ type: 'image', imageUrl: 'data:image/webp;base64,AAAA' }));
    expect(vars['background-image']).toContain('data:image/webp;base64,AAAA');
  });

  it('keeps a remote https picture as it is', () => {
    const { vars } = themeToCssVars(withBackground({ type: 'image', imageUrl: 'https://example.com/wall.jpg' }));
    expect(vars['background-image']).toContain('https://example.com/wall.jpg');
  });

  it('does not touch themes that use a gradient', () => {
    const { vars } = themeToCssVars(withBackground({ type: 'gradient', gradientString: 'linear-gradient(red, blue)' }));
    expect(vars['background-image']).toContain('linear-gradient(red, blue)');
  });
});

