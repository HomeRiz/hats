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
