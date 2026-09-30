import fs from 'fs';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { rewriteRootRelativePaths, normalizeIngressPath } from './ingressRewrite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VENDOR_DIR = path.join(__dirname, '..', 'vendor', 'mock-frontend', 'hass_frontend');
const BOOTSTRAP_DIR = path.join(__dirname, '..', 'vendor', 'mock-frontend-bootstrap');
const MODS_DIR = path.join(__dirname, '..', 'vendor', 'mock-mods');
const MOUNT_PREFIX = '/mock-frontend';

export function resolveMockFrontendDir(vendorDir = VENDOR_DIR) {
  return fs.existsSync(path.join(vendorDir, 'index.html')) ? vendorDir : null;
}

const TEXT_REWRITE_EXTENSIONS = new Set(['.js', '.json']);
const CONTENT_TYPES = { '.js': 'application/javascript', '.json': 'application/json' };
const rewriteCache = new Map();

export function mountMockFrontendStatic(app, { vendorDir = VENDOR_DIR } = {}) {
  const dir = resolveMockFrontendDir(vendorDir);
  if (!dir) {
    console.warn('mockFrontendAssets: hass_frontend not found - live-render preview unavailable, falling back to fake-tile preview');
    return;
  }

  app.get(`${MOUNT_PREFIX}/*splat`, (req, res) => {
    const relPath = req.params.splat.join('/');
    const filePath = path.resolve(dir, relPath);
    const ext = path.extname(filePath).toLowerCase();

    if (filePath !== dir && !filePath.startsWith(dir + path.sep)) {
      res.status(404).end();
      return;
    }

    if (ext === '.html' || ext === '.htm') {
      res.status(404).end();
      return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.status(404).end();
      return;
    }

    if (!TEXT_REWRITE_EXTENSIONS.has(ext)) {
      res.sendFile(relPath, { root: dir });
      return;
    }

    const ingressPath = normalizeIngressPath(req.headers['x-ingress-path']);
    const cacheKey = `${filePath}::${ingressPath}`;
    let rewritten = rewriteCache.get(cacheKey);
    if (rewritten === undefined) {
      const raw = fs.readFileSync(filePath, 'utf8');
      rewritten = rewriteRootRelativePaths(raw, ingressPath, MOUNT_PREFIX);
      rewriteCache.set(cacheKey, rewritten);
    }

    res.setHeader('Content-Type', CONTENT_TYPES[ext]);
    res.send(rewritten);
  });
}

export function mountMockFrontendBootstrap(app, { bootstrapDir = BOOTSTRAP_DIR } = {}) {
  const dir = bootstrapDir;
  if (!fs.existsSync(path.join(dir, 'index.html'))) return;
  app.use('/mock-frontend-bootstrap', (req, res, next) => {
    const originalPath = req.originalUrl.split('?')[0];
    if (originalPath === '/mock-frontend-bootstrap') {
      const query = req.originalUrl.slice(originalPath.length);
      res.redirect(301, `mock-frontend-bootstrap/${query}`);
      return;
    }
    next();
  });
  app.use('/mock-frontend-bootstrap', express.static(dir, { redirect: false }));
}

export function mountMockMods(app, { modsDir = MODS_DIR } = {}) {
  if (!fs.existsSync(modsDir)) {
    console.warn('mockModSources: vendor/mock-mods not found - live-render preview mods unavailable');
    return;
  }
  app.use('/mock-mods', express.static(modsDir, { redirect: false }));
}
