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
  Cell,
  RowData,
} from '@gridkit/core';

// Hook exports
export { useTable } from './hooks/useTable';
export type { UseTableOptions } from './types';

// Context exports (to be implemented in future tasks)
// export * from './context';

// React-specific types
export * from './types';
