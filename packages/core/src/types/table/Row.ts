/**
 * Row types.
 *
 * Contains all types related to table rows.
 *
 * @module @gridkit/core/types/table/row
 */

import type { RowData, RowId } from '@/types';
import type { Row as RowType } from '@/types/row/Row';

// Re-export Row type from row module for convenience
export type { RowType as Row };

// ===================================================================
// Row Model
// ===================================================================

/**
 * Model representing all rows with metadata.
 */
export interface RowModel<TData extends RowData> {
  /**
   * Array of rows in the model.
   */
  rows: RowType<TData>[];

  /**
   * Map of row ID to row instance for O(1) lookup.
   */
  rowsById: Map<RowId, RowType<TData>>;

  /**
   * Total number of rows (including filtered out).
   */
  totalCount: number;

  /**
   * Total number of rows (including filtered out).
   * @deprecated Use totalCount instead
   */
  totalRowCount: number;

  /**
   * Get row by ID with O(1) lookup.
   */
  getRow(id: RowId): RowType<TData> | undefined;

  // ===================================================================
  // Extended Model Properties and Methods
  // ===================================================================

  /**
   * Array of all rows in flat representation (for hierarchical data).
   */
  flatRows?: RowType<TData>[];

  /**
   * Map of original index to row instance for O(1) lookup.
   */
  rowsByOriginalIndex?: Map<number, RowType<TData>>;

  /**
   * Total count of flat rows (for hierarchical data).
   */
  totalFlatRowCount?: number;

  /**
   * Row model metadata and statistics.
   */
  meta?: {
    /** Total processing time in ms */
    processingTime: number;
    /** Memory usage estimate */
    memoryUsage: number;
    /** Has hierarchical data */
    hasHierarchicalData: boolean;
    /** Row count statistics */
    rowCount: {
      total: number;
      flat: number;
    };
  };

  // ===================================================================
  // Row Access Methods
  // ===================================================================

  /**
   * Get row by original index with O(1) lookup.
   */
  getRowByOriginalIndex(index: number): RowType<TData> | undefined;

  // ===================================================================
  // Filter and Search Methods
  // ===================================================================

  /**
   * Filter rows based on a predicate function.
   */
  filterRows(predicate: (row: RowType<TData>) => boolean): RowType<TData>[];

  /**
   * Find first row matching a predicate.
   */
  findRow(predicate: (row: RowType<TData>) => boolean): RowType<TData> | undefined;

  // ===================================================================
  // State-Aware Methods
  // ===================================================================

  /**
   * Get rows that are currently selected.
   */
  getSelectedRows(): RowType<TData>[];

  /**
   * Get rows that are currently expanded.
   */
  getExpandedRows(): RowType<TData>[];
}
