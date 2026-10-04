import { describe, it, expect } from 'vitest';
import { rewriteRootRelativePaths, normalizeIngressPath } from './ingressRewrite.js';

describe('normalizeIngressPath', () => {
  it('returns empty string for undefined', () => {
    expect(normalizeIngressPath(undefined)).toBe('');
  });

  it('returns empty string for an empty string header', () => {
    expect(normalizeIngressPath('')).toBe('');
  });

  it('returns the value unchanged for a real prefix', () => {
    expect(normalizeIngressPath('/api/hassio_ingress/abc123')).toBe('/api/hassio_ingress/abc123');
  });

  it('treats a value that is not a Supervisor ingress path as absent', () => {
    expect(normalizeIngressPath('/api/hassio_ingress/abc";alert(1);"')).toBe('');
    expect(normalizeIngressPath('/some/other/prefix')).toBe('');
    expect(normalizeIngressPath('/api/hassio_ingress/abc/extra')).toBe('');
    expect(normalizeIngressPath('/api/hassio_ingress/')).toBe('');
  });

  it('takes the first entry when Express gives an array (duplicate header)', () => {
    expect(normalizeIngressPath(['/api/hassio_ingress/abc123', '/other'])).toBe('/api/hassio_ingress/abc123');
  });
});

describe('rewriteRootRelativePaths', () => {
  it('rewrites /static/ references with the ingress-prefixed mount path', () => {
    const input = 'fetch("/static/translations/en.json")';
    const output = rewriteRootRelativePaths(input, '/api/hassio_ingress/abc123', '/mock-frontend');
    expect(output).toBe('fetch("/api/hassio_ingress/abc123/mock-frontend/static/translations/en.json")');
  });

  it('rewrites /frontend_latest/ and /frontend_es5/ references', () => {
    const input = 'import("/frontend_latest/chunk.js"); import("/frontend_es5/chunk.js")';
    const output = rewriteRootRelativePaths(input, '/prefix', '/mock-frontend');
    expect(output).toBe('import("/prefix/mock-frontend/frontend_latest/chunk.js"); import("/prefix/mock-frontend/frontend_es5/chunk.js")');
  });

  it('rewrites the service worker script references', () => {
    const input = 'register("/sw-modern.js"); register("/sw-legacy.js")';
    const output = rewriteRootRelativePaths(input, '/prefix', '/mock-frontend');
    expect(output).toBe('register("/prefix/mock-frontend/sw-modern.js"); register("/prefix/mock-frontend/sw-legacy.js")');
  });

  it('produces the unprefixed mount path when ingressPath is empty (dev mode)', () => {
    const input = 'fetch("/static/foo.json")';
    const output = rewriteRootRelativePaths(input, '', '/mock-frontend');
    expect(output).toBe('fetch("/mock-frontend/static/foo.json")');
  });

  it('does not touch unrelated paths', () => {
    const input = 'fetch("/api/ha/status")';
    expect(rewriteRootRelativePaths(input, '/prefix', '/mock-frontend')).toBe(input);
  });

  it('rewrites /static/ references expressed as a backtick template literal with an interpolated suffix', () => {
    const input = 'fetch(`/static/translations/${e}`,{credentials:"same-origin"})';
    const output = rewriteRootRelativePaths(input, '/api/hassio_ingress/abc123', '/mock-frontend');
    expect(output).toBe('fetch(`/api/hassio_ingress/abc123/mock-frontend/static/translations/${e}`,{credentials:"same-origin"})');
  });

  it('rewrites /static/ references expressed as a backtick template literal with an interpolated directory segment', () => {
    const input = 'fetch(`/static/locale-data/intl-${e.toLowerCase()}/${t}.json`)';
    const output = rewriteRootRelativePaths(input, '/prefix', '/mock-frontend');
    expect(output).toBe('fetch(`/prefix/mock-frontend/static/locale-data/intl-${e.toLowerCase()}/${t}.json`)');
  });

  it('rewrites unquoted CSS url() references', () => {
    const input = '@font-face{src:url(/static/fonts/roboto/Roboto-Regular.woff2) format("woff2")}';
    const output = rewriteRootRelativePaths(input, '/hats', '/mock-frontend');
    expect(output).toBe('@font-face{src:url(/hats/mock-frontend/static/fonts/roboto/Roboto-Regular.woff2) format("woff2")}');
  });

  it('rewrites the bare /static/ the frontend uses for its font URLs', () => {
    const input = 'url(${(0,r.iz)(/static/)}fonts/roboto/Roboto-Thin.woff2)';
    const output = rewriteRootRelativePaths(input, '/hats', '/mock-frontend');
    expect(output).toBe('url(${(0,r.iz)("/hats/mock-frontend/static/")}fonts/roboto/Roboto-Thin.woff2)');
  });
});
