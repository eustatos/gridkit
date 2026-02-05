/**
 * GridKit Core - Main entry point.
 * 
 * This module re-exports all publicly available functionality from the core package.
 * 
 * @example
 * ```ts
 * // Import factory functions
 * import { createGridId, createColumnId, createRowId } from '@gridkit/core';
 * 
 * // Import types
 * import type { GridId, ColumnId, RowId } from '@gridkit/core';
 * 
 * // Import error class
 * import { GridKitError } from '@gridkit/core';
 * 
 * // Import type utilities
 * import type { AccessorValue, DeepPartial } from '@gridkit/core/types';
 * ```
 * 
 * @packageDocumentation
 */

// Core types re-exports
export type {
  GridId,
  ColumnId,
  RowId,
  CellId,
  RowData,
  Validator,
  ErrorCode,
} from './types';

// Factory functions
export {
  createGridId,
  createColumnId,
  createRowId,
  createCellId,
} from './types';

// Error classes
export { GridKitError } from './errors';

// Re-export type utilities (tree-shakeable via /types subpath)
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
} from './types';