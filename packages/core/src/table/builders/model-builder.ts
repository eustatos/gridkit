import type { ColumnRegistry } from '../../column/factory/column-registry';
import type { RowFactory } from '../../row/create-row-factory';
import type { Row, RowData, RowId, RowModel, Table } from '../../types';

// Define the RowPredicate type locally since it's not exported
type RowPredicate<TData extends RowData> = (
  row: Row<TData>,
  index: number,
  array: readonly Row<TData>[]
) => boolean;

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
    const baseRow: Row<TData> = rowFactory.create(rowData, index);

    // Add missing properties that are required by the Row interface
    const completeRow: Row<TData> = {
      // Properties from the base row
      id: baseRow.id,
      original: baseRow.original,
      index: baseRow.index,
      subRows: baseRow.subRows,

      // Additional properties required by the Row interface
      table: table,
      originalIndex: index,
      depth: 0,
      parentRow: undefined,
      hasChildren: false,
      isExpanded: false,
      getAllCells: () => [],
      getVisibleCells: () => [],
      getCell: (columnId: string) => {
        // Suppress unused parameter warning
        columnId;
        return undefined;
      },
      getValue: <TValue = unknown>(columnId: string) => {
        // Suppress unused parameter warning
        columnId;
        return undefined as unknown as TValue;
      },
      getOriginalValue: (columnId: string) => {
        // Suppress unused parameter warning
        columnId;
        return undefined;
      },
      getIsSelected: () => false,
      toggleSelected: () => {},
      getIsExpanded: () => false,
      toggleExpanded: () => {},
      getParentRows: () => [],
      getLeafRows: () => [],
      getPath: () => [],
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

    rows.push(completeRow);
    rowsById.set(completeRow.id, completeRow);
  });

  // Create a proper RowModel implementation
  const rowModel: RowModel<TData> = {
    rows,
    flatRows: rows,
    allRows: rows,
    rowsById: rowsById as ReadonlyMap<RowId, Row<TData>>,
    getRow: (id: RowId) => rowsById.get(id),
    getRowByOriginalIndex: (index: number) => {
      const found = rows.find((row) => row.originalIndex === index);
      return found || undefined;
    },
    totalRowCount: rows.length,
    totalFlatRowCount: rows.length,
    selectedRowCount: 0,
    expandedRowCount: 0,
    getSelectedRows: () => [],
    getExpandedRows: () => [],
    filterRows: (predicate: RowPredicate<TData>) => {
      // Suppress unused parameter warning
      predicate;
      return [];
    },
    findRow: (predicate: RowPredicate<TData>) => {
      // Suppress unused parameter warning
      predicate;
      return undefined;
    },
    meta: {},
  };

  return rowModel;
}

export { buildRowModel };
