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
   * Get row by ID with O(1) lookup.
   */
  getRow(id: RowId): RowType<TData> | undefined;
}
