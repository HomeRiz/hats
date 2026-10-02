import { ThemeConfig } from '../types/theme';
import { generateHomeAssistantThemeYaml } from './yamlGenerator';
import { validateAndSanitizeTheme } from './themeSecurityValidator';
import { processBackgroundImage } from './imageProcessor';
import { resolveBundledPicture } from './bundledPicture';

export interface HaStatusResult {
  isAddon: boolean;
  configDir: string;
  themesDir: string;
  themesExists: boolean;
  hasSupervisorToken: boolean;
  autoReloadThemes?: boolean;
}

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  canAutoFix: boolean;
}

export interface DiagnosticsResult {
  configExists: boolean;
  hasFrontend: boolean;
  hasThemesDirective: boolean;
  hasCardMod: boolean;
  cardModOnDisk: boolean;
  cardModHacstag: string;
  cardModExactUrl?: string;
  hasCardModInConfig: boolean;
  hasCardModInResources: boolean;
  cardModNeedsConfig: boolean;
  hasHacs: boolean;
  themesExists: boolean;
  themesCount: number;
  themesDir: string;
  detectedCards: string[];
  issues: DiagnosticIssue[];
  readyForThemes: boolean;
  readyForGlassmorphism: boolean;
}

export interface FixConfigResult {
  success: boolean;
  message: string;
  reloaded?: boolean;
}

export interface ApplyThemeResult {
  success: boolean;
  message: string;
  filePath?: string;
  reloaded?: boolean;
}

const MUTATING_HEADERS = { 'X-HATS-Request': '1' };

export function getApiUrl(apiPath: string): string {
  const clean = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
  if (typeof window !== 'undefined' && window.location) {
    let base = window.location.pathname.replace(/\/index\.html$/, '');
    base = base.endsWith('/') ? base : `${base}/`;
    return `${base}${clean}`;
  }
  return `/${clean}`;
}

export async function checkHaAddonStatus(): Promise<HaStatusResult> {
  try {
    const res = await fetch(getApiUrl('api/ha/status'));
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('HA Add-on API not reachable (running standalone):', err);
  }

  return {
    isAddon: false,
    configDir: '/config',
    themesDir: '/config/themes',
    themesExists: false,
    hasSupervisorToken: false,
  };
}

export async function getHaDiagnostics(): Promise<DiagnosticsResult | null> {
  try {
    const res = await fetch(getApiUrl('api/ha/diagnostics'));
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.debug('Failed to get diagnostics:', err);
  }
  return null;
}

export async function fixHaConfiguration(options: { addThemes?: boolean; addCardMod?: boolean; hacstag?: string; exactUrl?: string } = {}): Promise<FixConfigResult> {
  try {
    const res = await fetch(getApiUrl('api/ha/fix-config'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...MUTATING_HEADERS,
      },
      body: JSON.stringify(options),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to auto-fix configuration.yaml',
    };
  }
}

export async function embedBundledBackground(theme: ThemeConfig): Promise<ThemeConfig> {
  const { type, imageUrl, darken } = theme.background;
  if (type !== 'image') return theme;
  const picture = resolveBundledPicture(imageUrl);
  if (!picture) return theme;
  const processed = await processBackgroundImage(picture, 1920, 1080, darken);
  return { ...theme, background: { ...theme.background, imageUrl: processed.dataUrl, avgColor: processed.avgColor } };
}

