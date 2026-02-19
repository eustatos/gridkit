// Filtering methods for columns
import type { ValidatedColumnDef } from '@/types/column';

import type { RowData } from '@/types';
import type { Table , FilteringState } from '@/types/table';

/**
 * Builds filtering-related methods for column instance.
 */
export function buildFilteringMethods<TData extends RowData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
) {
  const tableState = () => table.getState();

  return {
    // Filtering
    getIsFiltered: () => {
      const filtering = tableState().filtering ?? [];
      return filtering.some((f) => f.id === columnDef.id);
    },

    getFilterValue: () => {
      const filtering = tableState().filtering ?? [];
      const filter = filtering.find((f) => f.id === columnDef.id);
      return filter?.value;
    },

    setFilterValue: (value: unknown) => {
      if (!columnDef.enableFiltering) return;

      table.setState((prev) => {
        const currentFiltering = prev.filtering ?? [];
        const existingIndex = currentFiltering.findIndex(
          (f) => f.id === columnDef.id
        );

        let nextFiltering: FilteringState[];

        if (value == null || value === '') {
          // Remove filter
          nextFiltering = currentFiltering.filter(
            (_, i) => i !== existingIndex
          );
        } else if (existingIndex >= 0) {
          // Update existing filter
          nextFiltering = [...currentFiltering];
          nextFiltering[existingIndex] = {
            ...nextFiltering[existingIndex],
            value,
            operator: columnDef.filterFn ? 'custom' : 'equals',
          };
        } else {
          // Add new filter
          nextFiltering = [
            ...currentFiltering,
            {
              id: columnDef.id,
              value,
              operator: columnDef.filterFn ? 'custom' : 'equals',
            },
          ];
        }

        return { ...prev, filtering: nextFiltering };
      });
    },
  };
}
