import type { MockEntityState } from './store';

const now = new Date().toISOString();
const ctx = { id: 'seed', parent_id: null, user_id: null } as const;

function entity(entity_id: string, state: string, attributes: Record<string, unknown>): MockEntityState {
  return { entity_id, state, attributes, last_changed: now, last_updated: now, context: ctx };
}

const COVER_OPEN_CLOSE_STOP = 1 | 2 | 8;
const ALARM_HOME_AWAY_NIGHT = 1 | 2 | 4;
const CLIMATE_TARGET_TEMP_ON_OFF = 1 | 128 | 256;

export const DEMO_ENTITIES: MockEntityState[] = [
  entity('light.living_room', 'on', { friendly_name: 'Living Room Light', icon: 'mdi:sofa', brightness: 180, color_mode: 'brightness', supported_color_modes: ['brightness'], supported_features: 0 }),
  entity('light.kitchen', 'off', { friendly_name: 'Kitchen Light' }),
  entity('light.bedroom', 'off', { friendly_name: 'Bedroom Light' }),
  entity('switch.porch_plug', 'on', { friendly_name: 'Porch Plug' }),
  entity('alarm_control_panel.home', 'disarmed', { friendly_name: 'Home Alarm', code_format: null, supported_features: ALARM_HOME_AWAY_NIGHT }),
  entity('climate.living_room', 'heat', { friendly_name: 'Living Room Thermostat', temperature: 21, current_temperature: 20.5, hvac_modes: ['off', 'heat', 'cool'], supported_features: CLIMATE_TARGET_TEMP_ON_OFF, min_temp: 7, max_temp: 35, target_temp_step: 0.5 }),
  entity('fan.bedroom', 'on', { friendly_name: 'Bedroom Fan', percentage: 50, percentage_step: 25, preset_modes: [], supported_features: 1 }),
  entity('person.hats', 'home', { friendly_name: 'HATS Preview', source: 'device_tracker.demo_phone' }),
  entity('sensor.power_usage', '1.8', { friendly_name: 'Power Usage', unit_of_measurement: 'kW', device_class: 'power' }),
  entity('lock.front_door', 'locked', { friendly_name: 'Front Door' }),
  entity('cover.garage_door', 'closed', { friendly_name: 'Garage Door', device_class: 'garage', current_position: 0, supported_features: COVER_OPEN_CLOSE_STOP }),
  entity('media_player.living_room_speaker', 'playing', { friendly_name: 'Living Room Speaker', media_title: 'Demo Track', volume_level: 0.4 }),
  entity('sensor.living_room_temperature', '21.4', { friendly_name: 'Living Room Temperature', unit_of_measurement: '°C', device_class: 'temperature' }),
  entity('sensor.front_door_battery', '92', { friendly_name: 'Front Door Sensor Battery', unit_of_measurement: '%', device_class: 'battery' }),
];

export const DEMO_AREAS: { id: string; name: string; entityIds: string[] }[] = [
  { id: 'living_room', name: 'Living Room', entityIds: ['light.living_room', 'climate.living_room', 'media_player.living_room_speaker', 'sensor.living_room_temperature'] },
  { id: 'kitchen', name: 'Kitchen', entityIds: ['light.kitchen'] },
  { id: 'bedroom', name: 'Bedroom', entityIds: ['light.bedroom', 'fan.bedroom'] },
  { id: 'entryway', name: 'Entryway', entityIds: ['lock.front_door', 'sensor.front_door_battery', 'alarm_control_panel.home', 'person.hats'] },
  { id: 'garage', name: 'Garage', entityIds: ['cover.garage_door'] },
  { id: 'outside', name: 'Outside', entityIds: ['switch.porch_plug', 'sensor.power_usage'] },
];
