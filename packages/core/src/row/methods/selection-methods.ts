/**
 * Row selection methods for state management and UI state.
 * 
 * Provides row-level selection operations including single,
 * multi, and range selection with state synchronization.
 * 
 * @module @gridkit/core/row/methods/selection-methods
 */

import type { RowId } from '@/types';
import type { SelectionOptions } from '@/types/row/Row';
import type { Table } from '@/types/table/Table';

/**
 * Options for building selection methods.
 */
export interface BuildSelectionMethodsOptions {
  /** Row ID */
  id: RowId;
  /** Parent table instance */
  table: Table<any>;
}

/**
 * Selection methods for row state management.
 */
export interface SelectionMethods {
  /**
   * Check if row is currently selected.
   * @returns True if selected, false otherwise
   */
  getIsSelected(): boolean;

  /**
   * Toggle row selection state.
   * @param selected - Optional force state (toggles if undefined)
   * @param options - Selection options (range, multi, etc.)
   */
  toggleSelected(
    selected?: boolean,
    options?: SelectionOptions
  ): void;

  /**
   * Select all rows in table.
   * @param selected - True to select all, false to clear all
   */
  selectAll(selected?: boolean): void;

  /**
   * Deselect current row.
   */
  deselect(): void;
}

/**
 * Build selection methods for a row.
 * Creates methods for managing row selection state.
 * 
 * @param options - Build options
 * @returns Selection methods instance
 */
export function buildSelectionMethods(
  options: BuildSelectionMethodsOptions
): SelectionMethods {
  const { id, table } = options;

  return {
    // Check if row is selected
    getIsSelected: () => {
      const state = table.getState();
      const idStr = id.toString();
      return !!((state.rowSelection as any)[idStr]);
    },

    // Toggle selection state
    toggleSelected: (
      selected?: boolean,
      selectionOptions?: SelectionOptions
    ) => {
      const state = table.getState();
      const idStr = id.toString();
      const current = !!((state.rowSelection as any)[idStr]);
      const next = selected ?? !current;

      table.setState((prev) => {
        const nextSelection = prev.rowSelection;

        if (next) {
          nextSelection[idStr] = true;
        } else {
          delete nextSelection[idStr];
        }

        // Apply selection options
        if (selectionOptions?.clearOthers && next) {
          // Clear all other selections
          Object.keys(nextSelection).forEach((key) => {
            if (key !== idStr) delete nextSelection[key];
          });
        }

        return { ...prev, rowSelection: nextSelection };
      });
    },

    // Bulk selection helper
    selectAll: (selected = true) => {
      table.setState((prev) => {
        const rowModel = table.getRowModel();
        const nextSelection: Record<string, boolean> = {};

        if (selected) {
          rowModel.rows.forEach((row) => {
            nextSelection[row.id.toString()] = true;
          });
        }

        return { ...prev, rowSelection: nextSelection };
      });
    },

    // Deselect row
    deselect: () => {
      const idStr = id.toString();
      
      table.setState((prev) => {
        const nextSelection = prev.rowSelection;
        delete nextSelection[idStr];
        return { ...prev, rowSelection: nextSelection };
      });
    },
  };
}

/**
 * Create empty selection methods (placeholder).
 * Used when selection is not available.
 */
export function createEmptySelectionMethods(): SelectionMethods {
  return {
    getIsSelected: () => false,
    toggleSelected: () => {},
    selectAll: () => {},
    deselect: () => {},
  };
}
