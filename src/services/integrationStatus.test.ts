import { describe, it, expect } from 'vitest';
import { getIntegrationStatus } from './integrationStatus';
import type { HacsRepository } from './useHacsRepositories';

const HACS_REPOS: HacsRepository[] = [
  { id: '111', fullName: 'home-assistant/tado', domain: 'tado', category: 'integration', installed: true },
  { id: '222', fullName: 'someone/notinstalled', domain: 'notinstalled', category: 'integration', installed: false },
];

describe('getIntegrationStatus', () => {
  it('returns installed when the domain matches a HACS repo marked installed', () => {
    const status = getIntegrationStatus({ name: 'tado', domain: 'tado' }, HACS_REPOS);
    expect(status).toEqual({ state: 'installed', hacsRepoId: '111' });
  });

  it('returns not_installed when the domain matches a HACS repo that is not installed', () => {
    const status = getIntegrationStatus({ name: 'notinstalled', domain: 'notinstalled' }, HACS_REPOS);
    expect(status).toEqual({ state: 'not_installed', hacsRepoId: '222' });
  });

  it('returns unknown_to_hacs when no HACS repo matches the domain', () => {
    const status = getIntegrationStatus({ name: 'fluvy', domain: 'fluvy' }, HACS_REPOS);
    expect(status).toEqual({ state: 'unknown_to_hacs', hacsRepoId: null });
  });

  it('returns unknown_to_hacs when the HACS repository list is unavailable', () => {
    const status = getIntegrationStatus({ name: 'tado', domain: 'tado' }, []);
    expect(status).toEqual({ state: 'unknown_to_hacs', hacsRepoId: null });
  });
});
