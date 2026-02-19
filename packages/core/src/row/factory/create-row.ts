/**
 * Row instance factory for creating row instances from data.
 * 
 * Creates runtime row instances with cell caching, type safety,
 * and efficient data access patterns for flat data structures.
 * 
 * @module @gridkit/core/row/factory/create-row
 */


import type { RowData , RowId, ColumnId, CellId } from '@/types';
import type { Column } from '@/types/column/ColumnInstance';
import type { Cell } from '@/types/row/Cell';
import type { Row } from '@/types/table/Row';
import type { Table } from '@/types/table/Table';

import { CellCache, createCellCache } from '../cell/cell-cache';
import type { BasicRowMethods, BuildBasicRowMethodsOptions } from '../methods/basic-methods';

/**
 * Options for creating a row instance.
 */
export interface CreateRowOptions<TData extends RowData> {
  /** Row data */
  originalData: TData;
  /** Original index in data array */
  originalIndex: number;
  /** Column instances */
  columns: Column<TData>[];
  /** Function to generate row ID */
  getRowId: (row: TData, index: number) => RowId;
  /** Parent table instance */
  table: Table<TData>;
  /** Parent row (for hierarchical data) */
  parentRow?: Row<TData>;
  /** Nesting depth */
  depth?: number;
  /** Path from root (for hierarchical data) */
  path?: RowId[];
}

/**
 * Internal row metadata for runtime tracking.
 */
interface RowInternal<TData extends RowData> {
  /** Cell cache for performance */
  cellCache: CellCache<TData>;
  /** Basic row methods */
  methods: BasicRowMethods<TData>;
  /** Original data reference */
  originalData: TData;
}

/**
 * Create a single row instance from data.
 * Handles cell creation, caching, and basic row methods.
 * 
 * @template TData - Row data type
 * @param options - Row creation options
 * @returns Row instance with cell cache
 */
export function createRow<TData extends RowData>(
  options: CreateRowOptions<TData>
): Row<TData> {
  const {
    originalData,
    originalIndex,
    columns,
    getRowId,
    table,
    parentRow,
    depth = 0,
    path = [],
  } = options;

  // Generate row ID (RowId is string | number with brand)
  const idRaw = getRowId(originalData, originalIndex);
  const id = typeof idRaw === 'string' ? idRaw as RowId : String(idRaw) as RowId;

  // Create cell cache for performance
  const cellCache: CellCache<TData> = createCellCache<TData>();

  // Build basic row methods
  const methods = buildBasicRowMethods({
    id,
    originalData,
    table,
    columns,
    cellCache,
  });

  // Create row instance
  const row: Row<TData> & { _internal?: RowInternal<TData> } = {
    // Core properties
    id,
    table,
    original: Object.freeze(originalData),
    originalIndex,
    index: originalIndex, // Will be updated by row model

    // Hierarchical properties (basic)
    depth,
    parentRow,
    subRows: [],
    hasChildren: false,
    isExpanded: false,

    // Basic methods (cell access only)
    getAllCells: methods.getAllCells,
    getVisibleCells: methods.getVisibleCells,
    getCell: methods.getCell,
    getValue: methods.getValue,
    getOriginalValue: methods.getOriginalValue,

    // Placeholder methods for selection/expansion (next task)
    getIsSelected: () => false,
    toggleSelected: () => {},
    getIsExpanded: () => false,
    toggleExpanded: () => {},
    getParentRows: () => [],
    getLeafRows: () => [],
    getPath: () => [...path, id],
    isAncestorOf: () => false,
    isDescendantOf: () => false,

    // Metadata
    meta: {},
    isVisible: true,
  };

  // Initialize cell cache with cells for each column
  initializeCellCache(row, columns, cellCache);

  // Store internal data for potential future use
  (row as any)._internal = {
    cellCache,
    methods,
    originalData,
  };

  return row;
}

/**
 * Build basic row methods (imported separately for circular dependency handling).
 */
function buildBasicRowMethods<TData extends RowData>(
  options: BuildBasicRowMethodsOptions<TData>
): BasicRowMethods<TData> {
  const { id, originalData, table, columns, cellCache } = options;

  return {
    getAllCells: () => {
      const cells: Cell<TData>[] = [];
      columns.forEach((column) => {
        const cell = cellCache.get(column.id);
        if (cell) cells.push(cell);
      });
      return cells;
    },

    getVisibleCells: () => {
      const state = table.getState();
      const cells: Cell<TData>[] = [];

      columns.forEach((column) => {
        if (state.columnVisibility?.[column.id] !== false) {
          const cell = cellCache.get(column.id);
          if (cell) cells.push(cell);
        }
      });

      return cells;
    },

    getCell: (columnId: string | ColumnId): Cell<TData> | undefined => {
      return cellCache.get(columnId as string);
    },

    getValue: <TValue = unknown>(columnId: string | ColumnId): TValue => {
      const cell = cellCache.get(columnId as string);
      if (!cell) {
        throw new Error(`CELL_NOT_FOUND: Cell not found for column ${columnId}`);
      }
      return cell.getValue();
    },

    getOriginalValue: (columnId: string | ColumnId): unknown => {
      // Direct access without column accessor
      const path = (columnId as string).split('.');
      let value: any = originalData;

      for (const key of path) {
        if (value == null) return undefined;
        value = value[key];
      }

      return value;
    },
  };
}

/**
 * Initialize cell cache with cells for each column.
 * @template TData - Row data type
 * @param row - Row instance
 * @param columns - Column instances
 * @param cellCache - Cell cache to populate
 */
function initializeCellCache<TData extends RowData>(
  row: Row<TData>,
  columns: Column<TData>[],
  cellCache: CellCache<TData>
): void {
  columns.forEach((column, index) => {
    // Create cell ID: ${rowId}_${columnId} (CellId is branded type)
    const cellId = `${row.id}_${column.id}` as CellId;

    // Create cell with basic properties
    const cell: Cell<TData> = {
      id: cellId,
      rowId: row.id as string,
      column,
      getValue: () => column._internal.accessor.getValue(row.original, row.originalIndex),
      renderValue: () => column._internal.accessor.getValue(row.original, row.originalIndex),
      getIsFocused: () => false,
      getIsSelected: () => false,
      getIsEditable: () => false,
      meta: {},
      index,
    };

    // Cache the cell for O(1) lookups
    cellCache.set(column.id, cell);
  });
}
