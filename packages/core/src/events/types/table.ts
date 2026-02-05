// Table feature events (CORE-002)
// Implements CORE-005B requirement for table feature events

import type { GridEvent } from './base';
import type { GridId } from './grid';
import type { ColumnId } from './column';
import type { RowId } from './row';

// Sorting events
export interface TableSortEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly direction: 'asc' | 'desc' | null;
  readonly multiSort: boolean;
}> {
  readonly type: 'table:sort';
}

// Filtering events
export interface TableFilterEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly columnId: ColumnId;
  readonly filter: unknown;
  readonly filterType: string;
}> {
  readonly type: 'table:filter';
}

// Pagination events
export interface TablePageEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
}> {
  readonly type: 'table:page';
}

// Selection events
export interface TableSelectionEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly selectedRows: readonly RowId[];
  readonly previousSelection: readonly RowId[];
  readonly selectionType: 'single' | 'multiple' | 'range';
}> {
  readonly type: 'table:selection';
}

// Virtualization events
export interface TableVirtualizeEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly visibleRows: readonly RowId[];
  readonly renderedRows: readonly RowId[];
  readonly scrollTop: number;
  readonly scrollLeft: number;
}> {
  readonly type: 'table:virtualize';
}

// Resize events
export interface TableResizeEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly width: number;
  readonly height: number;
}> {
  readonly type: 'table:resize';
}

// Data events
export interface TableDataEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly data: readonly unknown[];
  readonly source: string;
}> {
  readonly type: 'table:data';
}

// Union type of all table events
export type TableEventType = 
  | TableSortEvent
  | TableFilterEvent
  | TablePageEvent
  | TableSelectionEvent
  | TableVirtualizeEvent
  | TableResizeEvent
  | TableDataEvent;

// Type mapping for table event payloads
export interface TableEventPayloadMap {
  'table:sort': TableSortEvent['payload'];
  'table:filter': TableFilterEvent['payload'];
  'table:page': TablePageEvent['payload'];
  'table:selection': TableSelectionEvent['payload'];
  'table:virtualize': TableVirtualizeEvent['payload'];
  'table:resize': TableResizeEvent['payload'];
  'table:data': TableDataEvent['payload'];
}

// Helper type to get payload type by event type
export type TableEventPayload<T extends keyof TableEventPayloadMap> = TableEventPayloadMap[T];