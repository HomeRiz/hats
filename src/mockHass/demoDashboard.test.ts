import { describe, it, expect } from 'vitest';
import { DEMO_DASHBOARD } from './demoDashboard';
import { DEMO_ENTITIES } from './demoEntities';
import { MOD_SOURCES } from './modSources';

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
    expect(DEMO_DASHBOARD.views.some((v: any) => v.type === 'custom:grid-layout')).toBe(true);
    expect(JSON.stringify(DEMO_DASHBOARD)).toContain('card_mod');
  });

  it('has one view per loaded mod plus the home view', () => {
    expect(DEMO_DASHBOARD.views).toHaveLength(Object.keys(MOD_SOURCES).length + 1);
  });
});
