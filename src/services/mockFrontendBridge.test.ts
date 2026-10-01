// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { applyThemeToLivePreview } from './mockFrontendBridge';

function fakeIframeWithPostMessage(postMessage: ((...args: any[]) => void) | null): HTMLIFrameElement {
  return {
    contentWindow: postMessage ? { postMessage } : null,
  } as any as HTMLIFrameElement;
}

describe('applyThemeToLivePreview', () => {
  it('posts the theme to the iframe on the real origin and returns true', () => {
    const postMessage = vi.fn();
    const iframe = fakeIframeWithPostMessage(postMessage);
    const ok = applyThemeToLivePreview(iframe, 'candidate', { 'primary-color': '#f00' });
    expect(ok).toBe(true);
    expect(postMessage).toHaveBeenCalledTimes(1);
    const [message, targetOrigin] = postMessage.mock.calls[0];
    expect(message).toEqual({ type: 'hats:apply-theme', themeName: 'candidate', themeVars: { 'primary-color': '#f00' } });
    expect(targetOrigin).toBe(window.location.origin);
  });

  it('returns false without throwing when iframe is null', () => {
    expect(applyThemeToLivePreview(null, 'candidate', {})).toBe(false);
  });

  it('returns false without throwing when contentWindow is not accessible', () => {
    const iframe = fakeIframeWithPostMessage(null);
    expect(applyThemeToLivePreview(iframe, 'candidate', {})).toBe(false);
  });

  it('returns false without throwing when postMessage itself throws (not yet navigated / inaccessible)', () => {
    const iframe = fakeIframeWithPostMessage(() => {
      throw new Error('not ready');
    });
    expect(applyThemeToLivePreview(iframe, 'candidate', {})).toBe(false);
  });
});
