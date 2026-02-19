import type { ValidatedTableOptions, TableState, ValidatedColumnDef, RowData, ColumnId } from '../../types';

/**
 * Builds the initial table state from options.
 */
function buildInitialState<TData extends RowData>(
  options: ValidatedTableOptions<TData>
): TableState<TData> {
  return {
    // Data
    data: options.data,

    // Column visibility
    columnVisibility: buildInitialColumnVisibility(options.columns),

    // Row selection
    rowSelection: {},

    // Column ordering
    columnOrder: options.columns.map((col) => 
      col.id
    ),

    // Column sizing
    columnSizing: {},

    // Column pinning
    columnPinning: {
      left: [],
      right: [],
    },

    // Row pinning
    rowPinning: {
      top: [],
      bottom: [],
    },

    // Pagination
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },

    // Sorting (default empty)
    sorting: [],

    // Filtering (default empty)
    filtering: [],

    // Grouping (default empty)
    grouping: [],

    // Expanded rows (default empty)
    expanded: {},

    // Version and timestamp
    version: 1,
    updatedAt: Date.now(),
  };
}

/**
 * Builds initial column visibility state.
 */
function buildInitialColumnVisibility<TData extends RowData>(
  columns: ValidatedColumnDef<TData>[]
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {};

  columns.forEach((column, index) => {
    const columnId = column.id;
    visibility[columnId] = column.enableHiding !== false;
  });

  return visibility;
}

export { buildInitialState };