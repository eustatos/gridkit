// Cell-level events
// Implements CORE-005B requirement for cell-level events

import type { GridEvent } from './base';
import type { ColumnId } from './column';
import type { GridId } from './grid';
import type { RowId } from './row';

// Cell focus events
export interface CellFocusEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly columnId: ColumnId;
  readonly previousRowId?: RowId;
  readonly previousColumnId?: ColumnId;
}> {
  readonly type: 'cell:focus';
}

// Cell edit events
export interface CellEditEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly columnId: ColumnId;
  readonly value: unknown;
  readonly previousValue: unknown;
}> {
  readonly type: 'cell:edit';
}

// Cell value events
export interface CellValueEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly columnId: ColumnId;
  readonly value: unknown;
  readonly previousValue: unknown;
}> {
  readonly type: 'cell:value';
}

// Cell update events
export interface CellUpdateEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly columnId: ColumnId;
  readonly value: unknown;
  readonly previousValue: unknown;
  readonly source?: string;
}> {
  readonly type: 'cell:update';
}

// Cell selection events
export interface CellSelectEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly columnId: ColumnId;
  readonly selected: boolean;
}> {
  readonly type: 'cell:select';
}

// Cell hover events
export interface CellHoverEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly columnId: ColumnId;
  readonly hovered: boolean;
}> {
  readonly type: 'cell:hover';
}

// Cell validation events
export interface CellValidationErrorEvent extends GridEvent<{
  readonly gridId: GridId;
  readonly rowId: RowId;
  readonly columnId: ColumnId;
  readonly error: string;
  readonly value: unknown;
}> {
  readonly type: 'cell:validation-error';
}

// Union type of all cell events
export type CellEventType = 
  | CellFocusEvent
  | CellEditEvent
  | CellValueEvent
  | CellUpdateEvent
  | CellSelectEvent
  | CellHoverEvent
  | CellValidationErrorEvent;

// Type mapping for cell event payloads
export interface CellEventPayloadMap {
  'cell:focus': CellFocusEvent['payload'];
  'cell:edit': CellEditEvent['payload'];
  'cell:value': CellValueEvent['payload'];
  'cell:update': CellUpdateEvent['payload'];
  'cell:select': CellSelectEvent['payload'];
  'cell:hover': CellHoverEvent['payload'];
  'cell:validation-error': CellValidationErrorEvent['payload'];
}

// Helper type to get payload type by event type
export type CellEventPayload<T extends keyof CellEventPayloadMap> = CellEventPayloadMap[T];