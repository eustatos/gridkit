// Test utilities for creating GridKit tables
// Uses mock tables with proper structure for DevToolsBackend

/**
 * Create a mock table with all required methods for DevToolsBackend
 */
export function createMockTable<TData = any>(overrides: any = {}): any {
  // Extract tableId from overrides before processing
  const { id: overridesId, options: overridesOptions, ...restOverrides } = overrides
  const tableId = overridesOptions?.tableId || overridesId || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const baseTable = {
    // Core table methods
    getState: restOverrides.getState || (() => ({})),
    setState: restOverrides.setState || (() => {}),
    getRowModel: restOverrides.getRowModel || (() => ({ rows: [] })),
    getAllColumns: restOverrides.getAllColumns || (() => []),
    getVisibleColumns: restOverrides.getVisibleColumns || (() => []),
    getHeaderGroups: restOverrides.getHeaderGroups || (() => []),
    
    // TanStack Table methods
    setSorting: restOverrides.setSorting || (() => {}),
    setFiltering: restOverrides.setFiltering || (() => {}),
    setPagination: restOverrides.setPagination || (() => {}),
    setGrouping: restOverrides.setGrouping || (() => {}),
    setColumnVisibility: restOverrides.setColumnVisibility || (() => {}),
    setColumnPinning: restOverrides.setColumnPinning || (() => {}),
    toggleSort: restOverrides.toggleSort || (() => {}),
    toggleRowSelection: restOverrides.toggleRowSelection || (() => {}),
    toggleAllRowsSelection: restOverrides.toggleAllRowsSelection || (() => {}),
    toggleExpansion: restOverrides.toggleExpansion || (() => {}),
    setFilter: restOverrides.setFilter || (() => {}),
    getCoreRowModel: restOverrides.getCoreRowModel || (() => ({ rows: [] })),
    
    // GridKit table methods
    subscribe: restOverrides.subscribe || (() => () => {}), // unsubscribe function
    on: restOverrides.on || (() => () => {}), // unsubscribe function
    debug: {
      getEventHistory: restOverrides.debug?.getEventHistory || (() => []),
      getPerformanceMetrics: restOverrides.debug?.getPerformanceMetrics || (() => ({})),
      getMemoryUsage: restOverrides.debug?.getMemoryUsage || (() => ({})),
      getPlugins: restOverrides.debug?.getPlugins || (() => []),
      getSnapshots: restOverrides.debug?.getSnapshots || (() => []),
      timeTravel: restOverrides.debug?.timeTravel || (() => ({})),
    },
  }
  
  // Return with id and options always set correctly
  return {
    id: tableId,
    options: { 
      tableId: tableId,  // THIS IS CRITICAL - backend uses this
      ...(overridesOptions || {})
    },
    ...baseTable,
    ...restOverrides,
  }
}

/**
 * Create a test table with default data and columns
 */
export function createTestTable<TData = any>(data: TData[] = [], columns: any[] = []) {
  const table = createMockTable<TData>({
    options: { data, columns },
    getRowModel: () => ({
      rows: (data || []).map((item: any, index: number) => ({
        id: item.id || `row-${index}`,
        original: item,
      })),
    }),
    getAllColumns: () => (columns || []).map((col: any) => ({
      id: col.accessor || col.id || 'unknown',
      accessorKey: col.accessor,
      header: col.header,
      size: col.size,
    })),
  })
  
  return table
}

/**
 * Create a sample table with realistic data
 */
export function createSampleTable() {
  const data = [
    { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' },
    { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' },
    { id: '3', name: 'Charlie', age: 35, email: 'charlie@example.com' },
  ]
  
  const columns = [
    { accessor: 'id', header: 'ID', size: 80 },
    { accessor: 'name', header: 'Name', size: 150 },
    { accessor: 'age', header: 'Age', size: 80 },
    { accessor: 'email', header: 'Email', size: 200 },
  ]
  
  return createTestTable(data, columns)
}

/**
 * Create a table with custom options
 */
export function createCustomTable<TData = any>(options: any) {
  return createMockTable<TData>(options)
}
