export interface PreviewRequest {
  repo: string;
  branch?: string;
  theme?: string;
}

const SLUG = /^[A-Za-z0-9._-]{1,100}\/[A-Za-z0-9._-]{1,100}$/;
const BRANCH = /^[A-Za-z0-9._\/-]{1,100}$/;
const ALLOWED_HOSTS = new Set(['github.com', 'raw.githubusercontent.com', 'gist.githubusercontent.com']);

function isAllowedRepo(value: string): boolean {
  if (SLUG.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function parsePreviewParams(search: string): PreviewRequest | null {
  const params = new URLSearchParams(search);
  const repo = params.get('repo')?.trim();
  if (!repo || !isAllowedRepo(repo)) return null;

  const request: PreviewRequest = { repo };
  const branch = params.get('branch')?.trim();
  if (branch && BRANCH.test(branch) && !branch.includes('..')) request.branch = branch;
  const theme = params.get('theme')?.trim();
  if (theme) request.theme = theme.slice(0, 100);
  return request;
}

export function pickRequestedTheme<T extends { id: string; name: string }>(themes: T[], requested?: string): T | undefined {
  if (!requested) return themes[0];
  const wanted = requested.toLowerCase();
  return themes.find((t) => t.name.toLowerCase() === wanted || t.id.toLowerCase() === wanted) ?? themes[0];
}

export function repoSlugFromInput(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (SLUG.test(text)) return text;
  const withScheme = /^[a-z]+:\/\//i.test(text) ? text : `https://${text}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null;
  const [owner, repo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) return null;
  const slug = `${owner}/${repo.replace(/\.git$/i, '')}`;
  return SLUG.test(slug) ? slug : null;
}

export function previewUrlForRepo(slug: string, location: { origin: string; pathname: string }): string {
  return `${location.origin}${location.pathname}?repo=${slug}`;
}
