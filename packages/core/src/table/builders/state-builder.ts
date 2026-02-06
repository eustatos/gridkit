/**
 * Builds the initial table state from options.
 */
function buildInitialState<TData>(
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
    columnOrder: options.columns.map((col, index) => 
      col.id ?? col.accessorKey ?? `column-${index}`
    ),

    // Column sizing
    columnSizing: {},

    // Column sizing info
    columnSizingInfo: {
      isResizingColumn: false,
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      columnSizingStart: [],
      headerId: null,
    },

    // Pagination
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },

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
  };
}

/**
 * Builds initial column visibility state.
 */
function buildInitialColumnVisibility<TData>(
  columns: ValidatedColumnDef<TData>[]
): Record<string, boolean> {
  const visibility: Record<string, boolean> = {};

  columns.forEach((column, index) => {
    const columnId = column.id ?? column.accessorKey ?? `column-${index}`;
    visibility[columnId] = column.enableHiding !== false;
  });

  return visibility;
}