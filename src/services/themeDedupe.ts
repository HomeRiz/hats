import { ThemeConfig } from '../types/theme';

function fingerprint(theme: ThemeConfig): string {
  const { id: _id, updatedAt: _updatedAt, createdAt: _createdAt, ...rest } = theme as ThemeConfig & { createdAt?: string };
  return JSON.stringify(rest);
}

export function dedupeIdenticalThemes(themes: ThemeConfig[]): ThemeConfig[] {
  const seen = new Map<string, number>();
  const result: ThemeConfig[] = [];
  for (const theme of themes) {
    const key = fingerprint(theme);
    const at = seen.get(key);
    if (at === undefined) {
      seen.set(key, result.length);
      result.push(theme);
    } else if ((theme.updatedAt ?? '') > (result[at].updatedAt ?? '')) {
      result[at] = theme;
    }
  }
  return result;
}

export function copyIdForPreview(source: string, name: string): string {
  const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `custom-copy-${slug(source)}-${slug(name)}`;
}
