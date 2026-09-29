import { describe, it, expect } from 'vitest';
import { buildMockConnection } from './buildMockConnection';

describe('buildMockConnection', () => {
  it('resolves a conn that can fetch the seeded states', async () => {
    const { conn, store } = await buildMockConnection();
    expect(store.getStates().length).toBeGreaterThan(0);
    expect(conn.connected).toBe(true);
    conn.close();
  });
});
