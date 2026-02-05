# CORE-010: Table Factory Implementation

## Task Card

```
task_id: CORE-010
priority: P0
complexity: High
estimated_tokens: ~25,000
ai_ready: yes (with architecture review)
dependencies: [CORE-001, CORE-002, CORE-003, CORE-004, CORE-011]
requires_validation: true (core API implementation)
```

## 🎯 **Core Objective**

Implement the primary `createTable` factory function that serves as the single entry point for creating GridKit table instances. This is the foundation upon which all features are built.

## 📋 **Implementation Scope**

### **1. Smart Factory Function with Advanced Validation**

````typescript
/**
 * Creates a production-ready table instance with comprehensive validation,
 * performance monitoring, and lifecycle management.
 *
 * @template TData - Row data type (extends RowData)
 * @param options - Type-safe table configuration
 * @returns Fully initialized, memory-safe table instance
 *
 * @example
 * ```typescript
 * const table = createTable({
 *   columns: [{ accessorKey: 'name', header: 'Name' }],
 *   data: users,
 *   getRowId: (row) => row.id,
 *   debug: { performance: true }
 * });
 * ```
 */
export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // 1. Performance tracking (debug mode)
  const perfStart = performance.now();
  const memoryBefore = measureMemory();

  try {
    // 2. Phase 1: Validation & Normalization
    const validated = validateAndNormalize(options);

    // 3. Phase 2: Core Instance Creation
    const instance = createTableInstance(validated);

    // 4. Phase 3: Setup & Initialization
    initializeTableInstance(instance, validated);

    // 5. Performance logging
    if (validated.debug?.performance) {
      logCreationMetrics(perfStart, memoryBefore);
    }

    return instance;
  } catch (error) {
    // 6. Error handling with context
    throw wrapCreationError(error, options);
  }
}
````

### **2. Advanced Validation System**

```typescript
/**
 * Comprehensive validation with helpful error messages.
 * Each validation is isolated for better error reporting.
 */
function validateAndNormalize<TData extends RowData>(
  options: TableOptions<TData>
): ValidatedTableOptions<TData> {
  const errors: ValidationError[] = [];

  // === Required Fields Validation ===
  if (!options || typeof options !== 'object') {
    throw new GridKitError(
      'INVALID_OPTIONS',
      'Table options must be an object'
    );
  }

  // Column validation (most critical)
  const columnErrors = validateColumns(options.columns);
  errors.push(...columnErrors);

  // Data validation
  if (options.data !== undefined) {
    const dataErrors = validateData(options.data);
    errors.push(...dataErrors);
  }

  // ID function validation
  if (options.getRowId) {
    const idErrors = validateRowIdFunction(options.getRowId);
    errors.push(...idErrors);
  }

  // Throw aggregated errors if any
  if (errors.length > 0) {
    throw new ValidationAggregateError('Invalid table configuration', errors);
  }

  // === Normalization ===
  return {
    ...options,
    columns: normalizeColumns(options.columns, options.defaultColumn),
    data: options.data ?? [],
    getRowId: options.getRowId ?? defaultGetRowId,
    debug: normalizeDebugOptions(options.debug),
    meta: options.meta ?? {},
    initialState: normalizeInitialState(options.initialState),
  };
}

/**
 * Column validation with detailed error messages.
 */
function validateColumns<TData>(columns: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(columns)) {
    errors.push({
      code: 'COLUMNS_NOT_ARRAY',
      message: 'columns must be an array',
      field: 'columns',
      value: columns,
    });
    return errors;
  }

  if (columns.length === 0) {
    errors.push({
      code: 'NO_COLUMNS',
      message: 'At least one column definition is required',
      field: 'columns',
      value: columns,
    });
  }

  // Validate each column
  columns.forEach((col, index) => {
    if (!col || typeof col !== 'object') {
      errors.push({
        code: 'INVALID_COLUMN_DEF',
        message: `Column at index ${index} must be an object`,
        field: `columns[${index}]`,
        value: col,
      });
      return;
    }

    // Check for required fields
    if (!col.accessorKey && !col.accessorFn) {
      errors.push({
        code: 'NO_ACCESSOR',
        message: `Column at index ${index} must have either accessorKey or accessorFn`,
        field: `columns[${index}].accessor`,
        value: col,
      });
    }

    // Check for duplicate IDs
    const columnId = col.id ?? col.accessorKey;
    // ... duplicate detection logic
  });

  return errors;
}
```

### **3. Core Instance Creation (Memory-Safe)**

