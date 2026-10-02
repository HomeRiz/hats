import type { CustomComponentId, RecommendedCard, ThemeConfig, ThemeRequirements } from '../types/theme';

export interface ComponentInfo {
  id: CustomComponentId;
  name: string;
  slug: string;
  summary: string;
  effect: string;
}

export const COMPONENT_CATALOG: ComponentInfo[] = [
  {
    id: 'card-mod',
    name: 'card-mod',
    slug: 'card-mod',
    summary: 'CSS styling for every card, the sidebar and the header',
    effect: 'Adds the glass, sheen, sidebar and header rules. Without it the theme only sets plain colors.',
  },
  {
    id: 'mushroom',
    name: 'Mushroom Cards',
    slug: 'mushroom',
    summary: 'Chips, icons and sliders from the Mushroom card set',
    effect: 'Sets the mush-* variables so Mushroom icons, controls and chips follow your palette, radii and glass tint.',
  },
  {
    id: 'bubble-card',
    name: 'Bubble Card',
    slug: 'bubble-card',
    summary: 'Bubble buttons, sliders and pop-ups',
    effect: 'Sets the bubble-* variables so Bubble Card backgrounds, borders, radii and accent follow the theme.',
  },
  {
    id: 'layout-card',
    name: 'Layout Card',
    slug: 'layout-card',
    summary: 'Grid and masonry views',
    effect: 'Sets the card spacing that Layout Card views use and lists Layout Card as a requirement.',
  },
  {
    id: 'button-card',
    name: 'Button Card',
    slug: 'button-card',
    summary: 'Fully customisable button cards',
    effect: 'Colors the Button Card ripple with your primary color and lists Button Card as a requirement.',
  },
  {
    id: 'stack-in-card',
    name: 'Stack-in-Card',
    slug: 'stack-in-card',
    summary: 'Several cards merged into one',
    effect: 'Lists Stack-in-Card as a requirement. Stacked cards use the theme glass style.',
  },
];

export type ComponentSupport = Record<CustomComponentId, boolean>;

const LEGACY_DEFAULTS: ComponentSupport = {
  'card-mod': true,
  mushroom: true,
  'bubble-card': true,
  'layout-card': false,
  'button-card': false,
  'stack-in-card': false,
};

export function resolveComponentSupport(theme: Pick<ThemeConfig, 'components' | 'requirements'>): ComponentSupport {
  const resolved = { ...LEGACY_DEFAULTS };
  const listed = new Set((theme.requirements?.recommendedCards ?? []).map((card) => card.slug));
  for (const info of COMPONENT_CATALOG) {
    if (info.id !== 'card-mod' && listed.has(info.slug)) resolved[info.id] = true;
  }
  if (theme.requirements && typeof theme.requirements.requiresCardMod === 'boolean') {
    resolved['card-mod'] = theme.requirements.requiresCardMod;
  }
  for (const info of COMPONENT_CATALOG) {
    const explicit = theme.components?.[info.id];
    if (typeof explicit === 'boolean') resolved[info.id] = explicit;
  }
  return resolved;
}

export function hasExplicitComponentSupport(theme: Pick<ThemeConfig, 'components'>): boolean {
  return theme.components !== undefined;
}

export function withComponentSupport(
  theme: Pick<ThemeConfig, 'components' | 'requirements'>,
  id: CustomComponentId,
  enabled: boolean
): Pick<ThemeConfig, 'components' | 'requirements'> {
  const components = { ...resolveComponentSupport(theme), [id]: enabled };
  const existing = new Map((theme.requirements?.recommendedCards ?? []).map((card) => [card.slug, card]));
  const recommendedCards: RecommendedCard[] = COMPONENT_CATALOG.filter(
    (info) => info.id !== 'card-mod' && components[info.id]
  ).map(
    (info) =>
      existing.get(info.slug) ?? {
        name: info.name,
        slug: info.slug,
        description: info.summary,
      }
  );
  const requirements: ThemeRequirements = {
    ...theme.requirements,
    requiresCardMod: components['card-mod'],
    recommendedCards,
  };
  return { components, requirements };
}
