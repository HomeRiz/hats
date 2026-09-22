import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const SUPERVISOR_API = 'http://supervisor/core/api';

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

    const cardModJsPath = path.join(CONFIG_DIR, 'www', 'community', 'lovelace-card-mod', 'card-mod.js');
    const cardModDir = path.join(CONFIG_DIR, 'www', 'community', 'lovelace-card-mod');
    const cardModOnDisk = fs.existsSync(cardModJsPath) || fs.existsSync(cardModDir);

    let cardModHacstag = '190927524421';
    if (cardModOnDisk && fs.existsSync(cardModJsPath)) {
      try {
        const stats = fs.statSync(cardModJsPath);
        cardModHacstag = `190927524${Math.floor(stats.mtimeMs / 1000).toString().slice(-4)}`;
      } catch (e) {
      }
    }

    let hasCardModInResources = false;
    if (fs.existsSync(LOVELACE_RESOURCES)) {
      try {
        const rawRes = fs.readFileSync(LOVELACE_RESOURCES, 'utf8');
        if (/card-mod\.js/i.test(rawRes)) hasCardModInResources = true;
        if (/mushroom\.js/i.test(rawRes)) detectedCards.push('mushroom');
        if (/bubble-card\.js/i.test(rawRes)) detectedCards.push('bubble-card');
        if (/layout-card\.js/i.test(rawRes)) detectedCards.push('layout-card');
      } catch (err) {
        console.debug('Could not parse lovelace_resources:', err);
      }
    }

    if (fs.existsSync(HACS_COMMUNITY_DIR)) {
      try {
        const communityFolders = fs.readdirSync(HACS_COMMUNITY_DIR);
        if (communityFolders.includes('lovelace-card-mod')) hasCardModInResources = true;
        if (communityFolders.includes('mushroom') && !detectedCards.includes('mushroom')) detectedCards.push('mushroom');
        if (communityFolders.includes('bubble-card') && !detectedCards.includes('bubble-card')) detectedCards.push('bubble-card');
        if (communityFolders.includes('lovelace-layout-card') && !detectedCards.includes('layout-card')) detectedCards.push('layout-card');
      } catch (err) {
        console.debug('Could not read community directory:', err);
      }
    }

    const hasCardMod = hasCardModInConfig || hasCardModInResources || cardModOnDisk;
    const cardModNeedsConfig = cardModOnDisk && !hasCardModInConfig;
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
        description: 'card-mod was detected on disk! Auto-Fix will register extra_module_url in configuration.yaml to activate it.',
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
    const { addThemes = true, addCardMod = true, hacstag } = req.body || {};

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

    let tag = hacstag;
    if (!tag) {
      const cardModJsPath = path.join(CONFIG_DIR, 'www', 'community', 'lovelace-card-mod', 'card-mod.js');
      if (fs.existsSync(cardModJsPath)) {
        try {
          const stats = fs.statSync(cardModJsPath);
          tag = `190927524${Math.floor(stats.mtimeMs / 1000).toString().slice(-4)}`;
        } catch {}
      }
      if (!tag) tag = '190927524421';
    }

    const cardModUrl = `/hacsfiles/lovelace-card-mod/card-mod.js?hacstag=${tag}`;

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
    if (!fs.existsSync(THEMES_DIR)) {
      return res.json({ themes: [] });
    }

    const files = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    res.json({ themes: files });
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

    if (!fs.existsSync(THEMES_DIR)) {
      fs.mkdirSync(THEMES_DIR, { recursive: true });
    }

    const filePath = path.join(THEMES_DIR, `${themeId}.yaml`);
    fs.writeFileSync(filePath, yamlContent, 'utf8');

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
