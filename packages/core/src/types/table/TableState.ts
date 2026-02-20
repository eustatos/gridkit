/**
 * Table state types.
 *
 * Contains all types related to table state management.
 *
 * @module @gridkit/core/types/table/state
 */

import type { RowId, ColumnId, RowData } from '@/types';

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
 * Filter value type - supports multiple data types.
 */
export type FilterValue = string | number | boolean | Date | { min?: number; max?: number } | unknown;

/**
 * Filtering configuration.
 */
export interface FilteringState {
  /**
   * Column ID to filter by.
   */
  id: ColumnId;

  /**
   * Filter value (type depends on operator and column type).
   */
  value: FilterValue;

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
  | 'lessOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'custom';

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