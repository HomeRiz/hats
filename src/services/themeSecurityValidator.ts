import DOMPurify from 'dompurify';
import { ThemeConfig } from '../types/theme';
import { normalizeHex } from './colorEngine';

export interface ValidationReport {
  safe: boolean;
  warnings: string[];
  sanitizedTheme: ThemeConfig;
}

export function sanitizeThemeCss(rawCss: string): string {
  if (!rawCss || typeof rawCss !== 'string') return '';
  let css = rawCss;

  for (let pass = 0; pass < 8; pass++) {
    const before = css;
    css = css.replace(/<\s*\/?\s*(?:script|style|iframe|object|embed)[^>]*>/gi, '');
    css = css.replace(/javascript\s*:/gi, '');
    css = css.replace(/expression\s*\([^)]*\)/gi, '');
    css = css.replace(/behavior\s*:[^;}]*/gi, '');
    css = css.replace(/-moz-binding\s*:[^;}]*/gi, '');
    css = css.replace(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g, '');
    css = css.replace(/@import[^;]*;?/gi, '');
    css = css.replace(/url\(\s*['"]?\s*(?:https?:)?\/\/[^)]*\)/gi, 'none');
    if (css === before) break;
  }
  css = css.replace(/\{\{|\{%|\{#/g, '');

  css = css.replace(/(:(?:host|ha-sidebar|ha-app-layout|hui-view|ha-card)[^{}]*::(?:before|after)\s*\{[^}]*?position\s*:\s*fixed[^}]*?\})/gi, (block) => {
    if (!/pointer-events\s*:\s*none/i.test(block)) {
      return block.replace(/\}$/, '  pointer-events: none !important;\n}');
    }
    return block;
  });

  css = css.replace(/(\*|\.backdrop|\.overlay|::before|::after)\s*\{([^}]*?position\s*:\s*(?:fixed|absolute)[^}]*?)\}/gi, (match, selector, body) => {
    if (!/pointer-events/i.test(body)) {
      return `${selector} {${body} pointer-events: none !important; }`;
    }
    return match;
  });

  return css;
}

let svgPurifier: ReturnType<typeof DOMPurify> | null = null;

function getSvgPurifier(): ReturnType<typeof DOMPurify> | null {
  if (svgPurifier) return svgPurifier;
  if (typeof window === 'undefined') return null;
  const purifier = DOMPurify(window);
  if (!purifier.isSupported) return null;
  purifier.addHook('afterSanitizeAttributes', (node) => {
    for (const attr of ['href', 'xlink:href']) {
      const value = node.getAttribute?.(attr);
      if (value !== null && value !== undefined && !value.trim().startsWith('#')) node.removeAttribute(attr);
    }
    const style = node.getAttribute?.('style');
    if (style && /url\s*\(|expression|@import|javascript:/i.test(style)) node.removeAttribute('style');
  });
  svgPurifier = purifier;
  return purifier;
}

export function sanitizeSvgCode(rawSvg: string): { valid: boolean; sanitized: string; error?: string } {
  if (!rawSvg || typeof rawSvg !== 'string') {
    return { valid: true, sanitized: '' };
  }

  let cleaned = rawSvg.trim();
  if (!cleaned.includes('xmlns=')) {
    cleaned = cleaned.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (typeof DOMParser === 'undefined') {
    return { valid: false, sanitized: '', error: 'No DOM available to sanitize SVG safely' };
  }
  try {
    const doc = new DOMParser().parseFromString(cleaned, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        valid: false,
        sanitized: '',
        error: `SVG syntax error: ${parserError.textContent?.slice(0, 100) || 'Malformed XML'}`,
      };
    }
  } catch (e: any) {
    return { valid: false, sanitized: '', error: `Could not parse SVG: ${e.message}` };
  }

  const purifier = getSvgPurifier();
  if (!purifier) {
    return { valid: false, sanitized: '', error: 'SVG sanitizer unavailable' };
  }
  const safe = String(
    purifier.sanitize(cleaned, {
      USE_PROFILES: { svg: true },
      FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'style', 'a', 'image', 'feImage', 'set', 'animate', 'animateMotion'],
      ALLOW_DATA_ATTR: false,
    })
  ).trim();

  if (!safe.startsWith('<svg')) {
    return { valid: false, sanitized: '', error: 'SVG contained no safe <svg> content' };
  }
  return { valid: true, sanitized: safe };
}


const SAFE_COLOR = /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([0-9.,%\s/-]{1,60}\)|[a-z]{3,20})$/i;
const SAFE_CSS_VALUE = /^[a-z0-9#%.,()\s/+*-]{0,300}$/i;
const SAFE_IMAGE_URL = /^(?:\/local\/[\w./-]{1,200}|\/hacsfiles\/[\w./-]{1,200}|https?:\/\/[\w.-]{1,100}\/[\w./%~+@-]{0,300}|data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]{1,700000})$/;

function safeColor(v: unknown, fallback: string): string {
  const t = typeof v === 'string' ? v.trim() : '';
  return SAFE_COLOR.test(t) ? t : fallback;
}

