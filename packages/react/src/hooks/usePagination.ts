import { useCallback, useMemo } from 'react';
import type { Table, RowData, PaginationState } from '@gridkit/core';
import { useTableState } from './useTableState';

/**
 * Pagination result interface for usePagination hook.
 * 
 * @template TData - Row data type
 */
export interface UsePaginationResult {
  /**
   * Current page index (0-based).
   */
  pageIndex: number;
  
  /**
   * Current page size.
   */
  pageSize: number;
  
  /**
   * Total number of pages.
   */
  pageCount: number;
  
  /**
   * Whether previous page is available.
   */
  canPreviousPage: boolean;
  
  /**
   * Whether next page is available.
   */
  canNextPage: boolean;
  
  /**
   * Set the current page index.
   * @param index - New page index
   */
  setPageIndex: (index: number) => void;
  
  /**
   * Set the page size.
   * @param size - New page size
   */
  setPageSize: (size: number) => void;
  
  /**
   * Navigate to the next page.
   */
  nextPage: () => void;
  
  /**
   * Navigate to the previous page.
   */
  previousPage: () => void;
  
  /**
   * Navigate to the first page.
   */
  firstPage: () => void;
  
  /**
   * Navigate to the last page.
   */
  lastPage: () => void;
}

/**
 * Hook for managing table pagination state.
 * Provides methods for page navigation, page size changes, and pagination helpers.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Pagination result object with methods and state
 * 
 * @example
 * ```tsx
 * const pagination = usePagination(table);
 * 
 * // Navigate to next page
 * pagination.nextPage();
 * 
 * // Navigate to previous page
 * pagination.previousPage();
 * 
 * // Go to first page
 * pagination.firstPage();
 * 
 * // Go to last page
 * pagination.lastPage();
 * 
 * // Set specific page
 * pagination.setPageIndex(2);
 * 
 * // Change page size
 * pagination.setPageSize(20);
 * 
 * // Access current pagination state
 * console.log(pagination.pageIndex, pagination.pageSize, pagination.pageCount);
 * ```
 */
export function usePagination<TData extends RowData>(
  table: Table<TData>
): UsePaginationResult {
  // Track pagination state with default fallback
  const paginationState = useTableState(table, (state) => state.pagination);
  const pagination = paginationState || { pageIndex: 0, pageSize: 10 };
  
  // Track row count
  const rowCount = useTableState(table, (state) => state.data.length);
  
  const { pageIndex, pageSize } = pagination;
  const pageCount = Math.ceil(rowCount / pageSize);
  
  // Use useMemo to recompute navigation state when pagination changes
  const { canPreviousPage, canNextPage } = useMemo(() => ({
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex < pageCount - 1,
  }), [pageIndex, pageCount]);
  
  const setPageIndex = useCallback(
    (index: number) => {
      table.setState((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          pageIndex: Math.max(0, Math.min(index, pageCount - 1)),
          pageSize: prev.pagination?.pageSize || 10,
        },
      }));
    },
    [table, pageCount]
  );
  
  const setPageSize = useCallback(
    (size: number) => {
      table.setState((prev) => ({
        ...prev,
        pagination: {
          pageIndex: 0,
          pageSize: size,
        },
      }));
    },
    [table]
  );
  
  const nextPage = useCallback(() => {
    setPageIndex(pageIndex + 1);
  }, [setPageIndex, pageIndex]);
  
  const previousPage = useCallback(() => {
    setPageIndex(pageIndex - 1);
  }, [setPageIndex, pageIndex]);
  
  const firstPage = useCallback(() => {
    setPageIndex(0);
  }, [setPageIndex]);
  
  const lastPage = useCallback(() => {
    setPageIndex(pageCount - 1);
  }, [setPageIndex, pageCount]);
  
  return {
    pageIndex,
    pageSize,
    pageCount,
    canPreviousPage,
    canNextPage,
    setPageIndex,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
  };
}
