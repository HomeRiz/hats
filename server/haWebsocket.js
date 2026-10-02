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
