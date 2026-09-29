import fs from 'fs';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VENDOR_DIR = path.join(__dirname, '..', 'vendor', 'mock-frontend', 'hass_frontend');

export function resolveMockFrontendDir() {
  return fs.existsSync(path.join(VENDOR_DIR, 'index.html')) ? VENDOR_DIR : null;
}

export function mountMockFrontendStatic(app) {
  const dir = resolveMockFrontendDir();
  if (!dir) {
    console.warn('mockFrontendAssets: hass_frontend not found - live-render preview unavailable, falling back to fake-tile preview');
    return;
  }
  app.use('/mock-frontend', express.static(dir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
}

export function mountMockFrontendBootstrap(app) {
  const dir = path.join(__dirname, '..', 'vendor', 'mock-frontend-bootstrap');
  if (!fs.existsSync(path.join(dir, 'index.html'))) return;
  app.use('/mock-frontend-bootstrap', express.static(dir));
}

const ROOT_ASSET_DIRS = ['frontend_latest', 'frontend_es5', 'static'];
const ROOT_ASSET_FILES = ['sw-modern.js', 'sw-legacy.js', 'robots.txt'];

export function mountMockFrontendRootAssets(app) {
  const dir = resolveMockFrontendDir();
  if (!dir) return;

  for (const sub of ROOT_ASSET_DIRS) {
    const fullDir = path.join(dir, sub);
    if (!fs.existsSync(fullDir)) continue;
    app.use(`/${sub}`, express.static(fullDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
  }

  for (const file of ROOT_ASSET_FILES) {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) continue;
    app.get(`/${file}`, (req, res) => res.sendFile(file, { root: dir }));
  }
}
