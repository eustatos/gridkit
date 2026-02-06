// Index methods for columns
import type { ValidatedColumnDef } from '../validation/validate-column';
import type { Table } from '@/types/table/Table';

/**
 * Builds index-related methods for column instance.
 */
export function buildIndexMethods<TData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
) {
  const tableState = () => table.getState();

  return {
    // Index
    getIndex: () => {
      const order = tableState().columnOrder;
      return order.indexOf(columnDef.id!);
    },
  };
}