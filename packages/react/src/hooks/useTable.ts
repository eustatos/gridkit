import { useEffect, useMemo, useRef, useState, useCallback, type DependencyList } from 'react';
import { createTable, type Table, type TableOptions, type RowData } from '@gridkit/core';
import type { UseTableOptions } from '../types';

/**
 * Core hook for creating and managing a GridKit table instance
 * 
 * @template TData - The row data type
 * @param options - Table configuration options
 * @returns Table instance with state management
 * 
 * @example
 * ```tsx
 * const { table } = useTable({
 *   data: myData,
 *   columns: myColumns,
 * });
 * 
 * // Use table.getState(), table.setState(), etc.
 * ```
 */
const EMPTY_DEPS: DependencyList = [];

export function useTable<TData extends RowData>(
  options: UseTableOptions<TData>
): {
  table: Table<TData> | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { deps, debug = false, ...tableOptions } = options;
  const dependencyList = deps ?? EMPTY_DEPS;
  
  // Track errors
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Table instance ref (persistent across renders)
  const tableRef = useRef<Table<TData> | null>(null);
  
  // Force re-render when table state changes
  const [, forceUpdate] = useState({});
  const forceRerender = useCallback(() => {
    forceUpdate({});
  }, []);
  
  // Create table instance (only when deps change)
  const table = useMemo(() => {
    try {
      if (debug) {
        console.log('[useTable] Creating table instance', { options: tableOptions });
      }
      
      setIsLoading(true);
      setError(null);
      
      // Cleanup previous instance if exists
      if (tableRef.current) {
        if (debug) {
          console.log('[useTable] Cleaning up previous instance');
        }
        // Cleanup logic here (if core provides destroy method)
      }
      
      // Create new instance
      const newTable = createTable<TData>(tableOptions);
      tableRef.current = newTable;
      
      setIsLoading(false);
      
      return newTable;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencyList);
  
  // Subscribe to table state changes
  useEffect(() => {
    if (!table) return;
    
    if (debug) {
      console.log('[useTable] Subscribing to table state changes');
    }
    
    // Subscribe to state changes to trigger re-renders
    const unsubscribe = table.subscribe(() => {
      if (debug) {
        console.log('[useTable] Table state changed, re-rendering');
      }
      forceRerender();
    });
    
    return () => {
      if (debug) {
        console.log('[useTable] Unsubscribing from table state changes');
      }
      unsubscribe();
    };
  }, [table, debug, forceRerender]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debug && tableRef.current) {
        console.log('[useTable] Component unmounting, cleaning up table');
      }
      // Cleanup table resources
      tableRef.current = null;
    };
  }, [debug]);
  
  return {
    table,
    isLoading,
    error,
  };
}

export default useTable;
