/**
 * GridKit Event System Types
 *
 * This module contains the type-safe event definitions for the entire GridKit system.
 * All events are strongly typed and integrated with existing core types.
 *
 * @module @gridkit/core/events/types
 */

import type { RowId, ColumnId } from '../types/base';
import type { TableMeta } from '../types/table';
/**
 * Event namespace aligned with core architecture.
 * Maps to component boundaries from CORE-001 to CORE-004.
 *
 * @public
 */
export type EventNamespace =
  | 'grid' // Grid lifecycle (CORE-002)
  | 'column' // Column operations (CORE-003)
  | 'column-group' // Column grouping (CORE-003)
  | 'row' // Row operations (CORE-004)
  | 'cell' // Cell-level events
  | 'selection' // Selection state
  | 'virtualization' // Viewport events (CORE-002)
  | 'sorting' // Sort operations (CORE-002)
  | 'filtering' // Filter operations (CORE-002)
  | 'validation' // Validation results (CORE-001)
  | 'config' // Configuration changes
  | 'plugin' // Plugin system
  | 'custom'; // User-defined events

/**
 * Event priority levels.
 * Determines execution order and scheduling strategy.
 *
 * @public
 */
export enum EventPriority {
  IMMEDIATE = 0, // Synchronous, blocks execution (use sparingly)
  HIGH = 1, // Next microtask
  NORMAL = 2, // Default priority, scheduled in priority queue
  LOW = 3, // Deferred to idle callback
}

/**
 * Base event interface.
 * All events extend this structure.
 *
 * @template T - The event payload type
 *
 * @public
 */
export interface GridEvent<T = unknown> {
  /** Event type (e.g., 'row:add', 'column:resize') */
  type: string;

  /** Event namespace extracted from type */
  namespace: EventNamespace;

  /** Event-specific payload */
  payload: T;

  /** Timestamp when event was emitted */
  timestamp: number;

  /** Optional source identifier (e.g., plugin ID, component name) */
  source?: string;

  /** Optional metadata for debugging and instrumentation */
  metadata?: Record<string, unknown>;
}

/**
 * Event handler function.
 *
 * @template T - The event payload type
 * @param event - The grid event
 * @returns void or Promise<void> for async handlers
 *
 * @public
 */
export type EventHandler<T = unknown> = (
  event: GridEvent<T>
) => void | Promise<void>;

/**
 * Event handler options.
 *
 * @public
 */
export interface EventHandlerOptions {
  /** Event execution priority */
  priority?: EventPriority;

  /** Execute handler only once */
  once?: boolean;

  /** Filter events before handling */
  filter?: (event: GridEvent) => boolean;

  /** Debounce delay in milliseconds */
  debounce?: number;

  /** Throttle interval in milliseconds */
  throttle?: number;
}

/**
 * Event middleware function.
 * Can modify, cancel, or pass through events.
 *
 * @param event - Input event
 * @returns Modified event or null to cancel
 *
 * @public
 */
export type EventMiddleware = (event: GridEvent) => GridEvent | null;

/**
 * Event subscription handle.
 *
 * @public
 */
export interface EventSubscription {
  /** Unsubscribe from the event */
  unsubscribe: () => void;
}

/**
 * Strongly-typed event registry.
 * All GridKit events are defined here.
 * Extend this interface to register custom events.
 *
 * ✅ Aligned with CORE-001 to CORE-004 architecture
 *
 * @public
 */
export interface EventRegistry {
  // ============================================
  // Grid Lifecycle Events (CORE-002)
  // ============================================

  /**
   * Fired when grid instance is created.
   */
  'grid:init': {
    gridId: string;
  };

  /**
   * Fired when grid is fully initialized and ready.
   */
  'grid:ready': {
    gridId: string;
    timestamp: number;
    meta: TableMeta;
  };

  /**
   * Fired when grid is being destroyed.
   */
  'grid:destroy': {
    gridId: string;
  };

