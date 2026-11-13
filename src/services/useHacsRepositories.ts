import { useEffect, useState } from 'react';
import { getApiUrl } from './haService';

export interface HacsRepository {
  id: string;
  fullName: string;
  domain: string;
  category: string;
  installed: boolean;
}

export interface HacsRepositoriesData {
  available: boolean;
  source: 'marketplace' | 'hacs' | null;
  loading: boolean;
  repositories: HacsRepository[];
}

const EMPTY: { available: boolean; source: 'marketplace' | 'hacs' | null; repositories: HacsRepository[] } = {
  available: false,
  source: null,
  repositories: [],
};

export function useHacsRepositories(enabled: boolean): HacsRepositoriesData {
  const [data, setData] = useState<{ available: boolean; source: 'marketplace' | 'hacs' | null; repositories: HacsRepository[] }>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    fetch(getApiUrl('api/ha/hacs-repositories'))
      .then((res) => (res.ok ? res.json() : EMPTY))
      .catch(() => EMPTY)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { available: data.available, source: data.source ?? null, loading, repositories: data.repositories };
}
