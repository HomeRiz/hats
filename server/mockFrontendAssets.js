import fs from 'fs';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { rewriteRootRelativePaths, normalizeIngressPath } from './ingressRewrite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VENDOR_DIR = path.join(__dirname, '..', 'vendor', 'mock-frontend', 'hass_frontend');
const MOUNT_PREFIX = '/mock-frontend';

export function resolveMockFrontendDir() {
  return fs.existsSync(path.join(VENDOR_DIR, 'index.html')) ? VENDOR_DIR : null;
}

const TEXT_REWRITE_EXTENSIONS = new Set(['.js', '.json', '.html']);
const CONTENT_TYPES = { '.js': 'application/javascript', '.json': 'application/json', '.html': 'text/html' };
const rewriteCache = new Map();

export function mountMockFrontendStatic(app) {
  const dir = resolveMockFrontendDir();
  if (!dir) {
    console.warn('mockFrontendAssets: hass_frontend not found - live-render preview unavailable, falling back to fake-tile preview');
    return;
  }

  app.get(`${MOUNT_PREFIX}/*splat`, (req, res) => {
    const relPath = req.params.splat.join('/');
    const filePath = path.resolve(dir, relPath);
    const ext = path.extname(filePath);

    if (filePath !== dir && !filePath.startsWith(dir + path.sep)) {
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

    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    res.setHeader('Content-Type', CONTENT_TYPES[ext]);
    res.send(rewritten);
  });
}

export function mountMockFrontendBootstrap(app) {
  const dir = path.join(__dirname, '..', 'vendor', 'mock-frontend-bootstrap');
  if (!fs.existsSync(path.join(dir, 'index.html'))) return;
  app.use('/mock-frontend-bootstrap', express.static(dir));
}
