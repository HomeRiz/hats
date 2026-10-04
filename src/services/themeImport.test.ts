import { describe, expect, it } from 'vitest';
import { importThemeFiles, validateImageFile, validateSnippet } from './themeImport';

const THEME_YAML = 'Night:\n  primary-color: "#336699"\n  accent-color: "#ff8800"\nDay:\n  primary-color: "#99ccff"\n';
const IMAGE = { dataUrl: 'data:image/jpeg;base64,AAAA', avgColor: '#112233', fileName: 'bg.jpg' };
const SNIPPET = "- title: Home\n  path: home\n  card_mod:\n    style: |\n      :host { --hats-view-background: url('/local/a.webp'); }\n";

describe('importThemeFiles', () => {
  it('imports every theme in the file', () => {
    const result = importThemeFiles({ yamlText: THEME_YAML });
    expect(result.ok && result.themes.map((t) => t.name)).toEqual(['Night', 'Day']);
  });

  it('applies the background image to every imported theme', () => {
    const result = importThemeFiles({ yamlText: THEME_YAML, image: IMAGE });
    if (!result.ok) throw new Error(result.error);
    for (const theme of result.themes) {
      expect(theme.background.type).toBe('image');
      expect(theme.background.imageUrl).toBe(IMAGE.dataUrl);
      expect(theme.background.imageFileName).toBe('bg.jpg');
    }
  });

  it('keeps the per-view snippet with each theme', () => {
    const result = importThemeFiles({ yamlText: THEME_YAML, snippetText: `\n${SNIPPET}\n` });
    if (!result.ok) throw new Error(result.error);
    expect(result.themes.every((t) => t.viewSnippet === SNIPPET.trim())).toBe(true);
  });

  it('reports a clear error instead of importing nothing', () => {
    expect(importThemeFiles({ yamlText: '   ' })).toEqual({ ok: false, error: 'Choose or paste the theme YAML first.' });
    expect(importThemeFiles({ yamlText: 'just text' })).toMatchObject({ ok: false });
    expect(importThemeFiles({ yamlText: 'x'.repeat(600 * 1024) })).toEqual({ ok: false, error: 'The theme YAML is larger than 512 KB.' });
  });

  it('refuses a broken snippet before touching the theme', () => {
    const result = importThemeFiles({ yamlText: THEME_YAML, snippetText: 'a: [unclosed' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain('per-view snippet');
  });
});

describe('validators', () => {
  it('accepts normal images and rejects other files or oversized ones', () => {
    expect(validateImageFile({ type: 'image/webp', size: 1000 })).toBeNull();
    expect(validateImageFile({ type: 'image/svg+xml', size: 1000 })).toContain('PNG, JPEG, WebP or GIF');
    expect(validateImageFile({ type: 'image/png', size: 16 * 1024 * 1024 })).toContain('15 MB');
  });

  it('accepts a view snippet and rejects text that is not YAML', () => {
    expect(validateSnippet(SNIPPET)).toBeNull();
    expect(validateSnippet('42')).toContain('not valid YAML');
    expect(validateSnippet('x'.repeat(20001))).toContain('too long');
  });
});
