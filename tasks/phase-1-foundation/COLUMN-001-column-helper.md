# CORE-010: Table Factory Implementation

## Task Card

```
task_id: CORE-010
priority: P0
complexity: High
estimated_tokens: ~20,000
ai_ready: yes (with strict validation)
dependencies: [CORE-001, CORE-002, CORE-003, CORE-004, CORE-011]
requires_review: true (core of the library)
```

## 🎯 Objective

Implement the `createTable<TData>()` factory function - the primary entry point for creating GridKit table instances. This function orchestrates the entire table lifecycle, validates configuration, initializes state, and creates a fully functional table instance.

## 📋 Implementation Scope

### **1. Main Factory Function (Entry Point)**

````typescript
/**
 * Creates a new GridKit table instance.
 * This is the main entry point for the library.
 *
 * @template TData - Row data type (must extend RowData)
 *
 * @param options - Table configuration
 * @returns Fully initialized table instance
 *
 * @throws {GridError} When configuration is invalid
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const table = createTable<User>({
 *   columns: [
 *     { accessorKey: 'name', header: 'Name' },
 *     { accessorKey: 'email', header: 'Email' },
 *   ],
 *   data: users,
 *   getRowId: user => user.id.toString(),
 *   debug: true,
 * });
 * ```
 */
export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // Validate configuration before any side effects
  validateTableOptions(options);

  // Create table ID for debugging
  const tableId = createGridId(`table-${Date.now()}`);

  // Create internal state store
  const initialState = createInitialState(options);
  const store = createStore<TableState<TData>>(initialState);

  // Create column instances
  const columns = createColumnInstances(options, tableId);

  // Build initial row model
  const rowModel = createRowModel({
    data: options.data || [],
    columns,
    getRowId: options.getRowId || defaultGetRowId,
    tableId,
  });

  // Create the table instance
  const tableInstance = createTableInstance(
    tableId,
    options,
    store,
    columns,
    rowModel
  );

  // Set up state change subscriptions
  setupStateSubscriptions(tableInstance, store, options);

  return tableInstance;
}
````

### **2. Configuration Validation**

```typescript
/**
 * Validates table configuration with detailed error messages.
 * Fails fast to prevent invalid state.
 */
function validateTableOptions<TData extends RowData>(
  options: TableOptions<TData>
): void {
  // Basic existence check
  if (!options || typeof options !== 'object') {
    throw new GridError(
      'TABLE_INVALID_CONFIGURATION',
      'Table options must be an object',
      { options }
    );
  }

  // Column validation
  if (!Array.isArray(options.columns)) {
    throw new GridError('TABLE_INVALID_COLUMNS', 'Columns must be an array', {
      columns: options.columns,
    });
  }

  if (options.columns.length === 0) {
    throw new GridError('TABLE_NO_COLUMNS', 'At least one column is required', {
      columnCount: 0,
    });
  }

  // Data validation (if provided)
  if (options.data !== undefined) {
    if (!Array.isArray(options.data)) {
      throw new GridError('TABLE_INVALID_DATA', 'Data must be an array', {
        data: options.data,
      });
    }

    // Validate data matches column definitions
    validateDataAgainstColumns(options.data, options.columns);
  }

  // Validate getRowId function
  if (options.getRowId && typeof options.getRowId !== 'function') {
    throw new GridError(
      'TABLE_INVALID_GET_ROW_ID',
      'getRowId must be a function',
      { getRowId: options.getRowId }
    );
  }

  // Validate initial state structure
  if (options.initialState) {
    validateInitialState(options.initialState);
  }
}

/**
 * Default row ID generator (array index).
 */
function defaultGetRowId<TData extends RowData>(
  row: TData,
  index: number
): RowId {
  return index;
}

/**
 * Validates data matches column definitions.
 */
function validateDataAgainstColumns<TData extends RowData>(
  data: TData[],
  columns: ColumnDef<TData>[]
): void {
  // Only validate first 10 rows in debug mode for performance
  const sampleRows = data.slice(0, 10);

  for (const column of columns) {
    if (column.accessorKey) {
      // Check if accessorKey exists in data
      for (const row of sampleRows) {
        const value = getNestedValue(row, column.accessorKey);
        if (
          value === undefined &&
          value !== row[column.accessorKey as keyof TData]
        ) {
          console.warn(
            `Column accessorKey "${column.accessorKey}" may not exist in data`,
            { column, sampleValue: value }
          );
        }
      }
    }
  }
}
```

