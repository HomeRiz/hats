export const MOD_SOURCES: Record<string, string> = {
  'card-mod': '/mock-mods/card-mod.js',
  'bubble-card': '/mock-mods/bubble-card.js',
  'mushroom-cards': '/mock-mods/mushroom-cards.js',
};

export function resolveModUrl(slug: string): string | null {
  return MOD_SOURCES[slug] ?? null;
}
