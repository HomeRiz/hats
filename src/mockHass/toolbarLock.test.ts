// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { isBlockedShortcut, lockToolbar } from './toolbarLock';

describe('lockToolbar', () => {
  it('adds the lock style to the dashboard header once', () => {
    const host = document.createElement('hui-root');
    host.attachShadow({ mode: 'open' });
    document.body.appendChild(host);
    expect(lockToolbar(document)).toBe(true);
    expect(lockToolbar(document)).toBe(true);
    const styles = host.shadowRoot!.querySelectorAll('#hats-toolbar-lock');
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain('actionItems');
    host.remove();
  });

  it('finds the header inside nested shadow roots', () => {
    const outer = document.createElement('div');
    outer.attachShadow({ mode: 'open' });
    const huiRoot = document.createElement('hui-root');
    huiRoot.attachShadow({ mode: 'open' });
    outer.shadowRoot!.appendChild(huiRoot);
    document.body.appendChild(outer);
    expect(lockToolbar(document)).toBe(true);
    expect(huiRoot.shadowRoot!.getElementById('hats-toolbar-lock')).not.toBeNull();
    outer.remove();
  });

  it('reports false while the header has not rendered yet', () => {
    expect(lockToolbar(document)).toBe(false);
  });
});

describe('isBlockedShortcut', () => {
  const key = (k: string, mods: Partial<KeyboardEvent> = {}) => ({ key: k, metaKey: false, ctrlKey: false, altKey: false, ...mods });

  it('blocks the search and command shortcuts', () => {
    expect(isBlockedShortcut(key('k', { metaKey: true }))).toBe(true);
    expect(isBlockedShortcut(key('K', { ctrlKey: true }))).toBe(true);
    for (const k of ['e', 'c', 'd', 'a', 'm']) expect(isBlockedShortcut(key(k))).toBe(true);
  });

  it('leaves other keys alone', () => {
    expect(isBlockedShortcut(key('ArrowRight'))).toBe(false);
    expect(isBlockedShortcut(key('Enter'))).toBe(false);
    expect(isBlockedShortcut(key('e', { metaKey: true }))).toBe(false);
  });
});
