import type { Row, RowData } from '../types';

interface RowFactory<TData> {
  create(rowData: TData, index: number): Row<TData>;
}

function createRowFactory<TData>(params: {
  getRowId: (row: TData, index: number) => string;
  columnRegistry: any; // ColumnRegistry<TData>;
}): RowFactory<TData> {
  const { getRowId, columnRegistry } = params;

  return {
    create(rowData: TData, index: number): Row<TData> {
      const rowId = getRowId(rowData, index);
      
      return {
        id: rowId,
        original: rowData,
        index,
        getIsSelected: () => false,
        getIsAllSubRowsSelected: () => false,
        getIsSomeSubRowsSelected: () => false,
        toggleSelected: () => {},
        getToggleSelectedHandler: () => () => {},
        subRows: [],
      } as Row<TData>;
    }
  };
}

export { createRowFactory };
export type { RowFactory };