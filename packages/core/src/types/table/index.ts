/**
 * Table interfaces and types.
 * All table-related types are re-exported from Table.ts to avoid circular dependencies.
 */

// Re-export all types from the consolidated Table.ts
export type {
  Table,
  StateCallback,
  Unsubscribe,
  RowModel,
  Row,
  Column,
  ColumnDef,
  ColumnMeta,
  TableOptions,
  TableState,
  SortingState,
  FilteringState,
  FilterOperator,
  PaginationState,
  GroupingState,
  ScrollPosition,
  CellCoordinate,
  GridKitError,
  DebugOptions,
  TableMetrics,
  PerformanceBudgets,
  TableMeta,
  ColumnAccessor,
  ColumnAccessorFn,
  ColumnValue,
} from './Table';
