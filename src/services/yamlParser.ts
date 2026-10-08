import { ThemeConfig } from '../types/theme';
import { defaultGlassTheme } from '../presets/defaultThemes';
import { validateAndSanitizeTheme } from './themeSecurityValidator';
import { extractPalette } from './colorEngine';
import { detectRequiresCardMod } from './themeRequirementDetector';
import { loadThemeYaml, readThemeColors, fallbackGradient, looksLikeTheme } from '../../server/themeValues.js';

function isValidImageUrl(url: string): boolean {
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('/local/')) return true;
  if (url.startsWith('/hacsfiles/')) return true;
  if (url.startsWith('./') || url.startsWith('../')) return true;
  if (url.length > 0 && url.charAt(0) !== '/' && !url.includes('://')) return true;
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg') || url.startsWith('data:image/png') || url.startsWith('data:image/webp') || url.startsWith('data:image/gif') || url.startsWith('data:image/svg')) return true;
  return false;
}

function extractImageUrl(str: string): string | undefined {
  if (!str || typeof str !== 'string') return undefined;
  const trimmed = str.trim();
  const urlStart = trimmed.indexOf('url(');
  if (urlStart === -1) {
    if (isValidImageUrl(trimmed)) return trimmed;
    return undefined;
  }
  const contentStart = urlStart + 4;
  const closeParen = trimmed.indexOf(')', contentStart);
  if (closeParen === -1) return undefined;
  let content = trimmed.slice(contentStart, closeParen).trim();
  if (content.startsWith('"') && content.endsWith('"')) content = content.slice(1, -1);
  else if (content.startsWith("'") && content.endsWith("'")) content = content.slice(1, -1);
  if (isValidImageUrl(content)) return content;
  return undefined;
}

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
      if (typeof bg === 'string' && bg.includes('data:image/svg')) {
        const svgStart = bg.indexOf('data:image/svg');
        if (svgStart !== -1) {
          const base64Start = bg.indexOf(';base64,', svgStart);
          if (base64Start !== -1) {
            const dataStart = base64Start + 8;
            const endQuote = bg.indexOf('"', dataStart);
            const endSingle = bg.indexOf("'", dataStart);
            const endParen = bg.indexOf(')', dataStart);

            let endIdx = -1;
            if (endQuote !== -1) endIdx = endQuote;
            if (endSingle !== -1 && (endIdx === -1 || endSingle < endIdx)) endIdx = endSingle;
            if (endParen !== -1 && (endIdx === -1 || endParen < endIdx)) endIdx = endParen;

            if (endIdx !== -1) {
              const b64Data = bg.slice(dataStart, endIdx);
              try {
                if (typeof window !== 'undefined' && typeof window.atob === 'function') {
                  customSvgOverlay = decodeURIComponent(escape(window.atob(b64Data)));
                } else if (typeof Buffer !== 'undefined') {
                  customSvgOverlay = Buffer.from(b64Data, 'base64').toString('utf-8');
                }
              } catch {}
            }
          }
        }
      }

      let bgUrl: string | undefined;
      let gradientString: string | undefined;

      const bgKeys = ['lovelace-background', 'background-image', 'primary-background-color'];
      for (const key of bgKeys) {
        const val = themeData[key];
        if (typeof val === 'string') {
          bgUrl = extractImageUrl(val);
          if (bgUrl) break;
        }
      }

      if (!bgUrl && themeData.modes && typeof themeData.modes === 'object') {
        for (const mode of Object.values(themeData.modes)) {
          if (mode && typeof mode === 'object') {
            const modeObj = mode as Record<string, any>;
            for (const key of bgKeys) {
              const val = modeObj[key];
              if (typeof val === 'string') {
                bgUrl = extractImageUrl(val);
                if (bgUrl) break;
              }
            }
            if (bgUrl) break;
          }
        }
      }

      if (typeof bg === 'string' && bg.includes('gradient')) {
        const gradStart = bg.indexOf('linear-gradient(');
        if (gradStart !== -1) {
          const closeParen = bg.indexOf(')', gradStart);
          if (closeParen !== -1) {
            gradientString = bg.slice(gradStart, closeParen + 1);
          }
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
          ...extractPalette(themeData, defaultGlassTheme.palette, 'dark'),
          primary,
          accent,
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
