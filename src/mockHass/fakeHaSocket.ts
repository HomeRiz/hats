import type { HaWebSocket } from 'home-assistant-js-websocket';
import type { MockHassStore, MockEntityState } from './store';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSLATIONS_DIR = path.join(__dirname, '..', '..', 'vendor', 'mock-frontend', 'hass_frontend', 'static', 'translations');

const FAKE_HA_VERSION = '2026.9.0';

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

function loadTranslationResources(language: string, category?: string): Record<string, unknown> {
  if (typeof language !== 'string' || !SAFE_SEGMENT.test(language)) return {};
  if (category !== undefined && (typeof category !== 'string' || !SAFE_SEGMENT.test(category))) return {};
  try {
    const dir = category ? path.join(TRANSLATIONS_DIR, category) : TRANSLATIONS_DIR;
    if (!fs.existsSync(dir)) return {};
    const match = fs.readdirSync(dir).find((f) => f.startsWith(`${language}-`) && f.endsWith('.json'));
    if (!match) return {};
    return JSON.parse(fs.readFileSync(path.join(dir, match), 'utf8'));
  } catch {
    return {};
  }
}

function toCompactState(s: MockEntityState) {
  return {
    s: s.state,
    a: s.attributes,
    c: s.context,
    lc: Math.floor(new Date(s.last_changed).getTime() / 1000),
    lu: Math.floor(new Date(s.last_updated).getTime() / 1000),
  };
}

type WsListener = (ev: any) => void;

const EMPTY_RESULT_COMMANDS = new Set([
  'config/area_registry/list',
  'config/device_registry/list',
  'config/entity_registry/list',
  'frontend/get_user_data',
  'lovelace/dashboards/list',
  'persistent_notification/subscribe',
]);

export function createFakeHaSocket(store: MockHassStore): HaWebSocket {
  const listeners: Record<string, WsListener[]> = { open: [], message: [], close: [], error: [] };
  let closed = false;
  let eventSubscriptionId: number | null = null;
  let storeUnsubscribe: (() => void) | null = null;

  function emit(type: string, ev: any) {
    for (const l of listeners[type] || []) l(ev);
  }

  function send(payload: unknown) {
    if (closed) return;
    queueMicrotask(() => emit('message', { data: JSON.stringify(payload) }));
  }

  function handleCommand(msg: any) {
    const { id, type } = msg;
    if (type === 'get_states') {
      send({ id, type: 'result', success: true, result: store.getStates() });
      return;
    }
    if (type === 'get_config') {
      send({ id, type: 'result', success: true, result: { location_name: 'HATS Preview', version: 'mock', components: [], state: 'RUNNING' } });
      return;
    }
    if (type === 'get_panels') {
      send({ id, type: 'result', success: true, result: {} });
      return;
    }
    if (type === 'get_services') {
      send({ id, type: 'result', success: true, result: {} });
      return;
    }
    if (type === 'ping') {
      send({ id, type: 'pong' });
      return;
    }
    if (type === 'frontend/get_translations') {
      send({ id, type: 'result', success: true, result: { resources: loadTranslationResources(msg.language, msg.category) } });
      return;
    }
    if (type === 'call_service') {
      store.callService(msg.domain, msg.service, msg.service_data || {});
      send({ id, type: 'result', success: true, result: {} });
      return;
    }
    if (type === 'subscribe_events') {
      eventSubscriptionId = id;
      storeUnsubscribe = store.subscribe((states) => {
        for (const s of states) {
          send({ id: eventSubscriptionId, type: 'event', event: { event_type: 'state_changed', data: { entity_id: s.entity_id, new_state: s } } });
        }
      });
      send({ id, type: 'result', success: true, result: null });
      return;
    }
    if (type === 'subscribe_entities') {
      eventSubscriptionId = id;
      const sendSnapshot = (states: MockEntityState[]) => {
        const add: Record<string, unknown> = {};
        for (const s of states) add[s.entity_id] = toCompactState(s);
        send({ id: eventSubscriptionId, type: 'event', event: { a: add } });
      };
      storeUnsubscribe = store.subscribe(sendSnapshot);
      send({ id, type: 'result', success: true, result: null });
      sendSnapshot(store.getStates());
      return;
    }
    if (type === 'unsubscribe_events') {
      storeUnsubscribe?.();
      storeUnsubscribe = null;
      send({ id, type: 'result', success: true, result: null });
      return;
    }
    if (EMPTY_RESULT_COMMANDS.has(type)) {
      send({ id, type: 'result', success: true, result: [] });
      return;
    }
    send({ id, type: 'result', success: false, error: { code: 'unknown_command', message: `fakeHaSocket: unhandled command type "${type}"` } });
  }

  const socket: any = {
    haVersion: FAKE_HA_VERSION,
    readyState: 0,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    addEventListener(type: string, listener: WsListener) {
      (listeners[type] ||= []).push(listener);
    },
    removeEventListener(type: string, listener: WsListener) {
      listeners[type] = (listeners[type] || []).filter((l) => l !== listener);
    },
    send(data: string) {
      const msg = JSON.parse(data);
      if (msg.type === 'auth') {
        send({ type: 'auth_ok', ha_version: FAKE_HA_VERSION });
        return;
      }
      handleCommand(msg);
    },
    close() {
      closed = true;
      socket.readyState = 3;
      storeUnsubscribe?.();
      emit('close', {});
    },
  };

  queueMicrotask(() => {
    socket.readyState = 1;
    emit('open', {});
    send({ type: 'auth_required', ha_version: FAKE_HA_VERSION });
  });

  return socket as HaWebSocket;
}
