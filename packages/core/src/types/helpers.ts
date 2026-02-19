/**
 * Helper types for RowData constraints and type safety.
 *
 * These helper types provide type-safe generic constraints
 * and utility functions for working with GridKit's type system.
 *
 * @module CoreHelpers
 */

import { CellId, RowData } from './base';
import { ColumnId } from './column/SupportingTypes';

/**
 * Helper type to constrain generic types to RowData.
 * Use this instead of direct RowData constraints.
 */
export type RowDataConstraint<T> = T extends RowData ? T : never;

/**
 * Type guard to ensure T extends RowData.
 */
export type EnsureRowData<T> = T extends RowData ? T : never;

/**
 * Type guard function to check if a value extends RowData.
 */
export function isRowData(value: unknown): value is RowData {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard function to check if a value is a valid RowId.
 */
export function isRowId(value: unknown): value is RowId {
  return typeof value === 'string' || typeof value === 'number';
}

/**
 * Type guard function to check if a value is a valid ColumnId.
 */
export function isColumnId(value: unknown): value is ColumnId {
  return typeof value === 'string';
}

/**
 * Type guard function to check if a value is a valid CellId.
 */
export function isCellId(value: unknown): value is CellId {
  return typeof value === 'string';
}

/**
 * Type guard function to check if a value is a valid GridId.
 */
export function isGridId(value: unknown): value is GridId {
  return typeof value === 'string';
}
