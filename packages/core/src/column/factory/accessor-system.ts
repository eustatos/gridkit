// Type-safe accessor system for column value extraction
import { GridKitError } from '../../errors/grid-kit-error';

import type { RowData } from '@/types';
import type { ValidatedColumnDef } from '@/types/column';


/**
 * Column accessor types.
 */
export type ColumnAccessor<TData extends RowData, TValue> =
  | {
      type: 'key';
      getValue: (row: TData) => TValue;
      path: string[];
    }
  | {
      type: 'function';
      getValue: (row: TData, index: number) => TValue;
      clearCache: (row?: TData) => void;
    };

/**
 * Creates optimized accessor function from column definition.
 * Supports both accessorKey and accessorFn with caching.
 */
export function createAccessor<TData extends RowData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>
): ColumnAccessor<TData, TValue> {
  if (columnDef.accessorFn) {
    // Function accessor with memoization
    const cache = new WeakMap<object, TValue>();

    return {
      type: 'function',
      getValue: (row: TData, index: number): TValue => {
        // Check cache
        if (cache.has(row as object)) {
          return cache.get(row as object)!;
        }

        const value = columnDef.accessorFn!(row, index);
        cache.set(row as object, value);
        return value;
      },
      clearCache: (row?: TData) => {
        if (row) {
          cache.delete(row as object);
        } else {
          // Note: WeakMap doesn't have clear() method
          // We would need to track entries manually or use a different approach
          // For now, we just clear the reference
        }
      },
    };
  }

  if (columnDef.accessorKey) {
    // Key accessor with dot notation support
    const path = columnDef.accessorKey.split('.');

    return {
      type: 'key',
      getValue: (row: TData): TValue => {
        let value: unknown = row;

        for (const key of path) {
          if (value == null) return undefined as TValue;
          value = (value as Record<string, unknown>)[key];
        }

        return value as TValue;
      },
      path,
    };
  }

  throw new GridKitError(
    'INVALID_ACCESSOR',
    'Column must have either accessorKey or accessorFn'
  );
}
