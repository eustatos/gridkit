/**
 * Event Bridge Types for GridKit Table Event System.
 *
 * Defines types for the table event bridge that connects
 * table instances with the event system.
 *
 * @module @gridkit/core/events/types/bridge
 */

import type { EventBus } from '../EventBus';
import type {
  EventType,
  EventPayload,
  EventHandler,
  EventHandlerOptions,
  GridEvent,
} from './base';
import type { TableState, RowId } from '@/types';
import type { GridId } from '@/types/base';

// ===================================================================
// Data Change Types
// ===================================================================

/**
 * Type of data change operation.
 */
export type DataChangeType = 'add' | 'update' | 'delete' | 'replace' | 'bulk';

// ===================================================================
// Table Event Bridge
// ===================================================================

/**
 * Event bridge interface for table instances.
 * Provides methods to emit events and subscribe to table-related events.
 *
 * @template TData - Row data type
 */
export interface TableEventBridge<TData extends RowData> {
  // === Event Emission ===

  /**
   * Emit a table event.
   *
   * @param event - Event type
   * @param payload - Event payload
   */
  emitEvent<T extends EventType>(event: T, payload: EventPayload<T>): void;

  /**
   * Emit a state update event with change detection.
   *
   * @param previousState - Previous table state
   * @param newState - New table state
   * @param changedKeys - Array of changed state keys
   */
  emitStateUpdate(
    previousState: TableState<TData>,
    newState: TableState<TData>,
    changedKeys: Array<keyof TableState<TData>>
  ): void;

  /**
   * Emit a data change event.
   *
   * @param changeType - Type of data change
   * @param rowIds - Array of affected row IDs
   * @param data - New data (if applicable)
   * @param previousData - Previous data (if applicable)
   */
  emitDataChange(
    changeType: DataChangeType,
    rowIds: RowId[],
    data?: TData[],
    previousData?: TData[]
  ): void;

  // === Event Subscription ===

  /**
   * Subscribe to an event.
   *
   * @param event - Event type to subscribe to
   * @param handler - Event handler function
   * @param options - Optional subscription options
   * @returns Unsubscribe function
   */
  on<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>,
    options?: EventHandlerOptions
  ): () => void;

  /**
   * Subscribe to an event once.
   *
   * @param event - Event type to subscribe to
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  once<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): () => void;

  /**
   * Unsubscribe from an event.
   *
   * @param event - Event type to unsubscribe from
   * @param handler - Event handler to remove
   */
  off<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): void;

  // === Lifecycle ===

  /**
   * Destroy the event bridge and clean up resources.
   */
  destroy(): void;

  // === Metadata ===

  /**
   * Reference to the event bus.
   */
  readonly eventBus: EventBus;

  /**
   * Table ID for event correlation.
   */
  readonly tableId: GridId;
}

/**
 * Row data type constraint.
 */
export interface RowData {
  [key: string]: unknown;
}
