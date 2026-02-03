/**
 * GridKit Table Types
 *
 * This module contains the core table interfaces that define the main table instance,
 * configuration options, and state management. These interfaces are the foundation
 * for the entire GridKit library.
 *
 * @module @gridkit/core/types/table
 */

import type {
  RowData,
  RowId,
  ColumnId,
  Updater,
  Listener,
  Unsubscribe,
} from './base';
import type { Column, ColumnDef } from './column';
import type { Row, RowModel } from './row';
import type {
  EventType,
  EventPayload,
  EventHandler,
  EventHandlerOptions,
  EventPriority,
} from '../events/types';

/**
 * Main table instance interface.
 * Provides access to all table functionality including event system.
 *
 * @template TData - The row data type extending RowData
 *
 * @example
 * ```typescript
 * const table = createTable<User>({
 *   columns,
 *   data,
 * });
 *
 * // Access table methods
 * const state = table.getState();
 * const rows = table.getRowModel();
 *
 * // Use event system
 * table.on('row:add', (event) => {
 *   console.log('Row added:', event.payload.rowId);
 * });
 * ```
 *
 * @public
 */
export interface Table<TData extends RowData> {
  /**
   * Get current table state.
   * State is immutable - returns a new object on each call.
   *
   * @returns Current table state
   */
  getState(): TableState<TData>;

  /**
   * Update table state immutably.
   *
   * @param updater - New state or updater function
   *
   * @example
   * ```typescript
   * // Direct state
   * table.setState(newState);
   *
   * // Updater function
   * table.setState(prev => ({ ...prev, sorting: newSorting }));
   * ```
   */
  setState(updater: Updater<TableState<TData>>): void;

  /**
   * Subscribe to state changes.
   * Listener is called whenever state updates.
   *
   * @param listener - Callback function
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = table.subscribe((state) => {
   *   console.log('State updated:', state);
   * });
   *
   * // Later: stop listening
   * unsubscribe();
   * ```
   */
  subscribe(listener: Listener<TableState<TData>>): Unsubscribe;

  /**
   * Get all columns (including hidden).
   *
   * @returns Array of all column instances
   */
  getAllColumns(): Column<TData>[];

  /**
   * Get only visible columns.
   *
   * @returns Array of visible column instances
   */
  getVisibleColumns(): Column<TData>[];

  /**
   * Get column by ID.
   *
   * @param id - Column identifier
   * @returns Column instance or undefined if not found
   */
  getColumn(id: ColumnId): Column<TData> | undefined;

  /**
   * Get current row model.
   * Row model contains all rows with current filtering/sorting applied.
   *
   * @returns Current row model
   */
  getRowModel(): RowModel<TData>;

  /**
   * Get row by ID.
   *
   * @param id - Row identifier
   * @returns Row instance or undefined if not found
   */
  getRow(id: RowId): Row<TData> | undefined;

  /**
   * Reset table to initial state.
   * Useful for clearing filters, sorting, etc.
   */
  reset(): void;

  /**
   * Destroy table instance and cleanup.
   * Removes all listeners and frees resources.
   * Table cannot be used after calling this method.
   */
  destroy(): void;

  /**
   * Subscribe to an event.
   *
   * @template T - Event type
   * @param event - Event type
   * @param handler - Event handler
   * @param options - Handler options
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = table.on('row:add', (event) => {
   *   console.log('Row added:', event.payload.rowId);
   * });
   *
   * // Later:
   * unsubscribe();
   * ```
   */
  on<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>,
    options?: EventHandlerOptions
  ): () => void;

  /**
   * Subscribe to event once.
   * Automatically unsubscribes after first invocation.
   *
   * @template T - Event type
   * @param event - Event type
   * @param handler - Event handler
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * table.once('grid:ready', (event) => {
   *   console.log('Grid is ready!');
   * });
   * ```
   */
  once<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>
  ): () => void;

  /**
   * Unsubscribe from event.
   *
   * @template T - Event type
   * @param event - Event type
   * @param handler - Event handler
   *
   * @example
   * ```typescript
   * const handler = (event) => console.log(event);
   * table.on('row:add', handler);
   *
   * // Later:
   * table.off('row:add', handler);
   * ```
   */
  off<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>
  ): void;

  /**
   * Emit an event.
   *
   * @template T - Event type
   * @param event - Event type
   * @param payload - Event payload
   * @param options - Emission options
   *
   * @example
   * ```typescript
   * table.emit('row:add', {
   *   rowId: '123',
   *   index: 0,
   *   isNew: true
   * });
   * ```
   */
  emit<T extends EventType>(
    event: T,
    payload: EventPayload<T>,
    options?: {
      priority?: EventPriority;
      source?: string;
      metadata?: Record<string, unknown>;
    }
  ): void;

  /**
   * Emit multiple events in batch.
   * More efficient than individual emits.
   *
   * @template T - Event type
   * @param events - Array of events to emit
   *
   * @example
   * ```typescript
   * table.emitBatch([
   *   {
   *     event: 'row:update',
   *     payload: { rowId: '1', changes: {} },
   *   },
   *   {
   *     event: 'selection:change',
   *     payload: { selectedIds: ['1'] },
   *   },
   * ]);
   * ```
   */
  emitBatch<T extends EventType>(
    events: Array<{
      event: T;
      payload: EventPayload<T>;
      priority?: EventPriority;
    }>
  ): void;

  /**
   * Original options used to create the table.
   * Read-only reference to initial configuration.
   */
  readonly options: TableOptions<TData>;
}

