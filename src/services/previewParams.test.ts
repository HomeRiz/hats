import { describe, expect, it } from 'vitest';
import { parsePreviewParams, pickRequestedTheme } from './previewParams';

describe('parsePreviewParams', () => {
  it('accepts an owner/repo slug with branch and theme', () => {
    expect(parsePreviewParams('?repo=basnijholt/lovelace-ios-themes&branch=main&theme=iOS%20Dark')).toEqual({
      repo: 'basnijholt/lovelace-ios-themes',
      branch: 'main',
      theme: 'iOS Dark',
    });
  });

  it('accepts github and raw.githubusercontent links', () => {
    expect(parsePreviewParams('?repo=https://github.com/a/b')?.repo).toBe('https://github.com/a/b');
    expect(parsePreviewParams('?repo=https://raw.githubusercontent.com/a/b/main/themes/x.yaml')).not.toBeNull();
  });

  it('rejects other hosts, other schemes and credentials', () => {
    expect(parsePreviewParams('?repo=https://evil.example/a/b')).toBeNull();
    expect(parsePreviewParams('?repo=http://github.com/a/b')).toBeNull();
    expect(parsePreviewParams('?repo=javascript:alert(1)')).toBeNull();
    expect(parsePreviewParams('?repo=https://user:pw@github.com/a/b')).toBeNull();
    expect(parsePreviewParams('?repo=https://github.com.evil.example/a/b')).toBeNull();
  });

  it('rejects a missing repo and malformed slugs', () => {
    expect(parsePreviewParams('')).toBeNull();
    expect(parsePreviewParams('?theme=x')).toBeNull();
    expect(parsePreviewParams('?repo=just-a-name')).toBeNull();
    expect(parsePreviewParams('?repo=../../etc/passwd')).toBeNull();
  });

  it('drops an unsafe branch but keeps the request', () => {
    const r = parsePreviewParams('?repo=a/b&branch=../x');
    expect(r).toEqual({ repo: 'a/b' });
    expect(parsePreviewParams('?repo=a/b&branch=feature/new-look')?.branch).toBe('feature/new-look');
    expect(parsePreviewParams('?repo=a/b&branch=a%20b')?.branch).toBeUndefined();
  });
});

describe('pickRequestedTheme', () => {
  const themes = [
    { id: 'one', name: 'One' },
    { id: 'two', name: 'Two Dark' },
  ];

  it('matches by name or id, ignoring case, and falls back to the first', () => {
    expect(pickRequestedTheme(themes, 'two dark')?.id).toBe('two');
    expect(pickRequestedTheme(themes, 'ONE')?.id).toBe('one');
    expect(pickRequestedTheme(themes, 'missing')?.id).toBe('one');
    expect(pickRequestedTheme(themes)?.id).toBe('one');
    expect(pickRequestedTheme([], 'x')).toBeUndefined();
  });
});
