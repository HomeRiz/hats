export const TARGET_REPO = 'HomeRiz/hats';

export function isPlausibleToken(token) {
  return typeof token === 'string' && /^[\w-]{20,255}$/.test(token.trim());
}
const THEMES_DIR = 'bundled/themes';
const BACKGROUNDS_DIR = 'www/hats/backgrounds';
const MAX_BACKGROUND_BYTES = 3 * 1024 * 1024;

class GitHubApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function friendlyError(status, apiMessage, step) {
  if (status === 401) return 'GitHub rejected the token. Check that it is correct and has not expired.';
  if (status === 403) {
    return `GitHub refused ${step}: the token is missing a permission (it needs "public_repo", or Contents and Pull requests write for a fine-grained token) or the rate limit was reached. (${apiMessage})`;
  }
  if (status === 404) {
    return `GitHub could not find the resource for ${step}. If ${TARGET_REPO} is private, a "public_repo" token cannot see it: use a token that has access to that repository.`;
  }
  if (status === 422) return `GitHub rejected ${step}: ${apiMessage}`;
  return `GitHub error ${status} while ${step}: ${apiMessage}`;
}

export async function submitThemePullRequest(params, options = {}) {
  const token = String(params.token || '').trim();
  const targetRepo = params.targetRepo || TARGET_REPO;
  const apiBase = options.apiBase || 'https://api.github.com';
  const doFetch = options.fetchImpl || fetch;
  const sleep = options.sleep || (ms => new Promise(res => setTimeout(res, ms)));
  const progress = msg => params.onProgress?.(msg);

  if (!token) return { success: false, error: 'No GitHub token is configured.' };
  if (!/^[\w-]{20,255}$/.test(token)) {
    return { success: false, error: 'That does not look like a GitHub token (unexpected characters or length).' };
  }
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(targetRepo)) return { success: false, error: 'Invalid target repository.' };
  if (typeof params.yamlContent !== 'string' || !params.yamlContent.trim()) {
    return { success: false, error: 'The theme YAML is empty.' };
  }

  const [owner, repo] = targetRepo.split('/');
  const themeId =
    String(params.themeId || params.themeName || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'theme';
  const themeName = String(params.themeName || themeId).slice(0, 100);

  const gh = async (method, path, body, step = 'contacting GitHub') => {
    const res = await doFetch(`${apiBase}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'hats-home-assistant-theme-store',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
    }
    if (!res.ok) {
      throw new GitHubApiError(friendlyError(res.status, String(data?.message || res.statusText || ''), step), res.status);
    }
    return data;
  };

  try {
    progress('Checking your GitHub token...');
    const me = await gh('GET', '/user', undefined, 'reading your account');
    const login = me.login;

    progress('Reading the HATS repository...');
    const upstream = await gh('GET', `/repos/${owner}/${repo}`, undefined, 'reading the HATS repository');
    const baseBranch = upstream.default_branch;
    const canPush = Boolean(upstream.permissions?.push);

    let headFullName = `${owner}/${repo}`;
    let headOwner = owner;
    if (!canPush) {
      progress('Forking the HATS repository...');
      const fork = await gh('POST', `/repos/${owner}/${repo}/forks`, { default_branch_only: true }, 'forking the repository');
      headFullName = fork.full_name;
      headOwner = fork.owner?.login || login;
      let ready = false;
      for (let attempt = 0; attempt < 15 && !ready; attempt++) {
        try {
          await gh('GET', `/repos/${headFullName}`, undefined, 'waiting for the fork');
          ready = true;
        } catch (e) {
          if (!(e instanceof GitHubApiError) || e.status !== 404) throw e;
          await sleep(2000);
        }
      }
      if (!ready) throw new GitHubApiError('The fork is taking too long to appear. Try again in a minute.', 504);
      try {
        await gh('POST', `/repos/${headFullName}/merge-upstream`, { branch: baseBranch }, 'syncing your fork');
      } catch {
      }
    }

    progress('Creating a branch...');
    const ref = await gh('GET', `/repos/${headFullName}/git/ref/heads/${encodeURIComponent(baseBranch)}`, undefined, 'reading the base branch');
    const branchName = `theme-${themeId}-${Date.now().toString(36)}`;
    await gh('POST', `/repos/${headFullName}/git/refs`, { ref: `refs/heads/${branchName}`, sha: ref.object.sha }, 'creating the branch');

    progress('Committing the theme...');
    const yamlPath = `${THEMES_DIR}/${themeId}.yaml`;
    let existingSha;
    try {
      const existing = await gh('GET', `/repos/${headFullName}/contents/${yamlPath}?ref=${encodeURIComponent(branchName)}`, undefined, 'checking for an existing theme');
      existingSha = existing.sha;
    } catch (e) {
      if (!(e instanceof GitHubApiError) || e.status !== 404) throw e;
    }
    await gh(
      'PUT',
      `/repos/${headFullName}/contents/${yamlPath}`,
      {
        message: `${existingSha ? 'Update' : 'Add'} theme: ${themeName}`,
        content: Buffer.from(params.yamlContent, 'utf8').toString('base64'),
        branch: branchName,
        ...(existingSha ? { sha: existingSha } : {}),
      },
      'committing the theme file'
    );

    const dataMatch = String(params.backgroundDataUrl || '').match(/^data:image\/[\w+.-]+;base64,([A-Za-z0-9+/=]+)$/);
    if (dataMatch) {
      if (Math.floor((dataMatch[1].length * 3) / 4) > MAX_BACKGROUND_BYTES) {
        throw new GitHubApiError('The wallpaper is larger than 3 MB. Re-upload a smaller image.', 413);
      }
      progress('Committing the wallpaper...');
      const imgPath = `${BACKGROUNDS_DIR}/${themeId}/default.webp`;
      let imgSha;
      try {
        const existingImg = await gh('GET', `/repos/${headFullName}/contents/${imgPath}?ref=${encodeURIComponent(branchName)}`, undefined, 'checking for an existing wallpaper');
        imgSha = existingImg.sha;
      } catch (e) {
        if (!(e instanceof GitHubApiError) || e.status !== 404) throw e;
      }
      await gh(
        'PUT',
        `/repos/${headFullName}/contents/${imgPath}`,
        {
          message: `${imgSha ? 'Update' : 'Add'} wallpaper: ${themeName}`,
          content: dataMatch[1],
          branch: branchName,
          ...(imgSha ? { sha: imgSha } : {}),
        },
        'committing the wallpaper'
      );
    }

    progress('Opening the pull request...');
    const title = String(params.title || `${existingSha ? 'Update' : 'Add new'} theme: ${themeName}`).slice(0, 200);
    const body = `${String(params.body || `Theme submission: ${themeName}\n\nAuthor: ${login}`).slice(0, 5000)}\n\n_Submitted with [HATS](https://github.com/HomeRiz/hats)_`;
    const pr = await gh(
      'POST',
      `/repos/${owner}/${repo}/pulls`,
      {
        title,
        body,
        head: canPush ? branchName : `${headOwner}:${branchName}`,
        base: baseBranch,
        maintainer_can_modify: true,
      },
      'opening the pull request'
    );

    return { success: true, prUrl: pr.html_url, prNumber: pr.number };
  } catch (err) {
    const message = err instanceof GitHubApiError ? err.message : `Could not reach GitHub: ${err?.message || 'network error'}`;
    return { success: false, error: message.split(token).join('***') };
  }
}
