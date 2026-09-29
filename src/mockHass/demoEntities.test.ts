import { describe, it, expect } from 'vitest';
import { DEMO_ENTITIES, DEMO_AREAS } from './demoEntities';

describe('demoEntities', () => {
  it('covers the domains needed for a realistic dashboard feel', () => {
    const domains = new Set(DEMO_ENTITIES.map((e) => e.entity_id.split('.')[0]));
    for (const required of ['light', 'switch', 'alarm_control_panel', 'climate', 'lock', 'cover', 'media_player', 'sensor']) {
      expect(domains.has(required)).toBe(true);
    }
  });

  it('every entity has a friendly_name', () => {
    for (const entity of DEMO_ENTITIES) {
      expect(entity.attributes.friendly_name).toBeTruthy();
    }
  });

  it('every area references only real entity ids', () => {
    const knownIds = new Set(DEMO_ENTITIES.map((e) => e.entity_id));
    for (const area of DEMO_AREAS) {
      for (const id of area.entityIds) expect(knownIds.has(id)).toBe(true);
    }
  });

  it('every entity belongs to at least one area', () => {
    const placed = new Set(DEMO_AREAS.flatMap((a) => a.entityIds));
    for (const entity of DEMO_ENTITIES) expect(placed.has(entity.entity_id)).toBe(true);
  });

  it('entity ids are unique', () => {
    const ids = DEMO_ENTITIES.map((e) => e.entity_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
