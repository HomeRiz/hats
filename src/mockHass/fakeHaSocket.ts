import type { HaWebSocket } from 'home-assistant-js-websocket';
import type { MockHassStore, MockEntityState } from './store';
import { DEMO_DASHBOARD } from './demoDashboard';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function translationsDir(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname, '..', '..', 'vendor', 'mock-frontend', 'hass_frontend', 'static', 'translations');
}

const FAKE_HA_VERSION = '2026.9.0';

const DEFAULT_DARK_THEME_VARS: Record<string, string> = {
  'primary-background-color': '#111111',
  'secondary-background-color': '#282828',
  'card-background-color': '#1c1c1c',
  'primary-text-color': '#e1e1e1',
  'secondary-text-color': '#9b9b9b',
  'disabled-text-color': '#6f6f6f',
  'divider-color': 'rgba(225, 225, 225, .12)',
  'primary-color': '#03a9f4',
  'accent-color': '#ff9800',
  'app-header-background-color': '#1c1c1c',
  'app-header-text-color': '#e1e1e1',
  'mdc-theme-surface': '#1c1c1c',
  'mdc-theme-on-surface': '#e1e1e1',
  'mdc-theme-primary': '#03a9f4',
  'mdc-theme-on-primary': '#111111',
};

const DEMO_NAV_PANEL_ORDER = ['lovelace', 'demo-energy', 'demo-history', 'demo-logbook', 'demo-map', 'demo-hacs', 'demo-hats'];

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;

