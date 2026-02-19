import type { ColumnRegistry } from '../../column/factory/column-registry';
import type { RowFactory } from '../../row/create-row-factory';
import type { Row, RowData, RowId, RowModel, Table } from '../../types';

/**
 * Builds the row model from raw data.
 */
function buildRowModel<TData extends RowData>(params: {
  data: readonly TData[];
  rowFactory: RowFactory<TData>;
  columnRegistry: ColumnRegistry<TData>;
  table: Table<TData>;
}): RowModel<TData> {
  const { data, rowFactory, table } = params;

  const rows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();

  // Create rows from data
  data.forEach((rowData, index) => {
    // Create a row using the row factory
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const baseRow: Row<TData> = rowFactory.create(rowData, index, table);

    // Type guard to ensure baseRow has the expected structure
    if (!baseRow || typeof baseRow.id === 'undefined') {
      throw new Error('Row factory returned invalid row');
    }

    rows.push(baseRow);
    rowsById.set(baseRow.id, baseRow);
  });

  // Create a proper RowModel implementation based on the actual type definition
  const rowModel: RowModel<TData> = {
    rows,
    rowsById,
    totalCount: rows.length,
    getRow: (id: RowId): Row<TData> | undefined => rowsById.get(id),
  };

  return rowModel;
}

export { buildRowModel };
