import { createConnection } from 'home-assistant-js-websocket';
import { MockHassStore } from './store';
import { DEMO_ENTITIES } from './demoEntities';
import { createFakeHaSocket } from './fakeHaSocket';

export async function buildMockConnection(store: MockHassStore = new MockHassStore(DEMO_ENTITIES)) {
  const auth = {
    expired: false,
    data: { access_token: 'mock', expires: 0, hassUrl: '', clientId: null, refresh_token: '' },
    wsUrl: 'ws://mock-frontend/',
    accessToken: 'mock',
    expires: 0,
  } as any;
  const conn = await createConnection({
    auth,
    createSocket: async () => createFakeHaSocket(store),
  });
  return { auth, conn, store };
}
