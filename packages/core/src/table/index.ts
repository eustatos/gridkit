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
  ValidatedColumnDef,
  ValidatedTableOptions,
} from '../types';

// Helper functions
export * from './helpers';

// Error types
export type { ValidationError, ValidationAggregateError } from '../errors';
