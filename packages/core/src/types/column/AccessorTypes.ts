// AccessorTypes.ts
// Accessor type utilities for type-safe data access

import type { RowData } from '../base'

/**
 * String key for accessing row data.
 * Uses template literal types for dot notation inference.
 *
 * @template TData - Row data type
 */
export type AccessorKey<TData extends RowData> =
  // Extract all string keys
  StringKeys<TData> extends infer K
    ? K extends string
      ? // Handle nested paths recursively
          | K
          | (TData[K] extends RowData ? `${K}.${AccessorKey<TData[K]>}` : never)
      : never
    : never;

/**
 * Helper type to extract string keys from an object type
 */
export type StringKeys<T> = T extends object
  ? { [K in keyof T]: K extends string ? K : never }[keyof T]
  : never;

/**
 * Function accessor with proper typing.
 *
 * @template TData - Row data type
 * @template TValue - Return type (inferred if possible)
 */
export type AccessorFn<TData extends RowData, TValue = unknown> = (
  row: TData,
  index: number
) => TValue;

/**
 * Extracts value type from accessor definition.
 * Advanced inference for both key and function accessors.
 *
 * @template TDef - ColumnDef type
 */
export type ColumnValue<TDef> =
  TDef extends ColumnDef<infer TData, infer TValue>
    ? TValue
    : TDef extends { accessorKey: infer TKey }
      ? TKey extends string
        ? AccessorValue<TData, TKey>
        : unknown
      : unknown;

/**
 * Extracts the value type from a nested object using a dot-notation key.
 *
 * @template T - The object type
 * @template K - The dot-notation key
 */
export type AccessorValue<T, K extends string> = K extends keyof T
  ? T[K]
  : K extends `${infer K1}.${infer K2}`
    ? K1 extends keyof T
      ? AccessorValue<T[K1], K2>
      : unknown
    : unknown;

// We need to import ColumnDef for ColumnValue type, but we can't import it directly due to circular dependency
// Instead, we'll define a minimal version here for type inference
interface ColumnDef<TData extends RowData, TValue> {
  accessorKey?: string;
  accessorFn?: AccessorFn<TData, TValue>;
}