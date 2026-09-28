import { describe, it, expect } from 'vitest';
import {
  domainIconKey,
  formatStateText,
  mapEntityToTile,
  mapAreasToTiles,
  mapAreasToTileGroups,
  filterTileGroupsForTab,
  mapViewTabsToNavItems,
} from './liveDashboardMapper';
import type { LiveArea, LiveEntity, LiveViewTab } from '../types/liveDashboard';

describe('domainIconKey', () => {
  it('returns the domain itself when it is a known domain', () => {
    expect(domainIconKey('light')).toBe('light');
    expect(domainIconKey('climate')).toBe('climate');
  });

  it('falls back to "default" for an unrecognized domain', () => {
    expect(domainIconKey('some_custom_integration_domain')).toBe('default');
  });
});

describe('formatStateText', () => {
  it('capitalizes on/off specially', () => {
    expect(formatStateText('on')).toBe('On');
    expect(formatStateText('off')).toBe('Off');
  });

  it('title-cases and un-snakes other states', () => {
    expect(formatStateText('armed_home')).toBe('Armed home');
    expect(formatStateText('cleaning')).toBe('Cleaning');
  });

  it('handles an empty/unknown state without throwing', () => {
    expect(formatStateText('')).toBe('Unknown');
  });

  it('appends a unit when provided', () => {
    expect(formatStateText('21.4', '°C')).toBe('21.4 °C');
  });

  it('does not append a unit to unknown/unavailable states', () => {
    expect(formatStateText('unknown', '°C')).toBe('Unknown');
    expect(formatStateText('unavailable', '°C')).toBe('Unavailable');
  });
});

describe('mapEntityToTile', () => {
  const entity: LiveEntity = {
    entityId: 'light.living_room',
    name: 'Living Room Light',
    domain: 'light',
    state: 'on',
    icon: 'mdi:lightbulb',
  };

  it('maps entity fields onto tile fields', () => {
    const tile = mapEntityToTile(entity);
    expect(tile).toEqual({
      id: 'light.living_room',
      title: 'Living Room Light',
      stateText: 'On',
      domain: 'light',
      isActive: true,
      iconKey: 'light',
    });
  });

  it('marks a closed/off/locked-style state as not active', () => {
    const tile = mapEntityToTile({ ...entity, state: 'off' });
    expect(tile.isActive).toBe(false);
  });

  it('marks an "active-sounding" non-boolean state as active (e.g. media playing)', () => {
    const tile = mapEntityToTile({ ...entity, domain: 'media_player', state: 'playing' });
    expect(tile.isActive).toBe(true);
  });
});

describe('mapAreasToTiles', () => {
  it('flattens every entity across every area into one tile list', () => {
    const areas: LiveArea[] = [
      {
        id: 'living_room',
        name: 'Living Room',
        entities: [
          { entityId: 'light.living_room', name: 'Living Room Light', domain: 'light', state: 'on' },
        ],
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        entities: [
          { entityId: 'light.kitchen', name: 'Kitchen Light', domain: 'light', state: 'off' },
          { entityId: 'sensor.kitchen_temp', name: 'Kitchen Temperature', domain: 'sensor', state: '21.4' },
        ],
      },
    ];

    const tiles = mapAreasToTiles(areas);
    expect(tiles).toHaveLength(3);
    expect(tiles.map((t) => t.id)).toEqual([
      'light.living_room',
      'light.kitchen',
      'sensor.kitchen_temp',
    ]);
  });

  it('returns an empty array for no areas', () => {
    expect(mapAreasToTiles([])).toEqual([]);
  });
});

describe('mapAreasToTileGroups', () => {
  const areas: LiveArea[] = [
    {
      id: 'living_room',
      name: 'Living Room',
      entities: [
        { entityId: 'light.living_room', name: 'Living Room Light', domain: 'light', state: 'on' },
      ],
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      entities: [
        { entityId: 'light.kitchen', name: 'Kitchen Light', domain: 'light', state: 'off' },
        { entityId: 'sensor.kitchen_temp', name: 'Kitchen Temperature', domain: 'sensor', state: '21.4' },
      ],
    },
  ];

  it('keeps each area as its own group instead of flattening', () => {
    const groups = mapAreasToTileGroups(areas);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({
      id: 'living_room',
      name: 'Living Room',
      tiles: [mapEntityToTile(areas[0].entities[0])],
    });
    expect(groups[1].tiles.map((t) => t.id)).toEqual(['light.kitchen', 'sensor.kitchen_temp']);
  });

  it('returns an empty array for no areas', () => {
    expect(mapAreasToTileGroups([])).toEqual([]);
  });
});

describe('filterTileGroupsForTab', () => {
  const groups = mapAreasToTileGroups([
    {
      id: 'living_room',
      name: 'Living Room',
      entities: [
        { entityId: 'climate.living_room', name: 'Living Room Thermostat', domain: 'climate', state: 'heat' },
        { entityId: 'light.living_room', name: 'Living Room Light', domain: 'light', state: 'on' },
      ],
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      entities: [
        { entityId: 'light.kitchen', name: 'Kitchen Light', domain: 'light', state: 'off' },
      ],
    },
  ]);

  it('filters to matching-domain tiles when the tab title matches a known keyword', () => {
    const filtered = filterTileGroupsForTab(groups, 'Climate');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('living_room');
    expect(filtered[0].tiles.map((t) => t.id)).toEqual(['climate.living_room']);
  });

  it('drops groups left with no tiles after filtering', () => {
    const filtered = filterTileGroupsForTab(groups, 'Climate');
    expect(filtered.find((g) => g.id === 'kitchen')).toBeUndefined();
  });

  it('returns every group unfiltered when the tab title matches no known keyword', () => {
    expect(filterTileGroupsForTab(groups, 'Overview')).toEqual(groups);
  });

  it('falls back to unfiltered groups if a matched keyword would filter out everything', () => {
    const lightOnlyGroups = mapAreasToTileGroups([
      {
        id: 'kitchen',
        name: 'Kitchen',
        entities: [{ entityId: 'light.kitchen', name: 'Kitchen Light', domain: 'light', state: 'off' }],
      },
    ]);
    expect(filterTileGroupsForTab(lightOnlyGroups, 'Climate')).toEqual(lightOnlyGroups);
  });
});

describe('mapViewTabsToNavItems', () => {
  it('maps id/title onto id/label', () => {
    const viewTabs: LiveViewTab[] = [
      { id: 'lovelace::default_view', title: 'Home' },
      { id: 'lovelace::rooms', title: 'Rooms' },
    ];
    expect(mapViewTabsToNavItems(viewTabs)).toEqual([
      { id: 'lovelace::default_view', label: 'Home' },
      { id: 'lovelace::rooms', label: 'Rooms' },
    ]);
  });
});
