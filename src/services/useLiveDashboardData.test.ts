// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLiveDashboardData, __resetLiveDashboardCache } from './useLiveDashboardData';

const SNAPSHOT_RESPONSE = {
  available: true,
  viewTabs: [
    { id: 'lovelace::default_view', title: 'Home' },
    { id: 'lovelace::rooms', title: 'Rooms' },
  ],
  areas: [
    {
      id: 'living_room',
      name: 'Living Room',
      entities: [
        { entityId: 'light.living_room', name: 'Living Room Light', domain: 'light', state: 'on' },
      ],
    },
  ],
  panels: [
    { id: 'smart-home', title: 'Smart Home', icon: 'mdi:home-automation', component: 'lovelace' },
  ],
};

describe('useLiveDashboardData', () => {
  beforeEach(() => {
    __resetLiveDashboardCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(SNAPSHOT_RESPONSE),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts loading, then exposes the mapped snapshot', async () => {
    const { result } = renderHook(() => useLiveDashboardData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(true);
    expect(result.current.viewNavItems).toEqual([
      { id: 'lovelace::default_view', label: 'Home' },
      { id: 'lovelace::rooms', label: 'Rooms' },
    ]);
    expect(result.current.panels).toEqual([
      { id: 'smart-home', title: 'Smart Home', icon: 'mdi:home-automation', component: 'lovelace' },
    ]);
    expect(result.current.tileGroups).toEqual([
      {
        id: 'living_room',
        name: 'Living Room',
        tiles: [
          {
            id: 'light.living_room',
            title: 'Living Room Light',
            stateText: 'On',
            domain: 'light',
            isActive: true,
            iconKey: 'light',
          },
        ],
      },
    ]);
  });

  it('filters tileGroups by the active tab title, and re-filters when the active tab changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            available: true,
            viewTabs: [
              { id: 'lovelace::default_view', title: 'Home' },
              { id: 'lovelace::climate', title: 'Climate' },
            ],
            areas: [
              {
                id: 'living_room',
                name: 'Living Room',
                entities: [
                  { entityId: 'climate.living_room', name: 'Living Room Thermostat', domain: 'climate', state: 'heat' },
                  { entityId: 'light.living_room', name: 'Living Room Light', domain: 'light', state: 'on' },
                ],
              },
            ],
          }),
      })
    );

    const { result } = renderHook(() => useLiveDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tileGroups[0].tiles).toHaveLength(2);

    act(() => result.current.setActiveViewId('lovelace::climate'));

    expect(result.current.tileGroups[0].tiles.map((t) => t.id)).toEqual(['climate.living_room']);
  });

  it('defaults activeViewId to the first view tab', async () => {
    const { result } = renderHook(() => useLiveDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeViewId).toBe('lovelace::default_view');
  });

  it('setActiveViewId updates activeViewId', async () => {
    const { result } = renderHook(() => useLiveDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setActiveViewId('lovelace::rooms'));

    expect(result.current.activeViewId).toBe('lovelace::rooms');
  });

  it('surfaces available: false without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: false, reason: 'no-supervisor-token', viewTabs: [], areas: [] }),
      })
    );

    const { result } = renderHook(() => useLiveDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.available).toBe(false);
    expect(result.current.tileGroups).toEqual([]);
  });

  it('dedupes concurrent hook instances into a single fetch', async () => {
    const a = renderHook(() => useLiveDashboardData());
    const b = renderHook(() => useLiveDashboardData());

    await waitFor(() => expect(a.result.current.loading).toBe(false));
    await waitFor(() => expect(b.result.current.loading).toBe(false));

    expect(vi.mocked(globalThis.fetch).mock.calls).toHaveLength(1);
  });

  it('refresh() triggers a new fetch', async () => {
    const { result } = renderHook(() => useLiveDashboardData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(vi.mocked(globalThis.fetch).mock.calls).toHaveLength(1);

    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(vi.mocked(globalThis.fetch).mock.calls).toHaveLength(2);
  });
});
