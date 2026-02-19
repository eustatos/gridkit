import { DeepPartial, RowData, RowId } from '../base';

import { ColumnDef } from './Column';
import { GridKitError } from './Errors';
import { TableMeta } from './support/Metadata';
import { TableState } from './TableState';

/**
 * Debug configuration options for debugging features.
 */
export interface DebugOptions {
  /** Log state changes to console */
  readonly logStateChanges?: boolean;

  /** Log performance metrics */
  readonly logPerformance?: boolean;

  /** Validate state on every change */
  readonly validateState?: boolean;

  /** Enable DevTools integration */
  readonly devTools?: boolean;
}

/**
 * Internal debug configuration with normalized boolean flags.
 */
export interface DebugConfig {
  /** Log state changes to console */
  readonly logStateChanges?: boolean;

  /** Log performance metrics */
  readonly logPerformance?: boolean;

  /** Validate state on every change */
  readonly validateState?: boolean;

  /** Enable DevTools integration */
  readonly devTools?: boolean;

  /** Debug performance */
  readonly performance?: boolean;

  /** Debug events */
  readonly events?: boolean;

  /** Debug validation */
  readonly validation?: boolean;

  /** Debug memory */
  readonly memory?: boolean;
}

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
  performanceBudgets?: CorePerformanceBudgets;

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

/**
 * Complete validated table configuration with all defaults applied.
 * This is the normalized version of TableOptions after validation.
 *
 * @template TData - Row data type
 */
export interface ValidatedTableOptions<
  TData extends RowData,
> extends TableOptions<TData> {
  /**
   * Normalized columns with all defaults applied.
   */
  columns: ColumnDef<TData>[];

  /**
   * Normalized data array (always has a value, defaults to empty array).
   */
  data: TData[];

  /**
   * Normalized getRowId function (always has a value).
   */
  getRowId: (row: TData, index: number) => RowId;

  /**
   * Normalized debug configuration.
   */
  debug: DebugConfig;

  /**
   * Normalized metadata (always has a value, defaults to empty object).
   */
  meta: Record<string, unknown>;

  /**
   * Normalized initial state (always has a value, defaults to empty object).
   */
  initialState: DeepPartial<TableState<TData>>;
}
