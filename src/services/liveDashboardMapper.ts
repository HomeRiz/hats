import type { LiveArea, LiveEntity, LiveViewTab } from '../types/liveDashboard';

export type DomainIconKey =
  | 'light'
  | 'switch'
  | 'climate'
  | 'media_player'
  | 'lock'
  | 'cover'
  | 'alarm_control_panel'
  | 'vacuum'
  | 'sensor'
  | 'binary_sensor'
  | 'scene'
  | 'fan'
  | 'default';

const KNOWN_DOMAINS: readonly string[] = [
  'light', 'switch', 'climate', 'media_player', 'lock', 'cover',
  'alarm_control_panel', 'vacuum', 'sensor', 'binary_sensor', 'scene', 'fan',
];

export function domainIconKey(domain: string): DomainIconKey {
  return (KNOWN_DOMAINS.includes(domain) ? domain : 'default') as DomainIconKey;
}

const ACTIVE_STATES = new Set([
  'on', 'open', 'unlocked', 'home', 'playing', 'cleaning',
  'armed_away', 'armed_home', 'armed_night',
]);

const NO_UNIT_STATES = new Set(['unknown', 'unavailable']);

export function formatStateText(state: string, unit?: string): string {
  if (!state) return 'Unknown';
  if (state === 'on') return 'On';
  if (state === 'off') return 'Off';
  const spaced = state.replace(/_/g, ' ');
  const formatted = spaced.charAt(0).toUpperCase() + spaced.slice(1);
  if (unit && !NO_UNIT_STATES.has(state)) {
    return `${formatted} ${unit}`;
  }
  return formatted;
}

export interface LiveTile {
  id: string;
  title: string;
  stateText: string;
  domain: string;
  isActive: boolean;
  iconKey: DomainIconKey;
}

export function mapEntityToTile(entity: LiveEntity): LiveTile {
  return {
    id: entity.entityId,
    title: entity.name,
    stateText: formatStateText(entity.state, entity.unit),
    domain: entity.domain,
    isActive: ACTIVE_STATES.has(entity.state),
    iconKey: domainIconKey(entity.domain),
  };
}

export function mapAreasToTiles(areas: LiveArea[]): LiveTile[] {
  return areas.flatMap((area) => area.entities.map(mapEntityToTile));
}

export interface LiveTileGroup {
  id: string;
  name: string;
  tiles: LiveTile[];
}

export function mapAreasToTileGroups(areas: LiveArea[]): LiveTileGroup[] {
  return areas.map((area) => ({
    id: area.id,
    name: area.name,
    tiles: area.entities.map(mapEntityToTile),
  }));
}

interface TabFilterRule {
  keywords: string[];
  matches: (tile: LiveTile) => boolean;
}

const TAB_FILTER_RULES: TabFilterRule[] = [
  {
    keywords: ['climate', 'thermostat', 'heat', 'hvac'],
    matches: (tile) => tile.domain === 'climate' || /temperature|humidity/i.test(tile.title),
  },
  {
    keywords: ['energy', 'power'],
    matches: (tile) =>
      /kwh|kw\b|watt|w\/|energy/i.test(tile.stateText) || /power|energy/i.test(tile.title),
  },
  {
    keywords: ['light', 'lighting'],
    matches: (tile) => tile.domain === 'light',
  },
  {
    keywords: ['security', 'alarm', 'lock'],
    matches: (tile) =>
      tile.domain === 'alarm_control_panel' || tile.domain === 'lock' ||
      /lock|door|window|alarm/i.test(tile.title),
  },
  {
    keywords: ['media'],
    matches: (tile) => tile.domain === 'media_player',
  },
];

export function filterTileGroupsForTab(groups: LiveTileGroup[], tabTitle: string): LiveTileGroup[] {
  const normalized = tabTitle.trim().toLowerCase();
  const rule = TAB_FILTER_RULES.find((r) => r.keywords.some((kw) => normalized.includes(kw)));
  if (!rule) return groups;

  const filtered = groups
    .map((group) => ({ ...group, tiles: group.tiles.filter(rule.matches) }))
    .filter((group) => group.tiles.length > 0);

  return filtered.length > 0 ? filtered : groups;
}

export interface LiveNavItem {
  id: string;
  label: string;
}

export function mapViewTabsToNavItems(viewTabs: LiveViewTab[]): LiveNavItem[] {
  return viewTabs.map((tab) => ({ id: tab.id, label: tab.title }));
}
