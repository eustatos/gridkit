/**
 * @gridkit/react - React adapter for GridKit
 * @packageDocumentation
 */

// Re-export core types that are useful in React
export type {
  TableOptions,
  TableState,
  Row,
  RowData,
} from '@gridkit/core';

// Hook exports
export { useTable } from './hooks/useTable';
export {
  useTableState,
  useTableStateProperty,
  useHasState,
  useTableData,
  useTableSorting,
  useTableFiltering,
  useTablePagination,
  useTableColumnVisibility,
  useTableColumnOrder,
  useTableExpanded,
  useTableRowSelection,
} from './hooks/useTableState';

export {
  useTableEvent,
  useTableEvents,
  useTableStateChange,
  useRowSelection,
  useColumnEvents,
  useDataEvents,
  useGridEvents,
  useSortingEvents,
  useFilteringEvents,
  usePaginationEvents,
  useExpansionEvents,
  useSelectionEvents,
} from './hooks/useTableEvents';

export {
  useColumns,
  useAllColumns,
  useColumn,
  useColumnVisibility,
} from './hooks/useColumns';
export {
  usePagination,
  type UsePaginationResult,
} from './hooks/usePagination';

export type { UseTableOptions, StateSelector } from './types';

// Component exports
export { Table, type TableProps } from './components';
export { Column, type ColumnProps, extractColumns, hasColumnChildren } from './components';

// Context exports (to be implemented in future tasks)
// export * from './context';

// React-specific types
export * from './types';
