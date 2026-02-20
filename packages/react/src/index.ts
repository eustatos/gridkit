/**
 * @gridkit/react - React adapter for GridKit
 * @packageDocumentation
 */

// Re-export core types that are useful in React
export type {
  Table,
  TableOptions,
  TableState,
  Column,
  ColumnDef,
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

export type { UseTableOptions, StateSelector } from './types';

// Context exports (to be implemented in future tasks)
// export * from './context';

// React-specific types
export * from './types';
