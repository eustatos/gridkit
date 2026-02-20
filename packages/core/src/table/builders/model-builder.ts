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
    // Alias for backwards compatibility
    totalRowCount: rows.length,
    getRow: (id: RowId): Row<TData> | undefined => rowsById.get(id),

    // Extended properties
    flatRows: rows,
    allRows: rows,
    rowsByOriginalIndex: new Map(rows.map((row, index) => [row.originalIndex, row])),
    totalFlatRowCount: rows.length,
    meta: {
      processingTime: 0, // Not tracking in this builder
      memoryUsage: rows.length * 100, // Estimate
      hasHierarchicalData: false,
      rowCount: {
        total: rows.length,
        flat: rows.length,
      },
    },

    // Row access methods
    getRowByOriginalIndex: (index) => {
      return rowModel.rowsByOriginalIndex?.get(index);
    },

    // Filter and search methods
    filterRows: (predicate) => {
      return rows.filter(predicate);
    },
    findRow: (predicate) => {
      return rows.find(predicate);
    },

    // State-aware methods
    getSelectedRows: () => {
      const state = table.getState();
      const selectedRows: Row<TData>[] = [];
      
      for (const [rowId, isSelected] of Object.entries(state.rowSelection || {})) {
        if (isSelected) {
          const row = rowsById.get(rowId as RowId);
          if (row) {
            selectedRows.push(row);
          }
        }
      }
      
      return selectedRows;
    },
    getExpandedRows: () => {
      const state = table.getState();
      const expandedRows: Row<TData>[] = [];
      
      for (const [rowId, isExpanded] of Object.entries(state.expanded || {})) {
        if (isExpanded) {
          const row = rowsById.get(rowId as RowId);
          if (row) {
            expandedRows.push(row);
          }
        }
      }
      
      return expandedRows;
    },

    // Reactive count properties
    get selectedRowCount() {
      const state = table.getState();
      return Object.keys(state.rowSelection || {}).filter(k => state.rowSelection?.[k]).length;
    },
    get expandedRowCount() {
      const state = table.getState();
      return Object.keys(state.expanded || {}).filter(k => state.expanded?.[k]).length;
    },
  };

  return rowModel;
}

export { buildRowModel };