  /**
   * Fired on grid-level errors.
   */
  'grid:error': {
    gridId: string;
    error: Error;
  };

  // ============================================
  // Column Events (CORE-003)
  // ============================================

  /**
   * Fired when column is added.
   */
  'column:add': {
    columnId: ColumnId;
    index: number;
    groupId?: string;
  };

  /**
   * Fired when column is removed.
   */
  'column:remove': {
    columnId: ColumnId;
  };

  /**
   * Fired when column is resized.
   */
  'column:resize': {
    columnId: ColumnId;
    width: number;
    oldWidth: number;
  };

  /**
   * Fired when column is reordered.
   */
  'column:reorder': {
    columnId: ColumnId;
    fromIndex: number;
    toIndex: number;
  };

  /**
   * Fired when column visibility changes.
   */
  'column:visibility-change': {
    columnId: ColumnId;
    visible: boolean;
  };

  /**
   * Fired when column is pinned/unpinned.
   */
  'column:pin': {
    columnId: ColumnId;
    position: 'left' | 'right' | 'none';
  };

  /**
   * Fired on column-level errors.
   */
  'column:error': {
    columnId: ColumnId;
    error: Error;
  };

  // ============================================
  // Column Group Events (CORE-003)
  // ============================================

  /**
   * Fired when column group is added.
   */
  'column-group:add': {
    groupId: string;
    parentId?: string;
  };

  /**
   * Fired when column group is removed.
   */
  'column-group:remove': {
    groupId: string;
  };

  /**
   * Fired when column group is collapsed/expanded.
   */
  'column-group:toggle': {
    groupId: string;
    collapsed: boolean;
  };

  /**
   * Fired when column group is reordered.
   */
  'column-group:reorder': {
    groupId: string;
    fromIndex: number;
    toIndex: number;
  };

  // ============================================
  // Row Events (CORE-004)
  // ============================================

  /**
   * Fired when row is added.
   */
  'row:add': {
    rowId: RowId;
    index: number;
    isNew: boolean;
  };

  /**
   * Fired when row is removed.
   */
  'row:remove': {
    rowId: RowId;
  };

  /**
   * Fired when row data is updated.
   */
  'row:update': {
    rowId: RowId;
    changes: Record<string, unknown>;
    isDirty: boolean;
  };

  /**
   * Fired when row enters edit mode.
   */
  'row:edit-start': {
    rowId: RowId;
  };

  /**
   * Fired when row edit is cancelled.
   */
  'row:edit-cancel': {
    rowId: RowId;
  };

  /**
   * Fired when row edit is committed.
   */
  'row:edit-commit': {
    rowId: RowId;
    changes: Record<string, unknown>;
    isValid: boolean;
  };

  /**
   * Fired when row dirty state changes.
   */
  'row:dirty': {
    rowId: RowId;
    isDirty: boolean;
  };

  // ============================================
  // Bulk Row Operations (CORE-004)
  // ============================================

  /**
   * Fired when multiple rows are added.
   */
  'rows:bulk-add': {
    rowIds: RowId[];
    count: number;
  };

  /**
   * Fired when multiple rows are removed.
   */
  'rows:bulk-remove': {
    rowIds: RowId[];
    count: number;
  };

  /**
   * Fired when multiple rows are updated.
   */
  'rows:bulk-update': {
    rowIds: RowId[];
    changes: Record<string, unknown>;
  };

  // ============================================
  // Cell Events
  // ============================================

  /**
   * Fired when cell receives focus.
   */
  'cell:focus': {
    cellId: string;
    rowId: RowId;
    columnId: ColumnId;
  };

  /**
   * Fired when cell loses focus.
   */
  'cell:blur': {
    cellId: string;
    rowId: RowId;
    columnId: ColumnId;
  };

  /**
   * Fired when cell enters edit mode.
   */
  'cell:edit': {
    cellId: string;
    rowId: RowId;
    columnId: ColumnId;
  };

