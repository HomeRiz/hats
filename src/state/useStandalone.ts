import { useEffect, useState } from 'react';
import { checkHaAddonStatus } from '../services/haService';
import { IS_HOSTED } from '../runtime';

let pending: Promise<boolean> | null = null;

export function detectStandalone(): Promise<boolean> {
  if (IS_HOSTED) return Promise.resolve(true);
  if (!pending) pending = checkHaAddonStatus().then((status) => Boolean(status.standalone));
  return pending;
}

export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    let alive = true;
    detectStandalone().then((value) => {
      if (alive) setStandalone(value);
    });
    return () => {
      alive = false;
    };
  }, []);
  return standalone;
}
