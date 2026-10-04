import { ThemeConfig } from '../types/theme';
import { defaultGlassTheme } from '../presets/defaultThemes';
import { validateAndSanitizeTheme } from './themeSecurityValidator';
import { detectRequiresCardMod } from './themeRequirementDetector';
import { loadThemeYaml, readThemeColors, fallbackGradient, looksLikeTheme } from '../../server/themeValues.js';

export function parseHomeAssistantThemeYaml(rawYaml: string): ThemeConfig[] {
  try {
    const doc = loadThemeYaml(rawYaml) as Record<string, any>;
    if (!doc || typeof doc !== 'object') {
      return [];
    }

    const themes: ThemeConfig[] = [];

    for (const [themeName, themeData] of Object.entries(doc)) {
      if (!looksLikeTheme(themeData)) continue;

      const colors = readThemeColors(themeData);
      const primary = colors.primary || '#0A84FF';
      const accent = colors.accent || primary;
      const bg = colors.background;
      
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

      if (!bgUrl && !gradientString) gradientString = fallbackGradient(colors);

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
          type: bgUrl ? 'image' : 'gradient',
          imageUrl: bgUrl,
          gradientString: gradientString || 'linear-gradient(140deg, #1b1030 0%, #0b0d14 55%, #12202e 100%)',
        },
        customSvgOverlay,
        dark: {
          primaryBackground: colors.dark.primaryBackground || defaultGlassTheme.dark.primaryBackground,
          secondaryBackground: colors.dark.secondaryBackground || defaultGlassTheme.dark.secondaryBackground,
          cardBackground: colors.dark.cardBackground || defaultGlassTheme.dark.cardBackground,
          textPrimary: colors.dark.textPrimary || defaultGlassTheme.dark.textPrimary,
          textSecondary: colors.dark.textSecondary || defaultGlassTheme.dark.textSecondary,
        },
        light: {
          primaryBackground: colors.light.primaryBackground || defaultGlassTheme.light.primaryBackground,
          secondaryBackground: colors.light.secondaryBackground || defaultGlassTheme.light.secondaryBackground,
          cardBackground: colors.light.cardBackground || defaultGlassTheme.light.cardBackground,
          textPrimary: colors.light.textPrimary || defaultGlassTheme.light.textPrimary,
          textSecondary: colors.light.textSecondary || defaultGlassTheme.light.textSecondary,
        },
        requirements: {
          requiresCardMod: detectRequiresCardMod(themeData),
          requiresThemesDirective: true,
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