### **3. Initial State Creation**

```typescript
/**
 * Creates initial table state from configuration.
 */
function createInitialState<TData extends RowData>(
  options: TableOptions<TData>
): TableState<TData> {
  const data = options.data || [];

  // Build column state from definitions
  const columnState = createColumnState(options.columns);

  // Merge with user-provided initial state
  const baseState: TableState<TData> = {
    data,
    columnVisibility: columnState.visibility,
    columnOrder: columnState.order,
    columnSizing: columnState.sizing,
    rowSelection: {},
    expanded: {},
    version: 1,
    updatedAt: Date.now(),
  };

  return options.initialState
    ? deepMerge(baseState, options.initialState)
    : baseState;
}

/**
 * Creates column state from definitions.
 */
function createColumnState<TData extends RowData>(
  columns: ColumnDef<TData>[]
): {
  visibility: Record<ColumnId, boolean>;
  order: ColumnId[];
  sizing: Record<ColumnId, number>;
} {
  const visibility: Record<ColumnId, boolean> = {};
  const order: ColumnId[] = [];
  const sizing: Record<ColumnId, number> = {};

  for (const column of columns) {
    const columnId =
      column.id || column.accessorKey || `column-${order.length}`;

    visibility[columnId] = true;
    order.push(columnId);
    sizing[columnId] = column.size || 150;
  }

  return { visibility, order, sizing };
}
```

### **4. Column Instance Creation**

```typescript
/**
 * Creates runtime column instances from definitions.
 */
function createColumnInstances<TData extends RowData>(
  options: TableOptions<TData>,
  tableId: GridId
): Column<TData>[] {
  const columns: Column<TData>[] = [];

  for (const columnDef of options.columns) {
    const columnId =
      columnDef.id || columnDef.accessorKey || `col-${columns.length}`;

    // Merge with default column options
    const fullColumnDef: ColumnDef<TData> = {
      ...options.defaultColumn,
      ...columnDef,
      id: columnId as ColumnId,
    };

    // Validate column definition
    validateColumnDefinition(fullColumnDef);

    // Create column instance
    const columnInstance: Column<TData> = {
      id: columnId as ColumnId,
      columnDef: fullColumnDef,

      // State accessors
      getSize: () => 150, // Placeholder - will be implemented later
      getIsVisible: () => true,
      getIndex: () => columns.length,

      // State mutators
      toggleVisibility: () => {
        /* Placeholder */
      },
      setSize: () => {
        /* Placeholder */
      },
      resetSize: () => {
        /* Placeholder */
      },

      // Feature state
      getIsSorted: () => false,
      getSortDirection: () => false,
      toggleSorting: () => {
        /* Placeholder */
      },

      // Metadata
      meta: columnDef.meta || {},
    };

    columns.push(columnInstance);
  }

  return columns;
}
```

### **5. Row Model Creation**

