/**
 * @gridkit/core
 *
 * Core table functionality for GridKit.
 * Framework-agnostic, zero dependencies.
 *
 * @packageDocumentation
 */

// Re-export all core types
// Note: For better tree-shaking, import types directly from './types/base'
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

// Also export the types module for convenience
export type * as Types from './types';

// Export version
export const VERSION = '0.0.1';
