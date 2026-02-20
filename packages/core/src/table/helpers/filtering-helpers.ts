/**
 * Filtering helpers for GridKit table.
 *
 * Provides utility functions for working with filtering state.
 *
 * @module @gridkit/core/table/helpers/filtering
 */

import type { ColumnId } from '@/types';
import type { FilteringState, FilterValue, FilterOperator } from '@/types/table';

/**
 * Set filter for a column.
 * Replaces existing filter for that column.
 * 
 * @param state - Current filtering state array
 * @param columnId - Column to filter
 * @param value - Filter value
 * @param operator - Filter operator (default: 'equals')
 * @returns New filtering state array
 * 
 * @public
 */
export function setColumnFilter(
  state: readonly FilteringState[],
  columnId: ColumnId,
  value: FilterValue,
  operator: FilterOperator = 'equals'
): FilteringState[] {
  const existingIndex = state.findIndex(f => f.id === columnId);
  
  if (existingIndex >= 0) {
    // Replace existing filter
    const newState = [...state];
    newState[existingIndex] = { id: columnId, value, operator };
    return newState;
  }
  
  // Add new filter
  return [...state, { id: columnId, value, operator }];
}

/**
 * Remove filter for a column.
 * 
 * @param state - Current filtering state array
 * @param columnId - Column to clear
 * @returns New filtering state array
 * 
 * @public
 */
export function removeColumnFilter(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilteringState[] {
  return state.filter(f => f.id !== columnId);
}

/**
 * Get filter for a specific column.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns Column filter or undefined
 * 
 * @public
 */
export function getColumnFilter(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilteringState | undefined {
  return state.find(f => f.id === columnId);
}

/**
 * Get filter value for a column.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns Filter value or undefined
 * 
 * @public
 */
export function getColumnFilterValue(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilterValue | undefined {
  return getColumnFilter(state, columnId)?.value;
}

/**
 * Get filter operator for a column.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns Filter operator or undefined
 * 
 * @public
 */
export function getColumnFilterOperator(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilterOperator | undefined {
  return getColumnFilter(state, columnId)?.operator;
}

/**
 * Check if column has a filter.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns True if column is filtered
 * 
 * @public
 */
export function isColumnFiltered(
  state: readonly FilteringState[],
  columnId: ColumnId
): boolean {
  return state.some(f => f.id === columnId);
}

/**
 * Clear all filters.
 * 
 * @returns Empty filtering state array
 * 
 * @public
 */
export function clearAllFilters(): FilteringState[] {
  return [];
}

/**
 * Get count of active filters.
 * 
 * @param state - Filtering state array
 * @returns Number of active filters
 * 
 * @public
 */
export function getActiveFilterCount(state: readonly FilteringState[]): number {
  return state.length;
}

/**
 * Update filter operator for a column.
 * 
 * @param state - Current filtering state array
 * @param columnId - Column ID
 * @param operator - New operator
 * @returns New filtering state array
 * 
 * @public
 */
export function updateColumnFilterOperator(
  state: readonly FilteringState[],
  columnId: ColumnId,
  operator: FilterOperator
): FilteringState[] {
  const existingIndex = state.findIndex(f => f.id === columnId);
  
  if (existingIndex < 0) {
    return [...state]; // No change if filter doesn't exist
  }
  
  const newState = [...state];
  newState[existingIndex] = {
    ...newState[existingIndex],
    operator,
  };
  return newState;
}

/**
 * Get all filtered column IDs.
 * 
 * @param state - Filtering state array
 * @returns Array of filtered column IDs
 * 
 * @public
 */
export function getFilteredColumnIds(
  state: readonly FilteringState[]
): ColumnId[] {
  return state.map(f => f.id);
}