```typescript
/**
 * Creates initial row model from data and columns.
 */
function createRowModel<TData extends RowData>(config: {
  data: TData[];
  columns: Column<TData>[];
  getRowId: (row: TData, index: number) => RowId;
  tableId: GridId;
}): RowModel<TData> {
  const rowsById = new Map<RowId, Row<TData>>();
  const rows: Row<TData>[] = [];
  const flatRows: Row<TData>[] = [];

  for (let i = 0; i < config.data.length; i++) {
    const rowData = config.data[i];
    const rowId = config.getRowId(rowData, i);

    // Create row instance
    const rowInstance: Row<TData> = {
      id: rowId,
      original: rowData,
      index: i,
      originalIndex: i,
      depth: 0,
      parentRow: undefined,
      subRows: [],
      hasChildren: false,
      isExpanded: false,

      // Data access
      getAllCells: () => [], // Placeholder
      getVisibleCells: () => [], // Placeholder
      getCell: () => undefined, // Placeholder
      getValue: () => undefined as any, // Placeholder
      getOriginalValue: () => undefined,

      // State management
      getIsSelected: () => false,
      toggleSelected: () => {
        /* Placeholder */
      },
      getIsExpanded: () => false,
      toggleExpanded: () => {
        /* Placeholder */
      },

      // Tree utilities
      getParentRows: () => [],
      getLeafRows: () => [],
      getPath: () => [rowId],
      isAncestorOf: () => false,
      isDescendantOf: () => false,

      // Metadata
      meta: {},
      isVisible: true,
    };

    rows.push(rowInstance);
    flatRows.push(rowInstance);
    rowsById.set(rowId, rowInstance);
  }

  return {
    rows,
    flatRows,
    allRows: rows,
    rowsById,

    // Lookup methods
    getRow: (id) => rowsById.get(id),
    getRowByOriginalIndex: (index) => rows[index],

    // Statistics
    totalRowCount: rows.length,
    totalFlatRowCount: flatRows.length,
    selectedRowCount: 0,
    expandedRowCount: 0,

    // Bulk operations
    getSelectedRows: () => [],
    getExpandedRows: () => [],
    filterRows: () => [],
    findRow: () => undefined,

    // Metadata
    meta: {
      processingTime: 0,
      memoryUsage: 0,
      cacheStats: { hits: 0, misses: 0 },
    },
  };
}
```

### **6. Table Instance Creation**

