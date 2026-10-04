import { ThemeConfig, RequiredIntegration } from '../types/theme';
import { parseHomeAssistantThemeYaml } from './yamlParser';
import { detectRequiredIntegrations } from './themeRequirementDetector';
import { parseRawThemes, createLocalAssetResolver, MAX_THEME_YAML_BYTES } from './rawThemePreview';

export interface GitHubImportResult {
  success: boolean;
  themes: ThemeConfig[];
  message: string;
  repoName?: string;
}

function rawYamlSource(url: string): { sourceUrl: string; owner?: string } {
  const match = url.match(/^https?:\/\/raw\.githubusercontent\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\//);
  return match ? { sourceUrl: `https://github.com/${match[1]}/${match[2]}`, owner: match[1] } : { sourceUrl: url };
}

function packMessage(count: number, source: string): string {
  return count > 1
    ? `Found a pack of ${count} themes in ${source}.`
    : `Found 1 theme in ${source}.`;
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

export interface ImportOptions {
  branch?: string;
  keepRaw?: boolean;
}

export async function importThemesFromGitHubRepo(repoInput: string, options: ImportOptions = {}): Promise<GitHubImportResult> {
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
        const { sourceUrl, owner } = rawYamlSource(repoInput.trim());
        for (const t of themes) {
          t.sourceUrl = sourceUrl;
          if (owner) t.authorGithub = owner;
        }
        return {
          success: true,
          themes,
          message: packMessage(themes.length, 'the YAML file'),
          repoName: owner ? sourceUrl.replace('https://github.com/', '') : 'Direct YAML Link',
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
  const ref = options.branch ?? parsed.branch ?? 'HEAD';
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;

  const collectThemes = async (
    paths: string[],
    requiredIntegrations: RequiredIntegration[],
    resolveAssets?: (data: Record<string, unknown>) => Record<string, unknown>,
  ): Promise<ThemeConfig[]> => {
    const collected: ThemeConfig[] = [];
    for (const filePath of paths.slice(0, 15)) {
      try {
        const rawRes = await fetch(`${rawBase}/${filePath.split('/').map(encodeURIComponent).join('/')}`);
        if (!rawRes.ok) continue;
        const yamlText = await rawRes.text();
        const rawThemes = options.keepRaw ? parseRawThemes(yamlText) : [];
        for (const t of parseHomeAssistantThemeYaml(yamlText)) {
          t.sourceUrl = `https://github.com/${owner}/${repo}`;
          t.authorGithub = owner;
          if (t.author === 'Unknown' || t.author === 'Community' || t.author === 'Imported') {
            t.author = owner;
          }
          if (requiredIntegrations.length > 0) {
            t.requirements = { ...t.requirements, requiresCardMod: t.requirements?.requiresCardMod ?? false, requiredIntegrations };
          }
          const raw = rawThemes.find((r) => r.name === t.name);
          if (raw) t.rawTheme = { source: `${owner}/${repo}`, data: resolveAssets ? resolveAssets(raw.data) : raw.data };
          collected.push(t);
        }
      } catch (fileErr) {
        console.warn(`Could not parse ${filePath}:`, fileErr);
      }
    }
    return collected;
  };

  const success = (themes: ThemeConfig[]): GitHubImportResult => ({
    success: true,
    themes,
    message: packMessage(themes.length, `"${owner}/${repo}"`),
    repoName: `${owner}/${repo}`,
  });

  try {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
    if (!treeRes.ok) {
      if (treeRes.status === 404) {
        return { success: false, themes: [], message: `Repository "${owner}/${repo}" was not found or is private.` };
      }
      if (treeRes.status === 403) {
        const guessed = await collectThemes([`themes/${repo}.yaml`, `themes/${repo}/${repo}.yaml`], []);
        if (guessed.length > 0) return success(guessed);
        return { success: false, themes: [], message: 'GitHub API rate limit reached. Try again later, or paste a direct raw YAML file link instead.' };
      }
      throw new Error(`GitHub API returned HTTP ${treeRes.status}`);
    }

    const treeData = await treeRes.json();
    const tree = treeData.tree || [];

    const yamlFiles = tree.filter((item: any) => {
      if (item.type !== 'blob') return false;
      if (typeof item.size === 'number' && item.size > MAX_THEME_YAML_BYTES) return false;
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

    const themeFolderFiles = yamlFiles.filter((item: any) => (item.path as string).toLowerCase().startsWith('themes/'));
    const candidates = themeFolderFiles.length > 0 ? themeFolderFiles : yamlFiles;

    const requiredIntegrations = detectRequiredIntegrations(
      tree.filter((item: any) => item.type === 'blob').map((item: any) => item.path)
    ).map((integration) => ({ ...integration, repoFullName: `${owner}/${repo}` }));

    const resolveAssets = options.keepRaw
      ? createLocalAssetResolver(
          tree.filter((item: any) => item.type === 'blob').map((item: any) => item.path as string),
          rawBase,
        )
      : undefined;
    const allImportedThemes = await collectThemes(
      candidates.map((item: any) => item.path as string),
      requiredIntegrations,
      resolveAssets,
    );

    if (allImportedThemes.length === 0) {
      return {
        success: false,
        themes: [],
        message: `Found ${yamlFiles.length} YAML file(s) in "${owner}/${repo}", but none contained valid Home Assistant theme definitions.`,
      };
    }

    return success(allImportedThemes);
  } catch (err: any) {
    return {
      success: false,
      themes: [],
      message: `Failed to import from GitHub: ${err.message || 'Unknown network error'}`,
    };
  }
}
