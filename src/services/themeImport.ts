import { ThemeConfig } from '../types/theme';
import { parseHomeAssistantThemeYaml } from './yamlParser';
import { MAX_THEME_YAML_BYTES } from './rawThemePreview';
import { loadThemeYaml } from '../../server/themeValues.js';

export const MAX_SNIPPET_CHARS = 20000;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export interface ImportedImage {
  dataUrl: string;
  avgColor: string;
  fileName: string;
}

export interface ThemeImportInput {
  yamlText: string;
  image?: ImportedImage;
  snippetText?: string;
}

export type ThemeImportResult = { ok: true; themes: ThemeConfig[] } | { ok: false; error: string };

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!IMAGE_MIME_TYPES.includes(file.type)) return 'The background must be a PNG, JPEG, WebP or GIF image.';
  if (file.size > MAX_IMAGE_BYTES) return 'The background image is larger than 15 MB.';
  return null;
}

export function validateSnippet(text: string): string | null {
  if (text.length > MAX_SNIPPET_CHARS) return 'The per-view snippet is too long.';
  try {
    const parsed = loadThemeYaml(text);
    if (!parsed || typeof parsed !== 'object') return 'The per-view snippet is not valid YAML for a dashboard view.';
  } catch (err: any) {
    return `The per-view snippet is not valid YAML: ${String(err?.message || err).split('\n')[0]}`;
  }
  return null;
}

export function importThemeFiles(input: ThemeImportInput): ThemeImportResult {
  if (!input.yamlText.trim()) return { ok: false, error: 'Choose or paste the theme YAML first.' };
  if (input.yamlText.length > MAX_THEME_YAML_BYTES) return { ok: false, error: 'The theme YAML is larger than 512 KB.' };

  const snippet = input.snippetText?.trim();
  if (snippet) {
    const snippetError = validateSnippet(snippet);
    if (snippetError) return { ok: false, error: snippetError };
  }

  const parsed = parseHomeAssistantThemeYaml(input.yamlText);
  if (parsed.length === 0) return { ok: false, error: 'No Home Assistant theme was found in this YAML.' };

  const themes = parsed.map((theme) => {
    let next = theme;
    if (input.image) {
      next = {
        ...next,
        background: {
          ...next.background,
          type: 'image',
          imageUrl: input.image.dataUrl,
          imageFileName: input.image.fileName,
          avgColor: input.image.avgColor,
        },
      };
    }
    if (snippet) next = { ...next, viewSnippet: snippet };
    return next;
  });
  return { ok: true, themes };
}
