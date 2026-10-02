import type { ThemeConfig } from '../types/theme';
import { withBundledArtwork } from '../presets/bundledArtwork';

function isDraft(theme: ThemeConfig): boolean {
  return Boolean(theme.isCustom) && !theme.installedFilePath && !theme.name.toLowerCase().startsWith('ultimate');
}

export function mergeSyncedThemes(
  previous: ThemeConfig[],
  fromServer: ThemeConfig[],
  builtIns: ThemeConfig[],
  syncStartedAt: number,
): ThemeConfig[] {
  const previousById = new Map(previous.map((theme) => [theme.id, theme]));
  const serverIds = new Set(fromServer.map((theme) => theme.id));

  const drafts = previous.filter((theme) => isDraft(theme) && !serverIds.has(theme.id));
  const draftIds = new Set(drafts.map((theme) => theme.id));

  const fromServerMerged = fromServer.map((server) => {
    const local = previousById.get(server.id);
    const editedDuringSync = local?.updatedAt && new Date(local.updatedAt).getTime() > syncStartedAt;
    return editedDuringSync ? local! : withBundledArtwork(server);
  });

  const keptBuiltIns = builtIns
    .filter((builtIn) => !serverIds.has(builtIn.id) && !draftIds.has(builtIn.id))
    .map((builtIn) => previousById.get(builtIn.id) ?? builtIn);

  return [...keptBuiltIns, ...fromServerMerged, ...drafts];
}
