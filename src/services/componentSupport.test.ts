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

  it('generates exactly what the switches show for themes that never chose', () => {
    const legacy = generateHomeAssistantThemeYaml(bare(), 'cdn');
    expect(legacy).toContain('card-mod-card');
    expect(legacy).toContain('mush-icon-border-radius');
    expect(legacy).toContain('bubble-border-radius');
    expect(legacy).not.toContain('masonry-view-card-margin');
  });

  it('does not change anything when a switch is touched without changing it', () => {
    const untouched = generateHomeAssistantThemeYaml(bare(), 'cdn');
    const touched = withComponentSupport(bare(), 'card-mod', true);
    expect(generateHomeAssistantThemeYaml(bare(touched), 'cdn')).toBe(untouched);
  });

  it('keeps the other cards as they were when one switch is turned off', () => {
    const touched = withComponentSupport(bare(), 'card-mod', false);
    const out = generateHomeAssistantThemeYaml(bare(touched), 'cdn');
    expect(out).toContain('mush-icon-border-radius');
    expect(out).toContain('bubble-border-radius');
    expect(out).not.toContain('card-mod-');
  });
});

describe('Stack-in-Card and Button Card', () => {
  const yaml = (components: ThemeConfig['components']) => generateHomeAssistantThemeYaml(bare({ components }), 'cdn');

  it('flattens the cards inside a Stack-in-Card only when it is turned on', () => {
    const on = yaml({ 'stack-in-card': true });
    expect(on).toContain(':host(.type-custom-stack-in-card) ha-card > div');
    expect(on).toContain('--hats-card-background: transparent');
    expect(on).toContain('background: var(--hats-card-background,');
    const off = yaml({ 'stack-in-card': false });
    expect(off).not.toContain('type-custom-stack-in-card');
    expect(off).not.toContain('--hats-card-background');
  });

  it('makes the Button Card ripple visible on hover and press when turned on', () => {
    const on = yaml({ 'button-card': true });
    expect(on).toContain('button-card-ripple-color:');
    expect(on).toContain('button-card-ripple-hover-opacity: "0.16"');
    expect(on).toContain('button-card-ripple-pressed-opacity: "0.32"');
    expect(yaml({ 'button-card': false })).not.toContain('button-card-ripple');
  });
});

describe('scanlines', () => {
  const withScanlines = (scanlines: boolean, scanlineIntensity = 0.05) =>
    generateHomeAssistantThemeYaml(bare({ engine: { ...defaultGlassTheme.engine, scanlines, scanlineIntensity } }), 'cdn');

  it('draws the overlay only when scanlines are on', () => {
    expect(withScanlines(true)).toContain('repeating-linear-gradient(0deg');
    expect(withScanlines(false)).not.toContain('repeating-linear-gradient(0deg');
  });

  it('gets darker as the intensity goes up', () => {
    expect(withScanlines(true, 0.02)).toContain('rgba(0, 0, 0, 0.08)');
    expect(withScanlines(true, 0.1)).toContain('rgba(0, 0, 0, 0.40)');
  });
});
