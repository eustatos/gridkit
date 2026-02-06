import type { Row, Column, ValidatedColumnDef, RowData } from '../../types';

interface RowModel<TData> {
  rows: Row<TData>[];
  rowsById: Map<string, Row<TData>>;
  flatRows: Row<TData>[];
  rowsByIdMap: Map<string, Row<TData>>;
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
  const rowsById = new Map<string, Row<TData>>();
  
  // Create rows from data
  data.forEach((rowData, index) => {
    // Create a simple row object for now
    const row: Row<TData> = {
      id: index.toString(),
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
  };
}

export { buildRowModel };