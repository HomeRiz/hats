import { describe, it, expect } from 'vitest';
import { themeToCssVars } from './themeToCssVars';
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
