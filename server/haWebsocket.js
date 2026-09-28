import WS from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WS;
}

import {
  createConnection,
  createLongLivedTokenAuth,
} from 'home-assistant-js-websocket';

const SUPERVISOR_ROOT = process.env.HATS_SUPERVISOR_URL || 'http://supervisor';

const SUPERVISOR_WS_URL = `${SUPERVISOR_ROOT.replace(/^http/, 'ws')}/core/websocket`;

const SUPERVISOR_HASS_URL = `${SUPERVISOR_ROOT}/core`;

const CONNECT_TIMEOUT_MS = 5000;

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const EMPTY_SNAPSHOT = { available: false, viewTabs: [], areas: [], panels: [] };

export async function fetchLiveDashboardSnapshot(supervisorToken) {
  return withHaConnection(supervisorToken, EMPTY_SNAPSHOT, async (connection) => {
    const [dashboards, areaRegistry, deviceRegistry, entityRegistry, states, panels, sidebarOrder, sidebarHidden] =
      await withTimeout(
        Promise.all([
          connection.sendMessagePromise({ type: 'lovelace/dashboards/list' }),
          connection.sendMessagePromise({ type: 'config/area_registry/list' }),
          connection.sendMessagePromise({ type: 'config/device_registry/list' }),
          connection.sendMessagePromise({ type: 'config/entity_registry/list' }),
          connection.sendMessagePromise({ type: 'get_states' }),
          connection.sendMessagePromise({ type: 'get_panels' }),
          connection.sendMessagePromise({ type: 'frontend/get_user_data', key: 'sidebar-panel-order' }),
          connection.sendMessagePromise({ type: 'frontend/get_user_data', key: 'sidebar-panel-hidden' }),
        ]),
        CONNECT_TIMEOUT_MS,
        'ha-websocket-fetch-timeout'
      );

    const viewTabs = await withTimeout(
      fetchViewTabs(connection, dashboards),
      CONNECT_TIMEOUT_MS,
      'ha-websocket-view-tabs-timeout'
    );
    const areas = buildAreas(areaRegistry, deviceRegistry, entityRegistry, states);
    const panelList = buildPanelList(panels, sidebarHidden?.value, sidebarOrder?.value);

    return { available: true, viewTabs, areas, panels: panelList };
  });
}

const EMPTY_HACS_SNAPSHOT = { available: false, repositories: [] };

export async function fetchHacsRepositories(supervisorToken) {
  return withHaConnection(supervisorToken, EMPTY_HACS_SNAPSHOT, async (connection) => {
    const repos = await withTimeout(
      connection.sendMessagePromise({ type: 'hacs/repositories/list' }),
      CONNECT_TIMEOUT_MS,
      'ha-websocket-hacs-fetch-timeout'
    );
    return {
      available: true,
      repositories: repos.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        domain: r.domain,
        category: r.category,
        installed: Boolean(r.installed),
      })),
    };
  });
}

async function withHaConnection(supervisorToken, emptyResult, fn) {
  if (!supervisorToken) {
    return { ...emptyResult, reason: 'no-supervisor-token' };
  }

  let connection;
  try {
    const auth = createLongLivedTokenAuth(SUPERVISOR_HASS_URL, supervisorToken);
    Object.defineProperty(auth, 'wsUrl', { value: SUPERVISOR_WS_URL });

    let connectTimedOut = false;
    const connectionPromise = createConnection({ auth, connectTimeout: CONNECT_TIMEOUT_MS });
    connectionPromise.then(
      (lateConnection) => {
        if (connectTimedOut) lateConnection.close();
      },
      () => {}
    );

    try {
      connection = await withTimeout(
        connectionPromise,
        CONNECT_TIMEOUT_MS,
        'ha-websocket-connect-timeout'
      );
    } catch (err) {
      if (err && err.message === 'ha-websocket-connect-timeout') connectTimedOut = true;
      throw err;
    }

    return await fn(connection);
  } catch (err) {
    return { ...emptyResult, reason: (err && err.message) || 'unknown-error' };
  } finally {
    if (connection) connection.close();
  }
}

async function fetchViewTabs(connection, dashboards) {
  const targets = [{ id: 'lovelace', url_path: null }, ...dashboards];
  const tabs = [];
  for (const dashboard of targets) {
    try {
      const config = await connection.sendMessagePromise(
        dashboard.url_path
          ? { type: 'lovelace/config', url_path: dashboard.url_path }
          : { type: 'lovelace/config' }
      );
      (config.views || []).forEach((view, index) => {
        tabs.push({
          id: `${dashboard.id || dashboard.url_path || 'lovelace'}::${view.path || view.title || 'view'}::${index}`,
          title: view.title || 'Home',
        });
      });
    } catch {
    }
  }
  return tabs;
}

export function buildAreas(areaRegistry, deviceRegistry, entityRegistry, states) {
  const stateById = new Map(states.map((s) => [s.entity_id, s]));
  const deviceAreaById = new Map(
    deviceRegistry.filter((d) => d.area_id).map((d) => [d.id, d.area_id])
  );
  const areasById = new Map(
    areaRegistry.map((a) => [a.area_id, { id: a.area_id, name: a.name, entities: [] }])
  );

  for (const entry of entityRegistry) {
    if (entry.disabled_by || entry.hidden_by || entry.entity_category) continue;

    const areaId = entry.area_id || deviceAreaById.get(entry.device_id);
    const area = areaId ? areasById.get(areaId) : undefined;
    if (!area) continue;

    const state = stateById.get(entry.entity_id);
    if (!state) continue;

    area.entities.push({
      entityId: entry.entity_id,
      name: state.attributes?.friendly_name || entry.entity_id,
      domain: entry.entity_id.split('.')[0],
      state: state.state,
      unit: state.attributes?.unit_of_measurement,
    });
  }

  return Array.from(areasById.values()).filter((a) => a.entities.length > 0);
}

const DEFAULT_HIDDEN_PANEL_IDS = new Set([
  'config',
  'lovelace',
  'history',
  'logbook',
  'media-browser',
  'energy',
  'todo',
]);

export function buildPanelList(panels, hiddenPanelIds, orderedPanelIds) {
  const explicitHidden = new Set(hiddenPanelIds || []);

  const list = Object.values(panels)
    .filter((p) => p.show_in_sidebar && p.title)
    .filter((p) => !DEFAULT_HIDDEN_PANEL_IDS.has(p.url_path))
    .filter((p) => !explicitHidden.has(p.url_path))
    .map((p) => ({ id: p.url_path, title: p.title, icon: p.icon ?? null, component: p.component_name }));

  if (orderedPanelIds && orderedPanelIds.length > 0) {
    const orderIndex = new Map(orderedPanelIds.map((id, i) => [id, i]));
    list.sort((a, b) => (orderIndex.get(a.id) ?? Infinity) - (orderIndex.get(b.id) ?? Infinity));
  }

  return list;
}
