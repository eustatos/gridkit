import type { RowData, RowId } from '../base';
import type { Row } from './Row';
import type { RowModelMeta } from './Metadata';

/**
 * Predicate function for row filtering.
 */
type RowPredicate<TData extends RowData> = (
  row: Row<TData>,
  index: number,
  array: readonly Row<TData>[]
) => boolean;

/**
 * Collection of rows with efficient access patterns.
 * Represents the current view after all transformations.
 *
 * @template TData - Row data type
 *
 * @example
 * ```typescript
 * const model = table.getRowModel();
 * const rows = model.rows; // Top-level rows
 * const allRows = model.flatRows; // All rows (flattened)
 * const row = model.getRow('user-123'); // Fast lookup
 * ```
 */
export interface RowModel<TData extends RowData> {
  // === Row Collections ===

  /**
   * Top-level rows in current view.
   * Does not include nested rows.
   */
  readonly rows: readonly Row<TData>[];

  /**
   * All rows including nested (flattened).
   * Maintains expansion state - only shows expanded rows.
   */
  readonly flatRows: readonly Row<TData>[];

  /**
   * All rows regardless of expansion state.
   * Full hierarchical data representation.
   */
  readonly allRows: readonly Row<TData>[];

  // === Efficient Lookups ===

  /**
   * Map for O(1) row lookup by ID.
   */
  readonly rowsById: ReadonlyMap<RowId, Row<TData>>;

  /**
   * Get row by ID.
   * Uses internal map for fast access.
   */
  getRow(id: RowId): Row<TData> | undefined;

  /**
   * Get row by original data index.
   */
  getRowByOriginalIndex(index: number): Row<TData> | undefined;

  // === Statistics ===

  /**
   * Total number of top-level rows.
   */
  readonly totalRowCount: number;

  /**
   * Total number of all rows (including nested).
   */
  readonly totalFlatRowCount: number;

  /**
   * Number of selected rows.
   */
  readonly selectedRowCount: number;

  /**
   * Number of expanded rows.
   */
  readonly expandedRowCount: number;

  // === Bulk Operations ===

  /**
   * Get all selected rows.
   */
  getSelectedRows(): readonly Row<TData>[];

  /**
   * Get all expanded rows.
   */
  getExpandedRows(): readonly Row<TData>[];

  /**
   * Get rows matching a predicate.
   */
  filterRows(predicate: RowPredicate<TData>): readonly Row<TData>[];

  /**
   * Find first row matching predicate.
   */
  findRow(predicate: RowPredicate<TData>): Row<TData> | undefined;

  // === Metadata ===

  /**
   * Model metadata and statistics.
   */
  readonly meta: RowModelMeta;
}