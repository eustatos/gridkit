/**
 * Creates a row instance from row data.
 */
export function createRow<TData extends RowData>(
  config: RowConfig<TData>
): Row<TData> {
  const {
    data,
    index,
    table,
    columns,
    getRowId,
    parentRow,
    depth = 0,
  } = config;

  // Basic validation
  if (!data) {
    throw new GridKitError('ROW_INVALID_DATA', 'Row data is required');
  }

  if (typeof config.getRowId !== 'function') {
    throw new GridKitError('ROW_INVALID_DATA', 'getRowId must be a function');
  }

  // Get row ID
  const id = config.getRowId(data, index);

  if (id == null) {
    throw new GridKitError(
      'ROW_INVALID_ID',
      `getRowId returned null or undefined for row at index ${index}`
    );
  }

  // Create cells
  const cells = columns.map((column) => {
    const cellId = `${id}_${column.id}`;

    const cell: Cell<TData> = {
      id: cellId,
      row: null as any, // Set later
      column,

      getValue() {
        const columnDef = column.columnDef;
        if (columnDef.accessorFn) {
          return columnDef.accessorFn(data);
        }
        if (columnDef.accessorKey) {
          const parts = columnDef.accessorKey.split('.');
          let value: any = data;
          for (const part of parts) {
            if (value == null) return undefined as any;
            value = value[part];
          }
          return value;
        }
        return undefined as any;
      },

      renderValue() {
        return this.getValue();
      },
    };

    return cell;
  });

  // Create row
  const row: Row<TData> = {
    id,
    table,
    original: data,
    index,
    depth,
    parentRow,
    subRows: [],

    getAllCells() {
      return cells;
    },

    getVisibleCells() {
      return cells.filter((cell) => cell.column.getIsVisible());
    },

    getCell(columnId) {
      return cells.find((cell) => cell.column.id === columnId);
    },

    getValue(columnId) {
      const cell = this.getCell(columnId);
      return cell?.getValue() as any;
    },

    getIsSelected() {
      const state = table.getState();
      return state.rowSelection[id] === true;
    },

    toggleSelected(value) {
      table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...prev.rowSelection,
          [id]: value !== undefined ? value : !this.getIsSelected(),
        },
      }));
    },

    getIsExpanded() {
      const state = table.getState();
      return state.expanded[id] === true;
    },

    toggleExpanded(value) {
      table.setState((prev) => ({
        ...prev,
        expanded: {
          ...prev.expanded,
          [id]: value !== undefined ? value : !this.getIsExpanded(),
        },
      }));
    },

    getParentRows() {
      const parents: Row<TData>[] = [];
      let current = this.parentRow;
      while (current) {
        parents.unshift(current);
        current = current.parentRow;
      }
      return parents;
    },

    getLeafRows() {
      const leaves: Row<TData>[] = [];
      function collectLeaves(row: Row<TData>) {
        if (row.subRows.length === 0) {
          leaves.push(row);
        } else {
          row.subRows.forEach(collectLeaves);
        }
      }
      collectLeaves(this);
      return leaves;
    },
  };

  // Set row reference on cells
  cells.forEach((cell) => {
    (cell as any).row = row;
  });

  return row;
}

export interface RowConfig<TData extends RowData> {
  data: TData;
  index: number;
  table: Table<TData>;
  columns: Column<TData>[];
  getRowId: (row: TData, index: number) => RowId;
  parentRow?: Row<TData>;
  depth?: number;
}

export interface RowModelConfig<TData extends RowData> {
  data: TData[];
  columns: Column<TData>[];
  getRowId: (row: TData, index: number) => RowId;
  table: Table<TData>;
  parentRow?: Row<TData>;
  depth?: number;
}

export function buildRowModel<TData extends RowData>(
  config: RowModelConfig<TData>
): RowModel<TData> {
  const rows: Row<TData>[] = [];
  const flatRows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();

  config.data.forEach((data, index) => {
    const row = createRow({
      data,
      index,
      table: config.table,
      columns: config.columns,
      getRowId: config.getRowId,
      parentRow: config.parentRow,
      depth: config.depth ?? 0,
    });

    rows.push(row);
    flatRows.push(row);
    rowsById.set(row.id, row);

    if (config.parentRow) {
      config.parentRow.subRows.push(row);
    }
  });

  return { rows, flatRows, rowsById };
}

import type { RowData, RowId } from '../types/base';
import type { Row, Cell, RowModel } from '../types/row';
import type { Column } from '../types/column';
import type { Table } from '../types/table';
import { GridKitError } from '../errors';
