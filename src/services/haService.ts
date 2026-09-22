import { ThemeConfig } from '../types/theme';
import { generateHomeAssistantThemeYaml } from './yamlGenerator';

export interface HaStatusResult {
  isAddon: boolean;
  configDir: string;
  themesDir: string;
  themesExists: boolean;
  hasSupervisorToken: boolean;
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

function getApiUrl(apiPath: string): string {
  const clean = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
  if (typeof window !== 'undefined' && window.location) {
    const base = window.location.pathname.endsWith('/') 
      ? window.location.pathname 
      : `${window.location.pathname}/`;
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

export async function applyThemeDirectlyToHa(theme: ThemeConfig): Promise<ApplyThemeResult> {
  const yamlContent = generateHomeAssistantThemeYaml(theme, 'local');
  
  try {
    const res = await fetch(getApiUrl('api/ha/apply-theme'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themeId: theme.id,
        themeName: theme.name,
        yamlContent,
        backgroundDataUrl: theme.background.type === 'image' ? theme.background.imageUrl : undefined,
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
    const res = await fetch(getApiUrl('api/ha/reload-themes'), { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
