type Card = Record<string, unknown>;

const tile = (entity: string): Card => ({ type: 'tile', entity });

const homeCards: Card[] = [
  'light.living_room',
  'light.kitchen',
  'light.bedroom',
  'switch.porch_plug',
  'alarm_control_panel.home',
  'climate.living_room',
  'lock.front_door',
  'cover.garage_door',
  'media_player.living_room_speaker',
  'sensor.living_room_temperature',
  'sensor.front_door_battery',
  'fan.bedroom',
  'person.hats',
  'sensor.power_usage',
].map(tile);

const mushroomCards: Card[] = [
  { type: 'custom:mushroom-title-card', title: 'Mushroom Cards', subtitle: 'Sliders, chips and state cards' },
  {
    type: 'custom:mushroom-chips-card',
    chips: [
      { type: 'entity', entity: 'light.living_room' },
      { type: 'entity', entity: 'climate.living_room' },
      { type: 'entity', entity: 'lock.front_door' },
      { type: 'entity', entity: 'sensor.living_room_temperature' },
    ],
  },
  { type: 'custom:mushroom-light-card', entity: 'light.living_room', show_brightness_control: true, collapsible_controls: false },
  { type: 'custom:mushroom-entity-card', entity: 'switch.porch_plug' },
  { type: 'custom:mushroom-climate-card', entity: 'climate.living_room', show_temperature_control: true, hvac_modes: ['off', 'heat', 'cool'], collapsible_controls: false },
  { type: 'custom:mushroom-cover-card', entity: 'cover.garage_door', show_buttons_control: true },
  { type: 'custom:mushroom-lock-card', entity: 'lock.front_door' },
  { type: 'custom:mushroom-alarm-control-panel-card', entity: 'alarm_control_panel.home', states: ['armed_home', 'armed_away'] },
  { type: 'custom:mushroom-media-player-card', entity: 'media_player.living_room_speaker', use_media_info: true, show_volume_level: true, volume_controls: ['volume_buttons', 'volume_set'] },
  { type: 'custom:mushroom-fan-card', entity: 'fan.bedroom', show_percentage_control: true, collapsible_controls: false },
  { type: 'custom:mushroom-person-card', entity: 'person.hats' },
];

const bubbleCards: Card[] = [
  { type: 'custom:bubble-card', card_type: 'separator', name: 'Bubble Card', icon: 'mdi:circle-bubble' },
  { type: 'custom:bubble-card', card_type: 'button', button_type: 'slider', entity: 'light.living_room', name: 'Living Room' },
  { type: 'custom:bubble-card', card_type: 'button', button_type: 'switch', entity: 'switch.porch_plug', name: 'Porch Plug' },
  { type: 'custom:bubble-card', card_type: 'button', button_type: 'state', entity: 'lock.front_door', name: 'Front Door' },
  { type: 'custom:bubble-card', card_type: 'cover', entity: 'cover.garage_door', name: 'Garage Door' },
  { type: 'custom:bubble-card', card_type: 'media-player', entity: 'media_player.living_room_speaker', name: 'Speaker' },
  { type: 'custom:bubble-card', card_type: 'climate', entity: 'climate.living_room', name: 'Thermostat' },
];

const layoutCards: Card[] = [
  { type: 'markdown', content: '## Layout Card\nThis view is arranged by `custom:grid-layout`.', view_layout: { 'grid-area': 'header' } },
  { type: 'tile', entity: 'climate.living_room', view_layout: { 'grid-area': 'main' } },
  { type: 'tile', entity: 'media_player.living_room_speaker', view_layout: { 'grid-area': 'side' } },
  { type: 'tile', entity: 'sensor.living_room_temperature', view_layout: { 'grid-area': 'footer-a' } },
  { type: 'tile', entity: 'sensor.power_usage', view_layout: { 'grid-area': 'footer-b' } },
  { type: 'tile', entity: 'light.living_room', view_layout: { 'grid-area': 'footer-c' } },
];

