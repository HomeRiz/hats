import { describe, it, expect } from 'vitest';
import { fetchHacsRepositories } from './haWebsocket.js';

describe('fetchHacsRepositories', () => {
  it('returns an empty result with a reason when there is no Supervisor token', async () => {
    const result = await fetchHacsRepositories(undefined);
    expect(result).toEqual({ available: false, repositories: [], reason: 'no-supervisor-token' });
  });

  it('returns an empty result when the Home Assistant connection fails', async () => {
    const result = await fetchHacsRepositories('token-that-cannot-connect');
    expect(result.available).toBe(false);
    expect(result.repositories).toEqual([]);
    expect(typeof result.reason).toBe('string');
  }, 15000);
});