export async function applyThemeDirectlyToHa(sourceTheme: ThemeConfig): Promise<ApplyThemeResult> {
  const theme = await embedBundledBackground(sourceTheme);
  const yamlContent = generateHomeAssistantThemeYaml(theme, 'local');
  const uploadedImage =
    theme.background.type === 'image' && theme.background.imageUrl?.startsWith('data:image/') ? theme.background.imageUrl : undefined;
  const themeMeta: ThemeConfig = {
    ...theme,
    background: { ...theme.background, imageUrl: uploadedImage ? undefined : theme.background.imageUrl },
  };

  try {
    const res = await fetch(getApiUrl('api/ha/apply-theme'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...MUTATING_HEADERS,
      },
      body: JSON.stringify({
        themeId: theme.id,
        themeName: theme.name,
        yamlContent,
        backgroundDataUrl: uploadedImage,
        themeMeta,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || `Theme '${theme.name}' installed and reloaded in Home Assistant!`,
        filePath: data.filePath,
        reloaded: data.reloaded,
      };
    } else {
      const errorData = await res.json();
      return {
        success: false,
        message: errorData.error || 'Failed to write theme to Home Assistant',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Could not connect to Home Assistant Add-on backend',
    };
  }
}

export async function reloadHomeAssistantThemes(): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl('api/ha/reload-themes'), { method: 'POST', headers: MUTATING_HEADERS });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchInstalledHaThemes(): Promise<ThemeConfig[]> {
  try {
    const res = await fetch(getApiUrl('api/ha/installed-themes'));
    if (res.ok) {
      const data = await res.json();
      return ((data.themes || []) as ThemeConfig[]).map(t => validateAndSanitizeTheme(t).sanitizedTheme);
    }
    return [];
  } catch (err) {
    console.warn('Could not fetch installed themes from Home Assistant:', err);
    return [];
  }
}

export async function deleteHaTheme(themeId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`api/ha/theme/${encodeURIComponent(themeId)}`), { method: 'DELETE', headers: MUTATING_HEADERS });
    return res.ok;
  } catch {
    return false;
  }
}

export async function repairAllHaThemes(): Promise<{ success: boolean; total: number; repairedCount: number; repairedFiles?: string[]; message: string }> {
  try {
    const res = await fetch(getApiUrl('api/ha/repair-all-themes'), { method: 'POST', headers: MUTATING_HEADERS });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json();
    return {
      success: false,
      total: 0,
      repairedCount: 0,
      message: errData.error || 'Failed to repair themes',
    };
  } catch (err: any) {
    return {
      success: false,
      total: 0,
      repairedCount: 0,
      message: err.message || 'Could not connect to HATS repair endpoint',
    };
  }
}

export async function restartHomeAssistant(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(getApiUrl('api/ha/restart'), { method: 'POST', headers: MUTATING_HEADERS });
    const data = await res.json();
    return {
      success: res.ok,
      message: data.message || (res.ok ? 'Home Assistant is restarting...' : 'Failed to restart Home Assistant'),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Could not send restart request to Home Assistant',
    };
  }
}


export interface GithubStatus {
  tokenConfigured: boolean;
  targetRepo: string;
  canSaveToken: boolean;
}

export async function getGithubStatus(): Promise<GithubStatus> {
  try {
    const res = await fetch(getApiUrl('api/github/status'));
    if (res.ok) return await res.json();
  } catch {
  }
  return { tokenConfigured: false, targetRepo: 'HomeRiz/hats', canSaveToken: false };
}

export async function saveGithubToken(token: string): Promise<{ success: boolean; restarting?: boolean; error?: string }> {
  try {
    const res = await fetch(getApiUrl('api/github/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...MUTATING_HEADERS },
      body: JSON.stringify({ token }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not reach the HATS add-on' };
  }
}

export async function waitForAddonBackUp(timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(getApiUrl('api/ha/status'));
      if (res.ok) return true;
    } catch {
    }
  }
  return false;
}

export interface SubmitPrResult {
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  error?: string;
}

export async function submitThemeViaServer(
  theme: ThemeConfig,
  options: { title?: string; body?: string; token?: string }
): Promise<SubmitPrResult> {
  const uploaded =
    theme.background.type === 'image' && theme.background.imageUrl?.startsWith('data:image/') ? theme.background.imageUrl : undefined;
  try {
    const res = await fetch(getApiUrl('api/github/submit-pr'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...MUTATING_HEADERS },
      body: JSON.stringify({
        themeId: theme.id,
        themeName: theme.name,
        yamlContent: generateHomeAssistantThemeYaml(theme, 'cdn'),
        backgroundDataUrl: uploaded,
        title: options.title,
        body: options.body,
        token: options.token || undefined,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not reach the HATS add-on' };
  }
}
