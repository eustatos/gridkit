// Event Timeline Types

export interface DevToolsEvent {
  id: string;
  type: string;
  tableId: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface EventTimelineProps {
  tableId: string;
}

export type EventType = 'all' | 'sorting' | 'selection' | 'pagination' | 'state' | 'other';

export interface EventFilter {
  type: EventType;
}
