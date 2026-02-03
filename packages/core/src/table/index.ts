/**
 * Table module for GridKit.
 *
 * This module provides the main table factory function and related types.
 * The table is the central data structure that manages state, columns, rows,
 * and provides the API for all table operations including event system.
 *
 * @module @gridkit/core/table
 */

export { createTable } from './create-table';
export type {
  Table,
  TableOptions,
  TableState,
  TableMeta,
} from '../types/table';

// Re-export event types for convenience
export type {
  EventType,
  EventPayload,
  EventHandler,
  EventHandlerOptions,
} from '../events/types';
