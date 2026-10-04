import { useCallback, useState } from 'react';

export type StylingEngine = 'card-mod' | 'uix';

const STORAGE_KEY = 'hats_styling_engine_v1';

export const UIX_REPO_URL = 'https://github.com/Lint-Free-Technology/uix';

function loadPreference(): StylingEngine | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'uix' || saved === 'card-mod' ? saved : null;
  } catch {
    return null;
  }
}

export function useStylingEngine(detected: 'card-mod' | 'uix' | 'both' | 'none' | undefined) {
  const [preference, setPreference] = useState<StylingEngine | null>(loadPreference);

  const engine: StylingEngine = preference ?? (detected === 'uix' ? 'uix' : 'card-mod');

  const setEngine = useCallback((next: StylingEngine) => {
    setPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
    }
  }, []);

  return { engine, setEngine };
}
