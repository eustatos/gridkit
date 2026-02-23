// Column events (CORE-003)
// Implements CORE-005B requirement for column operations events

import type { GridEvent } from './base';
import type { GridId } from './grid';

// Type definitions for column identifiers
export type ColumnId = string;

// Column lifecycle events
export interface ColumnAddEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly index: number;
  readonly definition: Record<string, unknown>;
}> {
  readonly type: 'column:add';
}

export interface ColumnRemoveEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly index: number;
}> {
  readonly type: 'column:remove';
}

// Column dimension events
export interface ColumnResizeEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly width: number;
  readonly previousWidth: number;
}> {
  readonly type: 'column:resize';
}

// Column position events
export interface ColumnMoveEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly fromIndex: number;
  readonly toIndex: number;
}> {
  readonly type: 'column:move';
}

// Column state events
export interface ColumnStateChangeEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly property: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}> {
  readonly type: 'column:state-change';
}

// Column visibility events
export interface ColumnVisibilityEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly visible: boolean;
}> {
  readonly type: 'column:visibility';
}

// Column sort events
export interface ColumnSortEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly direction: 'asc' | 'desc' | null;
}> {
  readonly type: 'column:sort';
}

// Column filter events
export interface ColumnFilterEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly filter: unknown;
}> {
  readonly type: 'column:filter';
}

// Column pinning events
export interface ColumnPinEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly position: 'left' | 'right' | false;
  readonly previousPosition: 'left' | 'right' | false;
}> {
  readonly type: 'column:pin';
}

// Column reorder events
export interface ColumnReorderEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnOrder: readonly ColumnId[];
}> {
  readonly type: 'column:reorder';
}

// Union type of all column events
export type ColumnEventType = 
  | ColumnAddEvent
  | ColumnRemoveEvent
  | ColumnResizeEvent
  | ColumnMoveEvent
  | ColumnStateChangeEvent
  | ColumnVisibilityEvent
  | ColumnSortEvent
  | ColumnFilterEvent
  | ColumnPinEvent
  | ColumnReorderEvent;

// Type mapping for column event payloads
export interface ColumnEventPayloadMap {
  'column:add': ColumnAddEvent['payload'];
  'column:remove': ColumnRemoveEvent['payload'];
  'column:resize': ColumnResizeEvent['payload'];
  'column:move': ColumnMoveEvent['payload'];
  'column:state-change': ColumnStateChangeEvent['payload'];
  'column:visibility': ColumnVisibilityEvent['payload'];
  'column:sort': ColumnSortEvent['payload'];
  'column:filter': ColumnFilterEvent['payload'];
  'column:pin': ColumnPinEvent['payload'];
  'column:reorder': ColumnReorderEvent['payload'];
}

// Helper type to get payload type by event type
export type ColumnEventPayload<T extends keyof ColumnEventPayloadMap> = ColumnEventPayloadMap[T];