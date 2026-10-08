import { describe, expect, it } from 'vitest';
import { buildHacsIndex, rawUrl, selectThemeFiles, themeNamesInYaml } from './hacsIndex.js';

const blob = (path, size = 100) => ({ type: 'blob', path, size });

describe('selectThemeFiles', () => {
  it('prefers the themes folder and drops config and workflow files', () => {
    const tree = [
      blob('themes/night.yaml'),
      blob('config.yaml'),
      blob('.github/workflows/ci.yml'),
      blob('example/other.yaml'),
      { type: 'tree', path: 'themes' },
    ];
    expect(selectThemeFiles(tree)).toEqual(['themes/night.yaml']);
  });

  it('falls back to any yaml when there is no themes folder', () => {
    expect(selectThemeFiles([blob('night.yaml'), blob('readme.md')])).toEqual(['night.yaml']);
  });

  it('skips files over the size cap', () => {
    expect(selectThemeFiles([blob('themes/huge.yaml', 5 * 1024 * 1024)])).toEqual([]);
  });
});

describe('themeNamesInYaml', () => {
  it('returns every theme name in a pack', () => {
    const text = 'Night:\n  primary-color: "#000"\nDay:\n  primary-color: "#fff"\n';
    expect(themeNamesInYaml(text)).toEqual(['Night', 'Day']);
  });

  it('accepts themes whose variables live under modes', () => {
    const text = 'Slate:\n  modes:\n    dark:\n      primary-color: "#2980b9"\n    light:\n      primary-color: "#fff"\n';
    expect(themeNamesInYaml(text)).toEqual(['Slate']);
  });

  it('ignores non-theme yaml and invalid yaml', () => {
    expect(themeNamesInYaml('- a\n- b\n')).toEqual([]);
    expect(themeNamesInYaml('name: x\nversion: 1\n')).toEqual([]);
    expect(themeNamesInYaml('a: [unclosed')).toEqual([]);
    expect(themeNamesInYaml(undefined)).toEqual([]);
  });

  it('does not construct objects from tags', () => {
    expect(themeNamesInYaml('Evil: !!js/function "function(){}"\n')).toEqual([]);
  });
});

describe('rawUrl', () => {
  it('pins to the commit and encodes each path segment', () => {
    expect(rawUrl('o/r', 'abc1234', 'themes/My Theme.yaml')).toBe(
      'https://raw.githubusercontent.com/o/r/abc1234/themes/My%20Theme.yaml'
    );
  });
});

describe('buildHacsIndex', () => {
  const catalog = {
    1: { full_name: 'a/good', last_commit: 'c1' },
    2: { full_name: 'b/gone', last_commit: 'c2' },
    3: { full_name: 'c/empty', last_commit: 'c3' },
  };

  const fetchImpl = async (url) => {
    if (url === 'https://api.github.com/repos/a/good') {
      return { ok: true, json: async () => ({ default_branch: 'main', license: { spdx_id: 'MIT' }, stargazers_count: 5, pushed_at: '2026-10-03T12:00:00Z' }) };
    }
    if (url === 'https://api.github.com/repos/b/gone') {
      return { ok: false, status: 404 };
    }
    if (url === 'https://api.github.com/repos/c/empty') {
      return { ok: true, json: async () => ({ default_branch: 'main', license: null, stargazers_count: 0, pushed_at: '2026-10-01T00:00:00Z' }) };
    }
    if (url.includes('/repos/a/good/git/trees')) {
      return { ok: true, json: async () => ({ tree: [blob('themes/good.yaml')] }) };
    }
    if (url.includes('/repos/c/empty/git/trees')) {
      return { ok: true, json: async () => ({ tree: [blob('themes/x.yaml')] }) };
    }
    if (url === 'https://raw.githubusercontent.com/a/good/c1/themes/good.yaml') {
      return { ok: true, text: async () => 'Good Night:\n  primary-color: "#000"\n' };
    }
    if (url.includes('/c/empty/')) return { ok: true, text: async () => 'just: text\n' };
    throw new Error(`unexpected ${url}`);
  };

  it('keeps valid repos, reports skipped ones and sends the token', async () => {
    const seen = [];
    const wrapped = async (url, init) => {
      if (url.includes('api.github.com')) seen.push(init?.headers?.Authorization);
      return fetchImpl(url, init);
    };
    const index = await buildHacsIndex({
      catalog,
      fetchImpl: wrapped,
      token: 'tok',
      now: () => new Date('2026-10-04T00:00:00Z'),
    });
    expect(index.generatedAt).toBe('2026-10-04T00:00:00.000Z');
    expect(index.themes).toEqual([
      {
        full_name: 'a/good',
        default_branch: 'main',
        license: 'MIT',
        stars: 5,
        pushed_at: '2026-10-03T12:00:00Z',
        files: [{ path: 'themes/good.yaml', themes: ['Good Night'] }],
      },
    ]);
    expect(index.skipped).toEqual([
      { repo: 'b/gone', reason: 'repo HTTP 404' },
      { repo: 'c/empty', reason: 'no valid theme files' },
    ]);
    expect(seen.filter(h => h).every((h) => h === 'Bearer tok')).toBe(true);
  });

  it('sorts several indexed repos by name', async () => {
    const ok = (spdx) => ({ ok: true, json: async () => ({ default_branch: 'main', license: spdx ? { spdx_id: spdx } : null, stargazers_count: 1, pushed_at: '2026-10-01T00:00:00Z' }) });
    const multi = async (url) => {
      if (url === 'https://api.github.com/repos/z/last') return ok('MIT');
      if (url === 'https://api.github.com/repos/b/first') return ok(null);
      if (url.includes('/git/trees')) return { ok: true, json: async () => ({ tree: [blob('themes/t.yaml')] }) };
      return { ok: true, text: async () => 'T:\n  primary-color: "#000"\n' };
    };
    const index = await buildHacsIndex({
      catalog: { 1: { full_name: 'z/last', last_commit: 'c1' }, 2: { full_name: 'b/first', last_commit: 'c2' } },
      fetchImpl: multi,
    });
    expect(index.themes.map((t) => t.full_name)).toEqual(['b/first', 'z/last']);
    expect(index.themes[0].license).toBeNull();
  });

  it('turns a thrown fetch into a skipped repo instead of failing the run', async () => {
    const index = await buildHacsIndex({
      catalog: { 1: catalog[1] },
      fetchImpl: async () => {
        throw new Error('network down');
      },
    });
    expect(index.themes).toEqual([]);
    expect(index.skipped).toEqual([{ repo: 'a/good', reason: 'network down' }]);
  });
});
