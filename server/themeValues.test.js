import { describe, it, expect } from 'vitest';
import { loadThemeYaml, readThemeColors, fallbackGradient } from './themeValues.js';

const parse = (text, name) => {
  const doc = loadThemeYaml(text);
  return readThemeColors(doc[name ?? Object.keys(doc)[0]]);
};

describe('readThemeColors', () => {
  it('reads top-level colours and follows var() chains', () => {
    const colors = parse(`
Sample:
  background-color: '#102030'
  text-color: '#ffffff'
  accent-color: '#00b59d'
  primary-color: var(--accent-color)
  primary-background-color: var(--background-color)
  primary-text-color: var(--text-color)
`);
    expect(colors.primary).toBe('#00b59d');
    expect(colors.dark.primaryBackground).toBe('#102030');
    expect(colors.dark.textPrimary).toBe('#ffffff');
  });

  it('lets the mode block override the top-level value', () => {
    const colors = parse(`
Sample:
  primary-background-color: '#111111'
  modes:
    dark:
      primary-background-color: '#222222'
    light:
      primary-background-color: '#eeeeee'
`);
    expect(colors.dark.primaryBackground).toBe('#222222');
    expect(colors.light.primaryBackground).toBe('#eeeeee');
  });

  it('uses the var() fallback when the variable is missing and ignores unresolved references', () => {
    const colors = parse(`
Sample:
  primary-text-color: var(--missing, '#abcdef')
  secondary-text-color: var(--also-missing)
`);
    expect(colors.dark.textPrimary).toBe("'#abcdef'");
    expect(colors.dark.textSecondary).toBeUndefined();
  });

  it('expands YAML merge keys', () => {
    const colors = parse(`
Base: &base
  primary-background-color: '#334455'
Sample:
  <<: *base
  accent-color: '#ff0000'
`, 'Sample');
    expect(colors.dark.primaryBackground).toBe('#334455');
    expect(colors.accent).toBe('#ff0000');
  });

  it('falls back to token-* variables used by Bubble style themes', () => {
    const colors = parse(`
Sample:
  modes:
    dark:
      token-accent: '#88C0D0'
      token-bg: '#2E3440'
      token-card: '#434C5E'
      token-text: '#D8DEE9'
`);
    expect(colors.primary).toBe('#88C0D0');
    expect(colors.dark.primaryBackground).toBe('#2E3440');
    expect(colors.dark.cardBackground).toBe('#434C5E');
    expect(colors.dark.textPrimary).toBe('#D8DEE9');
  });

  it('stops on circular references instead of looping', () => {
    const colors = parse(`
Sample:
  a: var(--b)
  b: var(--a)
  primary-text-color: var(--a)
`);
    expect(colors.dark.textPrimary).toBeUndefined();
  });
});

describe('fallbackGradient', () => {
  it('builds a gradient from the dark background colours', () => {
    const colors = parse(`
Sample:
  primary-background-color: '#101010'
  secondary-background-color: '#202020'
`);
    expect(fallbackGradient(colors)).toBe('linear-gradient(140deg, #101010 0%, #202020 100%)');
  });

  it('returns nothing when the theme defines no background colour', () => {
    expect(fallbackGradient(parse('Sample:\n  primary-color: "#ff0000"\n'))).toBeUndefined();
  });
});
