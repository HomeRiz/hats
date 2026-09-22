import yaml from 'js-yaml';
import { ThemeConfig } from '../types/theme';
import { defaultGlassTheme } from '../presets/defaultThemes';

export function parseHomeAssistantThemeYaml(rawYaml: string): ThemeConfig[] {
  try {
    const doc = yaml.load(rawYaml) as Record<string, any>;
    if (!doc || typeof doc !== 'object') {
      return [];
    }

    const themes: ThemeConfig[] = [];

    for (const [themeName, themeData] of Object.entries(doc)) {
      if (!themeData || typeof themeData !== 'object') continue;

      const primary = themeData['primary-color'] || themeData['accent-color'] || '#0A84FF';
      const bg = themeData['ultimate-background'] || '';
      
      let bgUrl: string | undefined;
      const urlMatch = bg.match(/url\(['"]?([^'")]+)['"]?\)/);
      if (urlMatch) {
        bgUrl = urlMatch[1];
      }

      const newTheme: ThemeConfig = {
        ...defaultGlassTheme,
        id: themeName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        name: themeName,
        category: 'Community',
        author: 'Imported',
        description: `Imported theme: ${themeName}`,
        isCustom: true,
        updatedAt: new Date().toISOString(),
        palette: {
          ...defaultGlassTheme.palette,
          primary: primary,
          accent: primary,
        },
        background: {
          ...defaultGlassTheme.background,
          type: bgUrl ? 'image' : 'gradient',
          imageUrl: bgUrl,
        }
      };

      themes.push(newTheme);
    }

    return themes;
  } catch (err) {
    console.error('Failed to parse YAML:', err);
    return [];
  }
}
