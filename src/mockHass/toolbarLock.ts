const STYLE_ID = 'hats-toolbar-lock';

const LOCK_CSS = `
[slot="actionItems"],
ha-dropdown,
ha-dropdown [slot="trigger"] {
  pointer-events: none !important;
  opacity: 0.35 !important;
}
`;

const BLOCKED_PLAIN_KEYS = new Set(['e', 'c', 'd', 'a', 'm']);

function deepQuery(root: Document | ShadowRoot, tag: string): Element | null {
  const direct = root.querySelector(tag);
  if (direct) return direct;
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (el.shadowRoot) {
      const found = deepQuery(el.shadowRoot, tag);
      if (found) return found;
    }
  }
  return null;
}

export function lockToolbar(doc: Document): boolean {
  const huiRoot = deepQuery(doc, 'hui-root');
  const shadow = huiRoot?.shadowRoot;
  if (!shadow) return false;
  if (!shadow.getElementById(STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = LOCK_CSS;
    shadow.appendChild(style);
  }
  return true;
}

export function isBlockedShortcut(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey'>): boolean {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === 'k') return true;
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  return BLOCKED_PLAIN_KEYS.has(key);
}

export function installToolbarLock(win: Window, intervalMs = 500): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!isBlockedShortcut(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  win.addEventListener('keydown', onKeyDown, true);
  const timer = win.setInterval(() => lockToolbar(win.document), intervalMs);
  return () => {
    win.removeEventListener('keydown', onKeyDown, true);
    win.clearInterval(timer);
  };
}
