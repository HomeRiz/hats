import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Connection, createConnection, getStates, subscribeEntities } from 'home-assistant-js-websocket';
import { MockHassStore } from './store';
import { DEMO_ENTITIES } from './demoEntities';
import { createFakeHaSocket } from './fakeHaSocket';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_DIR = path.join(__dirname, '..', '..', 'vendor', 'mock-frontend', 'hass_frontend', 'static', 'translations');

async function connectToFakeSocket(store: MockHassStore, translationsDir?: string): Promise<Connection> {
  return createConnection({
    auth: {
      expired: false,
      data: { access_token: 'mock', expires: 0, hassUrl: '', clientId: null, refresh_token: '' },
      wsUrl: 'ws://mock-frontend/',
      accessToken: 'mock',
      expires: 0,
    } as any,
    createSocket: async () => createFakeHaSocket(store, { translationsDir }),
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

describe('createFakeHaSocket - concurrent subscriptions', () => {
  it('routes each subscription\'s events to its own id (entities + an unrelated event type)', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    let latest: Record<string, any> = {};
    subscribeEntities(conn, (entities) => {
      latest = entities;
    });
    await new Promise((r) => setTimeout(r, 10));
    const otherEvents: any[] = [];
    await conn.subscribeEvents((ev) => otherEvents.push(ev), 'core_config_updated');
    await new Promise((r) => setTimeout(r, 10));
    store.callService('light', 'turn_off', { entity_id: 'light.living_room' });
    await new Promise((r) => setTimeout(r, 10));
    expect(latest['light.living_room']?.state).toBe('off');
    expect(otherEvents).toEqual([]);
    conn.close();
  });

  it('unsubscribing one state_changed subscription leaves the others delivering', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const a: any[] = [];
    const b: any[] = [];
    await conn.subscribeEvents((ev) => a.push(ev), 'state_changed');
    const unsubB = await conn.subscribeEvents((ev) => b.push(ev), 'state_changed');
    await unsubB();
    store.callService('light', 'turn_off', { entity_id: 'light.living_room' });
    await new Promise((r) => setTimeout(r, 10));
    expect(b).toEqual([]);
    expect(a.some((ev) => ev.event_type === 'state_changed' && ev.data.entity_id === 'light.living_room')).toBe(true);
    conn.close();
  });

  it('unsubscribing a non-state_changed subscription still acks successfully', async () => {
    const store = new MockHassStore(DEMO_ENTITIES);
    const conn = await connectToFakeSocket(store);
    const unsub = await conn.subscribeEvents(() => {}, 'core_config_updated');
    await unsub();
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

  it.skipIf(!fs.existsSync(TRANSLATIONS_DIR))('returns real translation resources for a category that exists on disk', async () => {
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

});

describe('createFakeHaSocket - translation path safety', () => {
  let tmpRoot: string;
  let translationsDir: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hats-fake-socket-test-'));
    translationsDir = path.join(tmpRoot, 'translations');
    fs.mkdirSync(path.join(translationsDir, 'app'), { recursive: true });
    fs.writeFileSync(path.join(translationsDir, 'app', 'en-good.json'), '{"ok":true}');
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('control: a safe language/category reads from the injected dir', async () => {
    const conn = await connectToFakeSocket(new MockHassStore(DEMO_ENTITIES), translationsDir);
    const result: any = await conn.sendMessagePromise({ type: 'frontend/get_translations', language: 'en', category: 'app' });
    expect(result.resources).toEqual({ ok: true });
    conn.close();
  });

  it('rejects a path-traversal category without reading outside the translations dir', async () => {
    fs.writeFileSync(path.join(tmpRoot, 'en-bait.json'), '{"leaked":true}');
    const conn = await connectToFakeSocket(new MockHassStore(DEMO_ENTITIES), translationsDir);
    const result: any = await conn.sendMessagePromise({ type: 'frontend/get_translations', language: 'en', category: '..' });
    expect(result.resources).toEqual({});
    conn.close();
  });

  it('rejects an unsafe language value', async () => {
    fs.writeFileSync(path.join(translationsDir, 'app', '..-bait.json'), '{"leaked":true}');
    const conn = await connectToFakeSocket(new MockHassStore(DEMO_ENTITIES), translationsDir);
    const result: any = await conn.sendMessagePromise({ type: 'frontend/get_translations', language: '..', category: 'app' });
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
