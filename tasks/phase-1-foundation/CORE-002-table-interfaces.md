# CORE-002: Table Interfaces & Core Types

## Task Card

```
task_id: CORE-002
priority: P0
complexity: Medium
estimated_tokens: ~12,000
ai_ready: true
dependencies: [CORE-001]
requires_review: true (core API design)
```

## 🎯 Objective

Define the core Table interfaces that represent the main table instance, its configuration, and internal state. These interfaces are the public API foundation - they define what a table IS and how developers interact with it.

## 📋 Implementation Scope

### **1. Table Instance Interface (Primary Public API)**

````typescript
/**
 * Main table instance - the core GridKit API.
 * Immutable by design with functional updates.
 *
 * @template TData - Row data type (must extend RowData)
 *
 * @example
 * ```typescript
 * const table = createTable<User>({
 *   columns: [...],
 *   data: users,
 * });
 *
 * // Subscribe to changes
 * const unsubscribe = table.subscribe(state => {
 *   console.log('Table updated:', state);
 * });
 * ```
 */
export interface Table<TData extends RowData> {
  // === State Management ===

  /**
   * Get current immutable table state.
   * Returns a new object on each call - safe for React/Vue.
   */
  getState(): Readonly<TableState<TData>>;

  /**
   * Update table state immutably.
   * Supports both direct values and functional updates.
   *
   * @example
   * ```typescript
   * // Direct update
   * table.setState(newState);
   *
   * // Functional update
   * table.setState(prev => ({
   *   ...prev,
   *   sorting: [{ id: 'name', desc: false }]
   * }));
   * ```
   */
  setState(updater: Updater<TableState<TData>>): void;

  /**
   * Subscribe to state changes.
   * Returns cleanup function for memory safety.
   *
   * @returns Function to unsubscribe
   */
  subscribe(listener: Listener<TableState<TData>>): Unsubscribe;

  // === Data Access ===

  /**
   * Get the row model with current filtering/sorting applied.
   * This is the primary data access method.
   */
  getRowModel(): RowModel<TData>;

  /**
   * Get a specific row by ID.
   * O(1) lookup via internal index.
   */
  getRow(id: RowId): Row<TData> | undefined;

  /**
   * Get all column instances (including hidden).
   */
  getAllColumns(): Column<TData>[];

  /**
   * Get only visible columns in current order.
   */
  getVisibleColumns(): Column<TData>[];

  /**
   * Get column by ID (case-sensitive).
   */
  getColumn(id: ColumnId): Column<TData> | undefined;

  // === Lifecycle ===

  /**
   * Reset table to initial state.
   * Clears filters, sorting, pagination, etc.
   */
  reset(): void;

  /**
   * Destroy table instance and clean up resources.
   * Required for memory management in SPA applications.
   */
  destroy(): void;

  // === Metadata ===

  /**
   * Read-only reference to original configuration.
   */
  readonly options: Readonly<TableOptions<TData>>;

  /**
   * Unique table identifier for debugging.
   */
  readonly id: GridId;

  /**
   * Performance metrics (enabled in debug mode).
   */
  readonly metrics?: TableMetrics;
}
````

### **2. Table Configuration (User Input)**

```typescript
/**
 * Complete table configuration.
 * All fields are optional except `columns`.
 *
 * @template TData - Row data type
 */
export interface TableOptions<TData extends RowData> {
  // === Required Configuration ===

  /**
   * Column definitions - at least one required.
   * Defines how data is displayed and interacted with.
   */
  columns: ColumnDef<TData>[];

  // === Data Configuration ===

  /**
   * Initial data array.
   * @default [] (empty array)
   */
  data?: TData[];

  /**
   * Function to extract unique row ID.
   * Critical for row selection, expansion, and updates.
   *
   * @default (row, index) => index (using array index)
   */
  getRowId?: (row: TData, index: number) => RowId;

  // === Initial State ===

  /**
   * Partial initial state to override defaults.
   * Useful for restoring saved views.
   */
  initialState?: DeepPartial<TableState<TData>>;

  // === Performance & Debugging ===

  /**
   * Enable debug mode for development.
   * Adds performance tracking and validation.
   * @default false (disabled in production)
   */
  debug?: boolean | DebugOptions;

  /**
   * Performance budgets for validation.
   * Fails fast if budgets are exceeded.
   */
  performanceBudgets?: PerformanceBudgets;

  // === Event Handlers ===

  /**
   * Called on every state change.
   * Useful for persistence or analytics.
   */
  onStateChange?: (state: TableState<TData>) => void;

  /**
   * Called when table encounters an error.
   * Prevents uncaught errors from crashing the app.
   */
  onError?: (error: GridError) => void;

  // === Advanced Configuration ===

  /**
   * Default column options applied to all columns.
   * Can be overridden by individual column definitions.
   */
  defaultColumn?: Partial<ColumnDef<TData>>;

  /**
   * Custom metadata for application use.
   * Not used internally by GridKit.
   */
  meta?: TableMeta;
}
```

### **3. Table State (Immutable Internal State)**

