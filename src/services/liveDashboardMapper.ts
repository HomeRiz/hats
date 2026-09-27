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

export function formatStateText(state: string): string {
  if (!state) return 'Unknown';
  if (state === 'on') return 'On';
  if (state === 'off') return 'Off';
  const spaced = state.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
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
    stateText: formatStateText(entity.state),
    domain: entity.domain,
    isActive: ACTIVE_STATES.has(entity.state),
    iconKey: domainIconKey(entity.domain),
  };
}

export function mapAreasToTiles(areas: LiveArea[]): LiveTile[] {
  return areas.flatMap((area) => area.entities.map(mapEntityToTile));
}

export interface LiveNavItem {
  id: string;
  label: string;
}

export function mapViewTabsToNavItems(viewTabs: LiveViewTab[]): LiveNavItem[] {
  return viewTabs.map((tab) => ({ id: tab.id, label: tab.title }));
}
