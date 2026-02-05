/**
 * Table options types.
 *
 * Contains all types related to table configuration.
 *
 * @module @gridkit/core/types/table/options
 */

import type { RowId, RowData, DeepPartial } from '@/types';
import type { TableState } from './TableState';
import type { ColumnDef, ColumnMeta } from './Column';

// ===================================================================
// Table Options (Configuration)
// ===================================================================

/**
 * Complete table configuration.
 * All fields are optional except `columns`.
 *
 * @template TData - Row data type
 */
export interface TableOptions<TData extends RowData> {
  // === Required Configuration ===

  /**
   * Column definitions - at least one required.
   * Defines how data is displayed and interacted with.
   */
  columns: ColumnDef<TData>[];

  // === Data Configuration ===

  /**
   * Initial data array.
   * @default [] (empty array)
   */
  data?: TData[];

  /**
   * Function to extract unique row ID.
   * Critical for row selection, expansion, and updates.
   *
   * @default (row, index) => index (using array index)
   */
  getRowId?: (row: TData, index: number) => RowId;

  // === Initial State ===

  /**
   * Partial initial state to override defaults.
   * Useful for restoring saved views.
   */
  initialState?: DeepPartial<TableState<TData>>;

  // === Performance & Debugging ===

  /**
   * Enable debug mode for development.
   * Adds performance tracking and validation.
   * @default false (disabled in production)
   */
  debug?: boolean | DebugOptions;

  /**
   * Performance budgets for validation.
   * Fails fast if budgets are exceeded.
   */
  performanceBudgets?: PerformanceBudgets;

  // === Event Handlers ===

  /**
   * Called on every state change.
   * Useful for persistence or analytics.
   */
  onStateChange?: (state: TableState<TData>) => void;

  /**
   * Called when table encounters an error.
   * Prevents uncaught errors from crashing the app.
   */
  onError?: (error: GridKitError) => void;

  // === Advanced Configuration ===

  /**
   * Default column options applied to all columns.
   * Can be overridden by individual column definitions.
   */
  defaultColumn?: Partial<ColumnDef<TData>>;

  /**
   * Custom metadata for application use.
   * Not used internally by GridKit.
   */
  meta?: TableMeta;
}

// Placeholder types for now
interface DebugOptions {}
interface PerformanceBudgets {}
interface GridKitError {}
interface TableMeta {}