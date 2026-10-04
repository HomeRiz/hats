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
    name: 'UIX / card-mod',
    slug: 'card-mod',
    summary: 'CSS styling for every card, the sidebar and the header (UIX or card-mod)',
    effect: 'Adds the glass, sheen, sidebar and header rules. Works with UIX or card-mod. Without either, the theme only sets plain colors and the selected sidebar item uses your primary color.',
  },
  {
    id: 'mushroom',
    name: 'Mushroom Cards',
    slug: 'mushroom',
    summary: 'Chips, icons and sliders from the Mushroom card set',
    effect: 'Sets the mush-* variables so Mushroom icons, controls and chips follow your palette, radii and glass tint. See the chips and the light card on Home.',
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
    effect: 'Adds 12px side padding to Layout Card grids, like the Home preview, and sets the card margin of masonry views to 8px 8px 16px.',
  },
  {
    id: 'button-card',
    name: 'Button Card',
    slug: 'button-card',
    summary: 'Fully customisable button cards',
    effect: 'Tints the Button Card hover and press ripple with your primary color and makes the hover stronger. Hover a Button Card on Home to see it.',
  },
  {
    id: 'stack-in-card',
    name: 'Stack-in-Card',
    slug: 'stack-in-card',
    summary: 'Several cards merged into one',
    effect: 'Merges the cards inside a Stack-in-Card into one glass card, with no separate rounded tiles, borders or shadows. See the Stack-in-Card block on Home.',
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
