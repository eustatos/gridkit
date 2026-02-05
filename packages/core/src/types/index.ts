/**
 * GridKit Core Types - Public API.
 *
 * This module re-exports all publicly available types from the core type system.
 * All exports are tree-shakeable and follow GridKit's type safety patterns.
 *
 * @example
 * ```ts
 * // Import branded types
 * import type { GridId, ColumnId, RowId } from '@gridkit/core/types';
 *
 * // Import factory functions
 * import { createGridId, createColumnId, createRowId } from '@gridkit/core';
 *
 * // Import utility types
 * import type { AccessorValue, DeepPartial } from '@gridkit/core/types';
 * ```
 *
 * @packageDocumentation
 */

// Branded types (type-only export)
export type {
  GridId,
  ColumnId,
  RowId,
  CellId,
  RowData,
  Validator,
} from './base';

// Re-export error codes for convenience
export type { ErrorCode } from './base';

// Re-export Unsubscribe from base
export type { Unsubscribe } from './base';

// Factory functions
export {
  createGridId,
  createColumnId,
  createRowId,
  createCellId,
} from './factory';

// Type utilities (zero-runtime)
export type {
  AccessorValue,
  DeepPartial,
  RequireKeys,
  StringKeys,
  Updater,
  Listener,
  Comparator,
  Predicate,
  FirstElement,
  RestElements,
  IsUndefined,
  IsNull,
  NonNullable,
  ReturnTypeOrVoid,
  MappedObject,
} from './utils';

// Table interfaces (public API) - all types consolidated in Table.ts
export type {
  Table,
  StateCallback,
  RowModel,
  Row,
  Column,
  ColumnDef,
  ColumnMeta,
  TableOptions,
  TableState,
  SortingState,
  FilteringState,
  FilterOperator,
  PaginationState,
  GroupingState,
  ScrollPosition,
  CellCoordinate,
  GridKitError,
  ColumnAccessor,
  ColumnAccessorFn,
  ColumnValue,
} from './table';