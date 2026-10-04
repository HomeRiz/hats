import { buildMockConnection } from './buildMockConnection';
import { MockHassStore } from './store';
import { DEMO_ENTITIES } from './demoEntities';
import { createFakeHaSocket } from './fakeHaSocket';
import { loadModsSequentially } from './modLoader';
import { CURATED_MOD_SLUGS } from './modSources';
import { installToolbarLock } from './toolbarLock';

const sharedStore = new MockHassStore(DEMO_ENTITIES);


const origin = window.location.origin;
try {
  window.localStorage.setItem(
    'hassTokens',
    JSON.stringify({
      access_token: 'hats-mock-access-token',
      token_type: 'Bearer',
      expires_in: 1000 * 60 * 60 * 24 * 365,
      refresh_token: 'hats-mock-refresh-token',
      hassUrl: origin,
      clientId: origin,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
    })
  );
  window.localStorage.setItem('dockedSidebar', JSON.stringify('auto'));
} catch {
}

class FakeWebSocketConstructor {
  constructor(_url?: string, _protocols?: string | string[]) {
    return createFakeHaSocket(sharedStore) as any;
  }
}
(window as any).WebSocket = FakeWebSocketConstructor;

(window as any).hassConnection = buildMockConnection(sharedStore).then(({ auth, conn }) => {
  return { auth, conn };
});
(window as any).__hatsMockStore = sharedStore;

function waitForRealHassReady(): Promise<void> {
  return new Promise((resolve) => {
    const POLL_INTERVAL_MS = 100;
    const check = () => {
      const haEl = document.querySelector('home-assistant') as (HTMLElement & { hass?: unknown }) | null;
      if (haEl?.hass) {
        resolve();
        return;
      }
      setTimeout(check, POLL_INTERVAL_MS);
    };
    check();
  });
}

waitForRealHassReady().then(() => {
  installToolbarLock(window);
  void loadModsSequentially(CURATED_MOD_SLUGS);
  window.parent.postMessage({ type: 'hats:ready' }, window.location.origin);
});

window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return;
  const data = event.data;
  if (!data || data.type !== 'hats:apply-theme') return;
  if (typeof data.themeName !== 'string' || typeof data.themeVars !== 'object' || data.themeVars === null) return;
  sharedStore.setTheme(data.themeName, data.themeVars);
});
