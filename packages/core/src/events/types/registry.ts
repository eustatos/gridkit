// Core event registry with essential event types

import type { GridEvent } from './base';
import type { GridId } from '../../types/grid';
import type { ColumnId } from '../../column/types';
import type { RowId } from '../../row/types';

// Grid lifecycle events
export interface GridCreatedEvent extends GridEvent<{ gridId: GridId }> {
  readonly type: 'grid.created';
}

export interface GridDestroyedEvent extends GridEvent<{ gridId: GridId }> {
  readonly type: 'grid.destroyed';
}

export interface GridResizeEvent extends GridEvent<{ 
  gridId: GridId; 
  width: number; 
  height: number 
}> {
  readonly type: 'grid.resize';
}

// Column events
export interface ColumnAddedEvent extends GridEvent<{ 
  gridId: GridId; 
  columnId: ColumnId;
  index: number;
}> {
  readonly type: 'column.added';
}

export interface ColumnRemovedEvent extends GridEvent<{ 
  gridId: GridId; 
  columnId: ColumnId;
}> {
  readonly type: 'column.removed';
}

export interface ColumnMovedEvent extends GridEvent<{ 
  gridId: GridId; 
  columnId: ColumnId;
  fromIndex: number;
  toIndex: number;
}> {
  readonly type: 'column.moved';
}

// Row events
export interface RowAddedEvent extends GridEvent<{ 
  gridId: GridId; 
  rowId: RowId;
  index: number;
}> {
  readonly type: 'row.added';
}

export interface RowRemovedEvent extends GridEvent<{ 
  gridId: GridId; 
  rowId: RowId;
}> {
  readonly type: 'row.removed';
}

export interface RowMovedEvent extends GridEvent<{ 
  gridId: GridId; 
  rowId: RowId;
  fromIndex: number;
  toIndex: number;
}> {
  readonly type: 'row.moved';
}

// Cell events
export interface CellValueChangedEvent extends GridEvent<{ 
  gridId: GridId; 
  rowId: RowId;
  columnId: ColumnId;
  oldValue: unknown;
  newValue: unknown;
}> {
  readonly type: 'cell.value.changed';
}

// Selection events
export interface SelectionChangedEvent extends GridEvent<{ 
  gridId: GridId; 
  selectedCells: Array<{ rowId: RowId; columnId: ColumnId }>;
}> {
  readonly type: 'selection.changed';
}

// Union type of all core events
export type CoreEventType = 
  | GridCreatedEvent
  | GridDestroyedEvent
  | GridResizeEvent
  | ColumnAddedEvent
  | ColumnRemovedEvent
  | ColumnMovedEvent
  | RowAddedEvent
  | RowRemovedEvent
  | RowMovedEvent
  | CellValueChangedEvent
  | SelectionChangedEvent;

// Type mapping for event payloads
export interface EventPayloadMap {
  'grid.created': GridCreatedEvent['payload'];
  'grid.destroyed': GridDestroyedEvent['payload'];
  'grid.resize': GridResizeEvent['payload'];
  'column.added': ColumnAddedEvent['payload'];
  'column.removed': ColumnRemovedEvent['payload'];
  'column.moved': ColumnMovedEvent['payload'];
  'row.added': RowAddedEvent['payload'];
  'row.removed': RowRemovedEvent['payload'];
  'row.moved': RowMovedEvent['payload'];
  'cell.value.changed': CellValueChangedEvent['payload'];
  'selection.changed': SelectionChangedEvent['payload'];
}

// Helper type to get payload type by event type
export type EventPayload<T extends keyof EventPayloadMap> = EventPayloadMap[T];

// Helper type for event type strings
export type EventType = keyof EventPayloadMap;