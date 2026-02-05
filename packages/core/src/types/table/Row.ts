/**
 * Row types.
 *
 * Contains all types related to table rows.
 *
 * @module @gridkit/core/types/table/row
 */

import type { RowId, ColumnId, RowData } from '@/types';
import type { ColumnValue } from './Column';

// ===================================================================
// Row Interface
// ===================================================================

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
  rows: Row<TData>[];

  /**
   * Total number of rows (including filtered out).
   */
  totalCount: number;
}