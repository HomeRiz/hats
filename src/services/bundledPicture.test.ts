import { describe, it, expect } from 'vitest';
import { resolveBundledPicture } from './bundledPicture';

describe('resolveBundledPicture', () => {
  it('resolves a relative path against the app address', () => {
    expect(resolveBundledPicture('./assets/a.jpg')).toBe('http://localhost/assets/a.jpg');
    expect(resolveBundledPicture('/assets/a.jpg')).toBe('http://localhost/assets/a.jpg');
  });

  it('accepts a full address on the app origin', () => {
    expect(resolveBundledPicture('http://localhost/api/hassio_ingress/x/assets/a.jpg')).toBe(
      'http://localhost/api/hassio_ingress/x/assets/a.jpg',
    );
  });

  it('rejects remote, embedded, Home Assistant and empty pictures', () => {
    expect(resolveBundledPicture('https://example.com/a.jpg')).toBeNull();
    expect(resolveBundledPicture('http://other.example/a.jpg')).toBeNull();
    expect(resolveBundledPicture('data:image/png;base64,AAAA')).toBeNull();
    expect(resolveBundledPicture('/local/hats/backgrounds/x/default.webp')).toBeNull();
    expect(resolveBundledPicture(undefined)).toBeNull();
    expect(resolveBundledPicture('')).toBeNull();
  });
});
