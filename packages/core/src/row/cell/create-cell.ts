/**
 * Cell factory for creating cell instances.
 * 
 * Provides complete cell creation with data access, rendering,
 * and state management integration.
 * 
 * @module @gridkit/core/row/cell/create-cell
 */

import type { RowData } from '@/types';
import type { Column } from '@/types/column/ColumnInstance';
import type { Cell } from '@/types/row/Cell';
import type { Row } from '@/types/table/Row';

/**
 * Create a cell instance for a row/column pair.
 * 
 * @template TData - Row data type
 * @template TValue - Cell value type
 * @param row - Parent row instance
 * @param column - Parent column instance
 * @returns Cell instance with all methods
 */
export function createCell<TData extends RowData, TValue = unknown>(
  row: Row<TData>,
  column: Column<TData, TValue>
): Cell<TData, TValue> {
  const cellId = `${row.id}:${column.id}`;

  const cell: Cell<TData, TValue> = {
    id: cellId as any,
    rowId: row.id as string,
    column,

    getValue: () => {
      const accessor = (column as any)._internal?.accessor;
      if (!accessor) {
        throw new Error(
          `NO_ACCESSOR: No accessor for column ${column.id}`
        );
      }

      return accessor.getValue(row.original, row.originalIndex);
    },

    renderValue: () => {
      const value = cell.getValue();
      const cellRenderer = column.columnDef.cell;

      if (cellRenderer) {
        const context: any = {
          getValue: () => value,
          getRow: () => row,
          column,
          table: row.table,
          rowIndex: row.index,
          cellIndex: column.getIndex(),
          getIsSelected: () => row.getIsSelected(),
          renderValue: () => value,
          meta: column.columnDef.meta?.cell || {},
        };

        if (typeof cellRenderer === 'function') {
          return cellRenderer(context);
        }
      }

      return value;
    },

    renderCell: () => {
      return cell.renderValue();
    },

    getIsFocused: () => {
      const state = row.table.getState();
      return (
        state.focusedCell?.rowId === row.id &&
        state.focusedCell?.columnId === column.id
      );
    },

    getIsSelected: () => {
      return row.getIsSelected();
    },

    getIsEditable: () => {
      const meta = (column.columnDef.meta)?.cell;
      return meta?.editable === true;
    },

    meta: (column.columnDef.meta)?.cell || {},
    index: column.getIndex(),

    // Position (for virtualization)
    get position(): any {
      // Will be set by virtualization system
      return undefined;
    },
  };

  return cell;
}