```typescript
/**
 * Complete table state - immutable and serializable.
 * This is what gets passed to subscribers and persisted.
 *
 * @template TData - Row data type
 */
export interface TableState<TData extends RowData> {
  // === Core Data ===

  /**
   * Current data array (immutable).
   * May differ from initial data due to updates.
   */
  readonly data: readonly TData[];

  // === Column State ===

  /**
   * Column visibility map.
   * @example { 'name': true, 'email': false }
   */
  readonly columnVisibility: Readonly<Record<ColumnId, boolean>>;

  /**
   * Column display order.
   * Array of column IDs in rendering order.
   */
  readonly columnOrder: readonly ColumnId[];

  /**
   * Column sizes in pixels.
   */
  readonly columnSizing: Readonly<Record<ColumnId, number>>;

  /**
   * Column pinning (frozen columns).
   */
  readonly columnPinning?: Readonly<{
    left?: readonly ColumnId[];
    right?: readonly ColumnId[];
  }>;

  // === Row State ===

  /**
   * Row selection state.
   * @example { 'row-1': true, 'row-2': false }
   */
  readonly rowSelection: Readonly<Record<RowId, boolean>>;

  /**
   * Row expansion state (for tree/grouped data).
   */
  readonly expanded: Readonly<Record<RowId, boolean>>;

  // === Feature States ===

  /**
   * Sorting configuration.
   * Array of sort descriptors.
   */
  readonly sorting?: readonly SortingState[];

  /**
   * Filter configuration.
   */
  readonly filtering?: FilteringState;

  /**
   * Pagination state.
   */
  readonly pagination?: PaginationState;

  /**
   * Grouping configuration.
   */
  readonly grouping?: GroupingState;

  // === UI State ===

  /**
   * Currently focused cell (if any).
   */
  readonly focusedCell?: CellCoordinate;

  /**
   * Scroll position for virtualization.
   */
  readonly scroll?: ScrollPosition;

  // === Metadata ===

  /**
   * State version for migration.
   */
  readonly version: number;

  /**
   * Last updated timestamp.
   */
  readonly updatedAt: number;
}

/**
 * Coordinate for cell focus/selection.
 */
export interface CellCoordinate {
  readonly rowId: RowId;
  readonly columnId: ColumnId;
}
```

### **4. Supporting Types**

```typescript
/**
 * Debug configuration options.
 */
export interface DebugOptions {
  /** Log state changes to console */
  readonly logStateChanges?: boolean;

  /** Log performance metrics */
  readonly logPerformance?: boolean;

  /** Validate state on every change */
  readonly validateState?: boolean;

  /** Enable DevTools integration */
  readonly devTools?: boolean;
}

/**
 * Performance budgets for validation.
 */
export interface PerformanceBudgets {
  /** Maximum render time in milliseconds */
  readonly maxRenderTime?: number;

  /** Maximum state update time */
  readonly maxUpdateTime?: number;

  /** Maximum memory usage in MB */
  readonly maxMemoryUsage?: number;
}

/**
 * Table metadata (user-defined).
 */
export interface TableMeta {
  /** User-friendly table name */
  readonly name?: string;

  /** Table description */
  readonly description?: string;

  /** Any custom application data */
  readonly [key: string]: unknown;
}

/**
 * Performance metrics (debug mode only).
 */
export interface TableMetrics {
  /** Total render count */
  readonly renderCount: number;

  /** Average render time */
  readonly avgRenderTime: number;

  /** Peak memory usage */
  readonly peakMemory: number;

  /** State update count */
  readonly updateCount: number;
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No implementation logic (only interfaces)
- ❌ No default values or initial states
- ❌ No validation logic
- ❌ No event system integration
- ❌ No plugin system hooks
- ❌ No framework-specific types

## 📁 **File Structure**

```
packages/core/src/types/
├── table/
│   ├── Table.ts          # Main Table interface
│   ├── TableOptions.ts   # Configuration types
│   ├── TableState.ts     # State types
│   └── support/         # Supporting types
└── index.ts             # Exports
```

## 🧪 **Test Requirements**

```typescript
// MUST test these scenarios:
describe('Table Interfaces', () => {
  test('Table interface is immutable', () => {
    const table: Table<User> = {} as any;

    // @ts-expect-error - Should not be mutable
    table.options = newOptions;

    // @ts-expect-error - Should not be mutable
    table.id = 'new-id';
  });

  test('TableState is deeply readonly', () => {
    const state: TableState<User> = {} as any;

    // @ts-expect-error - Should not be mutable
    state.data.push(newUser);

    // @ts-expect-error - Should not be mutable
    state.columnVisibility.name = false;
  });

  test('Generic type inference works', () => {
    interface Product {
      id: string;
      name: string;
      price: number;
    }

    const options: TableOptions<Product> = {
      columns: [{ accessorKey: 'name' }],
      // Should infer Product[] for data
      data: [{ id: '1', name: 'Test', price: 100 }],
    };
  });
});
```

## 💡 **Key Design Principles**

1. **Immutability First**: All state interfaces use `readonly`
2. **Generic Safety**: Full type inference from `TData`
3. **Separation of Concerns**: Config vs State vs Instance
4. **Memory Safety**: Clear ownership and cleanup patterns
5. **Debuggability**: Built-in metrics and error handling

## 🔍 **TypeScript Configuration**

```typescript
// Use these patterns:
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };

// Avoid these:
interface MutableState {
  data: any[]; // ❌ Mutable
  columnVisibility: Record<string, boolean>; // ❌ Mutable
}
```

## 📊 **Success Metrics**

- ✅ All interfaces are immutable (`readonly`)
- ✅ Generic `TData` flows through all types
- ✅ 100% type test coverage with edge cases
- ✅ Clear separation between config/state/instance
- ✅ Memory-safe patterns (unsubscribe, destroy)
- ✅ Tree-shakeable type exports

## 🎯 **AI Implementation Instructions**

1. **Start with `Table` interface** - define the public API
2. **Add `TableOptions`** - user configuration
3. **Implement `TableState`** - immutable internal state
4. **Add supporting types** - metadata, debug, metrics
5. **Write comprehensive type tests** - focus on immutability

**Remember:** This is TYPE DEFINITIONS only. No runtime code. Focus on API design and type safety.

---

**Status:** Ready for AI implementation. Dependencies (CORE-001) satisfied.
