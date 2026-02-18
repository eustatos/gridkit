/**
 * GridKit Data Types - Public API.
 *
 * This module re-exports all publicly available types from the data provider system.
 * All exports are tree-shakeable and follow GridKit's type safety patterns.
 *
 * @example
 * ```ts
 * // Import provider types
 * import type { DataProvider, DataResult, LoadParams } from '@gridkit/data/types';
 * ```
 *
 * @packageDocumentation
 */

// Re-export core types from @gridkit/core
export type { Unsubscribe, Comparator, Predicate } from '@gridkit/core/types';
export type { RowData } from '@gridkit/core/types';
export type { ColumnId, RowId } from '@gridkit/core/types';

// Provider interface
export type {
  DataProvider,
  ProviderType,
} from './provider';

// Load parameters
export type {
  LoadParams,
  PaginationParams,
  SortingParams,
  FilteringParams,
  FilterOperator,
} from './params';

// Data result types
export type {
  DataResult,
  PageInfo,
  ServerInfo,
  DataMeta,
  DataSchema,
} from './result';

// Event types
export type {
  DataListener,
  DataEvent,
  DataEventType,
  DataEventMeta,
} from './events';

// Error types
export type {
  DataErrorInfo,
  DataErrorCode,
} from './errors';

// Metadata types
export type {
  ProviderMeta,
  ProviderCapabilities,
  ProviderFeatures,
  CacheInfo,
  CacheStrategy,
} from './metadata';
