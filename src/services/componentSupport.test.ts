import { describe, it, expect } from 'vitest';
import { defaultGlassTheme } from '../presets/defaultThemes';
import { generateHomeAssistantThemeYaml } from './yamlGenerator';
import { COMPONENT_CATALOG, resolveComponentSupport, withComponentSupport } from './componentSupport';
import type { ThemeConfig } from '../types/theme';

const bare = (extra: Partial<ThemeConfig> = {}): ThemeConfig => ({ ...defaultGlassTheme, requirements: undefined, components: undefined, ...extra });

describe('resolveComponentSupport', () => {
  it('keeps card-mod, Mushroom and Bubble Card on for themes that never chose', () => {
    const s = resolveComponentSupport(bare());
    expect(s['card-mod'] && s.mushroom && s['bubble-card']).toBe(true);
    expect(s['layout-card'] || s['button-card'] || s['stack-in-card']).toBe(false);
  });

  it('reads the cards a theme already lists as requirements', () => {
    const s = resolveComponentSupport(
      bare({ requirements: { requiresCardMod: true, recommendedCards: [{ name: 'Button Card', slug: 'button-card', description: '' }] } })
    );
    expect(s['button-card']).toBe(true);
  });

  it('lets an explicit choice win', () => {
    expect(resolveComponentSupport(bare({ components: { mushroom: false } })).mushroom).toBe(false);
  });

  it('covers all six cards', () => {
    expect(COMPONENT_CATALOG.map((c) => c.id)).toEqual(['card-mod', 'mushroom', 'bubble-card', 'layout-card', 'button-card', 'stack-in-card']);
  });
});

describe('withComponentSupport', () => {
  it('stores the full choice and keeps the requirements in step', () => {
    const next = withComponentSupport(bare(), 'layout-card', true);
    expect(next.components?.['layout-card']).toBe(true);
    expect(next.requirements?.recommendedCards?.map((c) => c.slug)).toContain('layout-card');
    expect(next.requirements?.requiresCardMod).toBe(true);
  });

  it('drops a card from the requirements when turned off', () => {
    const next = withComponentSupport(bare(), 'mushroom', false);
    expect(next.requirements?.recommendedCards?.map((c) => c.slug)).not.toContain('mushroom');
  });
});

describe('generated theme', () => {
  const yaml = (components: ThemeConfig['components']) => generateHomeAssistantThemeYaml(bare({ components }), 'cdn');

  it('adds Mushroom and Bubble variables only when they are turned on', () => {
    const on = yaml({ 'card-mod': true, mushroom: true, 'bubble-card': true });
    expect(on).toContain('mush-icon-border-radius');
    expect(on).toContain('bubble-border-radius');
    const off = yaml({ 'card-mod': true, mushroom: false, 'bubble-card': false });
    expect(off).not.toContain('mush-');
    expect(off).not.toContain('bubble-');
    expect(off).not.toContain('mushroom-title-card');
    expect(off).not.toContain('type-custom-bubble-card');
  });

  it('adds Layout Card and Button Card variables only when turned on', () => {
    expect(yaml({ 'layout-card': true, 'button-card': true })).toContain('masonry-view-card-margin');
    expect(yaml({ 'layout-card': true, 'button-card': true })).toContain('button-card-ripple-pressed-color');
    expect(yaml({ 'layout-card': false, 'button-card': false })).not.toContain('masonry-view-card-margin');
  });

  it('leaves out every card-mod rule when card-mod support is off', () => {
    const off = yaml({ 'card-mod': false });
    expect(off).not.toContain('card-mod-');
    expect(yaml({ 'card-mod': true })).toContain('card-mod-theme');
  });

  it('does not change themes that never chose', () => {
    const legacy = generateHomeAssistantThemeYaml(bare(), 'cdn');
    expect(legacy).toContain('card-mod-card');
    expect(legacy).not.toContain('mush-icon-border-radius');
  });
});
