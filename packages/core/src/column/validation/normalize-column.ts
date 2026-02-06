// Column definition normalization
import type { RowData } from '@/types/base';
import type { ColumnDef } from '@/types/column/ColumnDef';
import type { ValidatedColumnDef } from './validate-column';

/**
 * Normalizes column definition with default values.
 */
export function normalizeColumnDef<TData extends RowData, TValue>(
  columnDef: ColumnDef<TData, TValue>
): ValidatedColumnDef<TData, TValue> {
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