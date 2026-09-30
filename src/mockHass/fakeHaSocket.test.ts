import { describe, it, expect } from 'vitest';
import { Connection, createConnection, getStates, subscribeEntities } from 'home-assistant-js-websocket';
import { MockHassStore } from './store';
import { DEMO_ENTITIES } from './demoEntities';
import { createFakeHaSocket } from './fakeHaSocket';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_DIR = path.join(__dirname, '..', '..', 'vendor', 'mock-frontend', 'hass_frontend', 'static', 'translations');

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

describe('createFakeHaSocket - completion', () => {
  it('responds to ping with pong', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    await expect(conn.ping()).resolves.toBeUndefined();
    conn.close();
  });

  it('reports a real, parseable haVersion, not "mock"', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    expect(conn.haVersion).not.toBe('mock');
    expect(conn.haVersion).toMatch(/^\d{4}\.\d+/);
    conn.close();
  });

  it('returns real translation resources for a category that exists on disk', async () => {
    if (!fs.existsSync(TRANSLATIONS_DIR)) {
      console.warn('translations not extracted - run ./scripts/fetch-mock-frontend.sh first, skipping');
      return;
    }
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const result: any = await conn.sendMessagePromise({ type: 'frontend/get_translations', language: 'en', category: 'app' });
    expect(result.resources).toBeTruthy();
    expect(Object.keys(result.resources).length).toBeGreaterThan(0);
    conn.close();
  });

  it('returns empty resources for a category with no matching file, does not throw', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const result: any = await conn.sendMessagePromise({ type: 'frontend/get_translations', language: 'xx', category: 'not-a-real-category' });
    expect(result.resources).toEqual({});
    conn.close();
  });

  it('rejects a path-traversal category without reading outside TRANSLATIONS_DIR', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const result: any = await conn.sendMessagePromise({
      type: 'frontend/get_translations',
      language: 'en',
      category: '../../../../../../../../etc',
    });
    expect(result.resources).toEqual({});
    conn.close();
  });

  it('rejects a path-traversal language without reading outside TRANSLATIONS_DIR', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const result: any = await conn.sendMessagePromise({
      type: 'frontend/get_translations',
      language: '../../../../../../../../etc/passwd',
      category: 'app',
    });
    expect(result.resources).toEqual({});
    conn.close();
  });
});

describe('createFakeHaSocket - themes and lovelace', () => {
  it('frontend/get_themes returns the store\'s current theme', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    store.setTheme('candidate', { 'primary-color': '#f00' });
    const conn = await connectToFakeSocket(store);
    const result: any = await conn.sendMessagePromise({ type: 'frontend/get_themes' });
    expect(result.themes.candidate).toEqual({ 'primary-color': '#f00' });
    conn.close();
  });

  it('lovelace/config returns a single default view referencing demo entities', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const result: any = await conn.sendMessagePromise({ type: 'lovelace/config' });
    expect(result.views.length).toBeGreaterThan(0);
    conn.close();
  });

  it('lovelace/resources returns an array (empty until mod loading exists)', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const result: any = await conn.sendMessagePromise({ type: 'lovelace/resources' });
    expect(Array.isArray(result)).toBe(true);
    conn.close();
  });
});
