import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';
import crypto from 'crypto';
import { submitThemePullRequest, TARGET_REPO, isPlausibleToken } from './github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.INGRESS_PORT || 4287;

app.disable('x-powered-by');

const INGRESS_GATEWAY = process.env.HATS_TRUSTED_INGRESS_IP || '172.30.32.2';
app.use((req, res, next) => {
  if (!process.env.SUPERVISOR_TOKEN) return next();
  const ip = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  if (ip !== INGRESS_GATEWAY) return res.status(403).json({ error: 'Forbidden: use Home Assistant Ingress' });
  next();
});

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  if (req.get('x-hats-request') !== '1') return res.status(403).json({ error: 'Missing X-HATS-Request header' });
  next();
});

app.use(express.json({ limit: '8mb' }));

let addOnOptions = {};
const OPTIONS_FILE = '/data/options.json';
if (fs.existsSync(OPTIONS_FILE)) {
  try {
    addOnOptions = JSON.parse(fs.readFileSync(OPTIONS_FILE, 'utf8'));
  } catch (err) {
    console.warn('Could not parse /data/options.json:', err.message);
  }
}

const CONFIG_DIR = process.env.HA_CONFIG_DIR || '/config';
const CONFIGURATION_YAML = path.join(CONFIG_DIR, 'configuration.yaml');
const THEMES_DIR = addOnOptions.themes_directory || path.join(CONFIG_DIR, 'themes');
const BUNDLED_THEMES_DIR = fs.existsSync(path.join(__dirname, '..', 'bundled', 'themes'))
  ? path.join(__dirname, '..', 'bundled', 'themes')
  : path.join(__dirname, 'bundled', 'themes');
const WWW_DIR = addOnOptions.backgrounds_directory || path.join(CONFIG_DIR, 'www', 'hats', 'backgrounds');
const AUTO_RELOAD_THEMES = addOnOptions.auto_reload_themes !== undefined ? Boolean(addOnOptions.auto_reload_themes) : true;
const HACS_COMMUNITY_DIR = path.join(CONFIG_DIR, 'www', 'community');
const HACS_CUSTOM_COMPONENTS = path.join(CONFIG_DIR, 'custom_components', 'hacs');
const LOVELACE_RESOURCES = path.join(CONFIG_DIR, '.storage', 'lovelace_resources');
const HACS_REPOSITORIES_FILE = path.join(CONFIG_DIR, '.storage', 'hacs.repositories');
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const SUPERVISOR_ROOT = process.env.HATS_SUPERVISOR_URL || 'http://supervisor';

function getGithubToken() {
  if (fs.existsSync(OPTIONS_FILE)) {
    try {
      const opts = JSON.parse(fs.readFileSync(OPTIONS_FILE, 'utf8'));
      if (typeof opts.github_token === 'string') return opts.github_token.trim();
    } catch (err) {
      console.warn('Could not re-read /data/options.json:', err.message);
    }
  }
  return typeof addOnOptions.github_token === 'string' ? addOnOptions.github_token.trim() : '';
}
const DATA_DIR = process.env.HATS_DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(__dirname, '..', '.hats-data'));
const META_DIR = path.join(DATA_DIR, 'theme-meta');
const DEFAULT_WWW_DIR = path.join(CONFIG_DIR, 'www', 'hats', 'backgrounds');
const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');
const metaPath = id => path.join(META_DIR, `${String(id).replace(/[^a-z0-9_-]/g, '-')}.json`);

function readThemeMeta(id, rawYaml) {
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath(id), 'utf8'));
    if (meta && meta.yamlSha256 === sha256(rawYaml) && meta.theme && typeof meta.theme === 'object') return meta.theme;
  } catch {
  }
  return null;
}
const SUPERVISOR_API = `${SUPERVISOR_ROOT}/core/api`;
const CARD_MOD_URL_RE = /^\/(?:hacsfiles|local\/community)\/lovelace-card-mod\/card-mod\.js(?:\?hacstag=[A-Za-z0-9_-]{1,40})?$/;
const IMAGE_MAGIC = [
  b => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  b => b.length > 7 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  b => b.length > 11 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  b => b.length > 5 && /^GIF8[79]a/.test(b.subarray(0, 6).toString('latin1')),
];

