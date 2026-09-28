import { ThemeConfig } from '../types/theme';
import { parseHomeAssistantThemeYaml } from './yamlParser';
import { detectRequiredIntegrations } from './themeRequirementDetector';

export interface GitHubImportResult {
  success: boolean;
  themes: ThemeConfig[];
  message: string;
  repoName?: string;
}

export function parseGitHubRepoUrl(urlOrSlug: string): { owner: string; repo: string; branch?: string } | null {
  const cleaned = urlOrSlug.trim().replace(/\/$/, '');
  
  const slugMatch = cleaned.match(/^([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/);
  if (slugMatch) {
    return { owner: slugMatch[1], repo: slugMatch[2] };
  }

  const urlMatch = cleaned.match(/^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)(?:\/tree\/([a-zA-Z0-9._-]+))?/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2], branch: urlMatch[3] };
  }

  return null;
}

export async function importThemesFromGitHubRepo(repoInput: string): Promise<GitHubImportResult> {
  const parsed = parseGitHubRepoUrl(repoInput);
  if (!parsed) {
    if (repoInput.trim().startsWith('http') && (repoInput.endsWith('.yaml') || repoInput.endsWith('.yml'))) {
      try {
        const res = await fetch(repoInput.trim());
        if (!res.ok) throw new Error(`HTTP ${res.status} when fetching YAML`);
        const text = await res.text();
        const themes = parseHomeAssistantThemeYaml(text);
        if (themes.length === 0) {
          return { success: false, themes: [], message: 'No valid Home Assistant themes found in the provided YAML file.' };
        }
        return {
          success: true,
          themes,
          message: `Successfully imported ${themes.length} theme(s) from raw YAML URL!`,
          repoName: 'Direct YAML Link',
        };
      } catch (err: any) {
        return { success: false, themes: [], message: `Failed to fetch YAML: ${err.message}` };
      }
    }

    return {
      success: false,
      themes: [],
      message: 'Invalid repository format. Please enter "owner/repo" (e.g. "mattschwarz/tet-49-theme") or a valid GitHub URL.',
    };
  }

  const { owner, repo } = parsed;

  try {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
    if (!treeRes.ok) {
      if (treeRes.status === 404) {
        return { success: false, themes: [], message: `Repository "${owner}/${repo}" was not found or is private.` };
      }
      if (treeRes.status === 403) {
        return { success: false, themes: [], message: 'GitHub API rate limit reached. Try pasting a direct raw YAML file link instead.' };
      }
      throw new Error(`GitHub API returned HTTP ${treeRes.status}`);
    }

    const treeData = await treeRes.json();
    const tree = treeData.tree || [];

    const yamlFiles = tree.filter((item: any) => {
      if (item.type !== 'blob') return false;
      const path = (item.path as string).toLowerCase();
      return (
        (path.endsWith('.yaml') || path.endsWith('.yml')) &&
        !path.includes('hacs.json') &&
        !path.includes('workflow') &&
        !path.includes('config.yaml') &&
        !path.includes('build.yaml')
      );
    });

    if (yamlFiles.length === 0) {
      return {
        success: false,
        themes: [],
        message: `No theme YAML files found in repository "${owner}/${repo}".`,
      };
    }

    const requiredIntegrations = detectRequiredIntegrations(
      tree.filter((item: any) => item.type === 'blob').map((item: any) => item.path)
    ).map((integration) => ({ ...integration, repoFullName: `${owner}/${repo}` }));

    const allImportedThemes: ThemeConfig[] = [];
    const filesToFetch = yamlFiles.slice(0, 15);

    for (const file of filesToFetch) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`;
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) {
          const yamlText = await rawRes.text();
          const parsedThemes = parseHomeAssistantThemeYaml(yamlText);
          for (const t of parsedThemes) {
            if (t.author === 'Unknown' || t.author === 'Community') {
              t.author = owner;
            }
            if (requiredIntegrations.length > 0) {
              t.requirements = { ...t.requirements, requiresCardMod: t.requirements?.requiresCardMod ?? false, requiredIntegrations };
            }
            allImportedThemes.push(t);
          }
        }
      } catch (fileErr) {
        console.warn(`Could not parse ${file.path}:`, fileErr);
      }
    }

    if (allImportedThemes.length === 0) {
      return {
        success: false,
        themes: [],
        message: `Found ${yamlFiles.length} YAML file(s) in "${owner}/${repo}", but none contained valid Home Assistant theme definitions.`,
      };
    }

    return {
      success: true,
      themes: allImportedThemes,
      message: `Successfully imported ${allImportedThemes.length} theme(s) from "${owner}/${repo}"!`,
      repoName: `${owner}/${repo}`,
    };
  } catch (err: any) {
    return {
      success: false,
      themes: [],
      message: `Failed to import from GitHub: ${err.message || 'Unknown network error'}`,
    };
  }
}
