export interface HacsIndexFile {
  path: string;
  themes: string[];
}

export interface HacsIndexEntry {
  full_name: string;
  default_branch: string;
  license: string | null;
  stars: number;
  pushed_at: string | null;
  files: HacsIndexFile[];
}

export interface HacsIndex {
  version: number;
  generatedAt: string;
  themes: HacsIndexEntry[];
}

export const HACS_INDEX_URL = 'https://raw.githubusercontent.com/HomeRiz/hats/hacs-index/hacs-themes.json';

export type HacsSort = 'stars' | 'updated' | 'name';
export type HacsLicenseFilter = 'all' | 'licensed' | 'unlicensed';

export function isUsableLicense(license: string | null): boolean {
  return !!license && license !== 'NOASSERTION';
}

export function themeCount(entry: HacsIndexEntry): number {
  return entry.files.reduce((n, f) => n + f.themes.length, 0);
}

function isEntry(value: unknown): value is HacsIndexEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.full_name === 'string' && /^[\w.-]+\/[\w.-]+$/.test(v.full_name) && Array.isArray(v.files);
}

export function parseHacsIndex(raw: unknown): HacsIndex | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (!Array.isArray(v.themes)) return null;
  const themes = v.themes.filter(isEntry).map((e) => ({
    full_name: e.full_name,
    default_branch: typeof e.default_branch === 'string' ? e.default_branch : 'main',
    license: typeof e.license === 'string' ? e.license : null,
    stars: typeof e.stars === 'number' ? e.stars : 0,
    pushed_at: typeof e.pushed_at === 'string' ? e.pushed_at : null,
    files: e.files
      .filter((f) => f && typeof f.path === 'string' && Array.isArray(f.themes))
      .map((f) => ({ path: f.path, themes: f.themes.filter((t) => typeof t === 'string') })),
  }));
  return { version: Number(v.version) || 1, generatedAt: String(v.generatedAt ?? ''), themes };
}

export async function fetchHacsIndex(fetchImpl: typeof fetch = fetch): Promise<HacsIndex> {
  const res = await fetchImpl(HACS_INDEX_URL, { cache: 'no-cache' });
  if (res.status === 404) throw new Error('The theme index has not been published yet.');
  if (!res.ok) throw new Error(`Could not load the theme index (HTTP ${res.status}).`);
  const parsed = parseHacsIndex(await res.json());
  if (!parsed) throw new Error('The theme index file is not in the expected format.');
  return parsed;
}

export function filterHacsThemes(
  entries: HacsIndexEntry[],
  opts: { query: string; sort: HacsSort; license: HacsLicenseFilter },
): HacsIndexEntry[] {
  const q = opts.query.trim().toLowerCase();
  const matches = entries.filter((e) => {
    if (opts.license === 'licensed' && !isUsableLicense(e.license)) return false;
    if (opts.license === 'unlicensed' && isUsableLicense(e.license)) return false;
    if (!q) return true;
    if (e.full_name.toLowerCase().includes(q)) return true;
    return e.files.some((f) => f.themes.some((t) => t.toLowerCase().includes(q)));
  });
  const sorted = [...matches];
  if (opts.sort === 'stars') sorted.sort((a, b) => b.stars - a.stars || a.full_name.localeCompare(b.full_name));
  else if (opts.sort === 'updated') sorted.sort((a, b) => (b.pushed_at ?? '').localeCompare(a.pushed_at ?? ''));
  else sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
  return sorted;
}
