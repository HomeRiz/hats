import { describe, expect, it } from 'vitest';
import { isLocalHost } from './hostGuard.js';

describe('isLocalHost', () => {
  it('accepts the loopback names on the app port', () => {
    expect(isLocalHost('127.0.0.1:47287', 47287)).toBe(true);
    expect(isLocalHost('localhost:47287', '47287')).toBe(true);
    expect(isLocalHost('[::1]:47287', 47287)).toBe(true);
    expect(isLocalHost('LOCALHOST:47287', 47287)).toBe(true);
  });

  it('rejects other names, other ports and a missing header', () => {
    expect(isLocalHost('evil.example:47287', 47287)).toBe(false);
    expect(isLocalHost('127.0.0.1.evil.example:47287', 47287)).toBe(false);
    expect(isLocalHost('localhost:8080', 47287)).toBe(false);
    expect(isLocalHost('localhost', 47287)).toBe(false);
    expect(isLocalHost(undefined, 47287)).toBe(false);
  });
});
