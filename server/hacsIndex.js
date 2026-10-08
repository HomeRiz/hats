import { loadThemeYaml, hasThemeSettings } from './themeValues.js';

export const HACS_THEME_DATA_URL = 'https://data-v2.hacs.xyz/theme/data.json';
export const MAX_THEME_YAML_BYTES = 4 * 1024 * 1024;
export const MAX_FILES_PER_REPO = 15;

const EXCLUDED_PATH = /hacs\.json|workflow|config\.yaml|build\.yaml|\.github\//i;

export function selectThemeFiles(tree) {
  const yamlFiles = tree.filter((item) => {
    if (item.type !== 'blob') return false;
    if (typeof item.size === 'number' && item.size > MAX_THEME_YAML_BYTES) return false;
    const path = String(item.path).toLowerCase();
    return (path.endsWith('.yaml') || path.endsWith('.yml')) && !EXCLUDED_PATH.test(path);
  });
  const inThemesFolder = yamlFiles.filter((item) => String(item.path).toLowerCase().startsWith('themes/'));
  const chosen = inThemesFolder.length > 0 ? inThemesFolder : yamlFiles;
  return chosen.map((item) => item.path).sort().slice(0, MAX_FILES_PER_REPO);
}

export function themeNamesInYaml(text) {
  if (typeof text !== 'string' || text.length > MAX_THEME_YAML_BYTES) return [];
  let parsed;
  try {
    parsed = loadThemeYaml(text);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  return Object.keys(parsed).filter((name) => hasThemeSettings(parsed[name]));
}

export function rawUrl(repo, ref, path) {
  return `https://raw.githubusercontent.com/${repo}/${ref}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

export async function indexRepo(entry, { fetchImpl, headers }) {
  const repo = entry.full_name;

  const repoRes = await fetchImpl(`https://api.github.com/repos/${repo}`, { headers });
  if (!repoRes.ok) return { repo, skipped: `repo HTTP ${repoRes.status}` };
  const repoData = await repoRes.json();

  const treeRes = await fetchImpl(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`, { headers });
  if (!treeRes.ok) return { repo, skipped: `tree HTTP ${treeRes.status}` };
  const treeData = await treeRes.json();
  const paths = selectThemeFiles(treeData.tree || []);
  const commit = entry.last_commit;
  if (!commit) return { repo, skipped: 'no commit in catalog' };

  const files = [];
  for (const path of paths) {
    const res = await fetchImpl(rawUrl(repo, commit, path));
    if (!res.ok) continue;
    const themes = themeNamesInYaml(await res.text());
    if (themes.length > 0) files.push({ path, themes });
  }
  if (files.length === 0) return { repo, skipped: 'no valid theme files' };

  return {
    repo,
    entry: {
      full_name: repo,
      default_branch: repoData.default_branch || 'main',
      license: repoData.license?.spdx_id || null,
      stars: repoData.stargazers_count ?? 0,
      pushed_at: repoData.pushed_at || null,
      files,
    },
  };
}

export async function buildHacsIndex({ catalog, fetchImpl = fetch, token, concurrency = 6, now = () => new Date() }) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'hats-hacs-index' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const repos = Object.values(catalog).filter((entry) => entry && entry.full_name);
  const results = await mapLimit(repos, concurrency, async (entry) => {
    try {
      return await indexRepo(entry, { fetchImpl, headers });
    } catch (err) {
      return { repo: entry.full_name, skipped: err.message };
    }
  });

  const themes = results.filter((r) => r.entry).map((r) => r.entry).sort((a, b) => a.full_name.localeCompare(b.full_name));
  const skipped = results.filter((r) => r.skipped).map((r) => ({ repo: r.repo, reason: r.skipped }));
  return { version: 1, generatedAt: now().toISOString(), source: HACS_THEME_DATA_URL, themes, skipped };
}
