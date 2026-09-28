import type { RequiredIntegration } from '../types/theme';
import type { HacsRepository } from './useHacsRepositories';

export type IntegrationState = 'installed' | 'not_installed' | 'unknown_to_hacs';

export interface IntegrationStatus {
  state: IntegrationState;
  hacsRepoId: string | null;
}

export function getIntegrationStatus(
  integration: RequiredIntegration,
  hacsRepositories: HacsRepository[]
): IntegrationStatus {
  const match = hacsRepositories.find((repo) => repo.domain === integration.domain);
  if (!match) return { state: 'unknown_to_hacs', hacsRepoId: null };
  return { state: match.installed ? 'installed' : 'not_installed', hacsRepoId: match.id };
}
