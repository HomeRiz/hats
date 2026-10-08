import { getApiUrl } from './haService';

export interface LibrarySaveResult {
  folder: string;
  file: string;
}

async function post(yamlText: string, imageDataUrl?: string): Promise<LibrarySaveResult | null> {
  const res = await fetch(getApiUrl('api/standalone/save-import'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-HATS-Request': '1' },
    body: JSON.stringify({ yamlText, imageDataUrl }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.saved ? { folder: String(body.folder), file: String(body.file) } : null;
}

export async function saveImportToLibrary(yamlText: string, imageDataUrl?: string): Promise<LibrarySaveResult | null> {
  try {
    const withImage = imageDataUrl ? await post(yamlText, imageDataUrl) : null;
    return withImage ?? (await post(yamlText));
  } catch {
    return null;
  }
}
