import { useCallback } from 'react';
import type { Table, RowData, SortingState } from '@gridkit/core';
import { useTableState } from './useTableState';

/**
 * Sorting result interface for useSorting hook.
 * 
 * @template TData - Row data type
 */
export interface UseSortingResult {
  /**
   * Current sorting state array.
   */
  sorting: SortingState[];
  
  /**
   * Set the sorting state directly.
   * @param sorting - New sorting state array
   */
  setSorting: (sorting: SortingState[]) => void;
  
  /**
   * Toggle sort direction for a column.
   * @param columnId - Column ID to toggle
   * @param desc - Optional direction (true for desc, false for asc)
   */
  toggleSort: (columnId: string, desc?: boolean) => void;
  
  /**
   * Clear all sorting.
   */
  clearSorting: () => void;
  
  /**
   * Check if a column is currently being sorted.
   * @param columnId - Column ID to check
   * @returns True if column is sorted
   */
  isSorted: (columnId: string) => boolean;
  
  /**
   * Get the current sort direction for a column.
   * @param columnId - Column ID to check
   * @returns 'asc', 'desc', or false if not sorted
   */
  getSortDirection: (columnId: string) => 'asc' | 'desc' | false;
}

/**
 * Hook for managing table sorting state.
 * Provides methods for sorting, toggling sort directions, and clearing sorting.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Sorting result object with methods and state
 * 
 * @example
 * ```tsx
 * const sorting = useSorting(table);
 * 
 * // Check if column is sorted
 * const isSorted = sorting.isSorted('name');
 * 
 * // Get sort direction
 * const direction = sorting.getSortDirection('name');
 * 
 * // Toggle sort on a column
 * sorting.toggleSort('name');
 * 
 * // Set specific sort
 * sorting.setSorting([{ id: 'name', desc: false }]);
 * 
 * // Clear all sorting
 * sorting.clearSorting();
 * 
 * // Get current sorting state
 * console.log(sorting.sorting);
 * ```
 */
export function useSorting<TData extends RowData>(
  table: Table<TData>
): UseSortingResult {
  const sorting = useTableState(table, (state) => state.sorting || []);
  
  const setSorting = useCallback(
    (newSorting: SortingState[]) => {
      table.setState((prev) => ({
        ...prev,
        sorting: newSorting,
      }));
    },
    [table]
  );
  
  const toggleSort = useCallback(
    (columnId: string, desc?: boolean) => {
      table.setState((prev) => {
        const currentSorting = prev.sorting || [];
        const existingIndex = currentSorting.findIndex((s) => s.id === columnId);
        
        if (existingIndex >= 0) {
          const existing = currentSorting[existingIndex];
          const newSorting = [...currentSorting];
          
          if (desc === undefined) {
            // Toggle
            newSorting[existingIndex] = { ...existing, desc: !existing.desc };
          } else if (desc === existing.desc) {
            // Remove
            newSorting.splice(existingIndex, 1);
          } else {
            // Update
            newSorting[existingIndex] = { ...existing, desc };
          }
          
          return { ...prev, sorting: newSorting };
        } else {
          // Add new sort
          return {
            ...prev,
            sorting: [...currentSorting, { id: columnId, desc: desc ?? false }],
          };
        }
      });
    },
    [table]
  );
  
  const clearSorting = useCallback(() => {
    table.setState((prev) => ({ ...prev, sorting: [] }));
  }, [table]);
  
  const isSorted = useCallback(
    (columnId: string) => sorting.some((s) => s.id === columnId),
    [sorting]
  );
  
  const getSortDirection = useCallback(
    (columnId: string): 'asc' | 'desc' | false => {
      const sort = sorting.find((s) => s.id === columnId);
      return sort ? (sort.desc ? 'desc' : 'asc') : false;
    },
    [sorting]
  );
  
  return {
    sorting,
    setSorting,
    toggleSort,
    clearSorting,
    isSorted,
    getSortDirection,
  };
}
