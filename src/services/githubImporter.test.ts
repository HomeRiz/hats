import { describe, it, expect, vi, afterEach } from 'vitest';
import { importThemesFromGitHubRepo, parseGitHubRepoUrl } from './githubImporter';

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
});