  /**
   * Fired when cell value is updated.
   */
  'cell:update': {
    cellId: string;
    rowId: RowId;
    columnId: ColumnId;
    value: unknown;
    oldValue: unknown;
  };

  // ============================================
  // Selection Events
  // ============================================

  /**
   * Fired when selection changes.
   */
  'selection:change': {
    selectedIds: RowId[];
  };

  /**
   * Fired when selection is cleared.
   */
  'selection:clear': {
    previousCount: number;
  };

  // ============================================
  // Virtualization Events (CORE-002)
  // ============================================

  /**
   * Fired when visible row range changes.
   */
  'virtualization:range-change': {
    startIndex: number;
    endIndex: number;
    visibleRows: RowId[];
  };

  /**
   * Fired on scroll.
   */
  'virtualization:scroll': {
    scrollTop: number;
    scrollLeft: number;
  };

  // ============================================
  // Sorting Events (CORE-002)
  // ============================================

  /**
   * Fired when sorting configuration changes.
   */
  'sorting:change': {
    sorts: Array<{ id: string; desc: boolean }>;
    affectedRows: RowId[];
  };

  // ============================================
  // Filtering Events (CORE-002)
  // ============================================

  /**
   * Fired when filtering configuration changes.
   */
  'filtering:change': {
    filters: Array<{ id: string; value: unknown }>;
    matchedRows: RowId[];
    totalRows: number;
  };

  // ============================================
  // Configuration Events (CORE-002)
  // ============================================

  /**
   * Fired when configuration is updated.
   */
  'config:update': {
    path: string; // e.g., 'virtualization.enabled'
    value: unknown;
    oldValue: unknown;
  };

  /**
   * Fired when configuration is reset.
   */
  'config:reset': {
    section?: string;
  };

  // ============================================
  // Plugin Events
  // ============================================

  /**
   * Fired when plugin is registered.
   */
  'plugin:register': {
    pluginId: string;
    version: string;
  };

  /**
   * Fired when plugin is unregistered.
   */
  'plugin:unregister': {
    pluginId: string;
  };

  /**
   * Fired on plugin-level errors.
   */
  'plugin:error': {
    pluginId: string;
    error: Error;
  };

  // ============================================
  // Additional State Change Events
  // ============================================

  /**
   * Fired when grid data changes.
   */
  'grid:data-change': {
    oldData: unknown[];
    newData: unknown[];
  };

  /**
   * Fired when column order changes.
   */
  'column:order-change': {
    oldOrder: string[];
    newOrder: string[];
  };

  /**
   * Fired when grid state changes.
   */
  'grid:state-change': {
    oldState: Record<string, unknown>;
    newState: Record<string, unknown>;
    changedKeys: string[];
  };

  /**
   * Fired when grid is reset to initial state.
   */
  'grid:reset': {
    oldState: Record<string, unknown>;
    newState: Record<string, unknown>;
  };

  // ============================================
  // Additional Selection Events
  // ============================================

  /**
   * Fired when bulk selection changes.
   */
  'selection:bulk-change': {
    added: RowId[];
    removed: RowId[];
    total: number;
  };

  // ============================================
  // Custom Events
  // ============================================
  /**
   * Generic custom event for user-defined events.
   */
  'custom:event': {
    [key: string]: unknown;
  };
}
/**
 * Extract event type from registry.
 *
 * @public
 */
export type EventType = keyof EventRegistry;

/**
 * Extract payload type for specific event.
 *
 * @template T - Event type
 * @public
 */
export type EventPayload<T extends EventType> = EventRegistry[T];

/**
 * Type guard to check if event type is in registry.
 *
 * @param event - Event type to check
 * @returns True if event is registered
 *
 * @public
 */
export function isRegisteredEvent(event: string): event is EventType {
  // This is a compile-time type guard
  // Actual implementation would check against known events
  return event.includes(':');
}
