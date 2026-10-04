// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useLiveRenderSlot } from './useLiveRenderSlot';

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

function slotAt(top: number, width: number): HTMLDivElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ top, left: 0, width, height: 100 }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('useLiveRenderSlot', () => {
  it('reports the rectangle of the registered slot and none when released', () => {
    const { result } = renderHook(() => useLiveRenderSlot());
    expect(result.current.slotRect).toBeNull();

    act(() => result.current.registerSlot(slotAt(10, 400)));
    expect(result.current.slotRect?.width).toBe(400);

    act(() => result.current.registerSlot(null));
    expect(result.current.slotRect).toBeNull();
  });

  it('follows the new slot when one replaces another in the same update', () => {
    const { result } = renderHook(() => useLiveRenderSlot());
    act(() => result.current.registerSlot(slotAt(10, 400)));

    act(() => {
      result.current.registerSlot(null);
      result.current.registerSlot(slotAt(60, 900));
    });
    expect(result.current.slotRect?.width).toBe(900);
    expect(result.current.slotRect?.top).toBe(60);
  });
});
