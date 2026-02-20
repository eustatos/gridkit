import type { ColumnRegistry } from '../column/factory/column-registry';
import type { Row, RowData, RowId } from '../types';
import type { Cell } from '../types/row/Cell';
import type { Table, ColumnId } from '../types/table';
import { createRow } from './factory/create-row';

interface RowFactory<TData extends RowData> {
  create(rowData: TData, index: number, table: Table<TData>): Row<TData>;
}

function createRowFactory<TData extends RowData>(params: {
  getRowId: (row: TData, index: number) => string;
  columnRegistry: ColumnRegistry<TData>;
}): RowFactory<TData> {
  const { getRowId, columnRegistry } = params;

  return {
    create(rowData: TData, index: number, table: Table<TData>): Row<TData> {
      // Get columns from registry for this row's data
      const columns = columnRegistry.getAll();

      // Create a proper Row implementation using createRow which handles cells
      const row = createRow({
        originalData: rowData,
        originalIndex: index,
        columns,
        getRowId: getRowId as (row: TData, index: number) => RowId,
        table,
      });

      return row;
    },
  } satisfies RowFactory<TData>;
}

export { createRowFactory };
export type { RowFactory };