```typescript
/**
 * Creates the table instance with proper memory management.
 * Uses weak references and cleanup systems.
 */
function createTableInstance<TData>(
  options: ValidatedTableOptions<TData>
): Table<TData> {
  // === State Management ===
  const initialState = buildInitialState(options);
  const stateStore = createStateStore(initialState);

  // === Column System ===
  const columnRegistry = createColumnRegistry();
  const columns = createColumns(options.columns, {
    table: null as any, // Will be set later
    registry: columnRegistry,
    defaultOptions: options.defaultColumn,
  });

  // === Row System ===
  const rowFactory = createRowFactory({
    getRowId: options.getRowId,
    columnRegistry,
  });

  // === Event System ===
  const eventBus = createEventBus({
    debug: options.debug?.events,
  });

  // === Performance Monitoring ===
  const metrics = options.debug?.performance
    ? createPerformanceMonitor()
    : undefined;

  // === Build the Instance ===
  const instance: Table<TData> = {
    // Identification
    id: createGridId(`table-${Date.now()}`),

    // State Management
    getState: () => stateStore.getSnapshot(),
    setState: (updater) => {
      metrics?.startMeasurement('stateUpdate');
      stateStore.update(updater);
      metrics?.endMeasurement('stateUpdate');
    },
    subscribe: (listener) => stateStore.subscribe(listener),

    // Data Access
    getRowModel: () =>
      buildRowModel({
        data: stateStore.getSnapshot().data,
        rowFactory,
        columnRegistry,
        table: instance,
      }),
    getRow: (id) => {
      const model = instance.getRowModel();
      return model.rowsById.get(id);
    },

    // Column Access
    getAllColumns: () => columnRegistry.getAll(),
    getVisibleColumns: () => {
      const state = stateStore.getSnapshot();
      return columnRegistry.getVisible(state.columnVisibility);
    },
    getColumn: (id) => columnRegistry.get(id),

    // Lifecycle
    reset: () => {
      stateStore.reset(initialState);
      eventBus.emit('table:reset', { tableId: instance.id });
    },
    destroy: () => {
      // Cleanup in reverse dependency order
      eventBus.emit('table:destroy', { tableId: instance.id });
      stateStore.destroy();
      columnRegistry.destroy();
      eventBus.clear();
      metrics?.destroy();

      // Clear references for GC
      Object.keys(instance).forEach((key) => {
        (instance as any)[key] = null;
      });
    },

    // Metadata
    options: Object.freeze(options) as Readonly<ValidatedTableOptions<TData>>,
    meta: options.meta,
    metrics,
    _internal: {
      stateStore,
      columnRegistry,
      rowFactory,
      eventBus,
    },
  };

  // Wire up circular dependencies
  columnRegistry.setTable(instance);

  return instance;
}
```

### **4. Initialization & Setup**

```typescript
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
```

### **5. Supporting Types & Interfaces**

