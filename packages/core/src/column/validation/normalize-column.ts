// Column definition normalization
import type { EnsureRowData } from '@/types/helpers';
import type { ColumnDef } from '@/types/column/ColumnDef';
import type { ValidatedColumnDef } from './validate-column';

/**
 * Normalizes column definition with default values.
 */
export function normalizeColumnDef<TData, TValue>(
  columnDef: ColumnDef<EnsureRowData<TData>, TValue>
): ValidatedColumnDef<EnsureRowData<TData>, TValue> {
  return {
    ...columnDef,
    id: columnDef.id!,
    size: columnDef.size ?? 150,
    minSize: columnDef.minSize ?? 50,
    maxSize: columnDef.maxSize ?? Infinity,
    enableSorting: columnDef.enableSorting ?? true,
    enableFiltering: columnDef.enableFiltering ?? true,
    enableResizing: columnDef.enableResizing ?? true,
    enableHiding: columnDef.enableHiding ?? true,
    enableReordering: columnDef.enableReordering ?? true,
    enablePinning: columnDef.enablePinning ?? false,
    meta: columnDef.meta ?? {},
  };
}
