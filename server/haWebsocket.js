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

const EMPTY_REPOSITORY_SNAPSHOT = { available: false, source: null, repositories: [] };

const REPOSITORY_LIST_COMMANDS = [
  { source: 'marketplace', type: 'marketplace/repositories/list' },
  { source: 'hacs', type: 'hacs/repositories/list' },
];

async function listRepositories(connection) {
  let lastError;
  for (const { source, type } of REPOSITORY_LIST_COMMANDS) {
    try {
      const repos = await withTimeout(
        connection.sendMessagePromise({ type }),
        CONNECT_TIMEOUT_MS,
        `ha-websocket-${source}-fetch-timeout`
      );
      return { source, repos };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function fetchHacsRepositories(supervisorToken) {
  return withHaConnection(supervisorToken, EMPTY_REPOSITORY_SNAPSHOT, async (connection) => {
    const { source, repos } = await listRepositories(connection);
    return {
      available: true,
      source,
      repositories: repos.map((r) => ({
        id: String(r.id),
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
