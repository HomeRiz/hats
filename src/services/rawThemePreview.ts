import { loadThemeYaml } from '../../server/themeValues.js';

export interface RawThemeEntry {
  name: string;
  data: Record<string, unknown>;
}

export const MAX_THEME_YAML_BYTES = 512 * 1024;

export function parseRawThemes(yamlText: string): RawThemeEntry[] {
  if (typeof yamlText !== 'string' || yamlText.length > MAX_THEME_YAML_BYTES) return [];
  let doc: unknown;
  try {
    doc = loadThemeYaml(yamlText);
  } catch {
    return [];
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return [];
  return Object.entries(doc as Record<string, unknown>)
    .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
    .map(([name, data]) => ({ name, data: data as Record<string, unknown> }));
}

const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|svg|avif)$/i;
const LOCAL_PATH = /\/local\/[^\s"'()\\,;]+/g;

function segmentsOf(p: string): string[] {
  return p.split('?')[0].split('#')[0].split('/').filter(Boolean);
}

export function createLocalAssetResolver(blobPaths: string[], rawBase: string): (data: Record<string, unknown>) => Record<string, unknown> {
  const byName = new Map<string, string[]>();
  for (const path of blobPaths) {
    if (!IMAGE_EXT.test(path)) continue;
    const name = path.split('/').pop()!.toLowerCase();
    byName.set(name, [...(byName.get(name) ?? []), path]);
  }

  const pick = (localPath: string): string | undefined => {
    const wanted = segmentsOf(localPath).slice(1).map((s) => safeDecode(s).toLowerCase());
    const name = wanted[wanted.length - 1];
    const candidates = name ? byName.get(name) : undefined;
    if (!candidates?.length) return undefined;
    const score = (path: string) => {
      const have = path.toLowerCase().split('/').reverse();
      const want = [...wanted].reverse();
      let n = 0;
      while (n < have.length && n < want.length && have[n] === want[n]) n++;
      return n;
    };
    return [...candidates].sort((a, b) => score(b) - score(a))[0];
  };

  const rewrite = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.replace(LOCAL_PATH, (match) => {
        const found = pick(match);
        return found ? `${rawBase}/${found.split('/').map(encodeURIComponent).join('/')}` : match;
      });
    }
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, rewrite(v)]));
    }
    return value;
  };

  return (data) => rewrite(data) as Record<string, unknown>;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
