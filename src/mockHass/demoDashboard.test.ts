import { describe, it, expect } from 'vitest';
import { DEMO_DASHBOARD } from './demoDashboard';
import { DEMO_ENTITIES } from './demoEntities';

function collect(value: unknown, out: { types: Set<string>; entities: Set<string> }) {
  if (Array.isArray(value)) {
    value.forEach((v) => collect(v, out));
  } else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.type === 'string') out.types.add(obj.type);
    if (typeof obj.entity === 'string') out.entities.add(obj.entity);
    if (Array.isArray(obj.entities)) obj.entities.forEach((e) => typeof e === 'string' && out.entities.add(e));
    Object.values(obj).forEach((v) => collect(v, out));
  }
}

describe('demoDashboard', () => {
  const found = { types: new Set<string>(), entities: new Set<string>() };
  collect(DEMO_DASHBOARD, found);

  it('only references entities that exist', () => {
    const known = new Set(DEMO_ENTITIES.map((e) => e.entity_id));
    for (const id of found.entities) expect(known.has(id)).toBe(true);
  });

  it('shows at least one card of every custom card family that is loaded', () => {
    const families = ['custom:mushroom-', 'custom:bubble-card', 'custom:button-card', 'custom:stack-in-card'];
    for (const family of families) {
      expect([...found.types].some((t) => t.startsWith(family))).toBe(true);
    }
    expect(JSON.stringify(DEMO_DASHBOARD)).toContain('card_mod');
  });

  it('is a single home view, with no extra tab per card family', () => {
    expect(DEMO_DASHBOARD.views.map((v: any) => v.path)).toEqual(['home']);
  });

  it('places the home cards in a fixed grid so they never move', () => {
    const home: any = DEMO_DASHBOARD.views[0];
    expect(home.type).toBe('custom:grid-layout');
    expect(home.cards).toHaveLength(3);
    expect(home.cards.every((card: any) => card.type === 'vertical-stack')).toBe(true);
    expect(JSON.stringify(home.cards)).not.toContain('masonry');
  });

  it('shows every card family on the home view so one page is enough to compare', () => {
    const home = DEMO_DASHBOARD.views.find((v: any) => v.path === 'home');
    const homeFound = { types: new Set<string>(), entities: new Set<string>() };
    collect(home, homeFound);
    for (const family of ['custom:mushroom-', 'custom:bubble-card', 'custom:button-card', 'custom:stack-in-card']) {
      expect([...homeFound.types].some((t) => t.startsWith(family))).toBe(true);
    }
    expect(JSON.stringify(home)).toContain('card_mod');
    expect(JSON.stringify(home)).toContain('Layout Card');
  });
});
