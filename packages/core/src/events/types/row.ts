// Row events (CORE-004)
// Implements CORE-005B requirement for row operations events

import type { GridEvent } from './base';
import type { GridId } from './grid';

// Type definitions for row identifiers
export type RowId = string;

// Row lifecycle events
export interface RowAddEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly index: number;
  readonly data: Record<string, unknown>;
}> {
  readonly type: 'row:add';
}

export interface RowRemoveEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly index: number;
}> {
  readonly type: 'row:remove';
}

// Row position events
export interface RowMoveEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly fromIndex: number;
  readonly toIndex: number;
}> {
  readonly type: 'row:move';
}

// Row state events
export interface RowStateChangeEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly property: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}> {
  readonly type: 'row:state-change';
}

// Row selection events
export interface RowSelectEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly selected: boolean;
}> {
  readonly type: 'row:select';
}

// Row expansion events
export interface RowExpandEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly expanded: boolean;
}> {
  readonly type: 'row:expand';
}

// Row data events
export interface RowUpdateEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly data: Record<string, unknown>;
  readonly previousData: Record<string, unknown>;
}> {
  readonly type: 'row:update';
}

// Union type of all row events
export type RowEventType = 
  | RowAddEvent
  | RowRemoveEvent
  | RowMoveEvent
  | RowStateChangeEvent
  | RowSelectEvent
  | RowExpandEvent
  | RowUpdateEvent;

// Type mapping for row event payloads
export interface RowEventPayloadMap {
  'row:add': RowAddEvent['payload'];
  'row:remove': RowRemoveEvent['payload'];
  'row:move': RowMoveEvent['payload'];
  'row:state-change': RowStateChangeEvent['payload'];
  'row:select': RowSelectEvent['payload'];
  'row:expand': RowExpandEvent['payload'];
  'row:update': RowUpdateEvent['payload'];
}

// Helper type to get payload type by event type
export type RowEventPayload<T extends keyof RowEventPayloadMap> = RowEventPayloadMap[T];