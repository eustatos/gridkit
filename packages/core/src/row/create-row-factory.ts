import type { ColumnRegistry } from '../column/factory/column-registry';
import type { Row, RowData, RowId } from '../types';
import type { Cell } from '../types/row/Cell';
import type { Table, ColumnId } from '../types/table';

interface RowFactory<TData extends RowData> {
  create(rowData: TData, index: number, table: Table<TData>): Row<TData>;
}

function createRowFactory<TData extends RowData>(params: {
  getRowId: (row: TData, index: number) => string;
  columnRegistry: ColumnRegistry<TData>;
}): RowFactory<TData> {
  const { getRowId } = params;

  return {
    create(rowData: TData, index: number, table: Table<TData>): Row<TData> {
      const rowId = getRowId(rowData, index) as RowId;

      // Create a proper Row implementation
      const row: Row<TData> = {
        id: rowId,
        original: rowData,
        index,
        table,
        originalIndex: index,
        depth: 0,
        parentRow: undefined,
        subRows: [],
        hasChildren: false,
        isExpanded: false,
        getAllCells: (): readonly Cell<TData>[] => [],
        getVisibleCells: (): readonly Cell<TData>[] => [],
        getCell: (columnId: ColumnId): Cell<TData> | undefined => {
          // Suppress unused parameter warning
          columnId;
          return undefined;
        },
        getValue: <TValue = unknown>(columnId: ColumnId): TValue => {
          // Suppress unused parameter warning
          columnId;
          return undefined as unknown as TValue;
        },
        getOriginalValue: (columnId: ColumnId): unknown => {
          // Suppress unused parameter warning
          columnId;
          return undefined;
        },
        getIsSelected: () => false,
        toggleSelected: () => {},
        getIsExpanded: () => false,
        toggleExpanded: () => {},
        getParentRows: (): readonly Row<TData>[] => [],
        getLeafRows: (): readonly Row<TData>[] => [],
        getPath: (): readonly RowId[] => [],
        isAncestorOf: (row: Row<TData>) => {
          // Suppress unused parameter warning
          row;
          return false;
        },
        isDescendantOf: (row: Row<TData>) => {
          // Suppress unused parameter warning
          row;
          return false;
        },
        meta: {},
        isVisible: true,
      };

      return row;
    },
  } satisfies RowFactory<TData>;
}

export { createRowFactory };
export type { RowFactory };
