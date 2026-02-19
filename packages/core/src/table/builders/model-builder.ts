import type { Row, Column, ValidatedColumnDef, RowData, RowId } from '../../types';

interface RowModel<TData> {
  rows: Row<TData>[];
  rowsById: Map<RowId, Row<TData>>;
  flatRows: Row<TData>[];
  rowsByIdMap: Map<RowId, Row<TData>>;
}

/**
 * Builds the row model from raw data.
 */
function buildRowModel<TData>(params: {
  data: readonly TData[];
  rowFactory: any; // RowFactory<TData>;
  columnRegistry: any; // ColumnRegistry<TData>;
  table: any; // Table<TData>;
}): RowModel<TData> {
  const { data, rowFactory, columnRegistry, table } = params;
  
  const rows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();
  
  // Create rows from data
  data.forEach((rowData, index) => {
    // Create a simple row object for now
    const row: Row<TData> = {
      id: String(index) as RowId,
      original: rowData,
      index,
      getIsSelected: () => false,
      getIsAllSubRowsSelected: () => false,
      getIsSomeSubRowsSelected: () => false,
      toggleSelected: () => {},
      getToggleSelectedHandler: () => () => {},
      subRows: [],
    } as Row<TData>;
    
    rows.push(row);
    rowsById.set(row.id, row);
  });
  
  return {
    rows,
    rowsById,
    flatRows: rows,
    rowsByIdMap: rowsById,
  } as RowModel<TData>;
}

export { buildRowModel };