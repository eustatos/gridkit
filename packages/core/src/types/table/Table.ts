/**
 * Main table instance interface and all related types.
 *
 * All table-related types are defined in this file to avoid circular dependencies.
 * This includes Table, TableState, TableOptions, and all supporting types.
 *
 * @template TData - Row data type (must extend RowData)
 */

import type { Column } from './Column';
import type { Row, RowModel } from './Row';
import type { TableOptions } from './TableOptions';
import type { TableState } from './TableState';

import type { PerformanceMetrics } from '@/performance';
import type {
  GridId,
  RowId,
  ColumnId,
  RowData,
  Updater,
  Listener,
  Unsubscribe,
} from '@/types';

// ===================================================================
// Table Instance Interface
// ===================================================================

/**
 * Main table instance - the core GridKit API.
 * Immutable by design with functional updates.
 *
 * @template TData - Row data type (must extend RowData)
 *
 * @example
 * ```ts
 * const table = createTable<User>({
 *   columns: [...],
 *   data: users,
 * });
 *
 * // Subscribe to changes
 * const unsubscribe = table.subscribe(state => {
 *   console.log('Table updated:', state);
 * });
 * ```
 */
export interface Table<TData extends RowData> {
  // === State Management ===

  /**
   * Get current immutable table state.
   * Returns a new object on each call - safe for React/Vue.
   */
  getState(): Readonly<TableState<TData>>;

  /**
   * Update table state immutably.
   * Supports both direct values and functional updates.
   */
  setState(updater: Updater<TableState<TData>>): void;

  /**
   * Subscribe to state changes.
   * Returns cleanup function for memory safety.
   *
   * @returns Function to unsubscribe
   */
  subscribe(listener: Listener<TableState<TData>>): Unsubscribe;

  // === Data Access ===

  /**
   * Get the row model with current filtering/sorting applied.
   * This is the primary data access method.
   */
  getRowModel(): RowModel<TData>;

  /**
   * Get a specific row by ID.
   * O(1) lookup via internal index.
   */
  getRow(id: RowId): Row<TData> | undefined;

  /**
   * Get all column instances (including hidden).
   */
  getAllColumns(): Column<TData>[];

  /**
   * Get only visible columns in current order.
   */
  getVisibleColumns(): Column<TData>[];

  /**
   * Get column by ID (case-sensitive).
   */
  getColumn(id: ColumnId): Column<TData> | undefined;

  // === Lifecycle ===

  /**
   * Reset table to initial state.
   * Clears filters, sorting, pagination, etc.
   */
  reset(): void;

  /**
   * Destroy table instance and clean up resources.
   * Required for memory management in SPA applications.
   */
  destroy(): void;

  // === Metadata ===

  /**
   * Read-only reference to original configuration.
   */
  readonly options: Readonly<TableOptions<TData>>;

  /**
   * Unique table identifier for debugging.
   */
  readonly id: GridId;

  /**
   * Performance metrics (enabled in debug mode).
   */
  readonly metrics?: PerformanceMetrics;
}

// ===================================================================
// Supporting Interfaces (Internal Use)
// ===================================================================

/**
 * Callback function for state subscription.
 * Receives the current state as parameter.
 */
export type StateCallback<TData extends RowData> = (
  state: TableState<TData>
) => void;

// Placeholder type that will be defined elsewhere
interface TableMetrics {}