import { describe, it, expect } from 'vitest';
import { Connection, createConnection, getStates, subscribeEntities } from 'home-assistant-js-websocket';
import { MockHassStore } from './store';
import { DEMO_ENTITIES } from './demoEntities';
import { createFakeHaSocket } from './fakeHaSocket';

async function connectToFakeSocket(store: MockHassStore): Promise<Connection> {
  return createConnection({
    auth: {
      expired: false,
      data: { access_token: 'mock', expires: 0, hassUrl: '', clientId: null, refresh_token: '' },
      wsUrl: 'ws://mock-frontend/',
      accessToken: 'mock',
      expires: 0,
    } as any,
    createSocket: async () => createFakeHaSocket(store),
  });
}

describe('createFakeHaSocket', () => {
  it('authenticates and returns the seeded states via a real HA WS client', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const states = await getStates(conn);
    expect(states.length).toBe(DEMO_ENTITIES.length);
    expect(states.find((s) => s.entity_id === 'light.living_room')?.state).toBe('on');
    conn.close();
  });

  it('delivers state changes to a real subscribeEntities subscription', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    let latest: Record<string, unknown> = {};
    subscribeEntities(conn, (entities) => {
      latest = entities;
    });
    await new Promise((r) => setTimeout(r, 10));
    store.callService('light', 'turn_off', { entity_id: 'light.living_room' });
    await new Promise((r) => setTimeout(r, 10));
    expect((latest['light.living_room'] as any)?.state).toBe('off');
    conn.close();
  });

  it('call_service through the real client mutates the store', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    await conn.sendMessagePromise({ type: 'call_service', domain: 'lock', service: 'unlock', service_data: { entity_id: 'lock.front_door' } });
    expect(store.getState('lock.front_door')?.state).toBe('unlocked');
    conn.close();
  });
});
