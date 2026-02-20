import { useCallback } from 'react';
import type { Table, RowData, FilteringState, FilterValue, FilterOperator } from '@gridkit/core';
import { useTableState } from './useTableState';

/**
 * Filtering result interface for useFiltering hook.
 * 
 * @template TData - Row data type
 */
export interface UseFilteringResult {
  /**
   * Current filtering state array.
   */
  filters: FilteringState[];
  
  /**
   * Set the filtering state directly.
   * @param filters - New filtering state array
   */
  setFilters: (filters: FilteringState[]) => void;
  
  /**
   * Set a column filter.
   * @param columnId - Column ID to filter
   * @param value - Filter value
   * @param operator - Optional filter operator (defaults to 'contains')
   */
  setColumnFilter: (columnId: string, value: FilterValue, operator?: FilterOperator) => void;
  
  /**
   * Clear a specific column filter.
   * @param columnId - Column ID to clear
   */
  clearColumnFilter: (columnId: string) => void;
  
  /**
   * Clear all filters.
   */
  clearAllFilters: () => void;
  
  /**
   * Get the current filter value for a column.
   * @param columnId - Column ID to check
   * @returns Filter value or undefined if not filtered
   */
  getColumnFilter: (columnId: string) => FilterValue | undefined;
  
  /**
   * Get the current filter operator for a column.
   * @param columnId - Column ID to check
   * @returns Filter operator or undefined if not filtered
   */
  getColumnFilterOperator: (columnId: string) => FilterOperator | undefined;
  
  /**
   * Check if a column has a filter.
   * @param columnId - Column ID to check
   * @returns True if column is filtered
   */
  isColumnFiltered: (columnId: string) => boolean;
}

/**
 * Hook for managing table filtering state.
 * Provides methods for setting, clearing, and checking column filters.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Filtering result object with methods and state
 * 
 * @example
 * ```tsx
 * const filtering = useFiltering(table);
 * 
 * // Set a column filter
 * filtering.setColumnFilter('name', 'Alice');
 * 
 * // Get filter value
 * const nameFilter = filtering.getColumnFilter('name');
 * 
 * // Clear specific column filter
 * filtering.clearColumnFilter('name');
 * 
 * // Clear all filters
 * filtering.clearAllFilters();
 * 
 * // Check if column is filtered
 * const isFiltered = filtering.isColumnFiltered('name');
 * 
 * // Get current filters
 * console.log(filtering.filters);
 * ```
 */
export function useFiltering<TData extends RowData>(
  table: Table<TData>
): UseFilteringResult {
  const filters = useTableState(table, (state) => state.filtering || []);
  
  const setFilters = useCallback(
    (newFilters: FilteringState[]) => {
      table.setState((prev) => ({
        ...prev,
        filtering: newFilters,
      }));
    },
    [table]
  );
  
  const setColumnFilter = useCallback(
    (columnId: string, value: FilterValue, operator?: FilterOperator) => {
      table.setState((prev) => {
        const currentFilters = prev.filtering || [];
        const existingIndex = currentFilters.findIndex((f) => f.id === columnId);
        
        if (value == null || value === '') {
          // Remove filter
          const newFilters = currentFilters.filter((f) => f.id !== columnId);
          return { ...prev, filtering: newFilters };
        }
        
        if (existingIndex >= 0) {
          // Update existing filter
          const newFilters = [...currentFilters];
          newFilters[existingIndex] = {
            ...newFilters[existingIndex],
            value,
            operator,
          };
          return { ...prev, filtering: newFilters };
        } else {
          // Add new filter
          return {
            ...prev,
            filtering: [
              ...currentFilters,
              { id: columnId, value, operator: operator ?? 'contains' },
            ],
          };
        }
      });
    },
    [table]
  );
  
  const clearColumnFilter = useCallback(
    (columnId: string) => {
      setColumnFilter(columnId, undefined);
    },
    [setColumnFilter]
  );
  
  const clearAllFilters = useCallback(() => {
    table.setState((prev) => ({ ...prev, filtering: [] }));
  }, [table]);
  
  const getColumnFilter = useCallback(
    (columnId: string) => {
      const filter = filters.find((f) => f.id === columnId);
      return filter?.value;
    },
    [filters]
  );
  
  const getColumnFilterOperator = useCallback(
    (columnId: string) => {
      const filter = filters.find((f) => f.id === columnId);
      return filter?.operator;
    },
    [filters]
  );
  
  const isColumnFiltered = useCallback(
    (columnId: string) => filters.some((f) => f.id === columnId),
    [filters]
  );
  
  return {
    filters,
    setFilters,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    getColumnFilter,
    getColumnFilterOperator,
    isColumnFiltered,
  };
}
