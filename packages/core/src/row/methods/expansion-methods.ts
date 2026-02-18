/**
 * Row expansion methods for tree/grouped data management.
 * 
 * Provides row-level expansion operations for hierarchical data
 * including expand/collapse functionality and state synchronization.
 * 
 * @module @gridkit/core/row/methods/expansion-methods
 */

import type { RowId } from '@/types';
import type { Table } from '@/types/table/Table';

/**
 * Options for building expansion methods.
 */
export interface BuildExpansionMethodsOptions {
  /** Row ID */
  id: RowId;
  /** Parent table instance */
  table: Table<any>;
  /** Whether this row has children */
  hasChildren: boolean;
}

/**
 * Expansion methods for row state management.
 */
export interface ExpansionMethods {
  /**
   * Check if row is currently expanded.
   * @returns True if expanded, false otherwise
   */
  getIsExpanded(): boolean;

  /**
   * Toggle row expansion state.
   * @param expanded - Optional force state (toggles if undefined)
   */
  toggleExpanded(expanded?: boolean): void;

  /**
   * Expand this row and all children recursively.
   */
  expandAll(): void;

  /**
   * Collapse this row and all children recursively.
   */
  collapseAll(): void;
}

/**
 * Build expansion methods for a row.
 * Creates methods for managing row expansion state.
 * 
 * @param options - Build options
 * @returns Expansion methods instance
 */
export function buildExpansionMethods(
  options: BuildExpansionMethodsOptions
): ExpansionMethods {
  const { id, table, hasChildren } = options;
  const idStr = id.toString();

  return {
    // Check if row is expanded
    getIsExpanded: () => {
      if (!hasChildren) return false;
      const state = table.getState();
      return !!((state.expanded as any)[idStr]);
    },

    // Toggle expansion state
    toggleExpanded: (expanded?: boolean) => {
      if (!hasChildren) return;

      const state = table.getState();
      const current = !!((state.expanded as any)[idStr]);
      const next = expanded ?? !current;

      table.setState((prev) => ({
        ...prev,
        expanded: {
          ...prev.expanded,
          [idStr]: next,
        },
      }));
    },

    // Expand all children recursively
    expandAll: () => {
      if (!hasChildren) return;
      
      table.setState((prev) => ({
        ...prev,
        expanded: {
          ...prev.expanded,
          [idStr]: true,
        },
      }));
    },

    // Collapse all descendants
    collapseAll: () => {
      if (!hasChildren) return;
      
      table.setState((prev) => {
        const expanded = prev.expanded as any;
        delete expanded[idStr];
        return { ...prev, expanded };
      });
    },
  };
}

/**
 * Create empty expansion methods (placeholder).
 * Used when expansion is not available.
 */
export function createEmptyExpansionMethods(): ExpansionMethods {
  return {
    getIsExpanded: () => false,
    toggleExpanded: () => {},
    expandAll: () => {},
    collapseAll: () => {},
  };
}
