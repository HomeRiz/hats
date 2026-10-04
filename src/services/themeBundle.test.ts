import { describe, expect, it } from 'vitest';
import { defaultGlassTheme } from '../presets/defaultThemes';
import { ThemeConfig } from '../types/theme';
import { buildThemeBundle, buildThemeReadme, buildThemesBundle, dataUrlToBytes, toThemeFileId } from './themeBundle';

const identity = async (theme: ThemeConfig) => theme;
const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function withBackground(background: Partial<ThemeConfig['background']>, id = 'night-glass'): ThemeConfig {
  return { ...defaultGlassTheme, id, name: 'Night Glass', background: { ...defaultGlassTheme.background, ...background } };
}

function text(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

describe('toThemeFileId', () => {
  it('matches the id the server writes to disk', () => {
    expect(toThemeFileId('My Theme!')).toBe('my-theme');
    expect(toThemeFileId('../etc/passwd')).toBe('etc-passwd');
    expect(toThemeFileId('***')).toBe('theme');
  });
});

describe('dataUrlToBytes', () => {
  it('decodes an image data url and rejects everything else', () => {
    expect(dataUrlToBytes(PNG_1PX)?.[0]).toBe(0x89);
    expect(dataUrlToBytes('https://example.com/a.png')).toBeNull();
    expect(dataUrlToBytes('data:text/html;base64,PGI+')).toBeNull();
    expect(dataUrlToBytes(undefined)).toBeNull();
  });
});

describe('buildThemeBundle', () => {
  it('puts the theme and the background in the folders Home Assistant expects', async () => {
    const bundle = await buildThemeBundle(withBackground({ type: 'image', imageUrl: PNG_1PX }), { embedBackground: identity });
    const content = text(bundle.bytes);
    expect(bundle.fileName).toBe('night-glass.zip');
    expect(content).toContain('config/themes/night-glass.yaml');
    expect(content).toContain('config/www/hats/backgrounds/night-glass/default.webp');
    expect(content).toContain('per-view-snippet.yaml');
    expect(content).toContain('README.md');
    expect(content).toContain("url('/local/hats/backgrounds/night-glass/default.webp')");
  });

  it('leaves the image out when the theme has none', async () => {
    const bundle = await buildThemeBundle(withBackground({ type: 'solid', solidColor: '#101018', imageUrl: undefined }), {
      embedBackground: identity,
    });
    const content = text(bundle.bytes);
    expect(content).not.toContain('config/www/');
    expect(content).toContain('does not use a background image');
  });

  it('does not bundle a remote image and says where it comes from', async () => {
    const bundle = await buildThemeBundle(
      withBackground({ type: 'image', imageUrl: 'https://example.com/bg.webp' }),
      { embedBackground: identity }
    );
    const content = text(bundle.bytes);
    expect(content).not.toContain('config/www/hats/backgrounds');
    expect(content).toContain('https://example.com/bg.webp');
  });

  it('keeps the data url out of the per-view snippet', async () => {
    const bundle = await buildThemeBundle(withBackground({ type: 'image', imageUrl: PNG_1PX }), { embedBackground: identity });
    const snippet = text(bundle.bytes).split('--hats-view-background: ')[1]?.split('\n')[0] ?? '';
    expect(snippet).toBe("url('/local/hats/backgrounds/night-glass/default.webp');");
  });

  it('uses a safe id for every path', async () => {
    const bundle = await buildThemeBundle(withBackground({ type: 'solid', solidColor: '#000' }, '../Bad Id'), {
      embedBackground: identity,
    });
    expect(bundle.fileName).toBe('bad-id.zip');
    expect(text(bundle.bytes)).toContain('config/themes/bad-id.yaml');
    expect(text(bundle.bytes)).not.toContain('../');
  });
});

describe('buildThemeReadme', () => {
  it('explains the install steps and the per-view snippet', () => {
    const readme = buildThemeReadme(withBackground({ type: 'image', imageUrl: PNG_1PX }), true);
    expect(readme).toContain('# Night Glass');
    expect(readme).toContain('1. Copy `config/themes/night-glass.yaml` to `/config/themes/night-glass.yaml`.');
    expect(readme).toContain('/config/www/hats/backgrounds/night-glass');
    expect(readme).toContain('themes: !include_dir_merge_named themes');
    expect(readme).toContain('Raw configuration editor');
    expect(readme).toContain('UIX or card-mod');
  });

  it('numbers the steps without a gap when there is no image', () => {
    const readme = buildThemeReadme(withBackground({ type: 'solid', solidColor: '#000' }), false);
    expect(readme).toContain('2. Make sure `configuration.yaml` loads the themes folder');
    expect(readme).not.toContain('/config/www/hats/backgrounds/night-glass`.');
  });
});

describe('buildThemesBundle', () => {
  const night = withBackground({ type: 'image', imageUrl: PNG_1PX }, 'night');
  const day = withBackground({ type: 'solid', solidColor: '#ffffff' }, 'day');

  it('puts every theme in one archive with a single README', async () => {
    const bundle = await buildThemesBundle([night, day], { embedBackground: identity });
    const content = text(bundle.bytes);
    expect(bundle.fileName).toBe('hats-themes.zip');
    expect(content).toContain('config/themes/night.yaml');
    expect(content).toContain('config/themes/day.yaml');
    expect(content).toContain('per-view-snippets/night.yaml');
    expect(content).toContain('config/www/hats/backgrounds/night/default.webp');
    expect(content).not.toContain('config/www/hats/backgrounds/day/default.webp');
    expect(content).toContain('2 Home Assistant themes exported from HATS');
    expect(content).toContain('`night.yaml`, background included');
    expect(content).toContain('`day.yaml`, no background image');
  });

  it('keeps ids unique when two themes clean up to the same name', async () => {
    const bundle = await buildThemesBundle([withBackground({ type: 'solid', solidColor: '#000' }, 'A B'), withBackground({ type: 'solid', solidColor: '#000' }, 'a-b')], {
      embedBackground: identity,
    });
    const content = text(bundle.bytes);
    expect(content).toContain('config/themes/a-b.yaml');
    expect(content).toContain('config/themes/a-b-2.yaml');
  });

  it('falls back to the single theme archive for one theme', async () => {
    const bundle = await buildThemesBundle([night], { embedBackground: identity });
    expect(bundle.fileName).toBe('night.zip');
  });
});