function sanitizeThemeYamlContent(rawYaml) {
  if (!rawYaml || typeof rawYaml !== 'string') return rawYaml;
  let content = rawYaml;

  content = content.replace(/url\(["']?data:image\/svg\+xml;utf8,([^"')]+)["']?\)/g, (match, rawSvg) => {
    try {
      const decoded = decodeURIComponent(rawSvg);
      const b64 = Buffer.from(decoded, 'utf-8').toString('base64');
      return `url('data:image/svg+xml;base64,${b64}')`;
    } catch {
      return match;
    }
  });

  content = content.replace(/:\s*"([^"\n]*?)url\("([^"\n]*?)"\)([^"\n]*?)"/g, ': "$1url(\'$2\')$3"');

  content = content.replace(/card-mod-sidebar:\s*\|\s*\n\s*:host::before\s*\{[\s\S]*?\}\s*(?=\n\s*(?:card-mod|modes|ha-|\.|\w+:))/g, 'card-mod-sidebar: |\n    :host {\n      background: none !important;\n    }\n    ');
  content = content.replace(/:host::(?:before|after)\s*\{[^}]*?position\s*:\s*fixed[^}]*?\}/g, (match) => {
    if (!/pointer-events\s*:\s*none/i.test(match)) {
      return match.replace(/\}$/, '  pointer-events: none !important;\n}');
    }
    return match;
  });

  const cssMarker = '/* Custom User Injected CSS */';
  const markerIdx = content.indexOf(cssMarker);
  if (markerIdx !== -1) {
    const head = content.slice(0, markerIdx + cssMarker.length);
    let tail = content.slice(markerIdx + cssMarker.length);
    for (let pass = 0; pass < 8; pass++) {
      const before = tail;
      tail = tail.replace(/<\s*\/?\s*(?:script|style|iframe|object|embed)[^>]*>/gi, '');
      tail = tail.replace(/javascript\s*:/gi, '');
      tail = tail.replace(/expression\s*\([^)]*\)/gi, '');
      tail = tail.replace(/behavior\s*:[^;}]*/gi, '');
      tail = tail.replace(/-moz-binding\s*:[^;}]*/gi, '');
      tail = tail.replace(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g, '');
      tail = tail.replace(/@import[^;]*;?/gi, '');
      tail = tail.replace(/url\(\s*['"]?\s*(?:https?:)?\/\/[^)]*\)/gi, 'none');
      if (tail === before) break;
    }
    tail = tail.replace(/\{\{|\{%|\{#/g, '');
    content = head + tail;
  }

  return content;
}

function parseThemeFile(fullPath, isInstalled) {
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const sanitized = sanitizeThemeYamlContent(raw);

    const parsed = yaml.load(sanitized);
    if (!parsed || typeof parsed !== 'object') return [];

    const themes = [];
    const fileName = path.basename(fullPath);

    for (const [themeName, themeData] of Object.entries(parsed)) {
      if (!themeData || typeof themeData !== 'object') continue;

      const cleanId = (fileName.replace(/\.ya?ml$/, '') + (Object.keys(parsed).length > 1 ? `-${themeName}` : ''))
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');

      const primary = themeData['primary-color'] || themeData['accent-color'] || '#0A84FF';
      const accent = themeData['accent-color'] || primary;
      const bg = themeData['hats-background'] || themeData['ultimate-background'] || themeData['background-image'] || themeData['lovelace-background'] || '';
      
      let customSvgOverlay = undefined;
      const b64SvgMatch = bg.match(/url\(['"]data:image\/svg\+xml;base64,([^'"]+)['"]\)/);
      if (b64SvgMatch) {
        try {
          customSvgOverlay = Buffer.from(b64SvgMatch[1], 'base64').toString('utf-8');
        } catch {}
      }

      let bgUrl = undefined;
      let gradientString = undefined;
      if (bg.includes('http') || bg.includes('/local/')) {
        const urlM = bg.match(/url\(['"]?(http[^'"]+|\/local\/[^'"]+)['"]?\)/);
        if (urlM) bgUrl = urlM[1];
      } else if (bg.includes('gradient')) {
        const gradM = bg.match(/linear-gradient\([^)]+\)/);
        if (gradM) gradientString = gradM[0];
      }

      const category = /kids/i.test(themeName) ? 'Kids'
        : /neon/i.test(themeName) ? 'Neon'
        : /velvet/i.test(themeName) ? 'Velvet'
        : /cyber/i.test(themeName) ? 'SciFi'
        : /aurora|nature|forest/i.test(themeName) ? 'Nature'
        : /glass/i.test(themeName) ? 'Glass'
        : 'Community';

      let mtime = new Date().toISOString();
      try {
        mtime = fs.statSync(fullPath).mtime.toISOString();
      } catch (statErr) {
        console.warn(`Could not stat theme file ${fullPath}:`, statErr.message);
      }

      themes.push({
        id: cleanId,
        name: themeName,
        category,
        author: isInstalled ? 'Installed Theme' : 'HATS Collection',
        description: isInstalled
          ? `Installed in Home Assistant (/config/themes/${path.relative(THEMES_DIR, fullPath)})`
          : `Official HATS Theme (${themeName})`,
        isCustom: isInstalled,
        isInstalled,
        installedFilePath: isInstalled ? fullPath : undefined,
        fileName,
        updatedAt: mtime,
        createdAt: mtime,
        palette: {
          primary,
          accent,
          purple: themeData['purple-color'] || '#BF5AF2',
          pink: themeData['pink-color'] || '#FF375F',
          red: themeData['red-color'] || '#FF453A',
          indigo: themeData['indigo-color'] || '#5E5CE6',
          blue: themeData['blue-color'] || '#0A84FF',
          lightBlue: themeData['light-blue-color'] || '#66D4CF',
          cyan: themeData['cyan-color'] || '#5AC8F5',
          teal: themeData['teal-color'] || '#6AC4DC',
          green: themeData['green-color'] || '#32D74B',
          yellow: themeData['yellow-color'] || '#FFD60A',
          orange: themeData['orange-color'] || '#FF9F0A',
          brown: themeData['brown-color'] || '#AC8E68',
          grey: themeData['grey-color'] || '#8E8E93',
        },
        engine: {
          engineType: category === 'Kids' ? 'kids' : category === 'Neon' ? 'neon' : category === 'Velvet' ? 'velvet' : 'glass',
          blurAmount: parseInt(themeData['ha-card-backdrop-filter']?.match(/blur\((\d+)px\)/)?.[1] || '16', 10),
          saturateAmount: parseFloat(themeData['ha-card-backdrop-filter']?.match(/saturate\(([\d.]+)\)/)?.[1] || '1.45'),
          brightnessAmount: 1.0,
          cardRadius: parseInt(themeData['ha-card-border-radius'] || '30', 10),
          badgeRadius: parseInt(themeData['ha-badge-border-radius'] || '24', 10),
          mushRadius: parseInt(themeData['mush-icon-border-radius'] || '24', 10),
          borderWidth: parseInt(themeData['ha-card-border-width'] || '0', 10),
          borderColor: themeData['ha-card-border-color'] || 'rgba(255, 255, 255, 0.18)',
          glassTint: themeData['ha-card-glass-tint'] || 'rgba(255, 255, 255, 0.06)',
          sheenOpacity: 0.22,
          sheenAngle: 160,
          sheenBlend: 'normal',
          insetShadow: themeData['ha-card-glass-inset-shadow'] || themeData['ha-card-box-shadow'] || 'none',
          hoverGlow: Boolean(themeData['hats-glow-color'] || themeData['ultimate-glow-color']),
          glowColor: themeData['hats-glow-color'] || themeData['ultimate-glow-color'] || primary,
          hoverGlowIntensity: 24,
          backgroundScrim: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.30) 100%)',
          fallbackCardBg: 'rgba(40, 42, 52, 0.86)',
          scanlines: false,
          scanlineIntensity: 0,
        },
        background: {
          type: bgUrl ? 'image' : 'gradient',
          imageUrl: bgUrl,
          gradientString: gradientString || (bgUrl ? undefined : 'linear-gradient(140deg, #1b1030 0%, #0b0d14 55%, #12202e 100%)'),
          darken: 0.2,
          blur: 0,
          saturation: 1.2,
          vignette: 0.35,
          headerTintAuto: true,
          avgColor: '#1a1428',
        },
        customSvgOverlay,
        dark: {
          primaryBackground: themeData.modes?.dark?.['primary-background-color'] || 'rgb(14, 14, 20)',
          secondaryBackground: themeData.modes?.dark?.['secondary-background-color'] || 'rgb(14, 14, 20)',
          cardBackground: themeData.modes?.dark?.['ha-card-background'] || 'rgba(0, 0, 0, 0.26)',
          textPrimary: themeData.modes?.dark?.['primary-text-color'] || 'rgba(255, 255, 255, 0.96)',
          textSecondary: themeData.modes?.dark?.['secondary-text-color'] || 'rgba(228, 228, 232, 0.78)',
        },
        light: {
          primaryBackground: themeData.modes?.light?.['primary-background-color'] || 'rgb(70, 74, 80)',
          secondaryBackground: themeData.modes?.light?.['secondary-background-color'] || 'rgb(70, 74, 80)',
          cardBackground: themeData.modes?.light?.['ha-card-background'] || 'rgba(190, 195, 205, 0.26)',
          textPrimary: themeData.modes?.light?.['primary-text-color'] || 'rgb(241, 241, 241)',
          textSecondary: themeData.modes?.light?.['secondary-text-color'] || 'rgba(228, 228, 232, 0.78)',
        },
        requirements: {
          requiresCardMod: Boolean(themeData['card-mod-theme'] || themeData['card-mod-root'] || themeData['card-mod-card']),
          requiresThemesDirective: true,
          recommendedCards: [
            { name: 'Mushroom Cards', slug: 'mushroom', description: 'Clean minimalist cards' },
            { name: 'Bubble Card', slug: 'bubble-card', description: 'Pop-up subviews' },
          ],
        },
      });
    }
    if (isInstalled && themes.length === 1) {
      const saved = readThemeMeta(themes[0].id, raw);
      if (saved) {
        themes[0] = {
          ...saved,
          id: themes[0].id,
          isCustom: true,
          isInstalled: true,
          installedFilePath: themes[0].installedFilePath,
          fileName: themes[0].fileName,
          updatedAt: themes[0].updatedAt,
        };
      }
    }
    return themes;
  } catch (err) {
    console.warn(`Error parsing theme file ${fullPath}:`, err.message);
    return [];
  }
}

function scanInstalledThemes() {
  const results = [];
  const seenIds = new Set();
  const seenNames = new Set();

  if (fs.existsSync(THEMES_DIR)) {
    function scanDir(dir) {
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (e) {
        console.warn(`Cannot read directory ${dir}:`, e.message);
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          const parsedThemes = parseThemeFile(fullPath, true);
          for (const t of parsedThemes) {
            if (!seenIds.has(t.id)) {
              seenIds.add(t.id);
              seenNames.add(t.name.toLowerCase());
              results.push(t);
            }
          }
        }
      }
    }
    scanDir(THEMES_DIR);
  }

  if (fs.existsSync(BUNDLED_THEMES_DIR)) {
    try {
      const bundledEntries = fs.readdirSync(BUNDLED_THEMES_DIR, { withFileTypes: true });
      for (const entry of bundledEntries) {
        if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          const fullPath = path.join(BUNDLED_THEMES_DIR, entry.name);
          const parsedThemes = parseThemeFile(fullPath, false);
          for (const t of parsedThemes) {
            if (!seenIds.has(t.id) && !seenNames.has(t.name.toLowerCase())) {
              seenIds.add(t.id);
              results.push(t);
            }
          }
        }
      }
    } catch (bErr) {
      console.warn('Error reading bundled themes directory:', bErr.message);
    }
  }

  return results;
}

function resolveCardModResourceInfo() {
  let exactUrl = null;
  let hacstag = null;

  if (fs.existsSync(LOVELACE_RESOURCES)) {
    try {
      const raw = JSON.parse(fs.readFileSync(LOVELACE_RESOURCES, 'utf8'));
      const items = raw?.data?.items || [];
      const cardModItem = items.find(it => it.url && /card-mod\.js/i.test(it.url));
      if (cardModItem && cardModItem.url) {
        exactUrl = cardModItem.url;
        const tagMatch = exactUrl.match(/hacstag=([a-zA-Z0-9_-]+)/);
        if (tagMatch) hacstag = tagMatch[1];
      }
    } catch (e) {
      console.debug('Error reading lovelace_resources:', e);
    }
  }

  if (!exactUrl && fs.existsSync(HACS_REPOSITORIES_FILE)) {
    try {
      const rawHacs = JSON.parse(fs.readFileSync(HACS_REPOSITORIES_FILE, 'utf8'));
      const repos = rawHacs?.data || {};
      const cardModRepo = repos['190927524'] || Object.values(repos).find(r => r.full_name === 'thomasloven/lovelace-card-mod');
      if (cardModRepo) {
        const rawVersion = cardModRepo.version_installed || cardModRepo.last_version || '4.2.1';
        const cleanVersion = rawVersion.replace(/[^0-9]/g, '');
        hacstag = `${cardModRepo.id || '190927524'}${cleanVersion}`;
        exactUrl = `/hacsfiles/lovelace-card-mod/card-mod.js?hacstag=${hacstag}`;
      }
    } catch (e) {
      console.debug('Error reading hacs.repositories:', e);
    }
  }

  const cardModJsPath = path.join(CONFIG_DIR, 'www', 'community', 'lovelace-card-mod', 'card-mod.js');
  const cardModDir = path.join(CONFIG_DIR, 'www', 'community', 'lovelace-card-mod');
  const onDisk = fs.existsSync(cardModJsPath) || fs.existsSync(cardModDir);

  if (!exactUrl && onDisk) {
    exactUrl = '/hacsfiles/lovelace-card-mod/card-mod.js';
  }

  return {
    exactUrl: exactUrl || '/hacsfiles/lovelace-card-mod/card-mod.js',
    hacstag: hacstag || '',
    onDisk,
  };
}

const DIST_DIR = path.join(__dirname, '..', 'dist');
app.use('/_private', (req, res) => res.status(404).end());
app.use(express.static(DIST_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get('/api/ha/status', (req, res) => {
  const isAddon = fs.existsSync(CONFIG_DIR) || Boolean(SUPERVISOR_TOKEN);
  const themesExists = fs.existsSync(THEMES_DIR);

  res.json({
    isAddon,
    configDir: CONFIG_DIR,
    themesDir: THEMES_DIR,
    themesExists,
    hasSupervisorToken: Boolean(SUPERVISOR_TOKEN),
    autoReloadThemes: AUTO_RELOAD_THEMES,
  });
});

app.get('/api/ha/diagnostics', (req, res) => {
  try {
    const configExists = fs.existsSync(CONFIGURATION_YAML);
    let configContent = '';
    let hasFrontend = false;
    let hasThemesDirective = false;
    let hasCardModInConfig = false;

    if (configExists) {
      configContent = fs.readFileSync(CONFIGURATION_YAML, 'utf8');
      hasFrontend = /^frontend\s*:/m.test(configContent);
      hasThemesDirective = /themes\s*:\s*(!include_dir_merge_named\s+themes|.*themes)/m.test(configContent);
      hasCardModInConfig = /card-mod\.js/i.test(configContent);
    }

    const detectedCards = [];
    const hasHacs = fs.existsSync(HACS_CUSTOM_COMPONENTS);

    const { exactUrl, hacstag: cardModHacstag, onDisk: cardModOnDisk } = resolveCardModResourceInfo();

    let hasCardModInResources = false;
    if (fs.existsSync(LOVELACE_RESOURCES)) {
      try {
        const rawRes = fs.readFileSync(LOVELACE_RESOURCES, 'utf8');
        if (/card-mod\.js/i.test(rawRes)) hasCardModInResources = true;
        if (/mushroom\.js/i.test(rawRes)) detectedCards.push('mushroom');
        if (/bubble-card\.js/i.test(rawRes)) detectedCards.push('bubble-card');
        if (/layout-card\.js/i.test(rawRes)) detectedCards.push('layout-card');
        if (/button-card\.js/i.test(rawRes)) detectedCards.push('button-card');
      } catch (err) {
        console.debug('Could not parse lovelace_resources:', err);
      }
    }

    if (fs.existsSync(HACS_COMMUNITY_DIR)) {
      try {
        const communityFolders = fs.readdirSync(HACS_COMMUNITY_DIR).map(f => f.toLowerCase());
        if (communityFolders.some(f => f.includes('card-mod'))) hasCardModInResources = true;
        if (communityFolders.some(f => f.includes('mushroom')) && !detectedCards.includes('mushroom')) detectedCards.push('mushroom');
        if (communityFolders.some(f => f.includes('bubble')) && !detectedCards.includes('bubble-card')) detectedCards.push('bubble-card');
        if (communityFolders.some(f => f.includes('layout')) && !detectedCards.includes('layout-card')) detectedCards.push('layout-card');
        if (communityFolders.some(f => f.includes('button')) && !detectedCards.includes('button-card')) detectedCards.push('button-card');
      } catch (err) {
        console.debug('Could not read community directory:', err);
      }
    }

    const hasCardMod = hasCardModInConfig || hasCardModInResources || cardModOnDisk;
    const cardModNeedsConfig = (cardModOnDisk || hasCardModInResources) && !hasCardModInConfig;
    const themesExists = fs.existsSync(THEMES_DIR);
    let themesCount = 0;
    if (themesExists) {
      themesCount = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length;
    }

    const issues = [];
    if (!hasThemesDirective) {
      issues.push({
        id: 'missing_themes_directive',
        severity: 'error',
        title: 'Themes Directive Missing in configuration.yaml',
        description: "Home Assistant won't load themes unless 'themes: !include_dir_merge_named themes' is under 'frontend:'.",
        canAutoFix: true,
      });
    }

    if (cardModNeedsConfig) {
      issues.push({
        id: 'card_mod_needs_config',
        severity: 'warning',
        title: 'card-mod Installed but Missing in configuration.yaml',
        description: `card-mod was detected! Auto-Fix will register '${exactUrl}' in configuration.yaml to activate it.`,
        canAutoFix: true,
      });
    } else if (!hasCardMod) {
      issues.push({
        id: 'missing_card_mod',
        severity: 'warning',
        title: 'card-mod Not Installed',
        description: 'Advanced glassmorphism cards and custom CSS require lovelace-card-mod. Install via HACS first.',
        canAutoFix: false,
      });
    }

    res.json({
      configExists,
      hasFrontend,
      hasThemesDirective,
      hasCardMod,
      cardModOnDisk,
      cardModHacstag,
      cardModExactUrl: exactUrl,
      hasCardModInConfig,
      hasCardModInResources,
      cardModNeedsConfig,
      hasHacs,
      themesExists,
      themesCount,
      themesDir: THEMES_DIR,
      detectedCards,
      issues,
      readyForThemes: hasThemesDirective,
      readyForGlassmorphism: hasThemesDirective && (hasCardModInConfig || hasCardModInResources),
    });
  } catch (err) {
    console.error('Failed to run diagnostics:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ha/fix-config', async (req, res) => {
  try {
    const { addThemes = true, addCardMod = true, exactUrl } = req.body || {};

    if (!fs.existsSync(CONFIG_DIR)) {
      return res.status(400).json({ error: 'Config directory not found (/config)' });
    }

    let content = '';
    if (fs.existsSync(CONFIGURATION_YAML)) {
      content = fs.readFileSync(CONFIGURATION_YAML, 'utf8');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(CONFIG_DIR, `configuration.yaml.hats_bak_${timestamp}`);
      fs.writeFileSync(backupPath, content, 'utf8');
    }

    let cardModUrl = exactUrl;
    if (!cardModUrl) {
      const resolved = resolveCardModResourceInfo();
      cardModUrl = resolved.exactUrl;
    }
    const sanitizedUrl = String(cardModUrl || '').trim();
    if (addCardMod && !CARD_MOD_URL_RE.test(sanitizedUrl)) {
      return res.status(400).json({ error: 'Invalid card-mod URL. Only /hacsfiles/lovelace-card-mod/card-mod.js is accepted.' });
    }

    let modified = content;
    const hasFrontend = /^frontend\s*:/m.test(modified);

    if (hasFrontend) {
      const frontendMatch = modified.match(/^(frontend\s*:\s*\n)/m);
      if (frontendMatch) {
        let frontendBlock = modified.split(/^frontend\s*:/m)[1];
        const nextSectionMatch = frontendBlock.match(/\n(?=[a-zA-Z_0-9]+:)/);
        const sectionEndIndex = nextSectionMatch ? nextSectionMatch.index : frontendBlock.length;
        const currentFrontendContent = frontendBlock.slice(0, sectionEndIndex);

        let newFrontendContent = currentFrontendContent;

        if (addThemes && !/themes\s*:/m.test(newFrontendContent)) {
          newFrontendContent = `\n  themes: !include_dir_merge_named themes${newFrontendContent}`;
        }

        if (addCardMod && !/card-mod\.js/i.test(newFrontendContent)) {
          if (/extra_module_url\s*:/m.test(newFrontendContent)) {
            newFrontendContent = newFrontendContent.replace(
              /(extra_module_url\s*:\s*\n)/m,
              `$1    - ${sanitizedUrl}\n`
            );
          } else {
            newFrontendContent = `${newFrontendContent}\n  extra_module_url:\n    - ${sanitizedUrl}`;
          }
        }

        const before = modified.split(/^frontend\s*:/m)[0];
        const after = frontendBlock.slice(sectionEndIndex);
        modified = `${before}frontend:${newFrontendContent}${after}`;
      }
    } else {
      const newBlock = `\n\n# Loaded by HATS (Home Assistant Theme Store)\nfrontend:\n  themes: !include_dir_merge_named themes\n  extra_module_url:\n    - ${sanitizedUrl}\n`;
      modified = `${modified.trimEnd()}${newBlock}`;
    }

    if (!fs.existsSync(THEMES_DIR)) {
      fs.mkdirSync(THEMES_DIR, { recursive: true });
    }

    fs.writeFileSync(CONFIGURATION_YAML, modified, 'utf8');

    let reloaded = false;
    if (AUTO_RELOAD_THEMES && SUPERVISOR_TOKEN) {
      try {
        const haRes = await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
        reloaded = haRes.ok;
      } catch (haErr) {
        console.warn('Could not reload themes via Supervisor:', haErr.message);
      }
    }

    res.json({
      success: true,
      reloaded,
      message: 'configuration.yaml updated with theme support and card-mod extra_module_url!',
    });
  } catch (err) {
    console.error('Failed to fix configuration.yaml:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ha/installed-themes', (req, res) => {
  try {
    const installed = scanInstalledThemes();
    res.json({ themes: installed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ha/apply-theme', async (req, res) => {
  try {
    const { themeId, themeName, yamlContent, backgroundDataUrl, themeMeta } = req.body;

    if (!themeId || !yamlContent) {
      return res.status(400).json({ error: 'themeId and yamlContent are required' });
    }

    const sanitizedYaml = sanitizeThemeYamlContent(yamlContent);

    try {
      yaml.load(sanitizedYaml);
    } catch (parseErr) {
      console.error('Refusing to write invalid YAML to disk:', parseErr.message);
      return res.status(400).json({ error: `Invalid YAML format: ${parseErr.message}` });
    }

    let bgBuffer = null;
    if (backgroundDataUrl && String(backgroundDataUrl).startsWith('data:image')) {
      bgBuffer = Buffer.from(String(backgroundDataUrl).replace(/^data:image\/[\w+.-]+;base64,/, ''), 'base64');
      if (!IMAGE_MAGIC.some(check => check(bgBuffer))) {
        return res.status(400).json({ error: 'Background is not a valid JPEG, PNG, WebP or GIF image' });
      }
    }

    if (typeof themeId !== 'string' || typeof yamlContent !== 'string') {
      return res.status(400).json({ error: 'themeId and yamlContent must be strings' });
    }

    if (!fs.existsSync(THEMES_DIR)) {
      fs.mkdirSync(THEMES_DIR, { recursive: true });
    }

    const cleanThemeId = (themeId.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'theme');
    const cleanFileName = `${cleanThemeId}.yaml`;
    const filePath = path.join(THEMES_DIR, cleanFileName);
    fs.writeFileSync(filePath, sanitizedYaml, 'utf8');

    if (bgBuffer) {
      const themeBgDir = path.join(WWW_DIR, cleanThemeId);
      fs.mkdirSync(themeBgDir, { recursive: true });
      fs.writeFileSync(path.join(themeBgDir, 'default.webp'), bgBuffer);
    }

    try {
      if (themeMeta && typeof themeMeta === 'object' && themeMeta.engine && themeMeta.palette) {
        const saved = JSON.parse(JSON.stringify(themeMeta));
        saved.id = cleanThemeId;
        const wallpaperOnDisk = fs.existsSync(path.join(WWW_DIR, cleanThemeId, 'default.webp'));
        const url = saved.background && saved.background.imageUrl;
        if (saved.background && saved.background.type === 'image' && (!url || String(url).startsWith('/local/') || String(url).startsWith('data:'))) {
          saved.background.imageUrl =
            wallpaperOnDisk && WWW_DIR === DEFAULT_WWW_DIR ? `/local/hats/backgrounds/${cleanThemeId}/default.webp` : undefined;
        }
        const payload = JSON.stringify({ yamlSha256: sha256(sanitizedYaml), savedAt: new Date().toISOString(), theme: saved });
        if (payload.length <= 400000) {
          fs.mkdirSync(META_DIR, { recursive: true });
          fs.writeFileSync(metaPath(cleanThemeId), payload, 'utf8');
        }
      }
    } catch (metaErr) {
      console.warn('Could not save theme editor state:', metaErr.message);
    }

    let reloaded = false;
    if (AUTO_RELOAD_THEMES && SUPERVISOR_TOKEN) {
      try {
        const haRes = await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
        reloaded = haRes.ok;
      } catch (haErr) {
        console.warn('Could not trigger reload_themes via Supervisor:', haErr.message);
      }
    }

    res.json({
      success: true,
      filePath,
      reloaded,
      message: `Theme '${themeName || themeId}' saved directly to ${filePath}${reloaded ? ' and reloaded in Home Assistant.' : '.'}`,
    });
  } catch (err) {
    console.error('Failed to apply theme:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ha/theme/:themeId', async (req, res) => {
  try {
    const { themeId } = req.params;
    const cleanThemeId = (themeId.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'theme');
    const cleanFileName = `${cleanThemeId}.yaml`;
    const filePath = path.join(THEMES_DIR, cleanFileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    try { fs.rmSync(metaPath(cleanThemeId), { force: true }); } catch { }

    const themeBgDir = path.join(WWW_DIR, cleanThemeId);
    if (fs.existsSync(themeBgDir)) {
      try {
        fs.rmSync(themeBgDir, { recursive: true, force: true });
      } catch (bgErr) {
        console.debug(`Could not remove background folder ${themeBgDir}:`, bgErr.message);
      }
    }

    if (AUTO_RELOAD_THEMES && SUPERVISOR_TOKEN) {
      try {
        await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
      } catch {}
    }

    res.json({ success: true, message: `Theme ${cleanThemeId} removed from Home Assistant` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ha/repair-all-themes', async (req, res) => {
  try {
    if (!fs.existsSync(THEMES_DIR)) {
      return res.json({ success: true, count: 0, repaired: 0, message: 'No themes directory found.' });
    }

    let total = 0;
    let repairedCount = 0;
    const repairedFiles = [];

    function repairDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          repairDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          total++;
          try {
            const raw = fs.readFileSync(fullPath, 'utf8');
            const sanitized = sanitizeThemeYamlContent(raw);
            if (sanitized !== raw) {
              fs.writeFileSync(`${fullPath}.hats_bak`, raw, 'utf8');
              fs.writeFileSync(fullPath, sanitized, 'utf8');
              repairedCount++;
              repairedFiles.push(entry.name);
            }
          } catch (e) {
            console.warn(`Could not repair ${fullPath}:`, e.message);
          }
        }
      }
    }

    repairDir(THEMES_DIR);

    if (SUPERVISOR_TOKEN) {
      try {
        await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
      } catch {}
    }

    res.json({
      success: true,
      total,
      repairedCount,
      repairedFiles,
      message: repairedCount > 0
        ? `Successfully inspected ${total} files and repaired ${repairedCount} theme(s)! Themes have been reloaded.`
        : `All ${total} theme files are 100% clean and compliant with Home Assistant safety guidelines.`,
    });
  } catch (err) {
    console.error('Failed to repair themes:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ha/reload-themes', async (req, res) => {
  if (!SUPERVISOR_TOKEN) {
    return res.status(400).json({ error: 'Supervisor token not available (not running as HA Add-on)' });
  }

  try {
    const haRes = await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (haRes.ok) {
      res.json({ success: true, message: 'Themes reloaded in Home Assistant!' });
    } else {
      res.status(500).json({ error: `Home Assistant API returned ${haRes.status}` });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ha/restart', async (req, res) => {
  if (!SUPERVISOR_TOKEN) {
    return res.status(400).json({ error: 'Supervisor token not available (not running as HA Add-on)' });
  }

  try {
    const haRes = await fetch(`${SUPERVISOR_API}/services/homeassistant/restart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (haRes.ok) {
      res.json({ success: true, message: 'Home Assistant Core is restarting...' });
    } else {
      res.status(500).json({ error: `Home Assistant API returned status ${haRes.status}` });
    }
  } catch (err) {
    console.error('Failed to restart Home Assistant:', err);
    res.status(500).json({ error: err.message });
  }
});

let submissionInFlight = false;
app.get('/api/github/status', (req, res) => {
  res.json({ tokenConfigured: Boolean(getGithubToken()), targetRepo: TARGET_REPO, canSaveToken: Boolean(SUPERVISOR_TOKEN) });
});

app.post('/api/github/token', async (req, res) => {
  if (!SUPERVISOR_TOKEN) {
    return res.status(400).json({ success: false, error: 'Not running as a Home Assistant Add-on: save the token in Configuration instead.' });
  }
  const raw = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (raw && !isPlausibleToken(raw)) {
    return res.status(400).json({ success: false, error: 'That does not look like a GitHub token (unexpected characters or length).' });
  }
  try {
    const infoRes = await fetch(`${SUPERVISOR_ROOT}/addons/self/info`, {
      headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!infoRes.ok) throw new Error(`Supervisor returned HTTP ${infoRes.status} reading current options`);
    const info = await infoRes.json();
    const currentOptions = info?.data?.options && typeof info.data.options === 'object' ? info.data.options : {};

    const optRes = await fetch(`${SUPERVISOR_ROOT}/addons/self/options`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: { ...currentOptions, github_token: raw } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!optRes.ok) {
      const errBody = await optRes.json().catch(() => ({}));
      throw new Error(errBody?.message || `Supervisor returned HTTP ${optRes.status} saving the token`);
    }

    res.json({ success: true, tokenConfigured: Boolean(raw), restarting: true });

    try {
      await fetch(`${SUPERVISOR_ROOT}/addons/self/restart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
        signal: AbortSignal.timeout(10000),
      });
    } catch (restartErr) {
      console.warn('Saved the token but could not auto-restart HATS; restart it manually to apply it:', restartErr.message);
    }
  } catch (err) {
    console.error('Failed to save GitHub token:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/github/submit-pr', async (req, res) => {
  if (submissionInFlight) return res.status(429).json({ success: false, error: 'A submission is already running.' });
  const { themeId, themeName, yamlContent, backgroundDataUrl, title, body, token } = req.body || {};
  if (typeof themeId !== 'string' || typeof yamlContent !== 'string') {
    return res.status(400).json({ success: false, error: 'themeId and yamlContent are required' });
  }
  if (yamlContent.length > 300000) return res.status(413).json({ success: false, error: 'Theme YAML is too large' });
  try {
    const parsed = yaml.load(sanitizeThemeYamlContent(yamlContent));
    if (!parsed || typeof parsed !== 'object') throw new Error('not a mapping');
  } catch (e) {
    return res.status(400).json({ success: false, error: `Invalid theme YAML: ${e.message}` });
  }
  submissionInFlight = true;
  try {
    const result = await submitThemePullRequest({
      token: getGithubToken() || (typeof token === 'string' ? token : ''),
      themeId,
      themeName,
      yamlContent: sanitizeThemeYamlContent(yamlContent),
      backgroundDataUrl: typeof backgroundDataUrl === 'string' ? backgroundDataUrl : undefined,
      title: typeof title === 'string' ? title : undefined,
      body: typeof body === 'string' ? body : undefined,
    });
    res.status(result.success ? 200 : 502).json(result);
  } finally {
    submissionInFlight = false;
  }
});

app.get('/*splat', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`🎩 HATS (Home Assistant Theme Store) running on Ingress port ${PORT}`);
  console.log(`Config Directory: ${CONFIG_DIR}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
