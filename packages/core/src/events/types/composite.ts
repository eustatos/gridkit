// Composite EventRegistry type
// Implements CORE-005B requirement for modular type architecture

import type { GridEventType } from './grid';
import type { ColumnEventType } from './column';
import type { RowEventType } from './row';
import type { CellEventType } from './cell';
import type { StateEventType } from './state';
import type { TableEventType } from './table';

// Composite event registry type
// Combines all event types from different modules
export type EventRegistry = 
  GridEventType &
  ColumnEventType &
  RowEventType &
  CellEventType &
  StateEventType &
  TableEventType;

// Union type of all event types
export type EventType = 
  | GridEventType
  | ColumnEventType
  | RowEventType
  | CellEventType
  | StateEventType<unknown>
  | TableEventType;

// Combined payload mapping for all events
export interface EventPayloadMap extends 
  GridEventPayloadMap,
  ColumnEventPayloadMap,
  RowEventPayloadMap,
  CellEventPayloadMap,
  StateEventPayloadMap,
  TableEventPayloadMap {}

// Re-export payload mapping types from individual modules
export type {
  GridEventPayloadMap,
  GridEventPayload,
} from './grid';

export type {
  ColumnEventPayloadMap,
  ColumnEventPayload,
} from './column';

export type {
  RowEventPayloadMap,
  RowEventPayload,
} from './row';

export type {
  CellEventPayloadMap,
  CellEventPayload,
} from './cell';

export type {
  StateEventPayloadMap,
  StateEventPayload,
} from './state';

export type {
  TableEventPayloadMap,
  TableEventPayload,
} from './table';