import { describe, it, expect } from 'vitest';
import { buildAreas, buildPanelList } from './haWebsocket.js';

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

describe('buildPanelList', () => {
  const PANELS = {
    config: { url_path: 'config', title: 'config', icon: 'mdi:cog', show_in_sidebar: true, component_name: 'config' },
    map: { url_path: 'map', title: 'Map', icon: 'mdi:map', show_in_sidebar: true, component_name: 'lovelace' },
    'smart-home': { url_path: 'smart-home', title: 'Smart Home', icon: 'mdi:home-automation', show_in_sidebar: true, component_name: 'lovelace' },
    lovelace: { url_path: 'lovelace', title: null, icon: null, show_in_sidebar: true, component_name: 'lovelace' },
    light: { url_path: 'light', title: 'light', icon: 'mdi:lamps', show_in_sidebar: false, component_name: 'light' },
    history: { url_path: 'history', title: 'history', icon: 'mdi:history', show_in_sidebar: true, component_name: 'history' },
    hacs: { url_path: 'hacs', title: 'HACS', icon: 'mdi:puzzle', show_in_sidebar: true, component_name: 'custom' },
    local_hats_dev: { url_path: 'local_hats_dev', title: 'HATS', icon: 'mdi:hat-fedora', show_in_sidebar: true, component_name: 'app' },
  };

  it('keeps panels with show_in_sidebar and a real title', () => {
    const list = buildPanelList(PANELS, null, null);
    expect(list.map((p) => p.id)).toContain('smart-home');
    expect(list.map((p) => p.id)).toContain('hacs');
    expect(list.map((p) => p.id)).toContain('local_hats_dev');
  });

  it('excludes a panel with show_in_sidebar: false', () => {
    const list = buildPanelList(PANELS, null, null);
    expect(list.map((p) => p.id)).not.toContain('light');
  });

  it('excludes a panel with a null title', () => {
    const list = buildPanelList(PANELS, null, null);
    expect(list.map((p) => p.id)).not.toContain('lovelace');
  });

  it('excludes config (rendered as the pinned Settings item, not the scrollable list) and HA-default-hidden panels like history', () => {
    const list = buildPanelList(PANELS, null, null);
    expect(list.map((p) => p.id)).not.toContain('config');
    expect(list.map((p) => p.id)).not.toContain('history');
  });

  it('carries id/title/icon/component through', () => {
    const list = buildPanelList(PANELS, null, null);
    const hacs = list.find((p) => p.id === 'hacs');
    expect(hacs).toEqual({ id: 'hacs', title: 'HACS', icon: 'mdi:puzzle', component: 'custom' });
  });

  it('respects an explicit sidebar-panel-hidden list over the default-hidden set', () => {
    const list = buildPanelList(PANELS, ['map'], null);
    expect(list.map((p) => p.id)).not.toContain('map');
  });

  it('orders by the explicit sidebar-panel-order list when provided', () => {
    const list = buildPanelList(PANELS, null, ['hacs', 'local_hats_dev', 'smart-home', 'map']);
    expect(list.map((p) => p.id)).toEqual(['hacs', 'local_hats_dev', 'smart-home', 'map']);
  });
});
