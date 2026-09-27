import * as yaml from 'js-yaml';
import { ThemeConfig } from '../types/theme';
import { defaultGlassTheme } from '../presets/defaultThemes';
import { validateAndSanitizeTheme } from './themeSecurityValidator';

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
      const accent = themeData['accent-color'] || primary;
      const bg = themeData['hats-background'] || themeData['ultimate-background'] || themeData['background-image'] || themeData['lovelace-background'] || '';
      
      let customSvgOverlay: string | undefined;
      const b64SvgMatch = typeof bg === 'string' ? bg.match(/url\(['"]data:image\/svg\+xml;base64,([^'"]+)['"]\)/) : null;
      if (b64SvgMatch) {
        try {
          if (typeof window !== 'undefined' && typeof window.atob === 'function') {
            customSvgOverlay = decodeURIComponent(escape(window.atob(b64SvgMatch[1])));
          } else if (typeof Buffer !== 'undefined') {
            customSvgOverlay = Buffer.from(b64SvgMatch[1], 'base64').toString('utf-8');
          }
        } catch {}
      }

      let bgUrl: string | undefined;
      let gradientString: string | undefined;
      if (typeof bg === 'string') {
        if (bg.includes('http') || bg.includes('/local/')) {
          const urlMatch = bg.match(/url\(['"]?(http[^'"]+|\/local\/[^'"]+)['"]?\)/);
          if (urlMatch) bgUrl = urlMatch[1];
        } else if (bg.includes('gradient')) {
          const gradMatch = bg.match(/linear-gradient\([^)]+\)/);
          if (gradMatch) gradientString = gradMatch[0];
        }
      }

      const category = /kids/i.test(themeName) ? 'Kids'
        : /neon/i.test(themeName) ? 'Neon'
        : /velvet/i.test(themeName) ? 'Velvet'
        : /cyber/i.test(themeName) ? 'SciFi'
        : /aurora|nature|forest/i.test(themeName) ? 'Nature'
        : /glass/i.test(themeName) ? 'Glass'
        : 'Community';

      const newTheme: ThemeConfig = {
        ...defaultGlassTheme,
        id: themeName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        name: themeName,
        category: category as any,
        author: 'Imported',
        description: `Imported theme: ${themeName}`,
        isCustom: true,
        updatedAt: new Date().toISOString(),
        palette: {
          ...defaultGlassTheme.palette,
          primary,
          accent,
          purple: themeData['purple-color'] || defaultGlassTheme.palette.purple,
          pink: themeData['pink-color'] || defaultGlassTheme.palette.pink,
          red: themeData['red-color'] || defaultGlassTheme.palette.red,
          indigo: themeData['indigo-color'] || defaultGlassTheme.palette.indigo,
          blue: themeData['blue-color'] || defaultGlassTheme.palette.blue,
          lightBlue: themeData['light-blue-color'] || defaultGlassTheme.palette.lightBlue,
          cyan: themeData['cyan-color'] || defaultGlassTheme.palette.cyan,
          teal: themeData['teal-color'] || defaultGlassTheme.palette.teal,
          green: themeData['green-color'] || defaultGlassTheme.palette.green,
          yellow: themeData['yellow-color'] || defaultGlassTheme.palette.yellow,
          orange: themeData['orange-color'] || defaultGlassTheme.palette.orange,
          brown: themeData['brown-color'] || defaultGlassTheme.palette.brown,
          grey: themeData['grey-color'] || defaultGlassTheme.palette.grey,
        },
        engine: {
          ...defaultGlassTheme.engine,
          engineType: category === 'Kids' ? 'kids' : category === 'Neon' ? 'neon' : category === 'Velvet' ? 'velvet' : 'glass',
          blurAmount: parseInt(themeData['ha-card-backdrop-filter']?.match(/blur\((\d+)px\)/)?.[1] || `${defaultGlassTheme.engine.blurAmount}`, 10),
          saturateAmount: parseFloat(themeData['ha-card-backdrop-filter']?.match(/saturate\(([\d.]+)\)/)?.[1] || `${defaultGlassTheme.engine.saturateAmount}`),
          cardRadius: parseInt(themeData['ha-card-border-radius'] || `${defaultGlassTheme.engine.cardRadius}`, 10),
          badgeRadius: parseInt(themeData['ha-badge-border-radius'] || `${defaultGlassTheme.engine.badgeRadius}`, 10),
          mushRadius: parseInt(themeData['mush-icon-border-radius'] || `${defaultGlassTheme.engine.mushRadius}`, 10),
          borderWidth: parseInt(themeData['ha-card-border-width'] || `${defaultGlassTheme.engine.borderWidth}`, 10),
          borderColor: themeData['ha-card-border-color'] || defaultGlassTheme.engine.borderColor,
          glassTint: themeData['ha-card-glass-tint'] || defaultGlassTheme.engine.glassTint,
          insetShadow: themeData['ha-card-glass-inset-shadow'] || themeData['ha-card-box-shadow'] || defaultGlassTheme.engine.insetShadow,
          hoverGlow: Boolean(themeData['hats-glow-color'] || themeData['ultimate-glow-color']),
          glowColor: themeData['hats-glow-color'] || themeData['ultimate-glow-color'] || primary,
        },
        background: {
          ...defaultGlassTheme.background,
          type: bgUrl ? 'image' : (gradientString ? 'gradient' : defaultGlassTheme.background.type),
          imageUrl: bgUrl,
          gradientString: gradientString || defaultGlassTheme.background.gradientString,
        },
        customSvgOverlay,
        dark: {
          primaryBackground: themeData.modes?.dark?.['primary-background-color'] || defaultGlassTheme.dark.primaryBackground,
          secondaryBackground: themeData.modes?.dark?.['secondary-background-color'] || defaultGlassTheme.dark.secondaryBackground,
          cardBackground: themeData.modes?.dark?.['ha-card-background'] || defaultGlassTheme.dark.cardBackground,
          textPrimary: themeData.modes?.dark?.['primary-text-color'] || defaultGlassTheme.dark.textPrimary,
          textSecondary: themeData.modes?.dark?.['secondary-text-color'] || defaultGlassTheme.dark.textSecondary,
        },
        light: {
          primaryBackground: themeData.modes?.light?.['primary-background-color'] || defaultGlassTheme.light.primaryBackground,
          secondaryBackground: themeData.modes?.light?.['secondary-background-color'] || defaultGlassTheme.light.secondaryBackground,
          cardBackground: themeData.modes?.light?.['ha-card-background'] || defaultGlassTheme.light.cardBackground,
          textPrimary: themeData.modes?.light?.['primary-text-color'] || defaultGlassTheme.light.textPrimary,
          textSecondary: themeData.modes?.light?.['secondary-text-color'] || defaultGlassTheme.light.textSecondary,
        },
        requirements: {
          requiresCardMod: Boolean(themeData['card-mod-theme'] || themeData['card-mod-root'] || themeData['card-mod-card']),
          requiresThemesDirective: true,
          recommendedCards: defaultGlassTheme.requirements?.recommendedCards,
        },
      };

      const validated = validateAndSanitizeTheme(newTheme);
      themes.push(validated.sanitizedTheme);
    }

    return themes;
  } catch (err) {
    console.error('Failed to parse YAML:', err);
    return [];
  }
}
