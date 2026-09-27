import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { LiveDashboardSnapshot } from '../types/liveDashboard';
import { mapAreasToTiles, mapViewTabsToNavItems } from './liveDashboardMapper';
import type { LiveTile, LiveNavItem } from './liveDashboardMapper';
import { getApiUrl } from './haService';

export interface LiveDashboardData {
  available: boolean;
  loading: boolean;
  viewNavItems: LiveNavItem[];
  activeViewId: string | null;
  setActiveViewId: (id: string) => void;
  tiles: LiveTile[];
  refresh: () => void;
}

const EMPTY_SNAPSHOT: LiveDashboardSnapshot = { available: false, viewTabs: [], areas: [] };

let sharedSnapshotPromise: Promise<LiveDashboardSnapshot> | null = null;

function fetchSnapshot(): Promise<LiveDashboardSnapshot> {
  return fetch(getApiUrl('api/ha/live-dashboard'))
    .then((res) => (res.ok ? res.json() : EMPTY_SNAPSHOT))
    .catch(() => ({ ...EMPTY_SNAPSHOT, reason: 'network-error' }));
}

function getSharedSnapshot(forceRefresh: boolean): Promise<LiveDashboardSnapshot> {
  if (forceRefresh || !sharedSnapshotPromise) {
    sharedSnapshotPromise = fetchSnapshot();
  }
  return sharedSnapshotPromise;
}

export function __resetLiveDashboardCache(): void {
  if (import.meta.env.MODE !== 'test') return;
  sharedSnapshotPromise = null;
}

export function useLiveDashboardData(): LiveDashboardData {
  const [snapshot, setSnapshot] = useState<LiveDashboardSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [activeViewId, setActiveViewIdState] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback((forceRefresh: boolean) => {
    setLoading(true);
    getSharedSnapshot(forceRefresh).then((snap) => {
      if (!mountedRef.current) return;
      setSnapshot(snap);
      setLoading(false);
      setActiveViewIdState((prev) => prev ?? snap.viewTabs[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load(false);
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const viewNavItems = useMemo(() => mapViewTabsToNavItems(snapshot.viewTabs), [snapshot]);
  const tiles = useMemo(() => mapAreasToTiles(snapshot.areas), [snapshot]);
  const refresh = useCallback(() => load(true), [load]);

  return {
    available: snapshot.available,
    loading,
    viewNavItems,
    activeViewId,
    setActiveViewId: setActiveViewIdState,
    tiles,
    refresh,
  };
}
