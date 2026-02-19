// Index methods for columns
import type { ValidatedColumnDef } from '@/types/column';

import type { RowData } from '@/types';
import type { Table } from '@/types/table';

/**
 * Builds index-related methods for column instance.
 */
export function buildIndexMethods<TData extends RowData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
) {
  const tableState = () => table.getState();

  return {
    // Index
    getIndex: () => {
      const order = tableState().columnOrder;
      return order.indexOf(columnDef.id as string);
    },
  };
}
