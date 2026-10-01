import { describe, it, expect, vi } from 'vitest';
import { loadModsSequentially } from './modLoader';

describe('loadModsSequentially', () => {
  it('loads known slugs one at a time, in order', async () => {
    const order: string[] = [];
    const importFn = vi.fn(async (url: string) => {
      order.push(url);
    });
    const result = await loadModsSequentially(['card-mod', 'bubble-card'], importFn);
    expect(result.loaded).toEqual(['card-mod', 'bubble-card']);
    expect(result.failed).toEqual([]);
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it('does not start loading the next mod until the previous import resolves', async () => {
    const resolveOrder: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const importFn = vi.fn(async (url: string) => {
      if (url === '/mock-mods/card-mod.js') {
        await firstGate;
      }
      resolveOrder.push(url);
    });
    const pending = loadModsSequentially(['card-mod', 'bubble-card'], importFn);
    await new Promise((r) => setTimeout(r, 0));
    expect(resolveOrder).toEqual([]);
    releaseFirst();
    await pending;
    expect(resolveOrder).toEqual(['/mock-mods/card-mod.js', '/mock-mods/bubble-card.js']);
  });

  it('continues the queue and reports a failure when one mod throws', async () => {
    const importFn = vi.fn(async (url: string) => {
      if (url === '/mock-mods/bubble-card.js') throw new Error('boom');
    });
    const result = await loadModsSequentially(['card-mod', 'bubble-card', 'mushroom-cards'], importFn);
    expect(result.loaded).toEqual(['card-mod', 'mushroom-cards']);
    expect(result.failed).toEqual(['bubble-card']);
  });

  it('an unknown slug is treated as a failure, not a crash', async () => {
    const importFn = vi.fn(async () => {});
    const result = await loadModsSequentially(['not-a-real-mod'], importFn);
    expect(result.failed).toEqual(['not-a-real-mod']);
    expect(importFn).not.toHaveBeenCalled();
  });

  it('an empty slug list resolves cleanly with no mods loaded', async () => {
    const importFn = vi.fn(async () => {});
    const result = await loadModsSequentially([], importFn);
    expect(result).toEqual({ loaded: [], failed: [] });
    expect(importFn).not.toHaveBeenCalled();
  });
});
