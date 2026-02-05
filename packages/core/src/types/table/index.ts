/**
 * Table interfaces and types.
 * All table-related types are re-exported from Table.ts to avoid circular dependencies.
 */

// Main table interface
export type { Table, StateCallback } from './Table';

// Table state types
export type {
  TableState,
  CellCoordinate,
  SortingState,
  FilteringState,
  FilterOperator,
  PaginationState,
  GroupingState,
  ScrollPosition,
} from './TableState';

// Table options types
export type {
  TableOptions,
} from './TableOptions';

// Column types
export type {
  Column,
  ColumnDef,
  ColumnMeta,
  ColumnAccessor,
  ColumnAccessorFn,
  ColumnValue,
} from './Column';

// Row types
export type { Row, RowModel } from './Row';

// Error types
export type { GridKitError, ErrorCode } from './Errors';