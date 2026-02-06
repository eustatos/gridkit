/**
 * GridKit Table Core API
 * 
 * This is the main entry point for the table functionality.
 */

// Main factory function
export { createTable } from './factory';

// Types
export type {
  Table,
  TableOptions,
  TableState,
  Row,
  Column,
  ColumnDef,
  RowData,
  RowId,
} from '../types';

// Error types
export type {
  GridError,
  ValidationError,
  ValidationAggregateError,
} from '../errors';

// Event types
export type {
  TableEvent,
  TableEventMap,
} from '../events';