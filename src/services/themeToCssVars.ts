import * as yaml from 'js-yaml';
import { generateHomeAssistantThemeYaml } from './yamlGenerator';
import { ThemeConfig } from '../types/theme';

const LIGHT_BASE_VARS: Record<string, string> = {
  'primary-background-color': '#fafafa',
  'secondary-background-color': '#e5e5e5',
  'card-background-color': '#ffffff',
  'primary-text-color': '#212121',
  'secondary-text-color': '#727272',
  'disabled-text-color': '#bdbdbd',
  'divider-color': 'rgba(0, 0, 0, 0.12)',
  'primary-color': '#03a9f4',
  'accent-color': '#ff9800',
  'app-header-background-color': '#03a9f4',
  'app-header-text-color': '#ffffff',
  'mdc-theme-surface': '#ffffff',
  'mdc-theme-on-surface': '#212121',
  'mdc-theme-primary': '#03a9f4',
  'mdc-theme-on-primary': '#ffffff',
};

const LIGHT_TEXT_VARS: Record<string, string> = {
  'primary-text-color': '#000000',
  'secondary-text-color': 'rgba(0, 0, 0, 0.72)',
};

const LIGHT_THEME_THRESHOLD = 0.6;

function perceivedBrightness(color: string | undefined): number | null {
  if (!color) return null;
  const value = color.trim().toLowerCase();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  let channels: number[] | null = null;
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1];
    channels = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  } else {
    const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
    if (rgb) channels = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  if (!channels) return null;
  return (0.299 * channels[0] + 0.587 * channels[1] + 0.114 * channels[2]) / 255;
}

export function isLightTheme(theme: ThemeConfig): boolean {
  const brightness = perceivedBrightness(theme.dark?.primaryBackground);
  return brightness !== null && brightness > LIGHT_THEME_THRESHOLD;
}

export function themeToCssVars(
  theme: ThemeConfig,
  requestedMode?: 'dark' | 'light',
): { name: string; vars: Record<string, string> } {
  const mode = requestedMode ?? (isLightTheme(theme) ? 'light' : 'dark');
  const yamlText = generateHomeAssistantThemeYaml(theme, 'embedded');
  const parsed = yaml.load(yamlText) as Record<string, unknown>;
  const themeName = Object.keys(parsed)[0];
  const themeObj = (themeName ? parsed[themeName] : undefined) as Record<string, unknown> | undefined;
  if (!themeName || !themeObj) return { name: theme.name, vars: {} };

  const { modes, ...flat } = themeObj as { modes?: Record<string, Record<string, unknown>> } & Record<string, unknown>;
  const modeVars = modes?.[mode] ?? {};

  const vars: Record<string, string> = {};
  const base = mode === 'light' ? LIGHT_BASE_VARS : {};
  const text = mode === 'light' ? LIGHT_TEXT_VARS : {};
  for (const [key, value] of Object.entries({ ...base, ...flat, ...modeVars, ...text })) {
    if (typeof value === 'string') vars[key] = value;
  }
  return { name: themeName, vars };
}