function safeCssValue(v: unknown, fallback: string): string {
  const t = typeof v === 'string' ? v.trim() : '';
  if (!SAFE_CSS_VALUE.test(t) || /url\s*\(|expression|import/i.test(t)) return fallback;
  return t;
}

function safeName(v: unknown, fallback: string): string {
  const t = String(v ?? '').replace(/[^\w .()-]/g, '').trim().slice(0, 64);
  return t || fallback;
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeThemeFields(t: ThemeConfig): void {
  t.name = safeName(t.name, 'Theme');
  t.id = String(t.id ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'theme';
  t.palette = t.palette || ({} as typeof t.palette);
  const paletteKeys = new Set<string>([
    'primary', 'accent', 'purple', 'pink', 'red', 'indigo', 'blue', 'lightBlue', 'cyan', 'teal', 'green', 'yellow', 'orange', 'brown', 'grey',
    ...Object.keys(t.palette),
  ]);
  for (const k of paletteKeys as Set<keyof typeof t.palette>) {
    (t.palette as any)[k] = normalizeHex((t.palette as any)[k]) ?? (k === 'primary' || k === 'accent' ? '#0A84FF' : '#808080');
  }
  if (t.engine) {
    const e = t.engine as any;
    e.borderColor = safeCssValue(e.borderColor, 'rgba(255, 255, 255, 0.18)');
    e.glassTint = safeCssValue(e.glassTint, 'rgba(255, 255, 255, 0.06)');
    e.glowColor = safeCssValue(e.glowColor, '#0A84FF');
    e.insetShadow = safeCssValue(e.insetShadow, 'none');
    e.backgroundScrim = safeCssValue(e.backgroundScrim, 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.30) 100%)');
    if (e.fallbackCardBg !== undefined) e.fallbackCardBg = safeCssValue(e.fallbackCardBg, 'rgba(40, 42, 52, 0.86)');
    e.saturateAmount = Math.max(0, Math.min(4, num(e.saturateAmount, 1.4)));
    e.sheenAngle = Math.max(0, Math.min(360, num(e.sheenAngle, 160)));
    e.hoverGlowIntensity = Math.max(0, Math.min(80, num(e.hoverGlowIntensity, 24)));
    e.sheenOpacity = Math.max(0, Math.min(1, num(e.sheenOpacity, 0.2)));
    e.blurAmount = num(e.blurAmount, 16);
    e.cardRadius = num(e.cardRadius, 24);
    e.borderWidth = num(e.borderWidth, 0);
  }
  if (t.background) {
    const b = t.background as any;
    if (b.gradientString !== undefined) b.gradientString = safeCssValue(b.gradientString, 'linear-gradient(140deg, #1b1030 0%, #0b0d14 100%)');
    if (b.solidColor !== undefined) b.solidColor = safeColor(b.solidColor, '#0b0d14');
    if (b.headerTintColor !== undefined) b.headerTintColor = safeColor(b.headerTintColor, '#1a1428');
    if (b.avgColor !== undefined) b.avgColor = safeColor(b.avgColor, '#1a1428');
    if (b.imageUrl !== undefined && !b.imageUrl.startsWith?.('data:image/') && !SAFE_IMAGE_URL.test(b.imageUrl)) b.imageUrl = undefined;
    if (b.imageFileName !== undefined) b.imageFileName = String(b.imageFileName).replace(/[^\w.-]/g, '_').slice(0, 80);
  }
  for (const mode of [t.dark, t.light] as any[]) {
    if (!mode) continue;
    for (const k of Object.keys(mode)) mode[k] = safeCssValue(mode[k], 'rgba(0, 0, 0, 0.26)');
  }
}

export function validateAndSanitizeTheme(theme: ThemeConfig): ValidationReport {
  const warnings: string[] = [];
  const sanitized: ThemeConfig = JSON.parse(JSON.stringify(theme));
  const original = JSON.stringify(sanitized);
  sanitizeThemeFields(sanitized);
  if (JSON.stringify(sanitized) !== original) warnings.push('Some theme fields contained unsafe characters and were reset to safe values.');

  if (sanitized.customCss) {
    const safeCss = sanitizeThemeCss(sanitized.customCss);
    if (safeCss !== sanitized.customCss) {
      warnings.push('Custom CSS contained potentially unsafe or click-intercepting properties and was auto-sanitized.');
      sanitized.customCss = safeCss;
    }
  }

  if (sanitized.customSvgOverlay) {
    const { valid, sanitized: safeSvg, error } = sanitizeSvgCode(sanitized.customSvgOverlay);
    if (!valid) {
      warnings.push(`Custom SVG Overlay was invalid (${error}) and was removed.`);
      sanitized.customSvgOverlay = undefined;
    } else {
      sanitized.customSvgOverlay = safeSvg;
    }
  }

  if (sanitized.engine) {
    sanitized.engine.cardRadius = Math.max(0, Math.min(64, sanitized.engine.cardRadius ?? 24));
    sanitized.engine.blurAmount = Math.max(0, Math.min(48, sanitized.engine.blurAmount ?? 16));
    sanitized.engine.borderWidth = Math.max(0, Math.min(10, sanitized.engine.borderWidth ?? 0));
    sanitized.engine.sheenOpacity = Math.max(0, Math.min(1, sanitized.engine.sheenOpacity ?? 0.2));
    sanitized.engine.sidebarOpacity = Math.max(0, Math.min(1.0, sanitized.engine.sidebarOpacity ?? 0.45));
    sanitized.engine.sidebarBlur = Math.max(0, Math.min(32, sanitized.engine.sidebarBlur ?? 20));
    if (!sanitized.engine.sidebarStyle) {
      sanitized.engine.sidebarStyle = 'translucent';
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
    sanitizedTheme: sanitized,
  };
}
