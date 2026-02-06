/**
 * Builds the row model from raw data.
 */
function buildRowModel<TData>(params: {
  data: readonly TData[];
  rowFactory: RowFactory<TData>;
  columnRegistry: ColumnRegistry<TData>;
  table: Table<TData>;
}): RowModel<TData> {
  const { data, rowFactory, columnRegistry, table } = params;
  
  const rows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();
  
  // Create rows from data
  data.forEach((rowData, index) => {
    const row = rowFactory.create(rowData, index);
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

/**
 * Builds column models from column definitions.
 */
function buildColumnModel<TData>(params: {
  columns: ValidatedColumnDef<TData>[];
  registry: ColumnRegistry<TData>;
  table: Table<TData>;
}): ColumnModel<TData> {
  const { columns, registry, table } = params;
  
  // Create column instances from definitions
  const columnInstances: Column<TData>[] = columns.map((columnDef, index) => {
    const columnId = columnDef.id ?? columnDef.accessorKey ?? `column-${index}`;
    return registry.createColumn(columnId, columnDef, table);
  });
  
  return {
    allColumns: columnInstances,
    visibleColumns: columnInstances.filter(col => 
      table.getState().columnVisibility[col.id] !== false
    ),
    columnsById: new Map(columnInstances.map(col => [col.id, col])),
  };
}

/**
 * Lazy row model that computes rows only when needed.
 */
class LazyRowModel<TData> {
  private cached?: RowModel<TData>;
  private dependencyHash = '';
  
  getModel(
    data: readonly TData[], 
    rowFactory: RowFactory<TData>,
    columnRegistry: ColumnRegistry<TData>,
    table: Table<TData>
  ): RowModel<TData> {
    const hash = this.computeDependencyHash(data, columnRegistry);
    
    if (!this.cached || this.dependencyHash !== hash) {
      this.cached = buildRowModel({ data, rowFactory, columnRegistry, table });
      this.dependencyHash = hash;
    }
    
    return this.cached;
  }
  
  private computeDependencyHash(
    data: readonly TData[],
    columnRegistry: ColumnRegistry<TData>
  ): string {
    // In a real implementation, this would create a hash based on:
    // - Data length and identity
    // - Column definitions
    // - Any other dependencies that affect row model computation
    return `${data.length}-${columnRegistry.getAll().length}`;
  }
}