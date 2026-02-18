/**
 * Provider metadata.
 */
export interface ProviderMeta {
  /**
   * Provider name.
   */
  name: string;

  /**
   * Provider version.
   */
  version: string;

  /**
   * Provider capabilities.
   */
  capabilities: ProviderCapabilities;

  /**
   * Supported features.
   */
  features: ProviderFeatures;

  /**
   * Configuration options.
   */
  config?: Record<string, unknown>;
}

/**
 * Provider capabilities.
 */
export interface ProviderCapabilities {
  /**
   * Supports loading data.
   */
  canLoad: boolean;

  /**
   * Supports saving data.
   */
  canSave: boolean;

  /**
   * Supports real-time updates.
   */
  canSubscribe: boolean;

  /**
   * Supports pagination.
   */
  supportsPagination: boolean;

  /**
   * Supports server-side sorting.
   */
  supportsSorting: boolean;

  /**
   * Supports server-side filtering.
   */
  supportsFiltering: boolean;

  /**
   * Supports search.
   */
  supportsSearch: boolean;

  /**
   * Supports batch operations.
   */
  supportsBatch: boolean;

  /**
   * Supports transactions.
   */
  supportsTransactions: boolean;

  /**
   * Supports caching.
   */
  supportsCaching: boolean;
}

/**
 * Provider features.
 */
export interface ProviderFeatures {
  /**
   * Real-time updates.
   */
  realtime?: boolean;

  /**
   * Offline support.
   */
  offline?: boolean;

  /**
   * Conflict resolution.
   */
  conflictResolution?: boolean;

  /**
   * Data validation.
   */
  validation?: boolean;

  /**
   * Data encryption.
   */
  encryption?: boolean;

  /**
   * Compression.
   */
  compression?: boolean;

  /**
   * Query optimization.
   */
  queryOptimization?: boolean;
}

/**
 * Cache information.
 */
export interface CacheInfo {
  /**
   * Cache hit/miss.
   */
  hit: boolean;

  /**
   * Cache key.
   */
  key?: string;

  /**
   * Cache age in milliseconds.
   */
  age?: number;

  /**
   * Cache size.
   */
  size?: number;

  /**
   * Cache strategy.
   */
  strategy?: CacheStrategy;
}

/**
 * Cache strategies.
 */
export type CacheStrategy =
  | 'none'
  | 'memory'
  | 'disk'
  | 'network'
  | 'hybrid'
  | 'custom';
