// Visibility management methods for columns
import type { EnsureRowData } from '@/types/helpers';
import type { ValidatedColumnDef } from '../validation/validate-column';
import type { Table } from '@/types/table/Table';

/**
 * Builds visibility-related methods for column instance.
 */
export function buildVisibilityMethods<TData, TValue>(
  columnDef: ValidatedColumnDef<EnsureRowData<TData>, TValue>,
  table: Table<EnsureRowData<TData>>
) {
  const tableState = () => table.getState();

  return {
    // Visibility
    getIsVisible: () => {
      const visibility = tableState().columnVisibility;
      return visibility[columnDef.id!] !== false;
    },

    toggleVisibility: (visible?: boolean) => {
      table.setState((prev) => {
        const current = prev.columnVisibility[columnDef.id!];
        const next = visible ?? current === false;

        return {
          ...prev,
          columnVisibility: {
            ...prev.columnVisibility,
            [columnDef.id!]: next,
          },
        };
      });
    },
  };
}
