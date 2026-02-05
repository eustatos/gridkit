import type { RowData, RowId } from '../base';
import type { Table } from '../table';
import type { Cell } from './Cell';
import type { ColumnId } from '../base';
import type { RowMeta } from './Metadata';

/**
 * Selection options for row operations.
 */
export interface SelectionOptions {
  /** Allow multiple selection */
  readonly multi?: boolean;

  /** Select range from last selection */
  readonly range?: boolean;

  /** Clear existing selection first */
  readonly clearOthers?: boolean;
}

/**
 * Runtime row instance representing a data record.
 * Supports hierarchical data with parent-child relationships.
 *
 * @template TData - Row data type
 *
 * @example
 * ```typescript
 * const row = table.getRow('user-123');
 * const name = row.getValue<string>('name');
 * const cells = row.getVisibleCells();
 * ```
 */
export interface Row<TData extends RowData> {
  // === Core Properties ===

  /**
   * Unique row identifier.
   * From getRowId option or array index.
   */
  readonly id: RowId;

  /**
   * Parent table reference.
   */
  readonly table: Table<TData>;

  /**
   * Original row data (immutable).
   * Direct access to source data.
   */
  readonly original: Readonly<TData>;

  /**
   * Row index in current view (after sorting/filtering).
   * Changes as data is manipulated.
   */
  readonly index: number;

  /**
   * Original data index (from source array).
   * Stable regardless of sorting/filtering.
   */
  readonly originalIndex: number;

  // === Hierarchical Data Support ===

  /**
   * Nesting depth for tree/grouped data.
   * 0 = top-level, 1 = first child level, etc.
   */
  readonly depth: number;

  /**
   * Parent row for nested data.
   * undefined for top-level rows.
   */
  readonly parentRow?: Row<TData>;

  /**
   * Immediate child rows.
   * Empty array for leaf rows.
   */
  readonly subRows: readonly Row<TData>[];

  /**
   * Check if row has children.
   */
  readonly hasChildren: boolean;

  /**
   * Check if children are currently expanded.
   */
  readonly isExpanded: boolean;

  // === Data Access Methods ===

  /**
   * Get all cells (including hidden columns).
   */
  getAllCells(): readonly Cell<TData>[];

  /**
   * Get only visible cells in display order.
   */
  getVisibleCells(): readonly Cell<TData>[];

  /**
   * Get cell by column ID.
   * O(1) lookup via internal index.
   */
  getCell(columnId: ColumnId): Cell<TData> | undefined;

  /**
   * Get typed value for a column.
   * Shorthand for getCell(id)?.getValue() with type safety.
   *
   * @template TValue - Expected value type
   * @param columnId - Column identifier
   * @returns Cell value with specified type
   */
  getValue<TValue = unknown>(columnId: ColumnId): TValue;

  /**
   * Get raw data value (bypasses column accessor).
   * Useful for custom operations.
   */
  getOriginalValue(columnId: ColumnId): unknown;

  // === State Management ===

  /**
   * Check if row is selected.
   */
  getIsSelected(): boolean;

  /**
   * Toggle row selection.
   *
   * @param selected - Optional force state (toggles if undefined)
   * @param options - Selection options (range, multi, etc.)
   */
  toggleSelected(selected?: boolean, options?: SelectionOptions): void;

  /**
   * Check if row is expanded (tree data).
   */
  getIsExpanded(): boolean;

  /**
   * Toggle row expansion.
   *
   * @param expanded - Optional force state (toggles if undefined)
   */
  toggleExpanded(expanded?: boolean): void;

  // === Tree Data Utilities ===

  /**
   * Get all parent rows (ancestors).
   * Returns empty array for top-level rows.
   */
  getParentRows(): readonly Row<TData>[];

  /**
   * Get all descendant rows (recursive).
   * Returns empty array for leaf rows.
   */
  getLeafRows(): readonly Row<TData>[];

  /**
   * Get path from root to this row.
   * Array of row IDs representing the hierarchy.
   */
  getPath(): readonly RowId[];

  /**
   * Check if this row is ancestor of another row.
   */
  isAncestorOf(row: Row<TData>): boolean;

  /**
   * Check if this row is descendant of another row.
   */
  isDescendantOf(row: Row<TData>): boolean;

  // === Metadata ===

  /**
   * Row-level metadata.
   */
  readonly meta: RowMeta;

  /**
   * Check if row is currently visible.
   * Affected by filtering, pagination, and expansion state.
   */
  readonly isVisible: boolean;
}