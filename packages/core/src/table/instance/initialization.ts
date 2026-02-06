/**
 * Completes table initialization after instance creation.
 * Separated for better error isolation.
 */
function initializeTableInstance<TData>(
  table: Table<TData>,
  options: ValidatedTableOptions<TData>
): void {
  // 1. Initial data processing
  const initialData = options.data;
  if (initialData.length > 0) {
    table.setState((state) => ({
      ...state,
      data: initialData,
    }));
  }

  // 2. Apply initial state
  if (options.initialState) {
    table.setState((state) => ({
      ...state,
      ...options.initialState,
    }));
  }

  // 3. Setup event system
  const eventBus = (table as any)._internal.eventBus;

  // Internal state change events
  table.subscribe((state) => {
    eventBus.emit('state:change', {
      tableId: table.id,
      state,
      timestamp: Date.now(),
    });
  });

  // Debug event logging
  if (options.debug?.events) {
    eventBus.on('*', (event) => {
      console.debug(`[GridKit Event] ${event.type}`, event);
    });
  }

  // 4. Performance monitoring setup
  if (table.metrics) {
    table.metrics.track('table', {
      columnCount: table.getAllColumns().length,
      initialRowCount: options.data.length,
      options,
    });
  }

  // 5. Emit initialization complete
  eventBus.emit('table:ready', {
    tableId: table.id,
    timestamp: Date.now(),
    columnCount: table.getAllColumns().length,
    rowCount: table.getRowModel().rows.length,
  });
}