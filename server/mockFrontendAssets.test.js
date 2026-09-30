import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveMockFrontendDir } from './mockFrontendAssets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VENDOR_DIR = path.join(__dirname, '..', 'vendor', 'mock-frontend', 'hass_frontend');

describe('resolveMockFrontendDir', () => {
  afterEach(() => {
    fs.rmSync(VENDOR_DIR, { recursive: true, force: true });
  });

  it('returns null when the extracted directory does not exist', () => {
    fs.rmSync(VENDOR_DIR, { recursive: true, force: true });
    expect(resolveMockFrontendDir()).toBeNull();
  });

  it('returns the absolute path when index.html is present', () => {
    fs.mkdirSync(VENDOR_DIR, { recursive: true });
    fs.writeFileSync(path.join(VENDOR_DIR, 'index.html'), '<html></html>');
    expect(resolveMockFrontendDir()).toBe(VENDOR_DIR);
  });
});

import express from 'express';
import http from 'http';
import { mountMockFrontendStatic } from './mockFrontendAssets.js';

describe('mountMockFrontendStatic - ingress rewriting', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    fs.mkdirSync(VENDOR_DIR, { recursive: true });
    fs.writeFileSync(path.join(VENDOR_DIR, 'index.html'), '<html></html>');
    fs.mkdirSync(path.join(VENDOR_DIR, 'frontend_latest'), { recursive: true });
    fs.writeFileSync(
      path.join(VENDOR_DIR, 'frontend_latest', 'core.abc123.js'),
      'fetch("/static/translations/en.json")'
    );
    const app = express();
    mountMockFrontendStatic(app);
    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    baseUrl = `http://localhost:${server.address().port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('rewrites /static/ references when X-Ingress-Path is present', async () => {
    const res = await fetch(`${baseUrl}/mock-frontend/frontend_latest/core.abc123.js`, {
      headers: { 'X-Ingress-Path': '/api/hassio_ingress/abc123' },
    });
    const body = await res.text();
    expect(body).toBe('fetch("/api/hassio_ingress/abc123/mock-frontend/static/translations/en.json")');
  });

  it('rewrites to the unprefixed mount path when X-Ingress-Path is absent', async () => {
    const res = await fetch(`${baseUrl}/mock-frontend/frontend_latest/core.abc123.js`);
    const body = await res.text();
    expect(body).toBe('fetch("/mock-frontend/static/translations/en.json")');
  });

  it('serves the same file differently for two different ingress paths (no cross-contamination)', async () => {
    const res1 = await fetch(`${baseUrl}/mock-frontend/frontend_latest/core.abc123.js`, {
      headers: { 'X-Ingress-Path': '/prefix-one' },
    });
    const res2 = await fetch(`${baseUrl}/mock-frontend/frontend_latest/core.abc123.js`, {
      headers: { 'X-Ingress-Path': '/prefix-two' },
    });
    expect(await res1.text()).toContain('/prefix-one/mock-frontend/static/');
    expect(await res2.text()).toContain('/prefix-two/mock-frontend/static/');
  });

  it('rejects a path-traversal request instead of reading a file outside the vendored dir', async () => {
    const secretPath = path.join(VENDOR_DIR, '..', 'secret.json');
    fs.writeFileSync(secretPath, '{"leaked":true}');
    try {
      const res = await fetch(
        `${baseUrl}/mock-frontend/frontend_latest/%2e%2e/%2e%2e/secret.json`
      );
      expect(res.status).toBe(404);
      const body = await res.text();
      expect(body).not.toContain('leaked');
    } finally {
      fs.rmSync(secretPath, { force: true });
    }
  });
});
