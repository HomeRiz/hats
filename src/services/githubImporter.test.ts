import { describe, it, expect, vi, afterEach } from 'vitest';
import { importThemesFromGitHubRepo, parseGitHubRepoUrl } from './githubImporter';
import { groupThemesIntoPacks } from './themePacks';

describe('parseGitHubRepoUrl', () => {
  it('parses an owner/repo slug', () => {
    expect(parseGitHubRepoUrl('HomeRiz/hats')).toEqual({ owner: 'HomeRiz', repo: 'hats' });
  });

  it('parses a full GitHub URL', () => {
    expect(parseGitHubRepoUrl('https://github.com/HomeRiz/hats')).toEqual({
      owner: 'HomeRiz',
      repo: 'hats',
      branch: undefined,
    });
  });
});

describe('importThemesFromGitHubRepo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches requiredIntegrations detected from the repo tree onto every parsed theme', async () => {
    const treeResponse = {
      tree: [
        { type: 'blob', path: 'themes/fluvy.yaml' },
        { type: 'blob', path: 'custom_components/fluvy/manifest.json' },
        { type: 'blob', path: 'custom_components/fluvy/__init__.py' },
      ],
    };
    const yamlText = 'fluvy:\n  primary-color: "#111"\n';

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('git/trees')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(treeResponse) } as Response);
        }
        return Promise.resolve({ ok: true, text: () => Promise.resolve(yamlText) } as Response);
      })
    );

    const result = await importThemesFromGitHubRepo('acosta290/fluvy');

    expect(result.success).toBe(true);
    expect(result.themes[0].requirements?.requiredIntegrations).toEqual([
      { name: 'fluvy', domain: 'fluvy', repoFullName: 'acosta290/fluvy' },
    ]);
  });

  it('leaves requiredIntegrations unset when the repo has no custom_components', async () => {
    const treeResponse = { tree: [{ type: 'blob', path: 'themes/plain.yaml' }] };
    const yamlText = 'plain:\n  primary-color: "#222"\n';

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('git/trees')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(treeResponse) } as Response);
        }
        return Promise.resolve({ ok: true, text: () => Promise.resolve(yamlText) } as Response);
      })
    );

    const result = await importThemesFromGitHubRepo('someone/plain-theme');

    expect(result.success).toBe(true);
    expect(result.themes[0].requirements?.requiredIntegrations).toBeUndefined();
  });
  function stubRepo(files: Record<string, string>) {
    const treeResponse = { tree: Object.keys(files).map((path) => ({ type: 'blob', path })) };
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('git/trees')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(treeResponse) } as Response);
        }
        const path = Object.keys(files).find((p) => url.endsWith(`/${p}`));
        return Promise.resolve({ ok: true, text: () => Promise.resolve(files[path ?? ''] ?? '') } as Response);
      })
    );
  }

  it('imports a repo with several theme files as one pack sharing the repository address', async () => {
    stubRepo({
      'themes/dark-blue.yaml': 'Pack Dark Blue:\n  primary-color: "#0000ff"\n',
      'themes/green.yaml': 'Pack Green:\n  primary-color: "#00ff00"\n',
      'themes/orange.yaml': 'Pack Orange:\n  primary-color: "#ff8800"\n',
    });

    const result = await importThemesFromGitHubRepo('awolkers/pack');

    expect(result.success).toBe(true);
    expect(result.message).toContain('pack of 3 themes');
    expect(result.themes.map((t) => t.sourceUrl)).toEqual([
      'https://github.com/awolkers/pack',
      'https://github.com/awolkers/pack',
      'https://github.com/awolkers/pack',
    ]);
    const packs = groupThemesIntoPacks(result.themes);
    expect(packs).toHaveLength(1);
    expect(packs[0].variants).toHaveLength(3);
  });

  it('imports several themes from a single file as one pack', async () => {
    stubRepo({
      'themes/all.yaml': 'Light Variant:\n  primary-color: "#fff"\nDark Variant:\n  primary-color: "#000"\n',
    });

    const result = await importThemesFromGitHubRepo('someone/two-in-one');

    expect(result.themes).toHaveLength(2);
    expect(groupThemesIntoPacks(result.themes)).toHaveLength(1);
  });

  it('describes a repo with a single theme as one theme, not a pack', async () => {
    stubRepo({ 'themes/solo.yaml': 'Solo:\n  primary-color: "#123456"\n' });

    const result = await importThemesFromGitHubRepo('someone/solo');

    expect(result.message).toContain('1 theme');
    expect(result.message).not.toContain('pack');
    expect(result.themes[0].authorGithub).toBe('someone');
  });

  it('groups themes imported from a raw GitHub YAML link under their repository', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('One:\n  primary-color: "#111"\nTwo:\n  primary-color: "#222"\n'),
        } as Response)
      )
    );

    const result = await importThemesFromGitHubRepo('https://raw.githubusercontent.com/awolkers/pack/main/themes/pack.yaml');

    expect(result.themes.every((t) => t.sourceUrl === 'https://github.com/awolkers/pack')).toBe(true);
    expect(groupThemesIntoPacks(result.themes)).toHaveLength(1);
  });
});

