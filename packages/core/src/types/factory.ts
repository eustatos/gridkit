/**
 * Factory functions for creating validated GridKit IDs.
 *
 * These functions provide type-safe ID generation with optional
 * validation and auto-generation capabilities.
 *
 * @example
 * ```ts
 * // Auto-generate Grid ID
 * const gridId = createGridId();
 * // "abc123-def456..."
 *
 * // Create with custom ID
 * const gridId = createGridId('my-grid-1');
 *
 * // Create column ID with validation
 * const colId = createColumnId('user.profile.name');
 * // "user.profile.name"
 *
 * // Create row ID from number
 * const rowId = createRowId(42);
 * // "42"
 * ```
 *
 * @module CoreFactory
 */

import { GridKitError } from '../errors/index';

import type { GridId, RowId, CellId } from './base';
import type { ColumnId } from './column/SupportingTypes';


/**
 * Creates a validated GridId with optional prefix.
 * Auto-generates UUID v4 if no value provided.
 *
 * @param id - Optional custom ID. If not provided, generates UUID v4.
 * @returns A validated GridId
 *
 * @throws {GridKitError} If provided ID is empty or invalid
 *
 * @example
 * ```ts
 * // Auto-generate
 * const gridId = createGridId();
 * // "c77e5a9e-8f3e-4c85-9d8b-2e3f1a4b5c6d"
 *
 * // Custom ID
 * const gridId = createGridId('grid-1');
 * ```
 */
export function createGridId(id?: string): GridId {
  const value = id ?? generateUUID();
  validateIdFormat(value, 'Grid');
  return value as GridId;
}

/**
 * Creates a ColumnId with dot-notation support validation.
 * Ensures valid JavaScript property access patterns.
 *
 * @param path - Column path (e.g., 'user.profile.name', 'name')
 * @returns A validated ColumnId
 *
 * @throws {GridKitError} If path contains invalid characters or patterns
 *
 * @example
 * ```ts
 * // Simple column
 * const colId = createColumnId('name');
 * // "name"
 *
 * // Nested path
 * const colId = createColumnId('user.profile.name');
 * // "user.profile.name"
 *
 * // Invalid (throws)
 * try {
 *   createColumnId('invalid..path');
 * } catch (e) {
 *   // GridKitError: INVALID_COLUMN_PATH
 * }
 * ```
 */
export function createColumnId(path: string): ColumnId {
  if (!isValidColumnPath(path)) {
    throw new GridKitError(
      'INVALID_COLUMN_PATH',
      `Invalid column path: ${path}`,
      { path }
    );
  }
  return path as ColumnId;
}

/**
 * Creates a RowId with automatic type conversion.
 * Numbers are converted to strings for consistency.
 *
 * @param id - Row ID (string or number)
 * @returns A validated RowId
 *
 * @throws {GridKitError} If ID is empty after conversion
 *
 * @example
 * ```ts
 * // String ID
 * const rowId = createRowId('row-1');
 *
 * // Number ID (auto-converted to string)
 * const rowId = createRowId(42);
 * // "42"
 * ```
 */
export function createRowId(id: string | number): RowId {
  const value = typeof id === 'number' ? String(id) : id;
  validateIdFormat(value, 'Row');
  return value as RowId;
}

/**
 * Creates a CellId from row and column IDs.
 * Uses deterministic composition for consistency.
 *
 * @param rowId - Row ID
 * @param columnId - Column ID
 * @returns A CellId in format `${rowId}_${columnId}`
 *
 * @example
 * ```ts
 * const rowId = createRowId('row-1');
 * const colId = createColumnId('name');
 * const cellId = createCellId(rowId, colId);
 * // "row-1_name"
 * ```
 */
export function createCellId(rowId: RowId, columnId: ColumnId): CellId {
  return `${rowId}_${columnId}` as CellId;
}

// ===================================================================
// Internal Validation Helpers
// ===================================================================

/**
 * Validates that an ID is non-empty and properly formatted.
 *
 * @param id - The ID to validate
 * @param type - The type of ID (for error messages)
 * @throws {GridKitError} If ID is empty or invalid
 */
function validateIdFormat(id: string, type: string): void {
  if (!id || !id.trim()) {
    throw new GridKitError('ID_INVALID_FORMAT', `${type} ID cannot be empty`, {
      id,
      type,
    });
  }
}

/**
 * Validates a column path follows dot-notation conventions.
 *
 * @param path - The path to validate
 * @returns `true` if path is valid, `false` otherwise
 *
 * @internal
 */
export function isValidColumnPath(path: string): boolean {
  // Empty or whitespace paths are invalid
  if (!path || !path.trim()) {
    return false;
  }

  // Must match pattern: identifier(.identifier)*
  // - Starts with letter or underscore
  // - Followed by alphanumeric or underscore
  // - Separated by single dots
  const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
  return pattern.test(path);
}

/**
 * Generates a UUID v4 string.
 *
 * @returns A UUID v4 string
 *
 * @internal
 */
export function generateUUID(): string {
  // Use crypto.randomUUID() if available, fallback to Math.random
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
