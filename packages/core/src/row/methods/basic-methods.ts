/**
 * Basic row methods for cell access and data retrieval.
 * 
 * Provides O(1) cell access via caching and typed value extraction.
 * These are the foundational methods for row data access.
 * 
 * @module @gridkit/core/row/methods/basic-methods
 */

import type { CellCache } from '../cell/cell-cache';

import type { RowData, RowId } from '@/types';
import type { Column } from '@/types/column/ColumnInstance';
import type { Cell } from '@/types/row/Cell';
import type { Row } from '@/types/row/Row';

/**
 * Basic row methods interface.
 * Covers cell access, value retrieval, and basic data operations.
 */
export interface BasicRowMethods<TData extends RowData> {
  /**
   * Get all cells (including hidden columns).
   */
  getAllCells(): readonly Cell<TData>[];

  /**
   * Get only visible cells in display order.
   */
  getVisibleCells(): readonly Cell<TData>[];

  /**
   * Get cell by column ID with O(1) lookup.
   */
  getCell(columnId: string): Cell<TData> | undefined;

  /**
   * Get typed value for a column using column accessor.
   */
  getValue<TValue = unknown>(columnId: string): TValue;

  /**
   * Get raw data value (bypasses column accessor).
   * Direct property access on original data.
   */
  getOriginalValue(columnId: string): unknown;
}

/**
 * Options for building basic row methods.
 */
export interface BuildBasicRowMethodsOptions<TData extends RowData> {
  /** Row ID */
  id: RowId;
  /** Original row data */
  originalData: TData;
  /** Parent table instance */
  table: Row<TData>['table'];
  /** Column instances */
  columns: Column<TData>[];
  /** Cell cache for performance */
  cellCache: CellCache<TData>;
}

/**
 * Build basic row methods with cell caching for performance.
 * Creates methods for accessing cell data with O(1) lookups.
 * 
 * @template TData - Row data type
 * @param options - Build options
 * @returns Basic row methods with caching
 */
export function buildBasicRowMethods<TData extends RowData>(
  options: BuildBasicRowMethodsOptions<TData>
): BasicRowMethods<TData> {
  const { originalData, table, columns, cellCache } = options;

  return {
    // Cell access methods
    getAllCells: () => {
      const cells: Cell<TData>[] = [];
      columns.forEach((column) => {
        const cell = cellCache.get(column.id);
        if (cell) {
          cells.push(cell);
        }
      });
      return cells;
    },

    getVisibleCells: () => {
      const state = table.getState();
      const cells: Cell<TData>[] = [];

      columns.forEach((column) => {
        // Check column visibility
        if ((state.columnVisibility as Record<string, boolean>)?.[column.id] !== false) {
          const cell = cellCache.get(column.id);
          if (cell) {
            cells.push(cell);
          }
        }
      });

      return cells;
    },

    getCell: (columnId: string): Cell<TData> | undefined => {
      return cellCache.get(columnId);
    },

    getValue: <TValue = unknown>(columnId: string): TValue => {
      const cell = cellCache.get(columnId);
      if (!cell) {
        throw new Error(`CELL_NOT_FOUND: Cell not found for column ${columnId}`);
      }
      return cell.getValue();
    },

    getOriginalValue: (columnId: string): unknown => {
      // Direct access without column accessor
      const path = columnId.split('.');
      let value: any = originalData;

      for (const key of path) {
        if (value == null) return undefined;
        value = value[key];
      }

      return value;
    },
  };
}
