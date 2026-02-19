// Size management methods for columns
import type { RowData } from '@/types';
import type { ValidatedColumnDef } from '@/types/column';
import type { Table } from '@/types/table';

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Builds size-related methods for column instance.
 */
export function buildSizeMethods<TData extends RowData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
) {
  const tableState = () => table.getState();

  return {
    // Size management
    getSize: () => {
      const sizing = tableState().columnSizing;
      return sizing[columnDef.id] ?? columnDef.size ?? 150;
    },

    setSize: (size: number) => {
      const clamped = clamp(
        size,
        columnDef.minSize ?? 50,
        columnDef.maxSize ?? Infinity
      );
      table.setState((prev) => ({
        ...prev,
        columnSizing: {
          ...prev.columnSizing,
          [columnDef.id]: clamped,
        },
      }));
    },

    resetSize: () => {
      table.setState((prev) => {
        const nextSizing = { ...prev.columnSizing };
        delete nextSizing[columnDef.id];
        return { ...prev, columnSizing: nextSizing };
      });
    },
  };
}
