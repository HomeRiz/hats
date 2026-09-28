import type { RequiredIntegration } from '../types/theme';

export function detectRequiresCardMod(themeData: Record<string, unknown> | null | undefined): boolean {
  if (!themeData) return false;
  return Boolean(themeData['card-mod-theme'] || themeData['card-mod-root'] || themeData['card-mod-card']);
}

const CUSTOM_COMPONENT_PATH = /^custom_components\/([^/]+)\/manifest\.json$/;

export function detectRequiredIntegrations(repoPaths: string[]): RequiredIntegration[] {
  const domains = new Set<string>();
  for (const path of repoPaths) {
    const match = path.match(CUSTOM_COMPONENT_PATH);
    if (match) domains.add(match[1]);
  }
  return Array.from(domains)
    .sort()
    .map((domain) => ({ name: domain, domain }));
}
