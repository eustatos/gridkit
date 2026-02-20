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
  FilterValue,
  PaginationState,
  GroupingState,
  ScrollPosition,
} from './TableState';

// Table options types
export type { TableOptions, ValidatedTableOptions, DebugOptions, DebugConfig } from './TableOptions';

// Column types (re-export from main column module)
export type {
  Column,
  ColumnDef,
  ColumnMeta,
  ColumnValue,
  AccessorKey,
  AccessorFn,
  AccessorValue,
  HeaderContext,
  CellContext,
  FooterContext,
  FooterRenderer,
  ColumnId,
  ColumnGroupId,
  Comparator as ColumnComparator,
  FilterFn,
  AggregationFn,
  ColumnFormat,
  CellMeta,
  CellValidation,
  ValidationResult,
  ColumnUtils,
} from '@/types/column';

// Row types
export type { Row, RowModel } from './Row';

// Error types
export type { GridKitError, ValidationError } from './Errors';
export type { ErrorCode, ValidationErrorCode } from '../base';
