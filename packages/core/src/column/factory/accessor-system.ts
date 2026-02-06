// Type-safe accessor system for column value extraction
import type { RowData } from '@/types/base';
import type { ValidatedColumnDef } from '../validation/validate-column';
import { GridKitError } from '@/errors/grid-kit-error';

/**
 * Column accessor types.
 */
export type ColumnAccessor<TData, TValue> = 
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
export function createAccessor<TData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>
): ColumnAccessor<TData, TValue> {
  if (columnDef.accessorFn) {
    // Function accessor with memoization
    const cache = new WeakMap<TData, TValue>();

    return {
      type: 'function',
      getValue: (row: TData, index: number): TValue => {
        // Check cache
        if (cache.has(row)) {
          return cache.get(row)!;
        }

        const value = columnDef.accessorFn!(row, index);
        cache.set(row, value);
        return value;
      },
      clearCache: (row?: TData) => {
        if (row) {
          cache.delete(row);
        } else {
          cache.clear();
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
        let value: any = row;

        for (const key of path) {
          if (value == null) return undefined as TValue;
          value = value[key];
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