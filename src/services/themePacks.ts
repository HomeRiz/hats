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

export interface PackPosition {
  pack: ThemePack;
  packIndex: number;
  packCount: number;
  variantIndex: number;
  prev: ThemeConfig;
  next: ThemeConfig;
}

export function locateInPacks(packs: ThemePack[], themeId: string): PackPosition | null {
  const flat = packs.flatMap((pack) => pack.variants);
  const flatIndex = flat.findIndex((theme) => theme.id === themeId);
  if (flatIndex === -1) return null;

  const packIndex = packs.findIndex((pack) => pack.variants.some((variant) => variant.id === themeId));
  const pack = packs[packIndex];

  return {
    pack,
    packIndex,
    packCount: packs.length,
    variantIndex: pack.variants.findIndex((variant) => variant.id === themeId),
    prev: flat[(flatIndex - 1 + flat.length) % flat.length],
    next: flat[(flatIndex + 1) % flat.length],
  };
}
