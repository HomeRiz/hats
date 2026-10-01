export function applyThemeToLivePreview(
  iframe: HTMLIFrameElement | null,
  themeName: string,
  themeVars: Record<string, string>,
): boolean {
  try {
    const win = iframe?.contentWindow;
    if (!win || typeof win.postMessage !== 'function') return false;
    win.postMessage({ type: 'hats:apply-theme', themeName, themeVars }, window.location.origin);
    return true;
  } catch {
    return false;
  }
}
