/**
 * Row model builder for creating efficient row models from data.
 * 
 * Builds row models with indexing, caching, and O(1) lookups.
 * Designed for flat data structures with basic row operations.
 * 
 * @module @gridkit/core/row/factory/build-row-model
 */

import type { RowData } from '@/types';
import type { Row } from '@/types/row/Row';
import type { Table } from '@/types/table/Table';
import type { Column } from '@/types/column/ColumnInstance';
import type { RowId, RowModel } from '@/types';
import type { CreateRowOptions } from './create-row';
import { createRow } from './create-row';

/**
 * Options for building a row model.
 */
export interface BuildRowModelOptions<TData extends RowData> {
  /** Data array to create rows from */
  data: readonly TData[];
  /** Column instances */
  columns: Column<TData>[];
  /** Function to generate row IDs */
  getRowId: (row: TData, index: number) => RowId;
  /** Parent table instance */
  table: Table<TData>;
  /** Parent row (for hierarchical data) */
  parentRow?: Row<TData>;
  /** Initial depth (for hierarchical data) */
  depth?: number;
  /** Initial path (for hierarchical data) */
  path?: RowId[];
}

/**
 * Row model metadata and statistics.
 */
export interface RowModelMeta {
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
}

/**
 * Row model with indexing and efficient lookups.
 */
export interface RowModel<TData extends RowData> {
  /** Array of row instances */
  rows: readonly Row<TData>[];
  /** Array of all rows in flat structure */
  flatRows: readonly Row<TData>[];
  /** Map of row ID to row instance for O(1) lookup */
  rowsById: Map<RowId, Row<TData>>;
  /** Map of original index to row instance */
  rowsByOriginalIndex: Map<number, Row<TData>>;
  /** Total row count */
  totalRowCount: number;
  /** Total flat row count */
  totalFlatRowCount: number;
  /** Model metadata */
  meta: RowModelMeta;
  /**
   * Get row by ID with O(1) lookup.
   */
  getRow(id: RowId): Row<TData> | undefined;
  /**
   * Get row by original index.
   */
  getRowByOriginalIndex(index: number): Row<TData> | undefined;
  /**
   * Get selected rows from table state.
   */
  getSelectedRows(): Row<TData>[];
  /**
   * Get expanded rows from table state.
   */
  getExpandedRows(): Row<TData>[];
  /**
   * Filter rows using predicate.
   */
  filterRows(predicate: (row: Row<TData>, index: number, array: readonly Row<TData>[]) => boolean): Row<TData>[];
  /**
   * Find first matching row.
   */
  findRow(predicate: (row: Row<TData>, index: number, array: readonly Row<TData>[]) => boolean): Row<TData> | undefined;
}

/**
 * Build row model from data with indexing and caching.
 * Creates efficient data structures for row access and manipulation.
 * 
 * @template TData - Row data type
 * @param options - Build options
 * @returns Row model with O(1) lookups
 * 
 * @example
 * ```typescript
 * const model = buildRowModel({
 *   data: users,
 *   columns,
 *   getRowId: (row) => row.id.toString(),
 *   table,
 * });
 * 
 * const user = model.getRow('123');
 * const firstRow = model.findRow(r => r.original.name === 'Alice');
 * ```
 */
export function buildRowModel<TData extends RowData>(
  options: BuildRowModelOptions<TData>
): RowModel<TData> {
  const {
    data,
    columns,
    getRowId,
    table,
    parentRow,
    depth = 0,
    path = [],
  } = options;

  const startTime = performance.now();

  // 1. Create row instances
  const rows: Row<TData>[] = [];
  const flatRows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();
  const rowsByOriginalIndex = new Map<number, Row<TData>>();

  // 2. Process each data item
  (data as TData[]).forEach((originalData, originalIndex) => {
    const row = createRow({
      originalData,
      originalIndex,
      columns,
      getRowId,
      table,
      parentRow,
      depth,
      path,
    });

    rows.push(row);
    flatRows.push(row);
    rowsById.set(row.id, row);
    rowsByOriginalIndex.set(originalIndex, row);
  });

  const processingTime = performance.now() - startTime;

  // 3. Create model instance
  const model: RowModel<TData> = {
    rows,
    flatRows,
    rowsById,
    rowsByOriginalIndex,

    // Computed properties
    totalRowCount: rows.length,
    totalFlatRowCount: flatRows.length,

    // Methods
    getRow: (id) => rowsById.get(id),
    getRowByOriginalIndex: (index) => rowsByOriginalIndex.get(index),

    getSelectedRows: () => {
      const state = table.getState();
      const selection = state.rowSelection;
      if (!selection) return [];

      return flatRows.filter((row) => selection[row.id]);
    },

    getExpandedRows: () => {
      const state = table.getState();
      const expanded = state.expanded;
      if (!expanded) return [];

      return flatRows.filter((row) => expanded[row.id]);
    },

    filterRows: (predicate) => {
      return flatRows.filter((row, index, array) =>
        predicate(row, index, array)
      );
    },

    findRow: (predicate) => {
      return flatRows.find((row, index, array) => predicate(row, index, array));
    },

    // Metadata
    meta: {
      processingTime,
      memoryUsage: 0, // Will be calculated in next task
      hasHierarchicalData: false, // Flat data only in this task
      rowCount: {
        total: rows.length,
        flat: flatRows.length,
      },
    },
  };

  return model;
}
