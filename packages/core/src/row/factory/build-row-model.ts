/**
 * Row model builder for creating efficient row models from data.
 * 
 * Builds row models with indexing, caching, and O(1) lookups.
 * Designed for flat data structures with basic row operations.
 * 
 * @module @gridkit/core/row/factory/build-row-model
 */


import type { RowData , RowId } from '@/types';
import type { Column } from '@/types/column/ColumnInstance';
import type { Row , RowModel } from '@/types/table/Row';
import type { Table } from '@/types/table/Table';

import { createRow } from './create-row';
import type { CreateRowOptions } from './create-row';

export { createRow } from './create-row';
export type { CreateRowOptions } from './create-row';
export type { RowModel } from '@/types/table/Row';

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
  /** Enable performance tracking */
  performanceTracking?: boolean;
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
    performanceTracking = true,
  } = options;

  const startTime = performance.now();

  // 1. Create row instances
  const rows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();

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
    rowsById.set(row.id, row);
  });

  const processingTime = performance.now() - startTime;

  // 3. Create model instance with full interface
  const model: RowModel<TData> = {
    rows,
    rowsById,
    totalCount: rows.length,
    // Alias for backwards compatibility
    totalRowCount: rows.length,
    getRow: (id) => rowsById.get(id),

    // Extended properties
    flatRows: rows,
    rowsByOriginalIndex: new Map(rows.map((row, index) => [row.originalIndex, row])),
    totalFlatRowCount: rows.length,
    meta: {
      processingTime,
      memoryUsage: rows.length * 100, // Estimate
      hasHierarchicalData: false,
      rowCount: {
        total: rows.length,
        flat: rows.length,
      },
    },

    // Row access methods
    getRowByOriginalIndex: (index) => {
      return model.rowsByOriginalIndex?.get(index);
    },

    // Filter and search methods
    filterRows: (predicate) => {
      return rows.filter(predicate);
    },
    findRow: (predicate) => {
      return rows.find(predicate);
    },

    // State-aware methods
    getSelectedRows: () => {
      const state = table.getState();
      const selectedRows: Row<TData>[] = [];
      
      for (const [rowId, isSelected] of Object.entries(state.rowSelection || {})) {
        if (isSelected) {
          const row = rowsById.get(rowId as RowId);
          if (row) {
            selectedRows.push(row);
          }
        }
      }
      
      return selectedRows;
    },
    getExpandedRows: () => {
      const state = table.getState();
      const expandedRows: Row<TData>[] = [];
      
      for (const [rowId, isExpanded] of Object.entries(state.expanded || {})) {
        if (isExpanded) {
          const row = rowsById.get(rowId as RowId);
          if (row) {
            expandedRows.push(row);
          }
        }
      }
      
      return expandedRows;
    },

    // Reactive count properties
    allRows: rows,
    get selectedRowCount() {
      const state = table.getState();
      return Object.keys(state.rowSelection || {}).filter(k => state.rowSelection?.[k]).length;
    },
    get expandedRowCount() {
      const state = table.getState();
      return Object.keys(state.expanded || {}).filter(k => state.expanded?.[k]).length;
    },
  };

  return model;
}
