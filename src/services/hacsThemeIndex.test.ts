import { describe, expect, it } from 'vitest';
import { fetchHacsIndex, filterHacsThemes, parseHacsIndex, themeCount, HacsIndexEntry } from './hacsThemeIndex';

const entry = (over: Partial<HacsIndexEntry>): HacsIndexEntry => ({
  full_name: 'a/b',
  default_branch: 'main',
  license: 'MIT',
  stars: 1,
  pushed_at: '2026-01-01T00:00:00Z',
  files: [{ path: 'themes/x.yaml', themes: ['Night Sky'] }],
  ...over,
});

describe('parseHacsIndex', () => {
  it('drops malformed entries and repo names with odd characters', () => {
    const parsed = parseHacsIndex({
      version: 1,
      generatedAt: 'now',
      themes: [entry({}), { full_name: 'bad name/x', files: [] }, { nope: true }, entry({ full_name: 'c/d', license: null })],
    });
    expect(parsed?.themes.map((t) => t.full_name)).toEqual(['a/b', 'c/d']);
    expect(parsed?.themes[1].license).toBeNull();
  });

  it('rejects non-index input', () => {
    expect(parseHacsIndex(null)).toBeNull();
    expect(parseHacsIndex({ themes: 'x' })).toBeNull();
  });
});

describe('filterHacsThemes', () => {
  const list = [
    entry({ full_name: 'a/zed', stars: 5, license: null, pushed_at: '2026-03-01T00:00:00Z' }),
    entry({ full_name: 'b/alpha', stars: 50, files: [{ path: 'themes/y.yaml', themes: ['Ocean', 'Forest'] }] }),
    entry({ full_name: 'c/mid', stars: 20, license: 'NOASSERTION', pushed_at: '2026-02-01T00:00:00Z' }),
  ];

  it('sorts by stars, name and last update', () => {
    const names = (sort: 'stars' | 'name' | 'updated') => filterHacsThemes(list, { query: '', sort, license: 'all' }).map((e) => e.full_name);
    expect(names('stars')).toEqual(['b/alpha', 'c/mid', 'a/zed']);
    expect(names('name')).toEqual(['a/zed', 'b/alpha', 'c/mid']);
    expect(names('updated')[0]).toBe('a/zed');
  });

  it('searches repo and theme names', () => {
    expect(filterHacsThemes(list, { query: 'forest', sort: 'stars', license: 'all' }).map((e) => e.full_name)).toEqual(['b/alpha']);
  });

  it('treats NOASSERTION as unlicensed', () => {
    expect(filterHacsThemes(list, { query: '', sort: 'name', license: 'unlicensed' }).map((e) => e.full_name)).toEqual(['a/zed', 'c/mid']);
    expect(filterHacsThemes(list, { query: '', sort: 'name', license: 'licensed' }).map((e) => e.full_name)).toEqual(['b/alpha']);
  });

  it('counts themes across files', () => {
    expect(themeCount(list[1])).toBe(2);
  });
});

describe('fetchHacsIndex', () => {
  it('explains a missing index', async () => {
    await expect(fetchHacsIndex((async () => ({ ok: false, status: 404 })) as unknown as typeof fetch)).rejects.toThrow('not been published');
  });

  it('returns the parsed index', async () => {
    const f = (async () => ({ ok: true, status: 200, json: async () => ({ version: 1, generatedAt: 'x', themes: [entry({})] }) })) as unknown as typeof fetch;
    expect((await fetchHacsIndex(f)).themes).toHaveLength(1);
  });
});
