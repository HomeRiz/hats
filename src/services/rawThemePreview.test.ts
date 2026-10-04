import { describe, expect, it } from 'vitest';
import { parseRawThemes, createLocalAssetResolver } from './rawThemePreview';
import { rawThemeToCssVars } from './themeToCssVars';

const YAML = `
My Theme:
  primary-color: "#ff0000"
  card-mod-theme: My Theme
  card-mod-card: |
    ha-card { border: 1px solid red; }
  some-number: 4
  modes:
    dark:
      primary-background-color: "#000000"
    light:
      primary-background-color: "#ffffff"
Second: {}
Not a theme: just text
`;

describe('parseRawThemes', () => {
  it('keeps every key of every theme as published', () => {
    const themes = parseRawThemes(YAML);
    expect(themes.map((t) => t.name)).toEqual(['My Theme', 'Second']);
    expect(themes[0].data['card-mod-card']).toContain('ha-card');
    expect(themes[0].data['card-mod-theme']).toBe('My Theme');
  });

  it('returns nothing for invalid or oversized input', () => {
    expect(parseRawThemes('a: [unclosed')).toEqual([]);
    expect(parseRawThemes('x'.repeat(5 * 1024 * 1024))).toEqual([]);
    expect(parseRawThemes('- a\n- b')).toEqual([]);
  });
});

describe('rawThemeToCssVars', () => {
  const [theme] = parseRawThemes(YAML);

  it('merges the chosen mode over the base variables and stringifies numbers', () => {
    const dark = rawThemeToCssVars(theme.name, theme.data, 'dark');
    expect(dark.vars['primary-background-color']).toBe('#000000');
    expect(dark.vars['some-number']).toBe('4');
    expect(dark.vars['card-mod-theme']).toBe('My Theme');
    expect(dark.vars).not.toHaveProperty('modes');
    const light = rawThemeToCssVars(theme.name, theme.data, 'light');
    expect(light.vars['primary-background-color']).toBe('#ffffff');
    expect(light.vars['primary-color']).toBe('#ff0000');
  });
});

describe('createLocalAssetResolver', () => {
  const base = 'https://raw.githubusercontent.com/o/r/main';

  it('points /local images at the same file in the repo', () => {
    const resolve = createLocalAssetResolver(['themes/t.yaml', 'images/bg blue.jpg', 'README.md'], base);
    const out = resolve({
      'primary-background-color': 'url("/local/ios-themes/bg%20blue.jpg") center / cover',
      nested: { 'card-mod-card': "ha-card { background: url('/local/ios-themes/bg%20blue.jpg?v=2'); }" },
      untouched: '/local/missing.png',
      color: '#fff',
    });
    expect(out['primary-background-color']).toBe(`url("${base}/images/bg%20blue.jpg") center / cover`);
    expect((out.nested as Record<string, string>)['card-mod-card']).toContain(`url('${base}/images/bg%20blue.jpg')`);
    expect(out.untouched).toBe('/local/missing.png');
    expect(out.color).toBe('#fff');
  });

  it('prefers the file whose folders match the /local path', () => {
    const resolve = createLocalAssetResolver(['light/bg.png', 'dark/bg.png'], base);
    expect(resolve({ x: '/local/mytheme/dark/bg.png' }).x).toBe(`${base}/dark/bg.png`);
    expect(resolve({ x: '/local/mytheme/light/bg.png' }).x).toBe(`${base}/light/bg.png`);
  });

  it('ignores non-image files with the same name', () => {
    const resolve = createLocalAssetResolver(['notes/bg.txt'], base);
    expect(resolve({ x: '/local/bg.txt' }).x).toBe('/local/bg.txt');
  });
});
