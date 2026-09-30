import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import express from 'express';
import {
  resolveMockFrontendDir,
  mountMockFrontendStatic,
  mountMockFrontendBootstrap,
} from './mockFrontendAssets.js';

let tmpRoot;
let VENDOR_DIR;

function makeTmpVendor() {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hats-mock-frontend-test-'));
  VENDOR_DIR = path.join(tmpRoot, 'hass_frontend');
}

function removeTmpVendor() {
  if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true });
  tmpRoot = undefined;
}

function rawGet(port, rawPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method: 'GET', path: rawPath, headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
}

describe('resolveMockFrontendDir', () => {
  beforeEach(makeTmpVendor);
  afterEach(removeTmpVendor);

  it('returns null when the extracted directory does not exist', () => {
    expect(resolveMockFrontendDir(VENDOR_DIR)).toBeNull();
  });

  it('returns the absolute path when index.html is present', () => {
    fs.mkdirSync(VENDOR_DIR, { recursive: true });
    fs.writeFileSync(path.join(VENDOR_DIR, 'index.html'), '<html></html>');
    expect(resolveMockFrontendDir(VENDOR_DIR)).toBe(VENDOR_DIR);
  });
});

describe('mountMockFrontendStatic - ingress rewriting', () => {
  let server;
  let port;
  let baseUrl;

  beforeEach(async () => {
    makeTmpVendor();
    fs.mkdirSync(path.join(VENDOR_DIR, 'frontend_latest'), { recursive: true });
    fs.writeFileSync(path.join(VENDOR_DIR, 'index.html'), '<html><script src="/frontend_latest/core.abc123.js"></script></html>');
    fs.writeFileSync(path.join(VENDOR_DIR, 'authorize.html'), '<html></html>');
    fs.writeFileSync(
      path.join(VENDOR_DIR, 'frontend_latest', 'core.abc123.js'),
      'fetch("/static/translations/en.json")'
    );
    const app = express();
    mountMockFrontendStatic(app, { vendorDir: VENDOR_DIR });
    server = await listen(app);
    port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    removeTmpVendor();
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
      headers: { 'X-Ingress-Path': '/api/hassio_ingress/prefix-one' },
    });
    const res2 = await fetch(`${baseUrl}/mock-frontend/frontend_latest/core.abc123.js`, {
      headers: { 'X-Ingress-Path': '/api/hassio_ingress/prefix-two' },
    });
    expect(await res1.text()).toContain('/api/hassio_ingress/prefix-one/mock-frontend/static/');
    expect(await res2.text()).toContain('/api/hassio_ingress/prefix-two/mock-frontend/static/');
  });

  it('does not reflect an X-Ingress-Path that is not a Supervisor ingress path', async () => {
    const res = await fetch(`${baseUrl}/mock-frontend/frontend_latest/core.abc123.js`, {
      headers: { 'X-Ingress-Path': '/x");alert(1);("' },
    });
    const body = await res.text();
    expect(body).toBe('fetch("/mock-frontend/static/translations/en.json")');
    expect(body).not.toContain('alert');
  });

  it('refuses to serve the bundle\'s own .html entrypoints (they would boot without boot.js)', async () => {
    for (const p of ['/mock-frontend/index.html', '/mock-frontend/authorize.html', '/mock-frontend/INDEX.HTML']) {
      const res = await rawGet(port, p);
      expect(res.status, p).toBe(404);
      expect(res.body, p).not.toContain('<html');
    }
  });

  it('rejects a path-traversal request instead of reading a file outside the vendored dir', async () => {
    fs.writeFileSync(path.join(tmpRoot, 'secret.json'), '{"leaked":true}');
    for (const p of [
      '/mock-frontend/frontend_latest/../../secret.json',
      '/mock-frontend/frontend_latest/..%2f..%2fsecret.json',
      '/mock-frontend/frontend_latest/%2e%2e/%2e%2e/secret.json',
    ]) {
      const res = await rawGet(port, p);
      expect(res.status, p).toBe(404);
      expect(res.body, p).not.toContain('leaked');
    }
  });
});

describe('mountMockFrontendBootstrap - trailing slash redirect', () => {
  let server;
  let port;

  beforeEach(async () => {
    makeTmpVendor();
    const bootstrapDir = path.join(tmpRoot, 'mock-frontend-bootstrap');
    fs.mkdirSync(bootstrapDir, { recursive: true });
    fs.writeFileSync(path.join(bootstrapDir, 'index.html'), '<html>bootstrap</html>');
    const app = express();
    mountMockFrontendBootstrap(app, { bootstrapDir });
    server = await listen(app);
    port = server.address().port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    removeTmpVendor();
  });

  it('redirects the no-slash form with a relative Location (stays inside the Ingress prefix)', async () => {
    const res = await rawGet(port, '/mock-frontend-bootstrap');
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('mock-frontend-bootstrap/');
    expect(new URL(res.headers.location, 'http://ha.local/api/hassio_ingress/abc/mock-frontend-bootstrap').pathname)
      .toBe('/api/hassio_ingress/abc/mock-frontend-bootstrap/');
  });

  it('serves the composed page for the trailing-slash form', async () => {
    const res = await rawGet(port, '/mock-frontend-bootstrap/');
    expect(res.status).toBe(200);
    expect(res.body).toContain('bootstrap');
  });
});
