import { resolveModUrl } from './modSources';

type ImportFn = (url: string) => Promise<unknown>;

const scriptBase =
  typeof document !== 'undefined' && document.currentScript instanceof HTMLScriptElement && document.currentScript.src
    ? document.currentScript.src
    : typeof location !== 'undefined'
      ? location.href
      : '';

const defaultImportFn: ImportFn = (url) => import(/* @vite-ignore */ new URL(url, scriptBase).href);

export async function loadModsSequentially(
  slugs: string[],
  importFn: ImportFn = defaultImportFn,
): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = [];
  const failed: string[] = [];

  for (const slug of slugs) {
    const url = resolveModUrl(slug);
    if (!url) {
      failed.push(slug);
      continue;
    }
    try {
      await importFn(url);
      loaded.push(slug);
    } catch (err) {
      console.warn(`modLoader: failed to load "${slug}"`, err);
      failed.push(slug);
    }
  }

  return { loaded, failed };
}
