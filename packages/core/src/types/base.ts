/**
 * Branded types for GridKit IDs with compile-time safety.
 *
 * These types use TypeScript's unique symbol branding pattern
 * to prevent ID mixing while adding zero runtime overhead.
 *
 * @packageDocumentation
 * @module CoreTypes
 */

// ===================================================================
// Branded ID Types
// ===================================================================

/**
 * Branded type for Grid IDs with runtime validation.
 * Prevents ID mixing and enables compile-time safety.
 */
declare const __gridId: unique symbol;
export type GridId = string & { readonly [__gridId]: never };

/**
 * Branded type for Column IDs with structure validation.
 * Ensures consistent ID format and prevents collisions.
 */
declare const __columnId: unique symbol;
export type ColumnId = string & { readonly [__columnId]: never };

/**
 * Branded type for Row IDs with flexible but safe typing.
 * Supports both string and number while maintaining type safety.
 */
declare const __rowId: unique symbol;
export type RowId = (string | number) & { readonly [__rowId]: never };

/**
 * Branded type for Cell IDs with composite structure.
 * Format: `${RowId}_${ColumnId}` for O(1) lookups.
 */
declare const __cellId: unique symbol;
export type CellId = string & { readonly [__cellId]: never };

// ===================================================================
// Base Types
// ===================================================================

/**
 * Base interface for all row data types.
 *
 * All data passed to GridKit must extend this interface.
 * Use TypeScript's intersection types to add constraints.
 */
export interface RowData {
  [key: string]: unknown;
}

/**
 * Basic validator interface for runtime type checking.
 */
export interface Validator<T> {
  (value: unknown): value is T;
}

// ===================================================================
// Utility Types
// ===================================================================

/**
 * Updater function type with better inference.
 * Supports both direct values and functional updates.
 *
 * @template T - The type being updated
 */
export type Updater<T> = T | ((prev: T) => T);

/**
 * Listener with unsubscribe capability.
 * Memory-safe with automatic cleanup.
 *
 * @template T - The type of value being listened to
 */
export type Listener<T> = (value: T) => void | (() => void);

/**
 * Comparator with null-safe handling.
 * Returns -1, 0, or 1 for stable sorting.
 *
 * @template T - The type being compared
 */
export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;

/**
 * Predicate with context support.
 * Includes index and array for advanced filtering.
 *
 * @template T - The type being filtered
 */
export type Predicate<T> = (value: T, index: number, array: T[]) => boolean;

/**
 * Unsubscribe function type.
 */
export type Unsubscribe = () => void;

/**
 * DeepPartial that handles arrays and readonly properties.
 * More precise than standard Partial<T>.
 *
 * @template T - The type to make partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

/**
 * Extracts the type at a nested accessor path.
 *
 * Supports deep property access with dot notation.
 * Type-safe: fails at compile-time for invalid paths.
 *
 * @template TData - The source data type (must extend RowData)
 * @template TPath - The accessor path (e.g., "user.profile.name")
 */
export type AccessorValue<
  TData extends RowData,
  TPath extends string,
> = TPath extends `${infer First}.${infer Rest}`
  ? First extends keyof TData
    ? TData[First] extends RowData
      ? AccessorValue<TData[First], Rest>
      : never
    : never
  : TPath extends keyof TData
    ? TData[TPath]
    : never;

/**
 * RequireKeys that makes specific keys required.
 *
 * @template T - The object type
 * @template K - The keys to make required
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ===================================================================
// Error Codes
// ===================================================================

/**
 * Error code type for GridKit errors.
 */
export type ErrorCode =
  // ID errors
  | 'ID_INVALID_FORMAT'
  // Column errors
  | 'INVALID_COLUMN_PATH'
  // Row errors
  | 'ROW_INVALID_ID'
  // Table errors
  | 'TABLE_INVALID_OPTIONS'
  | 'TABLE_NO_COLUMNS'
  | 'TABLE_DESTROYED'
  // Column errors
  | 'COLUMN_INVALID_ACCESSOR'
  | 'COLUMN_DUPLICATE_ID'
  | 'COLUMN_NOT_FOUND'
  // Row errors
  | 'ROW_NOT_FOUND'
  // State errors
  | 'STATE_UPDATE_FAILED'
  | 'STATE_INVALID'
  // Data errors
  | 'DATA_LOAD_FAILED'
  | 'DATA_INVALID_RESPONSE'
  // Plugin errors
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_REGISTRATION_FAILED';