function loadTranslationResources(language: string, category?: string, baseDir?: string): Record<string, unknown> {
  if (typeof language !== 'string' || !SAFE_SEGMENT.test(language)) return {};
  if (category !== undefined && (typeof category !== 'string' || !SAFE_SEGMENT.test(category))) return {};
  try {
    const base = baseDir ?? translationsDir();
    const dir = category ? path.join(base, category) : base;
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

export interface FakeHaSocketOptions {
  translationsDir?: string;
}

export function createFakeHaSocket(store: MockHassStore, options: FakeHaSocketOptions = {}): HaWebSocket {
  const listeners: Record<string, WsListener[]> = { open: [], message: [], close: [], error: [] };
  let closed = false;
  const subscriptions = new Map<number, () => void>();

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
      send({
        id,
        type: 'result',
        success: true,
        result: {
          location_name: 'HATS Preview',
          version: FAKE_HA_VERSION,
          components: [],
          state: 'RUNNING',
          unit_system: { length: 'km', mass: 'kg', temperature: '°C', volume: 'L', pressure: 'Pa', wind_speed: 'm/s', accumulated_precipitation: 'mm' },
        },
      });
      return;
    }
    if (type === 'config/entity_registry/list_for_display') {
      const entities = store.getStates().map((s) => ({
        ei: s.entity_id,
        di: null,
        ai: null,
        lb: [],
        tk: null,
        pl: 'demo',
        ec: undefined,
        hn: false,
        en: typeof s.attributes.friendly_name === 'string' ? s.attributes.friendly_name : null,
        ic: null,
        hb: false,
        dp: null,
      }));
      send({ id, type: 'result', success: true, result: { entities, entity_categories: [] } });
      return;
    }
    if (type === 'frontend/subscribe_user_data' || type === 'frontend/subscribe_system_data') {
      if (msg.key === 'sidebar') {
        const subId: number = id;
        send({ id, type: 'result', success: true, result: null });
        send({ id: subId, type: 'event', event: { value: { panelOrder: DEMO_NAV_PANEL_ORDER, hiddenPanels: [] } } });
        return;
      }
      const subId: number = id;
      send({ id, type: 'result', success: true, result: null });
      send({ id: subId, type: 'event', event: { value: null } });
      return;
    }
    if (type === 'labs/subscribe') {
      const subId: number = id;
      send({ id, type: 'result', success: true, result: null });
      send({ id: subId, type: 'event', event: { preview_feature_enabled: false } });
      return;
    }
    if (type === 'lovelace/info') {
      send({ id, type: 'result', success: true, result: { mode: 'storage', views: [] } });
      return;
    }
    if (type === 'get_panels') {
      const dashboardPanel = {
        component_name: 'lovelace',
        icon: null,
        title: null,
        config: { mode: 'auto' },
        url_path: 'lovelace',
      };
      const demoNavPanel = (urlPath: string, title: string, icon: string) => ({
        component_name: 'lovelace',
        icon,
        title,
        config: { mode: 'auto' },
        url_path: urlPath,
      });
      const homePanel = { ...demoNavPanel('demo-home', 'Home', 'mdi:home'), url_path: 'lovelace' };
      send({
        id,
        type: 'result',
        success: true,
        result: {
          lovelace: dashboardPanel,
          home: dashboardPanel,
          'demo-home': homePanel,
          'demo-energy': demoNavPanel('demo-energy', 'Energy', 'mdi:lightning-bolt'),
          'demo-history': demoNavPanel('demo-history', 'History', 'mdi:history'),
          'demo-logbook': demoNavPanel('demo-logbook', 'Logbook', 'mdi:format-list-bulleted'),
          'demo-map': demoNavPanel('demo-map', 'Map', 'mdi:map'),
          'demo-hacs': demoNavPanel('demo-hacs', 'HACS', 'mdi:storefront'),
          'demo-hats': demoNavPanel('demo-hats', 'HATS', 'mdi:hat-fedora'),
        },
      });
      return;
    }
    if (type === 'get_services') {
      send({ id, type: 'result', success: true, result: {} });
      return;
    }
    if (type === 'auth/current_user') {
      send({
        id,
        type: 'result',
        success: true,
        result: {
          id: 'hats-preview-user',
          name: 'HATS Preview',
          is_owner: true,
          is_admin: true,
          credentials: [],
          mfa_modules: [],
        },
      });
      return;
    }
    if (type === 'ping') {
      send({ id, type: 'pong' });
      return;
    }
    if (type === 'frontend/get_translations') {
      send({ id, type: 'result', success: true, result: { resources: loadTranslationResources(msg.language, msg.category, options.translationsDir) } });
      return;
    }
    if (type === 'call_service') {
      store.callService(msg.domain, msg.service, msg.service_data || {});
      send({ id, type: 'result', success: true, result: {} });
      return;
    }
    if (type === 'subscribe_events') {
      const eventType = msg.event_type;
      if (eventType === undefined || eventType === 'state_changed') {
        const subId: number = id;
        subscriptions.set(
          subId,
          store.subscribe((states) => {
            for (const s of states) {
              send({ id: subId, type: 'event', event: { event_type: 'state_changed', data: { entity_id: s.entity_id, new_state: s } } });
            }
          })
        );
      } else if (eventType === 'themes_updated') {
        const subId: number = id;
        subscriptions.set(
          subId,
          store.subscribeTheme(() => {
            send({ id: subId, type: 'event', event: { event_type: 'themes_updated', data: {} } });
          })
        );
      }
      send({ id, type: 'result', success: true, result: null });
      return;
    }
    if (type === 'subscribe_entities') {
      const subId: number = id;
      const sendSnapshot = (states: MockEntityState[]) => {
        const add: Record<string, unknown> = {};
        for (const s of states) add[s.entity_id] = toCompactState(s);
        send({ id: subId, type: 'event', event: { a: add } });
      };
      subscriptions.set(subId, store.subscribe(sendSnapshot));
      send({ id, type: 'result', success: true, result: null });
      sendSnapshot(store.getStates());
      return;
    }
    if (type === 'unsubscribe_events') {
      const unsubscribe = subscriptions.get(msg.subscription);
      unsubscribe?.();
      subscriptions.delete(msg.subscription);
      send({ id, type: 'result', success: true, result: null });
      return;
    }
    if (type === 'frontend/get_themes') {
      const current = store.getTheme();
      const themeVars = { ...DEFAULT_DARK_THEME_VARS, ...(current?.vars ?? {}) };
      send({
        id,
        type: 'result',
        success: true,
        result: { themes: { [current?.name ?? 'default']: themeVars }, default_theme: current?.name ?? 'default' },
      });
      return;
    }
    if (type === 'lovelace/config') {
      send({ id, type: 'result', success: true, result: DEMO_DASHBOARD });
      return;
    }
    if (type === 'lovelace/resources') {
      send({ id, type: 'result', success: true, result: [] });
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
      for (const unsubscribe of subscriptions.values()) unsubscribe();
      subscriptions.clear();
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