```typescript
/**
 * Creates the main table instance with all methods.
 */
function createTableInstance<TData extends RowData>(
  tableId: GridId,
  options: TableOptions<TData>,
  store: Store<TableState<TData>>,
  columns: Column<TData>[],
  rowModel: RowModel<TData>
): Table<TData> {
  // Track subscriptions for cleanup
  const subscriptions: Unsubscribe[] = [];

  const tableInstance: Table<TData> = {
    // Identification
    id: tableId,

    // Configuration
    options: Object.freeze({ ...options }),

    // State Management
    getState: () => {
      const state = store.getState();
      return Object.freeze({ ...state });
    },

    setState: (updater) => {
      const newState =
        typeof updater === 'function'
          ? (updater as Function)(store.getState())
          : updater;

      store.setState(newState);

      // Call user's onStateChange callback
      if (options.onStateChange) {
        try {
          options.onStateChange(store.getState());
        } catch (error) {
          console.error('Error in onStateChange callback:', error);
        }
      }
    },

    subscribe: (listener, fireImmediately) => {
      const unsubscribe = store.subscribe(listener, fireImmediately);
      subscriptions.push(unsubscribe);

      // Return wrapped unsubscribe that removes from tracking
      return () => {
        const index = subscriptions.indexOf(unsubscribe);
        if (index > -1) {
          subscriptions.splice(index, 1);
        }
        unsubscribe();
      };
    },

    // Column Access
    getAllColumns: () => [...columns],

    getVisibleColumns: () => {
      const state = store.getState();
      return columns.filter((col) => state.columnVisibility[col.id] !== false);
    },

    getColumn: (id) => {
      return columns.find((col) => col.id === id);
    },

    // Row Access
    getRowModel: () => ({ ...rowModel }),

    getRow: (id) => {
      return rowModel.getRow(id);
    },

    // Lifecycle
    reset: () => {
      const initialState = createInitialState(options);
      store.setState(initialState);
    },

    destroy: () => {
      // Unsubscribe all listeners
      subscriptions.forEach((unsub) => unsub());
      subscriptions.length = 0;

      // Destroy store
      store.destroy();

      // Clear references for GC
      columns.length = 0;
      (rowModel as any).rows.length = 0;
      (rowModel as any).flatRows.length = 0;
      rowModel.rowsById.clear();
    },

    // Performance Metrics (debug mode only)
    metrics: options.debug
      ? {
          renderCount: 0,
          avgRenderTime: 0,
          peakMemory: 0,
          updateCount: 0,
        }
      : undefined,
  };

  return tableInstance;
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No complex filtering/sorting logic (future tasks)
- ❌ No virtualization or rendering
- ❌ No plugin system integration
- ❌ No advanced state persistence
- ❌ No framework-specific adapters
- ❌ No complex error recovery beyond validation

## 📁 **File Structure**

```
packages/core/src/table/
├── create-table.ts           # Main factory
├── validation.ts            # Configuration validation
├── initialization.ts        # State and column initialization
├── instance.ts             # Table instance creation
└── index.ts               # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('createTable', () => {
  test('creates table with valid configuration', () => {
    const table = createTable({
      columns: [{ accessorKey: 'name', header: 'Name' }],
      data: [{ name: 'Test' }],
    });

    expect(table).toBeDefined();
    expect(table.getState).toBeFunction();
    expect(table.getAllColumns).toBeFunction();
  });

  test('validates configuration and throws clear errors', () => {
    // No columns
    expect(() => createTable({ columns: [] })).toThrow('TABLE_NO_COLUMNS');

    // Invalid data
    expect(() =>
      createTable({
        columns: [{ accessorKey: 'name' }],
        data: 'not an array' as any,
      })
    ).toThrow('TABLE_INVALID_DATA');
  });

  test('provides default values for optional options', () => {
    const table = createTable({
      columns: [{ accessorKey: 'id' }],
      // No data provided
    });

    expect(table.getState().data).toEqual([]);
    expect(table.getRowModel().rows).toHaveLength(0);
  });

  test('handles large datasets efficiently', () => {
    const largeData = Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
    }));

    const start = performance.now();
    const table = createTable({
      columns: [{ accessorKey: 'id' }, { accessorKey: 'name' }],
      data: largeData,
    });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100); // < 100ms for 5000 rows
    expect(table.getRowModel().totalRowCount).toBe(5000);
  });
});
```

## 💡 **Key Design Patterns**

```typescript
// 1. Factory pattern with validation-first approach
function createFactory<T>(validator: Validator<T>, creator: Creator<T>) {
  return (config: T) => {
    validator(config);
    return creator(config);
  };
}

// 2. Immutable state with defensive copying
function getImmutableState<T>(state: T): Readonly<T> {
  return Object.freeze({ ...state });
}

// 3. Memory-safe subscription tracking
class SubscriptionManager {
  private subscriptions = new Set<Unsubscribe>();

  add(unsub: Unsubscribe) {
    this.subscriptions.add(unsub);
    return () => {
      this.subscriptions.delete(unsub);
      unsub();
    };
  }

  clear() {
    this.subscriptions.forEach((unsub) => unsub());
    this.subscriptions.clear();
  }
}
```

## 📊 **Success Metrics**

- ✅ Creates table with 5000 rows in < 100ms
- ✅ Clear error messages for invalid configuration
- ✅ Memory-safe cleanup on destroy()
- ✅ Immutable state guarantees
- ✅ 100% test coverage for validation paths
- ✅ No side effects during initialization

## 🎯 **AI Implementation Instructions**

1. **Start with validation** - fail fast with clear errors
2. **Implement state initialization** - immutable with defaults
3. **Create column instances** - from definitions
4. **Build row model** - with efficient lookups
5. **Create table instance** - with all interface methods
6. **Add subscription management** - for memory safety

**Critical:** This is the core of the library. Every validation must be thorough, every error message must be helpful, and performance must be excellent from the start.

---

**Status:** Ready for implementation. This is the most important task - approach with extreme care.
