import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.INGRESS_PORT || 8099;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const CONFIG_DIR = process.env.HA_CONFIG_DIR || '/config';
const THEMES_DIR = path.join(CONFIG_DIR, 'themes');
const WWW_DIR = path.join(CONFIG_DIR, 'www', 'ultimate-theme', 'backgrounds');
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
