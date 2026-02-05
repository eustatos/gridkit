/**
 * Main table instance interface and all related types.
 *
 * All table-related types are defined in this file to avoid circular dependencies.
 * This includes Table, TableState, TableOptions, and all supporting types.
 *
 * @template TData - Row data type (must extend RowData)
 */

import type {
  AccessorValue,
  DeepPartial,
  GridId,
  RowId,
  ColumnId,
  RowData,
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
  readonly metrics?: TableMetrics;
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

/**
 * Model representing all rows with metadata.
 */
export interface RowModel<TData extends RowData> {
  /**
   * Array of rows in the model.
   */
  rows: Row<TData>[];

  /**
   * Total number of rows (including filtered out).
   */
  totalCount: number;
}

/**
 * Interface representing a single row.
 */
export interface Row<TData extends RowData> {
  /**
   * Unique row identifier.
   */
  readonly id: RowId;

  /**
   * Original row data.
   */
  readonly original: TData;

  /**
   * Index in the original data array.
   */
  readonly index: number;

  /**
   * Sub-rows (for tree/grouped data).
   */
  readonly subRows?: Row<TData>[];

  /**
   * Row depth in tree structure.
   */
  readonly depth: number;

  /**
   * Get cell value by column ID.
   */
  getValue<TColumnId extends ColumnId>(
    columnId: TColumnId
  ): ColumnValue<TData, TColumnId>;

  /**
   * Check if row is selected.
   */
  getIsSelected(): boolean;

  /**
   * Check if row is expanded (for tree/grouped data).
   */
  getIsExpanded(): boolean;
}

/**
 * Interface representing a column definition instance.
 */
export interface Column<TData extends RowData> {
  /**
   * Unique column identifier.
   */
  readonly id: ColumnId;

  /**
   * Header text or component.
   */
  readonly header: string | ((column: Column<TData>) => string);

  /**
   * Column size in pixels.
   */
  readonly size: number;

  /**
   * Whether column is visible.
   */
  readonly visible: boolean;

  /**
   * Column display order index.
   */
  readonly displayIndex: number;

  /**
   * Column accessor function or key.
   */
  readonly accessor: ColumnAccessor<TData>;

  /**
   * Get cell value for a specific row.
   */
  getValue(row: Row<TData>): unknown;

  /**
   * Check if column can be resized.
   */
  getCanResize(): boolean;

  /**
   * Check if column can be reordered.
   */
  getCanReorder(): boolean;

  /**
   * Check if column can be hidden.
   */
  getCanHide(): boolean;
}

// ===================================================================
// Column Accessor Types
// ===================================================================

/**
 * Column accessor can be either a string key or a function.
 */
export type ColumnAccessor<TData extends RowData> =
  | string
  | ColumnAccessorFn<TData>;

/**
 * Function-based column accessor.
 */
export type ColumnAccessorFn<TData extends RowData> = (
  row: TData,
  rowModel: RowModel<TData>
) => unknown;

/**
 * Value type for a specific column.
 */
export type ColumnValue<
  TData extends RowData,
  TColumnId extends ColumnId,
> = TColumnId extends `${infer Path}.${string}`
  ? AccessorValue<TData, Path>
  : TColumnId extends keyof TData
    ? TData[TColumnId]
    : unknown;

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

/**
 * Column definition for creating column instances.
 */
export interface ColumnDef<TData extends RowData> {
  /**
   * Unique column identifier.
   */
  id?: ColumnId;

  /**
   * Header text or function.
   */
  header?: string | ((column: Column<TData>) => string);

  /**
   * Column size in pixels.
   */
  size?: number;

  /**
   * Initial column visibility.
   */
  visible?: boolean;

  /**
   * Column accessor (string key or function).
   */
  accessor?: ColumnAccessor<TData>;

  /**
   * Custom column options.
   */
  meta?: ColumnMeta;
}

/**
 * Column metadata (user-defined).
 */
export interface ColumnMeta {
  /**
   * User-friendly column name.
   */
  name?: string;

  /**
   * Any custom application data.
   */
  [key: string]: unknown;
}

// ===================================================================
// Feature State Types
// ===================================================================

/**
 * Sorting configuration.
 */
export interface SortingState {
  /**
   * Column ID to sort by.
   */
  id: ColumnId;

  /**
   * Sort direction.
   */
  desc?: boolean;
}

/**
 * Filtering configuration.
 */
export interface FilteringState {
  /**
   * Column ID to filter by.
   */
  id: ColumnId;

  /**
   * Filter value.
   */
  value: string;

  /**
   * Filter operator.
   */
  operator?: FilterOperator;
}

/**
 * Filter operators.
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual';

/**
 * Pagination state.
 */
export interface PaginationState {
  /**
   * Current page index (0-based).
   */
  pageIndex: number;

  /**
   * Page size.
   */
  pageSize: number;
}

/**
 * Grouping configuration.
 */
export interface GroupingState {
  /**
   * Array of column IDs to group by.
   */
  groupBy: ColumnId[];
}

/**
 * Scroll position for virtualization.
 */
export interface ScrollPosition {
  /**
   * Horizontal scroll position in pixels.
   */
  x: number;

  /**
   * Vertical scroll position in pixels.
   */
  y: number;
}

// ===================================================================
// Table State (Immutable Internal State)
// ===================================================================

/**
 * Complete table state - immutable and serializable.
 * This is what gets passed to subscribers and persisted.
 *
 * @template TData - Row data type
 */
export interface TableState<TData extends RowData> {
  // === Core Data ===

  /**
   * Current data array (immutable).
   * May differ from initial data due to updates.
   */
  readonly data: readonly TData[];

  // === Column State ===

  /**
   * Column visibility map.
   * @example { 'name': true, 'email': false }
   */
  readonly columnVisibility: Readonly<Record<ColumnId, boolean>>;

  /**
   * Column display order.
   * Array of column IDs in rendering order.
   */
  readonly columnOrder: readonly ColumnId[];

  /**
   * Column sizes in pixels.
   */
  readonly columnSizing: Readonly<Record<ColumnId, number>>;

  /**
   * Column pinning (frozen columns).
   */
  readonly columnPinning?: Readonly<{
    left?: readonly ColumnId[];
    right?: readonly ColumnId[];
  }>;

  // === Row State ===

  /**
   * Row selection state.
   * @example { 'row-1': true, 'row-2': false }
   */
  readonly rowSelection: Readonly<Record<RowId, boolean>>;

  /**
   * Row expansion state (for tree/grouped data).
   */
  readonly expanded: Readonly<Record<RowId, boolean>>;

  // === Feature States ===

  /**
   * Sorting configuration.
   * Array of sort descriptors.
   */
  readonly sorting?: readonly SortingState[];

  /**
   * Filter configuration.
   */
  readonly filtering?: readonly FilteringState[];

  /**
   * Pagination state.
   */
  readonly pagination?: PaginationState;

  /**
   * Grouping configuration.
   */
  readonly grouping?: GroupingState;

  // === UI State ===

  /**
   * Currently focused cell (if any).
   */
  readonly focusedCell?: CellCoordinate;

  /**
   * Scroll position for virtualization.
   */
  readonly scroll?: ScrollPosition;

  // === Metadata ===

  /**
   * State version for migration.
   */
  readonly version: number;

  /**
   * Last updated timestamp.
   */
  readonly updatedAt: number;
}

/**
 * Cell coordinate for focus/selection.
 */
export interface CellCoordinate {
  /**
   * Row ID.
   */
  readonly rowId: RowId;

  /**
   * Column ID.
   */
  readonly columnId: ColumnId;
}

// ===================================================================
// GridKit Error Types
// ===================================================================

/**
 * GridKit error interface.
 */
export interface GridKitError extends Error {
  /**
   * Error code.
   */
  code: ErrorCode;

  /**
   * Error message.
   */
  message: string;

  /**
   * Additional context data.
   */
  context?: Record<string, unknown>;
}

/**
 * Error codes for GridKit errors.
 */
export type ErrorCode =
  // Table errors
  | 'TABLE_INVALID_OPTIONS'
  | 'TABLE_NO_COLUMNS'
  | 'TABLE_DESTROYED'
  // Column errors
  | 'COLUMN_INVALID_ACCESSOR'
  | 'COLUMN_DUPLICATE_ID'
  | 'COLUMN_NOT_FOUND'
  // Row errors
  | 'ROW_INVALID_ID'
  | 'ROW_NOT_FOUND'
  // State errors
  | 'STATE_UPDATE_FAILED'
  | 'STATE_INVALID'
  // Data errors
  | 'DATA_LOAD_FAILED'
  | 'DATA_INVALID_RESPONSE'
  // Plugin errors
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_REGISTRATION_FAILED';

// ===================================================================
