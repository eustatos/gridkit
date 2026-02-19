// Core event registry with essential event types
// Note: GridId, ColumnId, RowId are imported from '@/types/base' (not from this file)

import type { GridEvent } from './base';

// Grid lifecycle events
export interface GridCreatedEvent extends GridEvent<{ gridId: string }> {
  readonly type: 'grid.created';
}

export interface GridDestroyedEvent extends GridEvent<{ gridId: string }> {
  readonly type: 'grid.destroyed';
}

export interface GridResizeEvent extends GridEvent<{ 
  gridId: string; 
  width: number; 
  height: number 
}> {
  readonly type: 'grid.resize';
}

// Column events
export interface ColumnAddedEvent extends GridEvent<{ 
  gridId: string; 
  columnId: string;
  index: number;
}> {
  readonly type: 'column.added';
}

export interface ColumnRemovedEvent extends GridEvent<{ 
  gridId: string; 
  columnId: string;
}> {
  readonly type: 'column.removed';
}

export interface ColumnMovedEvent extends GridEvent<{ 
  gridId: string; 
  columnId: string;
  fromIndex: number;
  toIndex: number;
}> {
  readonly type: 'column.moved';
}

// Row events
export interface RowAddedEvent extends GridEvent<{ 
  gridId: string; 
  rowId: string;
  index: number;
}> {
  readonly type: 'row.added';
}

export interface RowRemovedEvent extends GridEvent<{ 
  gridId: string; 
  rowId: string;
}> {
  readonly type: 'row.removed';
}

export interface RowMovedEvent extends GridEvent<{ 
  gridId: string; 
  rowId: string;
  fromIndex: number;
  toIndex: number;
}> {
  readonly type: 'row.moved';
}

// Cell events
export interface CellValueChangedEvent extends GridEvent<{ 
  gridId: string; 
  rowId: string;
  columnId: string;
  oldValue: unknown;
  newValue: unknown;
}> {
  readonly type: 'cell.value.changed';
}

// Selection events
export interface SelectionChangedEvent extends GridEvent<{ 
  gridId: string; 
  selectedCells: Array<{ rowId: string; columnId: string }>;
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


// Re-export base types for convenience
export type { EventType, EventPayload } from './base';
