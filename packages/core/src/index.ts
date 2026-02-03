/**
 * @gridkit/core
 *
 * Core table functionality for GridKit.
 * Framework-agnostic, zero dependencies.
 *
 * Includes type-safe event system for pub/sub communication.
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

// Export state store
export { createStore } from './state';
export type { Store } from './state';

// Export table factory
export { createTable } from './table';
export type { Table, TableOptions, TableState, TableMeta } from './table';

// Export event system
export {
  // Event bus
  createEventBus,
  getEventBus,
  resetEventBus,
  EventBus,
  // Event utilities
  EventPriority,
  createLoggerMiddleware,
  simpleLogger,
  // Helper functions
  createEventFactory,
  createDebouncedHandler,
  createThrottledHandler,
} from './events';
export type {
  // Event types
  EventType,
  EventPayload,
  EventHandler,
  EventHandlerOptions,
  EventRegistry,
  GridEvent,
  EventNamespace,
  EventMiddleware,
  EventSubscription,
  // Event bus types
  EventBusOptions,
  // Logger types
  LoggerMiddlewareOptions,
} from './events';

// Export all Core API modules from core.ts
export * from './core';

// Also export the types module for convenience
export type * as Types from './types';

// Export version
export const VERSION = '0.0.1';
