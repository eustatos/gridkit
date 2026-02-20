/**
 * React-specific types for GridKit
 */

import type { Table, TableOptions, RowData } from '@gridkit/core';
import type { DependencyList } from 'react';

/**
 * Options for useTable hook
 */
export interface UseTableOptions<TData extends RowData> extends TableOptions<TData> {
  /**
   * Dependencies array for React useEffect
   * If provided, table will be recreated when dependencies change
   */
  deps?: DependencyList;
  
  /**
   * Enable debug mode (logs re-renders and updates)
   */
  debug?: boolean;
}

/**
 * Return type for useTable hook
 */
export interface UseTableResult<TData extends RowData> {
  /**
   * The table instance
   */
  table: Table<TData>;
  
  /**
   * Loading state (useful for async data)
   */
  isLoading: boolean;
  
  /**
   * Error state (if table creation fails)
   */
  error: Error | null;
}

/**
 * Options for event subscription hooks
 */
export interface UseEventOptions {
  /**
   * Enable/disable the subscription
   */
  enabled?: boolean;
  
  /**
   * Debounce delay in milliseconds
   */
  debounce?: number;
  
  /**
   * Throttle delay in milliseconds
   */
  throttle?: number;
}
