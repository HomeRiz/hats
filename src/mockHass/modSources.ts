export const MOD_SOURCES: Record<string, string> = {
  'card-mod': '../mock-mods/card-mod.js',
  'bubble-card': '../mock-mods/bubble-card.js',
  'mushroom-cards': '../mock-mods/mushroom-cards.js',
  'layout-card': '../mock-mods/layout-card.js',
  'button-card': '../mock-mods/button-card.js',
  'stack-in-card': '../mock-mods/stack-in-card.js',
};

export const CURATED_MOD_SLUGS = Object.keys(MOD_SOURCES);

export function resolveModUrl(slug: string): string | null {
  return MOD_SOURCES[slug] ?? null;
}
