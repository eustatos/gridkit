import type { RowData } from '../types/base';
import type { Column, ColumnDef } from '../types/column';
import type { Table } from '../types/table';
import { GridKitError } from '../errors';

/**
 * Creates a column instance from a column definition.
 */
export function createColumn<TData extends RowData, TValue = unknown>(
  config: ColumnConfig<TData, TValue>
): Column<TData, TValue> {
  const { columnDef, table } = config;

  // Basic validation
  if (!columnDef) {
    throw new GridKitError(
      'COLUMN_INVALID_DEFINITION',
      'Column definition is required'
    );
  }

  if (!table) {
    throw new GridKitError(
      'COLUMN_INVALID_DEFINITION',
      'Table instance is required'
    );
  }

  // Check for at least one accessor
  if (!columnDef.accessorKey && !columnDef.accessorFn) {
    throw new GridKitError(
      'COLUMN_INVALID_ACCESSOR',
      'Column must have either accessorKey or accessorFn'
    );
  }

  // Check for ID when using accessorFn
  if (columnDef.accessorFn && !columnDef.id) {
    throw new GridKitError(
      'COLUMN_INVALID_DEFINITION',
      'Column with accessorFn must have an id'
    );
  }

  // Check for duplicate column IDs
  const id = columnDef.id || columnDef.accessorKey || '';
  // Temporarily disable duplicate check during table creation
  // const existingColumn = table.getColumn(id);
  // if (existingColumn) {
  //   throw new GridKitError('COLUMN_DUPLICATE_ID', `Column ID "${id}" is already in use`);
  // }
  // Create column with basic methods
  const column: Column<TData, TValue> = {
    id,
    table,
    columnDef: {
      size: 150,
      minSize: 50,
      maxSize: Number.MAX_SAFE_INTEGER,
      enableSorting: true,
      enableFiltering: true,
      enableResizing: true,
      enableHiding: true,
      meta: {},
      ...columnDef,
    },

    getSize() {
      const state = table.getState();
      return state.columnSizing[id] ?? this.columnDef.size ?? 150;
    },

    getIsVisible() {
      const state = table.getState();
      return state.columnVisibility[id] !== false;
    },

    toggleVisibility(value) {
      table.setState((prev) => ({
        ...prev,
        columnVisibility: {
          ...prev.columnVisibility,
          [id]: value !== undefined ? value : !this.getIsVisible(),
        },
      }));
    },

    resetSize() {
      table.setState((prev) => ({
        ...prev,
        columnSizing: {
          ...prev.columnSizing,
          [id]: this.columnDef.size ?? 150,
        },
      }));
    },

    getIndex() {
      const state = table.getState();
      return state.columnOrder.indexOf(id);
    },
  };

  return column;
}

export interface ColumnConfig<TData extends RowData, TValue = unknown> {
  columnDef: ColumnDef<TData, TValue>;
  table: Table<TData>;
}
