import { describe, it, expect, afterEach } from 'vitest';
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
