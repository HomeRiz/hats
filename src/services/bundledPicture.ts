export function resolveBundledPicture(imageUrl: string | undefined): string | null {
  if (!imageUrl || imageUrl.startsWith('data:') || imageUrl.startsWith('/local/')) return null;
  const hasWindow = typeof window !== 'undefined';
  const base = hasWindow ? window.location.href : 'http://localhost/';
  const origin = hasWindow ? window.location.origin : 'http://localhost';
  try {
    const resolved = new URL(imageUrl, base);
    return resolved.origin === origin ? resolved.href : null;
  } catch {
    return null;
  }
}
