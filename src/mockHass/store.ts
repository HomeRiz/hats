export interface MockEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
  context: { id: string; parent_id: null; user_id: null };
}

type Listener = (states: MockEntityState[]) => void;

const TOGGLE_SERVICES: Record<string, { on: string; off: string; onState: string; offState: string }> = {
  light: { on: 'turn_on', off: 'turn_off', onState: 'on', offState: 'off' },
  switch: { on: 'turn_on', off: 'turn_off', onState: 'on', offState: 'off' },
  lock: { on: 'unlock', off: 'lock', onState: 'unlocked', offState: 'locked' },
  cover: { on: 'open_cover', off: 'close_cover', onState: 'open', offState: 'closed' },
};

export class MockHassStore {
  private states = new Map<string, MockEntityState>();
  private listeners = new Set<Listener>();
  private themeListeners = new Set<(theme: { name: string; vars: Record<string, string> }) => void>();
  private theme: { name: string; vars: Record<string, string> } | null = null;

  constructor(initialEntities: MockEntityState[]) {
    for (const entity of initialEntities) this.states.set(entity.entity_id, entity);
  }

  getStates(): MockEntityState[] {
    return Array.from(this.states.values());
  }

  getState(entityId: string): MockEntityState | undefined {
    return this.states.get(entityId);
  }

  setState(entityId: string, patch: Partial<Pick<MockEntityState, 'state' | 'attributes'>>): void {
    const current = this.states.get(entityId);
    if (!current) return;
    const now = new Date().toISOString();
    this.states.set(entityId, {
      ...current,
      ...patch,
      attributes: patch.attributes ? { ...current.attributes, ...patch.attributes } : current.attributes,
      last_updated: now,
      last_changed: patch.state && patch.state !== current.state ? now : current.last_changed,
    });
    this.notify();
  }

  callService(domain: string, service: string, serviceData: Record<string, unknown>): void {
    const entityId = serviceData.entity_id;
    if (typeof entityId !== 'string') return;
    const toggle = TOGGLE_SERVICES[domain];
    if (!toggle) return;
    if (service === toggle.on) this.setState(entityId, { state: toggle.onState });
    else if (service === toggle.off) this.setState(entityId, { state: toggle.offState });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setTheme(themeName: string, themeVars: Record<string, string>): void {
    this.theme = { name: themeName, vars: themeVars };
    for (const listener of this.themeListeners) listener(this.theme);
  }

  getTheme(): { name: string; vars: Record<string, string> } | null {
    return this.theme;
  }

  subscribeTheme(listener: (theme: { name: string; vars: Record<string, string> }) => void): () => void {
    this.themeListeners.add(listener);
    return () => this.themeListeners.delete(listener);
  }

  private notify(): void {
    const states = this.getStates();
    for (const listener of this.listeners) listener(states);
  }
}