/**
 * Configuration options for creating a table.
 *
 * @template TData - The row data type
 *
 * @example
 * ```typescript
 * const options: TableOptions<User> = {
 *   columns: [
 *     { accessorKey: 'name', header: 'Name' },
 *     { accessorKey: 'email', header: 'Email' },
 *   ],
 *   data: users,
 *   getRowId: (row) => row.id.toString(),
 * };
 * ```
 *
 * @public
 */
export interface TableOptions<TData extends RowData> {
  /**
   * Column definitions.
   * At least one column is required.
   */
  columns: ColumnDef<TData>[];

  /**
   * Initial data for the table.
   *
   * @default []
   */
  data?: TData[];

  /**
   * Function to get unique row ID.
   * Used for row selection, expansion, and internal tracking.
   *
   * @param row - Row data
   * @param index - Row index in data array
   * @returns Unique row identifier
   *
   * @default (row, index) => index
   *
   * @example
   * ```typescript
   * getRowId: (row) => row.id.toString()
   * ```
   */
  getRowId?: (row: TData, index: number) => RowId;

  /**
   * Initial table state.
   * Partial state - unspecified fields use defaults.
   *
   * @default {}
   *
   * @example
   * ```typescript
   * initialState: {
   *   sorting: [{ id: 'name', desc: false }],
   *   pagination: { pageIndex: 0, pageSize: 10 },
   * }
   * ```
   */
  initialState?: Partial<TableState<TData>>;

  /**
   * Enable debug mode.
   * Logs state changes and performance metrics to console.
   *
   * @default false
   */
  debugMode?: boolean;

  /**
   * Callback when state changes.
   * Called after state is updated and listeners are notified.
   *
   * @param state - New state
   *
   * @example
   * ```typescript
   * onStateChange: (state) => {
   *   console.log('State changed:', state);
   *   localStorage.setItem('tableState', JSON.stringify(state));
   * }
   * ```
   */
  onStateChange?: (state: TableState<TData>) => void;

  /**
   * Default column options.
   * Applied to all columns unless overridden in column definition.
   *
   * @example
   * ```typescript
   * defaultColumn: Partial<ColumnDef>;
   * ```
   */
  defaultColumn?: Partial<ColumnDef<TData>>;

  /**
   * Custom metadata for application use.
   * Not used by GridKit internally.
   *
   * @example
   * ```typescript
   * meta: {
   *   tableName: 'users',
   *   permissions: ['read', 'write'],
   * }
   * ```
   */
  meta?: TableMeta;
}

/**
 * Complete table state.
 * All state is immutable - updates create new state objects.
 *
 * @template TData - The row data type
 *
 * @public
 */
export interface TableState<TData extends RowData> {
  /**
   * Current data array.
   */
  data: TData[];

  /**
   * Column visibility state.
   * Maps column ID to visibility boolean.
   *
   * @example
   * ```typescript
   * columnVisibility: {
   *   'name': true,
   *   'email': false, // hidden
   * }
   * ```
   */
  columnVisibility: Record<ColumnId, boolean>;

  /**
   * Column order.
   * Array of column IDs in display order.
   *
   * @example
   * ```typescript
   * columnOrder: ['name', 'email', 'age']
   * ```
   */
  columnOrder: ColumnId[];

  /**
   * Column sizing state.
   * Maps column ID to width in pixels.
   *
   * @example
   * ```typescript
   * columnSizing: {
   *   'name': 200,
   *   'email': 300,
   * }
   * ```
   */
  columnSizing: Record<ColumnId, number>;

  /**
   * Row selection state.
   * Maps row ID to selection boolean.
   *
   * @example
   * ```typescript
   * rowSelection: {
   *   'user-1': true,
   *   'user-3': true,
  }
   * ```
   */
  rowSelection: Record<RowId, boolean>;

  /**
   * Expanded state for grouped/tree data.
   * Maps row ID to expansion boolean.
   */
  expanded: Record<RowId, boolean>;
}

/**
 * Custom metadata type.
 * Can be extended by users for application-specific data.
 *
 * @example
 * ```typescript
 * interface CustomMeta extends TableMeta {
 *   tableName: string;
 *   permissions: string[];
 * }
 * ```
 *
 * @public
 */
export type TableMeta = Record<string, unknown>;
