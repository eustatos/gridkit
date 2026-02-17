// Sorting methods for columns
import type { EnsureRowData } from '@/types/helpers';
import type { ValidatedColumnDef } from '../validation/validate-column';
import type { Table } from '@/types/table/Table';
import type { SortingState } from '@/types/table/TableState';

/**
 * Builds sorting-related methods for column instance.
 */
export function buildSortingMethods<TData, TValue>(
  columnDef: ValidatedColumnDef<EnsureRowData<TData>, TValue>,
  table: Table<EnsureRowData<TData>>
) {
  const tableState = () => table.getState();

  return {
    // Sorting
    getIsSorted: () => {
      const sorting = tableState().sorting ?? [];
      return sorting.some((s) => s.id === columnDef.id);
    },

    getSortDirection: () => {
      const sorting = tableState().sorting ?? [];
      const sort = sorting.find((s) => s.id === columnDef.id);
      return sort ? (sort.desc ? 'desc' : 'asc') : false;
    },

    toggleSorting: (desc?: boolean) => {
      if (!columnDef.enableSorting) return;

      table.setState((prev) => {
        const currentSorting = prev.sorting ?? [];
        const existingIndex = currentSorting.findIndex(
          (s) => s.id === columnDef.id
        );

        let nextSorting: SortingState[];

        if (existingIndex >= 0) {
          // Toggle existing sort
          const existing = currentSorting[existingIndex];
          if (desc === undefined || desc !== existing.desc) {
            // Toggle direction
            nextSorting = [...currentSorting];
            nextSorting[existingIndex] = { ...existing, desc: !existing.desc };
          } else {
            // Remove sort
            nextSorting = currentSorting.filter((_, i) => i !== existingIndex);
          }
        } else {
          // Add new sort
          nextSorting = [
            ...currentSorting,
            { id: columnDef.id!, desc: desc ?? false },
          ];
        }

        return { ...prev, sorting: nextSorting };
      });
    },
  };
}
