/**
 * Eventful Table Types.
 *
 * Defines the EventfulTable interface and factory functions
 * that wrap standard tables with event emission capabilities.
 *
 * @module @gridkit/core/events/types/eventful-table
 */

import { createTableEventBridge } from '../../events/integration/table-event-bridge';
import { createTable } from '../../table/factory/create-table';
import type { EventBus } from '../EventBus';
import { createEventBus } from '../EventBus';

import type { TableEventBridge } from './event-bridge';

import type {
  Table,
  TableOptions,
  RowData,
  GridId,
} from '@/types';

// ===================================================================
// Eventful Table Interface
// ===================================================================

/**
 * Extended table interface with event emission methods.
 * Wraps a standard table with an event bridge and convenient event methods.
 *
 * @template TData - Row data type
 */
export interface EventfulTable<TData extends RowData> extends Table<TData> {
  // === Event Bridge ===

  /**
   * Event bridge for the table.
   * Provides all event emission and subscription methods.
   */
  readonly events: TableEventBridge<TData>;

  // === Event Subscription Methods ===

  /**
   * Subscribe to an event on the table.
   *
   * @param event - Event type to subscribe to
   * @param handler - Event handler function
   * @param options - Optional subscription options
   * @returns Unsubscribe function
   */
  on<T extends string>(
    event: T,
    handler: (e: any) => void,
    options?: any
  ): () => void;

  /**
   * Subscribe to an event once.
   *
   * @param event - Event type to subscribe to
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  once<T extends string>(
    event: T,
    handler: (e: any) => void
  ): () => void;

  /**
   * Unsubscribe from an event.
   *
   * @param event - Event type to unsubscribe from
   * @param handler - Event handler to remove
   */
  off<T extends string>(
    event: T,
    handler: (e: any) => void
  ): void;

  // === Event Emission Methods ===

  /**
   * Emit an event for this table.
   *
   * @param event - Event type
   * @param payload - Event payload
   */
  emit<T extends string>(event: T, payload: any): void;

  // === Lifecycle ===

  /**
   * Destroy the table and cleanup event subscriptions.
   */
  destroy(): void;

  // === Metadata ===

  /**
   * Table ID.
   */
  readonly id: GridId;
}

// ===================================================================
// Eventful Table Factory
// ===================================================================

/**
 * Creates a table instance with event emission capabilities.
 * Wraps a standard table with an event bridge and convenient event methods.
 *
 * @template TData - Row data type
 * @param options - Table configuration options
 * @returns Eventful table instance
 *
 * @example
 * ```ts
 * const table = createEventfulTable({
 *   columns: [{ accessorKey: 'name' }],
 *   data: users,
 *   debug: { events: true }
 * });
 *
 * // Use event methods directly on table
 * table.on('state:update', (event) => {
 *   console.log('State changed:', event.payload.changedKeys);
 * });
 *
 * table.emit('custom:event', { data: 'value' });
 * ```
 */
export function createEventfulTable<TData extends RowData>(
  options: TableOptions<TData>
): EventfulTable<TData> {
  // Create the base table
  const table = createTable<TData>(options);

  // Create event bus for this table
  const eventBus = createEventBus({
    devMode: options.debug?.events || options.debug?.devMode || false,
  });

  // Create event bridge
  const eventBridge = createTableEventBridge(table, eventBus);

  // Create eventful table wrapper
  const eventfulTable: EventfulTable<TData> = {
    // Forward all table methods
    ...table,

    // Event bridge
    events: eventBridge,

    // Event subscription methods
    on: <T extends string>(
      event: T,
      handler: (e: any) => void,
      options?: any
    ) => eventBridge.on(event, handler, options),

    once: <T extends string>(
      event: T,
      handler: (e: any) => void
    ) => eventBridge.once(event, handler),

    off: <T extends string>(
      event: T,
      handler: (e: any) => void
    ) => eventBridge.off(event, handler),

    // Event emission
    emit: <T extends string>(event: T, payload: any) =>
      eventBridge.emitEvent(event, payload),

    // Override destroy to cleanup events
    destroy: () => {
      eventBridge.destroy();
      table.destroy();
    },
  };

  return eventfulTable;
}
