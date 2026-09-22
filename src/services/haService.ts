import { ThemeConfig } from '../types/theme';
import { generateHomeAssistantThemeYaml } from './yamlGenerator';

export interface HaStatusResult {
  isAddon: boolean;
  configDir: string;
  themesDir: string;
  themesExists: boolean;
  hasSupervisorToken: boolean;
}

export interface ApplyThemeResult {
  success: boolean;
  message: string;
  filePath?: string;
  reloaded?: boolean;
}

export async function checkHaAddonStatus(): Promise<HaStatusResult> {
  try {
    const res = await fetch('/api/ha/status');
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

export async function applyThemeDirectlyToHa(theme: ThemeConfig): Promise<ApplyThemeResult> {
  const yamlContent = generateHomeAssistantThemeYaml(theme, 'local');
  
  try {
    const res = await fetch('/api/ha/apply-theme', {
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
    const res = await fetch('/api/ha/reload-themes', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
