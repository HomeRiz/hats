import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.INGRESS_PORT || 4287;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const CONFIG_DIR = process.env.HA_CONFIG_DIR || '/config';
const CONFIGURATION_YAML = path.join(CONFIG_DIR, 'configuration.yaml');
const THEMES_DIR = path.join(CONFIG_DIR, 'themes');
const WWW_DIR = path.join(CONFIG_DIR, 'www', 'ultimate-theme', 'backgrounds');
const HACS_COMMUNITY_DIR = path.join(CONFIG_DIR, 'www', 'community');
const HACS_CUSTOM_COMPONENTS = path.join(CONFIG_DIR, 'custom_components', 'hacs');
const LOVELACE_RESOURCES = path.join(CONFIG_DIR, '.storage', 'lovelace_resources');
const HACS_REPOSITORIES_FILE = path.join(CONFIG_DIR, '.storage', 'hacs.repositories');
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const SUPERVISOR_API = 'http://supervisor/core/api';

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

  return content;
}

function scanInstalledThemes() {
  if (!fs.existsSync(THEMES_DIR)) {
    return [];
  }

  const results = [];
  const seenIds = new Set();

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
        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          const sanitized = sanitizeThemeYamlContent(raw);

          if (sanitized !== raw) {
            try {
              fs.writeFileSync(fullPath, sanitized, 'utf8');
              console.log(`Auto-repaired YAML syntax in ${fullPath}`);
            } catch (wErr) {
              console.warn(`Could not save repaired YAML ${fullPath}:`, wErr.message);
            }
          }

          const parsed = yaml.load(sanitized);
          if (parsed && typeof parsed === 'object') {
            for (const [themeName, themeData] of Object.entries(parsed)) {
              if (!themeData || typeof themeData !== 'object') continue;

              const cleanId = (entry.name.replace(/\.ya?ml$/, '') + (Object.keys(parsed).length > 1 ? `-${themeName}` : ''))
                .toLowerCase()
                .replace(/[^a-z0-9_-]/g, '-');

              if (seenIds.has(cleanId)) continue;
              seenIds.add(cleanId);

              const primary = themeData['primary-color'] || themeData['accent-color'] || '#0A84FF';
              const accent = themeData['accent-color'] || primary;
              const bg = themeData['ultimate-background'] || themeData['background-image'] || themeData['lovelace-background'] || '';
              
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

              const mtime = fs.statSync(fullPath).mtime.toISOString();

              results.push({
                id: cleanId,
                name: themeName,
                category,
                author: 'Installed Theme',
                description: `Installed in Home Assistant (/config/themes/${path.relative(THEMES_DIR, fullPath)})`,
                isCustom: true,
                isInstalled: true,
                installedFilePath: fullPath,
                fileName: entry.name,
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
                  hoverGlow: Boolean(themeData['ultimate-glow-color']),
                  glowColor: themeData['ultimate-glow-color'] || primary,
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
          }
        } catch (err) {
          console.warn(`Error parsing theme file ${fullPath}:`, err.message);
        }
      }
    }
  }

  scanDir(THEMES_DIR);
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
app.use(express.static(DIST_DIR));

app.get('/api/ha/status', (req, res) => {
  const isAddon = fs.existsSync(CONFIG_DIR) || Boolean(SUPERVISOR_TOKEN);
  const themesExists = fs.existsSync(THEMES_DIR);

  res.json({
    isAddon,
    configDir: CONFIG_DIR,
    themesDir: THEMES_DIR,
    themesExists,
    hasSupervisorToken: Boolean(SUPERVISOR_TOKEN),
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
              `$1    - ${cardModUrl}\n`
            );
          } else {
            newFrontendContent = `${newFrontendContent}\n  extra_module_url:\n    - ${cardModUrl}`;
          }
        }

        const before = modified.split(/^frontend\s*:/m)[0];
        const after = frontendBlock.slice(sectionEndIndex);
        modified = `${before}frontend:${newFrontendContent}${after}`;
      }
    } else {
      const newBlock = `\n\n# Loaded by HATS (Home Assistant Theme Store)\nfrontend:\n  themes: !include_dir_merge_named themes\n  extra_module_url:\n    - ${cardModUrl}\n`;
      modified = `${modified.trimEnd()}${newBlock}`;
    }

    if (!fs.existsSync(THEMES_DIR)) {
      fs.mkdirSync(THEMES_DIR, { recursive: true });
    }

    fs.writeFileSync(CONFIGURATION_YAML, modified, 'utf8');

    let reloaded = false;
    if (SUPERVISOR_TOKEN) {
      try {
        const haRes = await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
            'Content-Type': 'application/json',
          },
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

app.get('/api/ha/themes', (req, res) => {
  try {
    const installed = scanInstalledThemes();
    const files = fs.existsSync(THEMES_DIR)
      ? fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      : [];
    res.json({ files, themes: installed });
  } catch (err) {
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
    const { themeId, themeName, yamlContent, backgroundDataUrl } = req.body;

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

    if (!fs.existsSync(THEMES_DIR)) {
      fs.mkdirSync(THEMES_DIR, { recursive: true });
    }

    const cleanFileName = `${themeId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.yaml`;
    const filePath = path.join(THEMES_DIR, cleanFileName);
    fs.writeFileSync(filePath, sanitizedYaml, 'utf8');

    if (backgroundDataUrl && backgroundDataUrl.startsWith('data:image')) {
      const themeBgDir = path.join(WWW_DIR, themeId);
      fs.mkdirSync(themeBgDir, { recursive: true });
      const base64Data = backgroundDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(path.join(themeBgDir, 'default.webp'), buffer);
    }

    let reloaded = false;
    if (SUPERVISOR_TOKEN) {
      try {
        const haRes = await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
            'Content-Type': 'application/json',
          },
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
    const cleanFileName = `${themeId.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.yaml`;
    const filePath = path.join(THEMES_DIR, cleanFileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (SUPERVISOR_TOKEN) {
      try {
        await fetch(`${SUPERVISOR_API}/services/frontend/reload_themes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {}
    }

    res.json({ success: true, message: `Theme ${themeId} removed from Home Assistant` });
  } catch (err) {
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

app.get('/api/ha/entities', async (req, res) => {
  if (!SUPERVISOR_TOKEN) {
    return res.json({ entities: [] });
  }

  try {
    const haRes = await fetch(`${SUPERVISOR_API}/states`, {
      headers: {
        'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
      },
    });
    if (haRes.ok) {
      const data = await haRes.json();
      res.json({ entities: data });
    } else {
      res.json({ entities: [] });
    }
  } catch {
    res.json({ entities: [] });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎩 HATS (Home Assistant Theme Store) running on Ingress port ${PORT}`);
  console.log(`Config Directory: ${CONFIG_DIR}`);
});
