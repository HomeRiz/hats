import { resolveModUrl } from './modSources';

type ImportFn = (url: string) => Promise<unknown>;

const defaultImportFn: ImportFn = (url) => import(/* @vite-ignore */ url);

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
