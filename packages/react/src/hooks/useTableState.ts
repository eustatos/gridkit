import { useEffect, useRef, useState, useDebugValue } from 'react';
import type { Table, TableState, RowData } from '@gridkit/core';

/**
 * Selector function type for extracting specific state
 */
export type StateSelector<TData extends RowData, TSelected = any> = (
  state: TableState<TData>
) => TSelected;

/**
 * Hook to subscribe to table state with optional selector
 * 
 * @template TData - Row data type
 * @template TSelected - Selected state type
 * @param table - Table instance
 * @param selector - Optional selector function for specific state
 * @returns Selected state or full state
 * 
 * @example
 * ```tsx
 * // Get full state
 * const state = useTableState(table);
 * 
 * // Get specific state with selector
 * const sorting = useTableState(table, state => state.sorting);
 * const rowCount = useTableState(table, state => state.data.length);
 * ```
 */
export function useTableState<TData extends RowData, TSelected = TableState<TData>>(
  table: Table<TData>,
  selector?: StateSelector<TData, TSelected>
): TSelected {
  const stateRef = useRef<TSelected | null>(null);
  const selectorRef = useRef<StateSelector<TData, TSelected> | undefined>(selector);
  const forceUpdateRef = useRef<() => void>(() => {});
  
  // Use force update pattern with stable ref
  const [, forceUpdate] = useState({});
  
  // Store force update in ref for use in subscription callback
  useEffect(() => {
    forceUpdateRef.current = () => {
      forceUpdate({});
    };
  }, []);
  
  // Keep selector ref updated
  useEffect(() => {
    selectorRef.current = selector;
  }, [selector]);
  
  // Initialize and subscribe
  useEffect(() => {
    const currentState = table.getState();
    stateRef.current = selector
      ? (selector(currentState) as TSelected)
      : (currentState as unknown as TSelected);
    
    // Subscribe to state changes
    const unsubscribe = table.subscribe(() => {
      const tableState = table.getState();
      const currentSelector = selectorRef.current;
      
      if (currentSelector) {
        const newState = currentSelector(tableState) as TSelected;
        const oldState = stateRef.current;
        
        // Only update if changed (shallow comparison for performance)
        if (newState !== oldState && !shallowEqual(newState, oldState)) {
          stateRef.current = newState;
          forceUpdateRef.current();
        }
      } else {
        const newFullState = tableState as unknown as TSelected;
        const oldFullState = stateRef.current;
        
        if (newFullState !== oldFullState) {
          stateRef.current = newFullState;
          forceUpdateRef.current();
        }
      }
    });
    
    // Trigger initial render
    forceUpdateRef.current();
    
    return () => {
      unsubscribe();
    };
  }, [table]);
  
  // Add debug value for React DevTools
  useDebugValue(stateRef.current);
  
  return stateRef.current as TSelected;
}

// Simple shallow equality check
function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) {
    return true;
  }
  
  if (a === null || b === null) {
    return false;
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (const key of keysA) {
      if (a[key as keyof T] !== b[key as keyof T]) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

/**
 * Hook to get specific state property
 * 
 * @example
 * ```tsx
 * const data = useTableStateProperty(table, 'data');
 * const sorting = useTableStateProperty(table, 'sorting');
 * ```
 */
export function useTableStateProperty<
  TData extends RowData,
  TKey extends keyof TableState<TData>
>(
  table: Table<TData>,
  key: TKey
): TableState<TData>[TKey] {
  return useTableState(table, (state) => state[key]);
}

/**
 * Hook to check if state has a specific property
 */
export function useHasState<TData extends RowData>(
  table: Table<TData>,
  key: keyof TableState<TData>
): boolean {
  return useTableState(table, (state) => key in state && state[key] !== undefined);
}

/**
 * Hook to get table data
 */
export function useTableData<TData extends RowData>(
  table: Table<TData>
): readonly TData[] {
  return useTableStateProperty(table, 'data');
}

/**
 * Hook to get sorting state
 */
export function useTableSorting<TData extends RowData>(
  table: Table<TData>
): readonly any[] {
  return useTableStateProperty(table, 'sorting');
}

/**
 * Hook to get filtering state
 */
export function useTableFiltering<TData extends RowData>(
  table: Table<TData>
): any {
  return useTableStateProperty(table, 'filtering');
}

/**
 * Hook to get pagination state
 */
export function useTablePagination<TData extends RowData>(
  table: Table<TData>
): any {
  return useTableStateProperty(table, 'pagination');
}

/**
 * Hook to get column visibility state
 */
export function useTableColumnVisibility<TData extends RowData>(
  table: Table<TData>
): Readonly<Record<string, boolean>> {
  return useTableStateProperty(table, 'columnVisibility');
}

/**
 * Hook to get column order state
 */
export function useTableColumnOrder<TData extends RowData>(
  table: Table<TData>
): readonly string[] {
  return useTableStateProperty(table, 'columnOrder');
}

/**
 * Hook to get expanded state
 */
export function useTableExpanded<TData extends RowData>(
  table: Table<TData>
): Readonly<Record<string, boolean>> {
  return useTableStateProperty(table, 'expanded');
}

/**
 * Hook to get row selection state
 */
export function useTableRowSelection<TData extends RowData>(
  table: Table<TData>
): Readonly<Record<string, boolean>> {
  return useTableStateProperty(table, 'rowSelection');
}
