import { buildMockConnection } from './buildMockConnection';
import { MockHassStore } from './store';
import { DEMO_ENTITIES } from './demoEntities';
import { createFakeHaSocket } from './fakeHaSocket';

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
