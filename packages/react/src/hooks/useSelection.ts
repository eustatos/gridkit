import { useCallback } from 'react';
import type { Table, RowData } from '@gridkit/core';
import { useTableState } from './useTableState';

/**
 * Selection result interface for useSelection hook.
 * 
 * @template TData - Row data type
 */
export interface UseSelectionResult<TData extends RowData> {
  /**
   * Array of selected row IDs.
   */
  selectedRows: string[];
  
  /**
   * Check if a row is selected.
   * @param rowId - Row ID to check
   * @returns True if row is selected
   */
  isRowSelected: (rowId: string) => boolean;
  
  /**
   * Toggle row selection.
   * @param rowId - Row ID to toggle
   */
  toggleRowSelection: (rowId: string) => void;
  
  /**
   * Select a row.
   * @param rowId - Row ID to select
   */
  selectRow: (rowId: string) => void;
  
  /**
   * Deselect a row.
   * @param rowId - Row ID to deselect
   */
  deselectRow: (rowId: string) => void;
  
  /**
   * Select all rows.
   */
  selectAll: () => void;
  
  /**
   * Clear all selection.
   */
  clearSelection: () => void;
  
  /**
   * Number of selected rows.
   */
  selectedCount: number;
}

/**
 * Hook for managing row selection state.
 * Provides methods for selecting, deselecting, and checking row selection status.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Selection result object with methods and state
 * 
 * @example
 * ```tsx
 * const selection = useSelection(table);
 * 
 * // Check if row is selected
 * const isSelected = selection.isRowSelected('row-1');
 * 
 * // Select a row
 * selection.selectRow('row-1');
 * 
 * // Toggle row selection
 * selection.toggleRowSelection('row-2');
 * 
 * // Select all rows
 * selection.selectAll();
 * 
 * // Clear selection
 * selection.clearSelection();
 * 
 * // Get selected row IDs
 * console.log(selection.selectedRows);
 * ```
 */
export function useSelection<TData extends RowData>(
  table: Table<TData>
): UseSelectionResult<TData> {
  const rowSelection = useTableState(table, (state) => state.rowSelection || {});
  
  const selectedRows = Object.keys(rowSelection || {}).filter(
    (key) => rowSelection[key]
  );
  
  const isRowSelected = useCallback(
    (rowId: string) => !!rowSelection[rowId],
    [rowSelection]
  );
  
  const toggleRowSelection = useCallback(
    (rowId: string) => {
      table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...(prev.rowSelection || {}),
          [rowId]: !prev.rowSelection?.[rowId],
        },
      }));
    },
    [table]
  );
  
  const selectRow = useCallback(
    (rowId: string) => {
      table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...(prev.rowSelection || {}),
          [rowId]: true,
        },
      }));
    },
    [table]
  );
  
  const deselectRow = useCallback(
    (rowId: string) => {
      table.setState((prev) => {
        const newSelection = { ...(prev.rowSelection || {}) };
        delete newSelection[rowId];
        return { ...prev, rowSelection: newSelection };
      });
    },
    [table]
  );
  
  const selectAll = useCallback(() => {
    const allRows = table.getRowModel().rows;
    const newSelection: Record<string, boolean> = {};
    allRows.forEach((row) => {
      newSelection[row.id] = true;
    });
    table.setState((prev) => ({
      ...prev,
      rowSelection: newSelection,
    }));
  }, [table]);
  
  const clearSelection = useCallback(() => {
    table.setState((prev) => ({
      ...prev,
      rowSelection: {},
    }));
  }, [table]);
  
  return {
    selectedRows,
    isRowSelected,
    toggleRowSelection,
    selectRow,
    deselectRow,
    selectAll,
    clearSelection,
    selectedCount: selectedRows.length,
  };
}
