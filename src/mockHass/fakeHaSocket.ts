import type { HaWebSocket } from 'home-assistant-js-websocket';
import type { MockHassStore } from './store';

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
    haVersion: 'mock',
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
        send({ type: 'auth_ok', ha_version: 'mock' });
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
    send({ type: 'auth_required', ha_version: 'mock' });
  });

  return socket as HaWebSocket;
}
