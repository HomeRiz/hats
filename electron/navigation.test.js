import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const { isSameOrigin } = createRequire(import.meta.url)('./navigation.cjs');
const ORIGIN = 'http://127.0.0.1:47287';

describe('isSameOrigin', () => {
  it('accepts pages of the app', () => {
    expect(isSameOrigin('http://127.0.0.1:47287/', ORIGIN)).toBe(true);
    expect(isSameOrigin('http://127.0.0.1:47287/index.html?x=1#y', ORIGIN)).toBe(true);
  });

  it('rejects addresses that only start with the origin', () => {
    expect(isSameOrigin('http://127.0.0.1:47287@evil.example/', ORIGIN)).toBe(false);
    expect(isSameOrigin('http://127.0.0.1:472871/', ORIGIN)).toBe(false);
    expect(isSameOrigin('http://127.0.0.1:47287.evil.example/', ORIGIN)).toBe(false);
  });

  it('rejects other schemes, hosts and text that is not a url', () => {
    expect(isSameOrigin('https://127.0.0.1:47287/', ORIGIN)).toBe(false);
    expect(isSameOrigin('file:///etc/passwd', ORIGIN)).toBe(false);
    expect(isSameOrigin('not a url', ORIGIN)).toBe(false);
  });
});
