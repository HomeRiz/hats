import { describe, it, expect, vi } from 'vitest';
import { MockHassStore } from './store';

const light = {
  entity_id: 'light.living_room',
  state: 'off',
  attributes: { friendly_name: 'Living Room Light' },
  last_changed: '2026-09-29T00:00:00Z',
  last_updated: '2026-09-29T00:00:00Z',
  context: { id: '1', parent_id: null, user_id: null },
};

describe('MockHassStore', () => {
  it('returns seeded states', () => {
    const store = new MockHassStore([light]);
    expect(store.getStates()).toHaveLength(1);
    expect(store.getState('light.living_room')?.state).toBe('off');
  });

  it('setState updates state and last_updated, notifies subscribers', () => {
    const store = new MockHassStore([light]);
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState('light.living_room', { state: 'on' });
    expect(store.getState('light.living_room')?.state).toBe('on');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('callService for light.turn_on sets state to on', () => {
    const store = new MockHassStore([light]);
    store.callService('light', 'turn_on', { entity_id: 'light.living_room' });
    expect(store.getState('light.living_room')?.state).toBe('on');
  });

  it('callService for light.turn_off sets state to off', () => {
    const store = new MockHassStore([{ ...light, state: 'on' }]);
    store.callService('light', 'turn_off', { entity_id: 'light.living_room' });
    expect(store.getState('light.living_room')?.state).toBe('off');
  });

  it('callService for an unknown entity_id is a safe no-op', () => {
    const store = new MockHassStore([light]);
    expect(() => store.callService('light', 'turn_on', { entity_id: 'light.does_not_exist' })).not.toThrow();
  });

  it('unsubscribe stops notifications', () => {
    const store = new MockHassStore([light]);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setState('light.living_room', { state: 'on' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('setTheme/getTheme round-trips without touching entity state', () => {
    const store = new MockHassStore([light]);
    store.setTheme('candidate', { 'primary-color': '#ff0000' });
    expect(store.getTheme()).toEqual({ name: 'candidate', vars: { 'primary-color': '#ff0000' } });
    expect(store.getState('light.living_room')?.state).toBe('off');
  });
});
