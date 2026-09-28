import type { ThemeConfig } from '../types/theme';

export interface ThemePack {
  representative: ThemeConfig;
  variants: ThemeConfig[];
}

export function groupThemesIntoPacks(themes: ThemeConfig[]): ThemePack[] {
  const groups = new Map<string, ThemeConfig[]>();
  const order: string[] = [];

  themes.forEach((theme, index) => {
    const key = theme.sourceUrl || `__singleton_${theme.id}_${index}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(theme);
  });

  return order.map((key) => {
    const variants = groups.get(key)!;
    const representative = variants.reduce((shortest, t) =>
      t.id.length < shortest.id.length ? t : shortest
    );
    return { representative, variants };
  });
}
