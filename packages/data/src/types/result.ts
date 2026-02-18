import type { RowData } from '@gridkit/core/types';
import type { DataErrorInfo } from './errors';

/**
 * Result from data provider load operation.
 */
export interface DataResult<TData extends RowData> {
  /**
   * Loaded data rows.
   */
  data: TData[];

  /**
   * Total row count (for pagination).
   * If undefined, client-side pagination is assumed.
   */
  totalCount?: number;

  /**
   * Page information.
   */
  pageInfo?: PageInfo;

  /**
   * Server-side processing information.
   */
  serverInfo?: ServerInfo;

  /**
   * Additional metadata.
   */
  meta?: DataMeta;

  /**
   * Load duration in milliseconds.
   */
  duration?: number;

  /**
   * Error information (if any).
   */
  error?: DataErrorInfo;
}

/**
 * Page information for paginated results.
 */
export interface PageInfo {
  /**
   * Current page index.
   */
  pageIndex: number;

  /**
   * Page size.
   */
  pageSize: number;

  /**
   * Total number of pages.
   */
  totalPages?: number;

  /**
   * Has next page.
   */
  hasNextPage?: boolean;

  /**
   * Has previous page.
   */
  hasPreviousPage?: boolean;
}

/**
 * Server-side processing information.
 */
export interface ServerInfo {
  /**
   * Server processing time in milliseconds.
   */
  processingTime?: number;

  /**
   * Server memory usage.
   */
  memoryUsage?: number;

  /**
   * Server-side filtering applied.
   */
  filtered?: boolean;

  /**
   * Server-side sorting applied.
   */
  sorted?: boolean;

  /**
   * Query execution plan.
   */
  executionPlan?: unknown;
}

/**
 * Data metadata.
 */
export interface DataMeta {
  /**
   * Data source identifier.
   */
  source?: string;

  /**
   * Data version/timestamp.
   */
  version?: string | number;

  /**
   * Data schema information.
   */
  schema?: DataSchema;

  /**
   * Cache information.
   */
  cache?: CacheInfo;

  /**
   * Custom metadata.
   */
  [key: string]: unknown;
}

/**
 * Data schema information.
 */
export interface DataSchema {
  /**
   * Column definitions.
   */
  columns?: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    format?: string;
  }>;

  /**
   * Primary keys.
   */
  primaryKeys?: string[];

  /**
   * Foreign keys.
   */
  foreignKeys?: Array<{
    column: string;
    references: string;
  }>;
}