```typescript
/**
 * Validated and normalized options.
 * All optional fields have defaults.
 */
interface ValidatedTableOptions<TData extends RowData> {
  readonly columns: readonly ValidatedColumnDef<TData>[];
  readonly data: readonly TData[];
  readonly getRowId: (row: TData, index: number) => RowId;
  readonly debug: DebugConfig;
  readonly meta: TableMeta;
  readonly initialState: Partial<TableState<TData>>;
  readonly defaultColumn?: Partial<ColumnDef<TData>>;
  readonly onStateChange?: (state: TableState<TData>) => void;
  readonly onError?: (error: GridError) => void;
}

/**
 * Debug configuration with sane defaults.
 */
interface DebugConfig {
  readonly performance: boolean;
  readonly validation: boolean;
  readonly events: boolean;
  readonly memory: boolean;
}

/**
 * Validation error with context.
 */
interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly field: string;
  readonly value: unknown;
  readonly suggestion?: string;
}

/**
 * Internal table structure (not exposed).
 */
interface TableInternal<TData> {
  readonly stateStore: StateStore<TableState<TData>>;
  readonly columnRegistry: ColumnRegistry<TData>;
  readonly rowFactory: RowFactory<TData>;
  readonly eventBus: EventBus;
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No DOM rendering or UI logic
- ❌ No framework-specific code (React, Vue, etc.)
- ❌ No sorting/filtering algorithms (plugins)
- ❌ No complex state transitions (state machine)
- ❌ No network/async operations
- ❌ No plugin system integration (CORE-006)
- ❌ No persistence or storage logic

## 📁 **File Structure**

```
packages/core/src/table/
├── factory/
│   ├── create-table.ts          # Main factory function
│   ├── validation.ts            # Comprehensive validation
│   ├── normalization.ts         # Option normalization
│   └── error-handling.ts        # Error wrapping
├── instance/
│   ├── TableInstance.ts         # Core implementation
│   ├── initialization.ts        # Setup logic
│   └── lifecycle.ts             # Destroy/reset
├── builders/
│   ├── state-builder.ts         # Initial state construction
│   └── model-builder.ts         # Row/column models
└── index.ts                     # Public exports
```

## 🧪 **Test Requirements (Critical)**

```typescript
// MUST test these scenarios comprehensively:
describe('createTable', () => {
  describe('Validation', () => {
    test('Rejects invalid columns with helpful errors', () => {
      expect(() => createTable({ columns: 'invalid' })).toThrow(
        'columns must be an array'
      );

      expect(() => createTable({ columns: [] })).toThrow(
        'At least one column definition is required'
      );

      expect(() =>
        createTable({
          columns: [{}], // No accessor
        })
      ).toThrow('must have either accessorKey or accessorFn');
    });

    test('Validates data consistency', () => {
      const invalidData = [null, undefined, 'string'];
      expect(() =>
        createTable({
          columns: [{ accessorKey: 'name' }],
          data: invalidData,
        })
      ).toThrow('Invalid row data');
    });
  });

  describe('Performance', () => {
    test('Creates 10,000 rows in < 200ms', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const start = performance.now();
      const table = createTable({
        columns: [{ accessorKey: 'name' }],
        data: largeData,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(table.getRowModel().rows).toHaveLength(10000);
    });

    test('Memory usage scales linearly', () => {
      // Test with increasing data sizes
      const sizes = [100, 1000, 10000];
      const memoryUsages: number[] = [];

      sizes.forEach((size) => {
        const data = Array.from({ length: size }, (_, i) => ({ id: i }));
        const table = createTable({
          columns: [{ accessorKey: 'id' }],
          data,
        });

        // Measure memory after GC
        memoryUsages.push(measureTableMemory(table));
        table.destroy();
      });

      // Should be roughly linear (allow 20% variance)
      expect(memoryUsages[2] / memoryUsages[1]).toBeCloseTo(10, -1); // ~10x increase for 10x data
    });
  });

  describe('Memory Safety', () => {
    test('No memory leaks after destroy', () => {
      const initialMemory = measureMemory();
      const tables: Table<any>[] = [];

      // Create and destroy tables
      for (let i = 0; i < 100; i++) {
        const table = createTable({
          columns: [{ accessorKey: 'test' }],
          data: [{ test: 'value' }],
        });
        tables.push(table);
      }

      // Destroy all
      tables.forEach((table) => table.destroy());

      // Force GC and measure
      global.gc?.();
      const finalMemory = measureMemory();

      expect(finalMemory).toBeLessThan(initialMemory * 1.1); // < 10% increase
    });

    test('Weak references prevent leaks', () => {
      let tableRef: WeakRef<Table<any>> | undefined;

      {
        // Create in isolated scope
        const table = createTable({
          columns: [{ accessorKey: 'test' }],
          data: [{ test: 'value' }],
        });
        tableRef = new WeakRef(table);
      }

      // Table should be GC'd
      global.gc?.();
      expect(tableRef?.deref()).toBeUndefined();
    });
  });
});
```

## 💡 **Critical Implementation Patterns**

```typescript
// 1. Immutable state with structural sharing
function updateState<T>(prev: T, changes: Partial<T>): T {
  // Use shallow copy for performance
  const changed = Object.keys(changes).some(
    (key) => (prev as any)[key] !== (changes as any)[key]
  );

  return changed ? { ...prev, ...changes } : prev;
}

// 2. Lazy initialization for performance
class LazyRowModel<TData> {
  private cached?: RowModel<TData>;
  private dependencyHash = '';

  getModel(data: TData[], columns: Column<TData>[]): RowModel<TData> {
    const hash = computeDependencyHash(data, columns);
    if (!this.cached || this.dependencyHash !== hash) {
      this.cached = buildRowModel(data, columns);
      this.dependencyHash = hash;
    }
    return this.cached;
  }
}

// 3. Error boundaries for isolation
function withErrorBoundary<T>(fn: () => T, context: string): T {
  try {
    return fn();
  } catch (error) {
    throw new GridKitError(
      'RUNTIME_ERROR',
      `Error in ${context}: ${error.message}`,
      { originalError: error, context }
    );
  }
}
```

## 📊 **Success Metrics (Non-Negotiable)**

- ✅ Table creation with 10,000 rows: < 200ms
- ✅ State updates: < 5ms (cold), < 1ms (hot)
- ✅ Zero memory leaks after destroy()
- ✅ Heap memory increase < 10% after 100 create/destroy cycles
- ✅ 100% test coverage for validation paths
- ✅ All errors provide actionable messages
- ✅ TypeScript strict mode compliance

## 🎯 **AI Implementation Strategy**

1. **Phase 1: Validation System** - Get error handling right first
2. **Phase 2: Core Factory** - Implement main createTable function
3. **Phase 3: Instance Implementation** - Build Table interface methods
4. **Phase 4: Performance Optimizations** - Add caching and lazy loading
5. **Phase 5: Memory Safety** - Implement destroy() and cleanup
6. **Phase 6: Comprehensive Testing** - Validate all scenarios

**Critical Priority:** Memory safety and performance are non-negotiable. Every feature must be tested for memory leaks.

---

**Status:** Ready for implementation. This is the most critical task in the codebase - requires careful architecture review.
