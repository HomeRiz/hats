import * as yaml from 'js-yaml';
import { generateHomeAssistantThemeYaml, fallbackBackgroundUrl } from './yamlGenerator';
import { resolveBundledPicture } from './bundledPicture';
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
const UNSAFE_RAW_VALUE = /javascript:|vbscript:|@import|expression\s*\(|<\s*\/?\s*(?:script|iframe|object|embed)|data:\s*(?:text\/html|image\/svg)/i;

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

function bundledPictureUrl(theme: ThemeConfig): string | null {
  return theme.background.type === 'image' ? resolveBundledPicture(theme.background.imageUrl) : null;
}

export function rawThemeToCssVars(
  name: string,
  data: Record<string, unknown>,
  mode: 'dark' | 'light',
): { name: string; vars: Record<string, string> } {
  const { modes, ...flat } = data as { modes?: Record<string, Record<string, unknown>> } & Record<string, unknown>;
  const modeVars = modes && typeof modes === 'object' ? modes[mode] ?? {} : {};
  const base = mode === 'light' ? LIGHT_BASE_VARS : {};
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...base, ...flat, ...modeVars })) {
    if (typeof value === 'string') {
      if (!UNSAFE_RAW_VALUE.test(value)) vars[key] = value;
    } else if (typeof value === 'number') vars[key] = String(value);
  }
  if (vars['background-image'] && !vars['lovelace-background']) vars['lovelace-background'] = vars['background-image'];
  if (vars['lovelace-background'] && !vars['background-image']) vars['background-image'] = vars['lovelace-background'];
  return { name, vars };
}

export function themeToCssVars(
  theme: ThemeConfig,
  requestedMode?: 'dark' | 'light',
): { name: string; vars: Record<string, string> } {
  if (theme.rawTheme) return rawThemeToCssVars(theme.name, theme.rawTheme.data, requestedMode ?? 'dark');
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
  const picture = bundledPictureUrl(theme);
  const placeholder = fallbackBackgroundUrl(theme.id);
  for (const [key, value] of Object.entries({ ...base, ...flat, ...modeVars, ...text })) {
    if (typeof value === 'string') vars[key] = picture ? value.split(placeholder).join(picture) : value;
  }
  return { name: themeName, vars };
}
