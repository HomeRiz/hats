import * as yaml from 'js-yaml';
import { generateHomeAssistantThemeYaml } from './yamlGenerator';
import { ThemeConfig } from '../types/theme';

export function themeToCssVars(
  theme: ThemeConfig,
  mode: 'dark' | 'light' = 'dark',
): { name: string; vars: Record<string, string> } {
  const yamlText = generateHomeAssistantThemeYaml(theme, 'embedded');
  const parsed = yaml.load(yamlText) as Record<string, unknown>;
  const themeName = Object.keys(parsed)[0];
  const themeObj = (themeName ? parsed[themeName] : undefined) as Record<string, unknown> | undefined;
  if (!themeName || !themeObj) return { name: theme.name, vars: {} };

  const { modes, ...flat } = themeObj as { modes?: Record<string, Record<string, unknown>> } & Record<string, unknown>;
  const modeVars = modes?.[mode] ?? {};

  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...flat, ...modeVars })) {
    if (typeof value === 'string') vars[key] = value;
  }
  return { name: themeName, vars };
}