const buttonCards: Card[] = [
  { type: 'custom:button-card', entity: 'light.living_room', name: 'Living Room', show_state: true },
  { type: 'custom:button-card', entity: 'switch.porch_plug', name: 'Porch Plug', show_state: true },
  { type: 'custom:button-card', entity: 'lock.front_door', name: 'Front Door', show_state: true, icon: 'mdi:door' },
  { type: 'custom:button-card', entity: 'climate.living_room', name: 'Thermostat', show_state: true, icon: 'mdi:thermostat' },
  { type: 'custom:button-card', entity: 'sensor.living_room_temperature', name: 'Temperature', show_state: true, layout: 'icon_name_state2nd' },
  { type: 'custom:button-card', entity: 'media_player.living_room_speaker', name: 'Speaker', show_state: true, layout: 'name_state' },
];

const stackCards: Card[] = [
  {
    type: 'custom:stack-in-card',
    cards: [
      { type: 'markdown', content: '### Living Room\nOne card, several cards inside.' },
      { type: 'horizontal-stack', cards: [tile('light.living_room'), tile('climate.living_room')] },
      { type: 'horizontal-stack', cards: [tile('media_player.living_room_speaker'), tile('sensor.living_room_temperature')] },
    ],
  },
  {
    type: 'custom:stack-in-card',
    mode: 'vertical',
    cards: [
      { type: 'markdown', content: '### Entryway' },
      tile('lock.front_door'),
      tile('alarm_control_panel.home'),
      tile('sensor.front_door_battery'),
    ],
  },
];

const cardModStyle = `ha-card {
  border-radius: var(--ha-card-border-radius, 24px);
  background: var(--ha-card-glass-tint, rgba(255, 255, 255, 0.12));
  backdrop-filter: var(--ha-card-backdrop-filter, blur(16px));
  -webkit-backdrop-filter: var(--ha-card-backdrop-filter, blur(16px));
  border: 1px solid rgba(255, 255, 255, 0.18);
}`;

const cardModCards: Card[] = [
  { type: 'markdown', content: '## card-mod\nEach card below is styled with its own `card_mod` rules on top of the theme.', card_mod: { style: cardModStyle } },
  { type: 'entities', title: 'Entities', entities: ['light.living_room', 'switch.porch_plug', 'lock.front_door'], card_mod: { style: cardModStyle } },
  { type: 'glance', title: 'Glance', entities: ['sensor.living_room_temperature', 'sensor.front_door_battery', 'sensor.power_usage'], card_mod: { style: cardModStyle } },
  { type: 'tile', entity: 'climate.living_room', card_mod: { style: `ha-card { box-shadow: 0 0 24px var(--primary-color) !important; }` } },
  { type: 'button', entity: 'light.kitchen', name: 'Kitchen', show_state: true, card_mod: { style: `ha-card { background: linear-gradient(135deg, var(--primary-color), var(--accent-color)) !important; color: white; }` } },
];

export const DEMO_DASHBOARD = {
  views: [
    { title: 'Home', path: 'home', cards: homeCards },
    { title: 'Mushroom', path: 'mushroom', cards: mushroomCards },
    { title: 'Bubble Card', path: 'bubble-card', cards: bubbleCards },
    {
      title: 'Layout Card',
      path: 'layout-card',
      type: 'custom:grid-layout',
      layout: {
        'grid-template-columns': 'repeat(3, 1fr)',
        'grid-template-areas': '"header header header" "main main side" "footer-a footer-b footer-c"',
        'grid-gap': '12px',
      },
      cards: layoutCards,
    },
    { title: 'Button Card', path: 'button-card', cards: buttonCards },
    { title: 'Stack-in-Card', path: 'stack-in-card', cards: stackCards },
    { title: 'card-mod', path: 'card-mod', cards: cardModCards },
  ],
};
