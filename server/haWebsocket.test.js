import { describe, it, expect } from 'vitest';
import { buildAreas } from './haWebsocket.js';

const AREA_REGISTRY = [
  { area_id: 'living_room', name: 'Living Room' },
  { area_id: 'kitchen', name: 'Kitchen' },
];

describe('buildAreas', () => {
  it('includes an entity with a direct area_id on the registry entry', () => {
    const entityRegistry = [
      { entity_id: 'light.living_room', area_id: 'living_room', device_id: null },
    ];
    const deviceRegistry = [];
    const states = [
      { entity_id: 'light.living_room', state: 'on', attributes: { friendly_name: 'Living Room Light' } },
    ];

    const areas = buildAreas(AREA_REGISTRY, deviceRegistry, entityRegistry, states);
    const livingRoom = areas.find((a) => a.id === 'living_room');
    expect(livingRoom).toBeDefined();
    expect(livingRoom.entities).toEqual([
      {
        entityId: 'light.living_room',
        name: 'Living Room Light',
        domain: 'light',
        state: 'on',
        unit: undefined,
      },
    ]);
  });

  it('inherits area only through device_id -> device registry area_id (regression)', () => {
    const entityRegistry = [
      { entity_id: 'light.kitchen', area_id: null, device_id: 'device-1' },
    ];
    const deviceRegistry = [{ id: 'device-1', area_id: 'kitchen' }];
    const states = [
      { entity_id: 'light.kitchen', state: 'off', attributes: { friendly_name: 'Kitchen Light' } },
    ];

    const areas = buildAreas(AREA_REGISTRY, deviceRegistry, entityRegistry, states);
    const kitchen = areas.find((a) => a.id === 'kitchen');
    expect(kitchen).toBeDefined();
    expect(kitchen.entities.map((e) => e.entityId)).toEqual(['light.kitchen']);
  });

  it('excludes entities that are disabled, hidden, or diagnostic/config category', () => {
    const entityRegistry = [
      { entity_id: 'sensor.disabled', area_id: 'living_room', device_id: null, disabled_by: 'user' },
      { entity_id: 'sensor.hidden', area_id: 'living_room', device_id: null, hidden_by: 'user' },
      { entity_id: 'sensor.diagnostic', area_id: 'living_room', device_id: null, entity_category: 'diagnostic' },
      { entity_id: 'sensor.config', area_id: 'living_room', device_id: null, entity_category: 'config' },
      { entity_id: 'light.normal', area_id: 'living_room', device_id: null },
    ];
    const deviceRegistry = [];
    const states = [
      { entity_id: 'sensor.disabled', state: '1.0.0', attributes: {} },
      { entity_id: 'sensor.hidden', state: '-60', attributes: {} },
      { entity_id: 'sensor.diagnostic', state: '3.3', attributes: {} },
      { entity_id: 'sensor.config', state: 'on', attributes: {} },
      { entity_id: 'light.normal', state: 'on', attributes: { friendly_name: 'Normal Light' } },
    ];

    const areas = buildAreas(AREA_REGISTRY, deviceRegistry, entityRegistry, states);
    const livingRoom = areas.find((a) => a.id === 'living_room');
    expect(livingRoom.entities.map((e) => e.entityId)).toEqual(['light.normal']);
  });

  it('excludes a registered entity with no matching state', () => {
    const entityRegistry = [
      { entity_id: 'light.no_state', area_id: 'living_room', device_id: null },
    ];
    const deviceRegistry = [];
    const states = [];

    const areas = buildAreas(AREA_REGISTRY, deviceRegistry, entityRegistry, states);
    const livingRoom = areas.find((a) => a.id === 'living_room');
    expect(livingRoom).toBeUndefined();
  });

  it('carries unit_of_measurement through for a sensor', () => {
    const entityRegistry = [
      { entity_id: 'sensor.kitchen_temp', area_id: 'kitchen', device_id: null },
    ];
    const deviceRegistry = [];
    const states = [
      {
        entity_id: 'sensor.kitchen_temp',
        state: '21.4',
        attributes: { friendly_name: 'Kitchen Temperature', unit_of_measurement: '°C' },
      },
    ];

    const areas = buildAreas(AREA_REGISTRY, deviceRegistry, entityRegistry, states);
    const kitchen = areas.find((a) => a.id === 'kitchen');
    expect(kitchen.entities[0]).toEqual({
      entityId: 'sensor.kitchen_temp',
      name: 'Kitchen Temperature',
      domain: 'sensor',
      state: '21.4',
      unit: '°C',
    });
  });

  it('does not include a raw icon field on built entities (data minimization)', () => {
    const entityRegistry = [
      { entity_id: 'light.living_room', area_id: 'living_room', device_id: null },
    ];
    const deviceRegistry = [];
    const states = [
      {
        entity_id: 'light.living_room',
        state: 'on',
        attributes: { friendly_name: 'Living Room Light', icon: 'mdi:lightbulb' },
      },
    ];

    const areas = buildAreas(AREA_REGISTRY, deviceRegistry, entityRegistry, states);
    const livingRoom = areas.find((a) => a.id === 'living_room');
    expect(livingRoom.entities[0]).not.toHaveProperty('icon');
  });

  it('excludes areas that end up with zero entities', () => {
    const areas = buildAreas(AREA_REGISTRY, [], [], []);
    expect(areas).toEqual([]);
  });
});
