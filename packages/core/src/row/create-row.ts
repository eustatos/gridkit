/**
 * Creates row instances from data and column definitions.
 * This function is internal to the table creation process.
 *
 * @module @gridkit/core/row/create-row
 */

import { GridKitError } from '../errors';
import type { RowData, RowId } from '../types/base';
import type { Column } from '../types/column';
import type { Row, RowModel, Cell } from '../types/row';
import type { Table } from '../types/table';

interface BuildRowModelOptions<TData extends RowData> {
  data: TData[];
  columns: Column<TData>[];
  getRowId: (row: TData, index: number) => RowId;
  table: Table<TData>;
  parentRow?: Row<TData>;
  depth?: number;
}

interface BuildRowOptions<TData extends RowData> {
  rowData: TData;
  index: number;
  columns: Column<TData>[];
  table: Table<TData>;
  getRowId: (row: TData, index: number) => RowId;
  parentRow?: Row<TData>;
  depth?: number;
}
/**
 * Extract value from row data using column accessor.
 */
function extractValue<TData extends RowData, TValue>(
  rowData: TData,
  column: Column<TData, TValue>
): TValue {
  const { columnDef } = column;

  if (columnDef.accessorFn) {
    return columnDef.accessorFn(rowData);
  }

  if (columnDef.accessorKey) {
    // Simple property access
    const key = columnDef.accessorKey;
    if (key in rowData) {
      return (rowData as any)[key];
    }

    // Handle dot notation for nested properties
    const parts = key.split('.');
    let value: any = rowData;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined as TValue;
      }
    }
    return value;
  }

  // Fallback to undefined
  return undefined as TValue;
}
/**
 * Create a single row instance.
 * Internal function used by buildRowModel.
 */
export function createRow<TData extends RowData>(
  options: BuildRowOptions<TData>
): Row<TData> {
  const {
    rowData,
    index,
    columns,
    table,
    getRowId,
    parentRow,
    depth = parentRow ? parentRow.depth + 1 : 0,
  } = options;

  // Validate inputs
  if (!rowData || typeof rowData !== 'object') {
    throw new GridKitError('Row data must be an object', {
      code: 'INVALID_ROW_DATA',
      context: { rowData, index },
    });
  }

  if (typeof getRowId !== 'function') {
    throw new GridKitError('getRowId must be a function', {
      code: 'INVALID_GET_ROW_ID',
      context: { getRowId },
    });
  }

  const rowId = getRowId(rowData, index);

  const row: Row<TData> = {
    id: rowId,
    table,
    original: rowData,
    index,
    depth,
    parentRow,
    subRows: [],

    getAllCells(): Cell<TData>[] {
      return columns.map((column) => {
        const cell: Cell<TData> = {
          id: `${rowId}_${column.id}`,
          row,
          column,
          getValue: () => extractValue(rowData, column),
          renderValue: () => {
            const value = extractValue(rowData, column);
            // For now, just return the value
            // Later, we can apply formatting, etc.
            return value;
          },
        };
        return cell;
      });
    },

    getVisibleCells(): Cell<TData>[] {
      const visibleColumns = columns.filter(
        (col) => table.getState().columnVisibility[col.id] !== false
      );
      return visibleColumns.map((column) => {
        const cell: Cell<TData> = {
          id: `${rowId}_${column.id}`,
          row,
          column,
          getValue: () => extractValue(rowData, column),
          renderValue: () => {
            const value = extractValue(rowData, column);
            return value;
          },
        };
        return cell;
      });
    },

    getCell(columnId: string): Cell<TData> | undefined {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return undefined;

      return {
        id: `${rowId}_${column.id}`,
        row,
        column,
        getValue: () => extractValue(rowData, column),
        renderValue: () => {
          const value = extractValue(rowData, column);
          return value;
        },
      };
    },

    getValue<TValue = unknown>(columnId: string): TValue {
      const cell = this.getCell(columnId);
      return cell ? cell.getValue() : (undefined as any);
    },

    getIsSelected(): boolean {
      const state = table.getState();
      return !!state.rowSelection[rowId];
    },

    toggleSelected(value?: boolean): void {
      const state = table.getState();
      const current = !!state.rowSelection[rowId];
      const newValue = value ?? !current;

      table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...prev.rowSelection,
          [rowId]: newValue,
        },
      }));
    },

    getIsExpanded(): boolean {
      const state = table.getState();
      return !!state.expanded[rowId];
    },

    toggleExpanded(value?: boolean): void {
      const state = table.getState();
      const current = !!state.expanded[rowId];
      const newValue = value ?? !current;

      table.setState((prev) => ({
        ...prev,
        expanded: {
          ...prev.expanded,
          [rowId]: newValue,
        },
      }));
    },

    getParentRows(): Row<TData>[] {
      const parents: Row<TData>[] = [];
      let current = parentRow;
      while (current) {
        parents.unshift(current);
        current = current.parentRow;
      }
      return parents;
    },

    getLeafRows(): Row<TData>[] {
      const leaves: Row<TData>[] = [];

      const collectLeaves = (row: Row<TData>) => {
        if (row.subRows.length === 0) {
          leaves.push(row);
        } else {
          row.subRows.forEach(collectLeaves);
        }
      };

      collectLeaves(row);
      return leaves;
    },
  };

  return row;
}

/**
 * Build complete row model from data.
 * Creates all rows, handles flattening for tree data, and builds lookup maps.
 *
 * @template TData - Row data type
 * @param options - Row model options
 * @returns Complete row model
 *
 * @public
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
    depth = parentRow ? parentRow.depth + 1 : 0,
  } = options;
  // Validate inputs
  if (!Array.isArray(data)) {
    throw new GridKitError('Data must be an array', {
      code: 'INVALID_DATA',
      context: { data },
    });
  }

  if (typeof getRowId !== 'function') {
    throw new GridKitError('getRowId must be a function', {
      code: 'INVALID_GET_ROW_ID',
      context: { getRowId },
    });
  }

  const rows: Row<TData>[] = [];
  const flatRows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();

  // Create rows
  data.forEach((rowData, index) => {
    const row = createRow({
      rowData,
      index,
      columns,
      table,
      getRowId,
      parentRow,
      depth,
    });

    rows.push(row);
    flatRows.push(row);
    rowsById.set(row.id, row);

    // Add to parent's subRows if provided
    if (parentRow) {
      parentRow.subRows.push(row);
    }
  });

  return {
    rows,
    flatRows,
    rowsById,
  };
}
