import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConnection } from 'home-assistant-js-websocket';
import { fetchHacsRepositories } from './haWebsocket.js';

vi.mock('home-assistant-js-websocket', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createConnection: vi.fn(actual.createConnection) };
});

const MARKETPLACE_ROW = {
  id: 190927524,
  full_name: 'thomasloven/lovelace-card-mod',
  domain: 'lovelace',
  category: 'plugin',
  installed: 1,
  name: 'card-mod',
  stars: 10,
};

const HACS_ROW = {
  id: '99',
  full_name: 'hacs/integration',
  domain: 'hacs',
  category: 'integration',
  installed: false,
  name: 'HACS',
  stars: 1,
};

function fakeConnection(handler) {
  return {
    sendMessagePromise: vi.fn(handler),
    close: vi.fn(),
  };
}

describe('fetchHacsRepositories', () => {
  beforeEach(() => {
    vi.mocked(createConnection).mockClear();
  });

  it('returns an empty result with a reason when there is no Supervisor token', async () => {
    const result = await fetchHacsRepositories(undefined);
    expect(result).toEqual({ available: false, source: null, repositories: [], reason: 'no-supervisor-token' });
  });

  it('returns an empty result when the Home Assistant connection fails', async () => {
    const result = await fetchHacsRepositories('token-that-cannot-connect');
    expect(result.available).toBe(false);
    expect(result.source).toBe(null);
    expect(result.repositories).toEqual([]);
    expect(typeof result.reason).toBe('string');
  }, 15000);

  it('prefers the Marketplace list and maps it with string ids', async () => {
    const connection = fakeConnection(async ({ type }) => {
      if (type === 'marketplace/repositories/list') return [MARKETPLACE_ROW];
      throw new Error(`unexpected command ${type}`);
    });
    vi.mocked(createConnection).mockResolvedValueOnce(connection);

    const result = await fetchHacsRepositories('supervisor-token');

    expect(result).toEqual({
      available: true,
      source: 'marketplace',
      repositories: [
        {
          id: '190927524',
          fullName: 'thomasloven/lovelace-card-mod',
          domain: 'lovelace',
          category: 'plugin',
          installed: true,
        },
      ],
    });
    expect(connection.sendMessagePromise).toHaveBeenCalledTimes(1);
    expect(connection.sendMessagePromise).toHaveBeenCalledWith({ type: 'marketplace/repositories/list' });
    expect(connection.close).toHaveBeenCalled();
  });

  it('falls back to the HACS list when the Marketplace command is unknown', async () => {
    const connection = fakeConnection(async ({ type }) => {
      if (type === 'marketplace/repositories/list') {
        throw { code: 'unknown_command', message: 'Unknown command.' };
      }
      if (type === 'hacs/repositories/list') return [HACS_ROW];
      throw new Error(`unexpected command ${type}`);
    });
    vi.mocked(createConnection).mockResolvedValueOnce(connection);

    const result = await fetchHacsRepositories('supervisor-token');

    expect(result).toEqual({
      available: true,
      source: 'hacs',
      repositories: [
        {
          id: '99',
          fullName: 'hacs/integration',
          domain: 'hacs',
          category: 'integration',
          installed: false,
        },
      ],
    });
    expect(connection.sendMessagePromise.mock.calls.map(([msg]) => msg.type)).toEqual([
      'marketplace/repositories/list',
      'hacs/repositories/list',
    ]);
  });

  it('returns an empty snapshot when neither repository command works', async () => {
    const connection = fakeConnection(async ({ type }) => {
      throw { code: 'unknown_command', message: `Unknown command ${type}.` };
    });
    vi.mocked(createConnection).mockResolvedValueOnce(connection);

    const result = await fetchHacsRepositories('supervisor-token');

    expect(result).toEqual({
      available: false,
      source: null,
      repositories: [],
      reason: 'Unknown command hacs/repositories/list.',
    });
  });
});
