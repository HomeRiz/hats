export interface LiveEntity {
  entityId: string;
  name: string;
  domain: string;
  state: string;
  icon?: string;
}

export interface LiveArea {
  id: string;
  name: string;
  entities: LiveEntity[];
}

export interface LiveViewTab {
  id: string;
  title: string;
}

export interface LiveDashboardSnapshot {
  available: boolean;
  reason?: string;
  viewTabs: LiveViewTab[];
  areas: LiveArea[];
}
