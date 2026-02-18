import type { ColumnId } from '@gridkit/core/types';

/**
 * Parameters for data loading operations.
 * Follows table state structure for consistency.
 */
export interface LoadParams {
  /**
   * Pagination parameters.
   */
  pagination?: PaginationParams;

  /**
   * Sorting configuration.
   */
  sorting?: SortingParams;

  /**
   * Filter configuration.
   */
  filtering?: FilteringParams;

  /**
   * Search term for global search.
   */
  search?: string;

  /**
   * Custom parameters for provider-specific needs.
   */
  custom?: Record<string, unknown>;

  /**
   * Signal for aborting requests.
   */
  signal?: AbortSignal;
}

/**
 * Pagination parameters.
 */
export interface PaginationParams {
  /**
   * Current page index (0-based).
   */
  pageIndex: number;

  /**
   * Number of rows per page.
   */
  pageSize: number;

  /**
   * Total row count (if known).
   */
  totalCount?: number;
}

/**
 * Sorting parameters.
 */
export type SortingParams = Array<{
  /**
   * Column ID to sort by.
   */
  id: ColumnId;

  /**
   * Sort direction (true = descending).
   */
  desc: boolean;

  /**
   * Custom sort function (overrides default).
   */
  sortFn?: Comparator<any>;
}>;

/**
 * Filtering parameters.
 */
export type FilteringParams = Array<{
  /**
   * Column ID to filter.
   */
  id: ColumnId;

  /**
   * Filter value.
   */
  value: unknown;

  /**
   * Filter operator (equals, contains, etc.).
   */
  operator?: FilterOperator;

  /**
   * Custom filter function (overrides default).
   */
  filterFn?: Predicate<any>;
}>;

/**
 * Supported filter operators.
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'notIn'
  | 'custom';