describe('importThemesFromGitHubRepo preview options', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const respond = (tree: unknown[], files: Record<string, string>, calls: string[]) =>
    vi.fn((url: string) => {
      calls.push(url);
      if (url.includes('git/trees')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ tree }) } as Response);
      }
      const hit = Object.keys(files).find((p) => url.endsWith(p));
      return Promise.resolve(
        hit ? ({ ok: true, status: 200, text: () => Promise.resolve(files[hit]) } as Response) : ({ ok: false, status: 404 } as Response),
      );
    });

  it('reads the requested branch from the tree and the raw files', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', respond([{ type: 'blob', path: 'themes/a.yaml' }], { 'themes/a.yaml': 'a:\n  primary-color: "#111"\n' }, calls));

    await importThemesFromGitHubRepo('owner/repo', { branch: 'dev' });

    expect(calls[0]).toContain('/git/trees/dev?recursive=1');
    expect(calls[1]).toBe('https://raw.githubusercontent.com/owner/repo/dev/themes/a.yaml');
  });

  it('takes the branch from a /tree/ URL', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', respond([{ type: 'blob', path: 'themes/a.yaml' }], { 'themes/a.yaml': 'a:\n  primary-color: "#111"\n' }, calls));

    await importThemesFromGitHubRepo('https://github.com/owner/repo/tree/beta');

    expect(calls[0]).toContain('/git/trees/beta?recursive=1');
  });

  it('prefers the themes folder over other YAML files in the repo', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      respond(
        [
          { type: 'blob', path: 'examples/other.yaml' },
          { type: 'blob', path: 'themes/real.yaml' },
        ],
        { 'themes/real.yaml': 'real:\n  primary-color: "#222"\n', 'examples/other.yaml': 'other:\n  primary-color: "#333"\n' },
        calls,
      ),
    );

    const result = await importThemesFromGitHubRepo('owner/repo');

    expect(result.themes.map((t) => t.name)).toEqual(['real']);
  });

  it('keeps the theme exactly as published when asked', async () => {
    const calls: string[] = [];
    const yamlText = 'raw:\n  primary-color: "#444"\n  some-unmodelled-var: 12px\n  card-mod-card: |\n    ha-card { color: red; }\n';
    vi.stubGlobal('fetch', respond([{ type: 'blob', path: 'themes/raw.yaml' }], { 'themes/raw.yaml': yamlText }, calls));

    const kept = await importThemesFromGitHubRepo('owner/repo', { keepRaw: true });
    expect(kept.themes[0].rawTheme?.source).toBe('owner/repo');
    expect(kept.themes[0].rawTheme?.data['some-unmodelled-var']).toBe('12px');

    const plain = await importThemesFromGitHubRepo('owner/repo');
    expect(plain.themes[0].rawTheme).toBeUndefined();
  });

  it('falls back to the usual HACS file locations when the API is rate limited', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        calls.push(url);
        if (url.includes('git/trees')) return Promise.resolve({ ok: false, status: 403 } as Response);
        if (url.endsWith('themes/repo.yaml')) {
          return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('repo:\n  primary-color: "#555"\n') } as Response);
        }
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }),
    );

    const result = await importThemesFromGitHubRepo('owner/repo');

    expect(result.success).toBe(true);
    expect(result.themes[0].name).toBe('repo');
  });

  it('reports the rate limit when nothing can be guessed', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 403 } as Response)));

    const result = await importThemesFromGitHubRepo('owner/repo');

    expect(result.success).toBe(false);
    expect(result.message).toContain('rate limit');
  });
});

describe('importThemesFromGitHubRepo file selection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubRepo = (tree: object[], files: Record<string, string>) => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('git/trees')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ tree }) } as Response);
        const file = Object.keys(files).find((path) => url.endsWith(`/${path}`));
        return Promise.resolve(
          file ? ({ ok: true, text: () => Promise.resolve(files[file]) } as Response) : ({ ok: false, status: 404 } as Response)
        );
      })
    );
  };

  it('imports a theme file that is larger than 512 KB, like one with an embedded background', async () => {
    const big = `big-theme:\n  primary-color: "#123456"\n  background-image: "url('data:image/jpeg;base64,${'A'.repeat(600 * 1024)}')"\n`;
    stubRepo([{ type: 'blob', path: 'themes/big.yaml', size: big.length }], { 'themes/big.yaml': big });
    const result = await importThemesFromGitHubRepo('owner/big', { keepRaw: true });
    expect(result.success).toBe(true);
    expect(result.themes[0].name).toBe('big-theme');
    expect(result.themes[0].rawTheme?.data['primary-color']).toBe('#123456');
  });

  it('does not turn project files into themes when the real theme file is missing', async () => {
    stubRepo(
      [
        { type: 'blob', path: '.pre-commit-config.yaml', size: 100 },
        { type: 'blob', path: '.github/FUNDING.yml', size: 20 },
        { type: 'blob', path: 'docs/mkdocs.yml', size: 50 },
      ],
      {
        '.pre-commit-config.yaml': 'repos:\n  - repo: https://example.com/x.git\n    hooks:\n      - id: lint\n',
        '.github/FUNDING.yml': 'github: someone\n',
        'docs/mkdocs.yml': 'site_name: Docs\nnav:\n  - Home: index.md\n',
      }
    );
    const result = await importThemesFromGitHubRepo('owner/notheme');
    expect(result.success).toBe(false);
    expect(result.themes).toEqual([]);
  });
});
