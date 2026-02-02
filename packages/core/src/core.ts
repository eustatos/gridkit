/**
 * @gridkit/core - Core API module
 *
 * Complete implementation of Core API module including:
 * - Context management
 * - Configuration management
 * - Provider management
 * - Error handling
 */

// Re-export all core types
export type {
  // Base constraint types
  RowData,
  ColumnId,
  RowId,
  // Utility types
  AccessorValue,
  RequireKeys,
  DeepPartial,
  // Function types
  Updater,
  Listener,
  Unsubscribe,
  Comparator,
  Predicate,
} from './types/base';

// Export state store
export { createStore } from './state';
export type { Store } from './state';

// Export table factory
export { createTable } from './table';
export type { Table, TableOptions, TableState, TableMeta } from './table';

// Export errors
export { GridKitError, isGridKitError, assert } from './errors';
export type { ErrorCode } from './errors';

// Export version
export const VERSION = '0.0.1';
