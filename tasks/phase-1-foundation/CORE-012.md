# CORE-012: Column System Implementation

## Task Card

```
task_id: CORE-012
priority: P0
complexity: High
estimated_tokens: ~15,000
ai_ready: yes (with type safety focus)
dependencies: [CORE-001, CORE-002, CORE-003, CORE-011]
requires_validation: true (complex type inference)
```

## 🎯 **Objective**

Implement runtime column system that creates fully functional column instances from `ColumnDef` definitions. This bridges the gap between type definitions and runtime behavior with advanced type inference and memory-efficient column management.

## 📋 **Implementation Scope**

### **1. Column Factory & Registry**

```typescript
/**
 * Creates a runtime column instance from definition.
 * Handles type inference, validation, and feature enablement.
 */
export function createColumn<TData extends RowData, TValue = unknown>(
  options: CreateColumnOptions<TData, TValue>
): Column<TData, TValue> {
  // 1. Validate and normalize definition
  const validatedDef = validateColumnDef(options.columnDef, options.table);

  // 2. Extract column metadata
  const metadata = extractColumnMetadata(validatedDef);

  // 3. Create runtime methods
  const methods = buildColumnMethods(validatedDef, options.table);

  // 4. Build column instance
  const column: Column<TData, TValue> = {
    // Identification
    id: validatedDef.id!,
    table: options.table,
    columnDef: Object.freeze(validatedDef),

    // State accessors
    getSize: methods.getSize,
    getIsVisible: methods.getIsVisible,
    getIndex: methods.getIndex,
    getPinnedPosition: methods.getPinnedPosition,

    // State mutators
    toggleVisibility: methods.toggleVisibility,
    setSize: methods.setSize,
    resetSize: methods.resetSize,
    togglePinned: methods.togglePinned,

    // Feature state
    getIsSorted: methods.getIsSorted,
    getSortDirection: methods.getSortDirection,
    toggleSorting: methods.toggleSorting,
    getIsFiltered: methods.getIsFiltered,
    getFilterValue: methods.getFilterValue,
    setFilterValue: methods.setFilterValue,

    // Metadata
    meta: metadata.columnMeta,
    utils: metadata.columnUtils,

    // Internal (for performance)
    _internal: {
      accessor: createAccessor(validatedDef),
      featureFlags: metadata.featureFlags,
      stateWatchers: new Set(),
    },
  };

  return column;
}

/**
 * Manages all columns in a table with O(1) lookups.
 */
export class ColumnRegistry<TData extends RowData> {
  private columns = new Map<ColumnId, Column<TData>>();
  private columnOrder: ColumnId[] = [];
  private columnGroups = new Map<ColumnGroupId, ColumnId[]>();

  /**
   * Register a column and validate uniqueness.
   */
  register(column: Column<TData>): void {
    if (this.columns.has(column.id)) {
      throw new GridError(
        'DUPLICATE_COLUMN',
        `Column ${column.id} already exists`
      );
    }

    this.columns.set(column.id, column);
    this.columnOrder.push(column.id);

    // Handle column groups
    const groupId = column.columnDef.columnGroupId;
    if (groupId) {
      if (!this.columnGroups.has(groupId)) {
        this.columnGroups.set(groupId, []);
      }
      this.columnGroups.get(groupId)!.push(column.id);
    }
  }

  /**
   * Get column by ID with type-safe value inference.
   */
  get<TValue = unknown>(id: ColumnId): Column<TData, TValue> | undefined {
    return this.columns.get(id) as Column<TData, TValue> | undefined;
  }

  /**
   * Get all columns in registration order.
   */
  getAll(): Column<TData>[] {
    return this.columnOrder.map((id) => this.columns.get(id)!);
  }

  /**
   * Get visible columns considering state.
   */
  getVisible(visibilityState: Record<ColumnId, boolean>): Column<TData>[] {
    return this.columnOrder
      .filter((id) => visibilityState[id] !== false)
      .map((id) => this.columns.get(id)!);
  }
}
```

### **2. Type-Safe Accessor System**

```typescript
/**
 * Creates optimized accessor function from column definition.
 * Supports both accessorKey and accessorFn with caching.
 */
function createAccessor<TData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>
): ColumnAccessor<TData, TValue> {
  if (columnDef.accessorFn) {
    // Function accessor with memoization
    const cache = new WeakMap<TData, TValue>();

    return {
      type: 'function',
      getValue: (row: TData, index: number): TValue => {
        // Check cache
        if (cache.has(row)) {
          return cache.get(row)!;
        }

        const value = columnDef.accessorFn!(row, index);
        cache.set(row, value);
        return value;
      },
      clearCache: (row?: TData) => {
        if (row) {
          cache.delete(row);
        } else {
          cache.clear();
        }
      },
    };
  }

  if (columnDef.accessorKey) {
    // Key accessor with dot notation support
    const path = columnDef.accessorKey.split('.');

    return {
      type: 'key',
      getValue: (row: TData): TValue => {
        let value: any = row;

        for (const key of path) {
          if (value == null) return undefined as TValue;
          value = value[key];
        }

        return value as TValue;
      },
      path,
    };
  }

  throw new GridError(
    'INVALID_ACCESSOR',
    'Column must have either accessorKey or accessorFn'
  );
}
```

### **3. Column Method Implementation**

```typescript
/**
 * Builds runtime methods for column instance.
 */
function buildColumnMethods<TData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
): ColumnMethods<TData, TValue> {
  const tableState = () => table.getState();

  return {
    // Size management
    getSize: () => {
      const sizing = tableState().columnSizing;
      return sizing[columnDef.id!] ?? columnDef.size ?? 150;
    },

    setSize: (size: number) => {
      const clamped = clamp(
        size,
        columnDef.minSize ?? 50,
        columnDef.maxSize ?? Infinity
      );
      table.setState((prev) => ({
        ...prev,
        columnSizing: {
          ...prev.columnSizing,
          [columnDef.id!]: clamped,
        },
      }));
    },

    resetSize: () => {
      table.setState((prev) => {
        const nextSizing = { ...prev.columnSizing };
        delete nextSizing[columnDef.id!];
        return { ...prev, columnSizing: nextSizing };
      });
    },

    // Visibility
    getIsVisible: () => {
      const visibility = tableState().columnVisibility;
      return visibility[columnDef.id!] !== false;
    },

    toggleVisibility: (visible?: boolean) => {
      table.setState((prev) => {
        const current = prev.columnVisibility[columnDef.id!];
        const next = visible ?? current === false;

        return {
          ...prev,
          columnVisibility: {
            ...prev.columnVisibility,
            [columnDef.id!]: next,
          },
        };
      });
    },

    // Sorting
    getIsSorted: () => {
      const sorting = tableState().sorting ?? [];
      return sorting.some((s) => s.id === columnDef.id);
    },

    getSortDirection: () => {
      const sorting = tableState().sorting ?? [];
      const sort = sorting.find((s) => s.id === columnDef.id);
      return sort ? (sort.desc ? 'desc' : 'asc') : false;
    },

    toggleSorting: (desc?: boolean) => {
      if (!columnDef.enableSorting) return;

      table.setState((prev) => {
        const currentSorting = prev.sorting ?? [];
        const existingIndex = currentSorting.findIndex(
          (s) => s.id === columnDef.id
        );

        let nextSorting: SortingState[];

        if (existingIndex >= 0) {
          // Toggle existing sort
          const existing = currentSorting[existingIndex];
          if (desc === undefined || desc !== existing.desc) {
            // Toggle direction
            nextSorting = [...currentSorting];
            nextSorting[existingIndex] = { ...existing, desc: !existing.desc };
          } else {
            // Remove sort
            nextSorting = currentSorting.filter((_, i) => i !== existingIndex);
          }
        } else {
          // Add new sort
          nextSorting = [
            ...currentSorting,
            { id: columnDef.id!, desc: desc ?? false },
          ];
        }

        return { ...prev, sorting: nextSorting };
      });
    },

    // Filtering
    getIsFiltered: () => {
      const filtering = tableState().filtering ?? [];
      return filtering.some((f) => f.id === columnDef.id);
    },

    getFilterValue: () => {
      const filtering = tableState().filtering ?? [];
      const filter = filtering.find((f) => f.id === columnDef.id);
      return filter?.value;
    },

    setFilterValue: (value: unknown) => {
      if (!columnDef.enableFiltering) return;

      table.setState((prev) => {
        const currentFiltering = prev.filtering ?? [];
        const existingIndex = currentFiltering.findIndex(
          (f) => f.id === columnDef.id
        );

        let nextFiltering: FilteringState[];

        if (value == null || value === '') {
          // Remove filter
          nextFiltering = currentFiltering.filter(
            (_, i) => i !== existingIndex
          );
        } else if (existingIndex >= 0) {
          // Update existing filter
          nextFiltering = [...currentFiltering];
          nextFiltering[existingIndex] = {
            ...nextFiltering[existingIndex],
            value,
            operator: columnDef.filterFn ? 'custom' : 'equals',
          };
        } else {
          // Add new filter
          nextFiltering = [
            ...currentFiltering,
            {
              id: columnDef.id!,
              value,
              operator: columnDef.filterFn ? 'custom' : 'equals',
            },
          ];
        }

        return { ...prev, filtering: nextFiltering };
      });
    },

    // Pinning
    getPinnedPosition: () => {
      const pinning = tableState().columnPinning;
      if (pinning?.left?.includes(columnDef.id!)) return 'left';
      if (pinning?.right?.includes(columnDef.id!)) return 'right';
      return false;
    },

    togglePinned: (position?: 'left' | 'right' | false) => {
      if (!columnDef.enablePinning) return;

      table.setState((prev) => {
        const currentPinning = prev.columnPinning ?? { left: [], right: [] };
        const isLeft = currentPinning.left?.includes(columnDef.id!);
        const isRight = currentPinning.right?.includes(columnDef.id!);

        let nextPinning = { ...currentPinning };

        if (
          position === false ||
          (position === undefined && (isLeft || isRight))
        ) {
          // Unpin from whichever side
          if (isLeft) {
            nextPinning.left = nextPinning.left?.filter(
              (id) => id !== columnDef.id
            );
          }
          if (isRight) {
            nextPinning.right = nextPinning.right?.filter(
              (id) => id !== columnDef.id
            );
          }
        } else if (position === 'left') {
          // Pin to left (remove from right if present)
          nextPinning.left = [...(nextPinning.left ?? []), columnDef.id!];
          nextPinning.right = nextPinning.right?.filter(
            (id) => id !== columnDef.id
          );
        } else if (position === 'right') {
          // Pin to right (remove from left if present)
          nextPinning.right = [...(nextPinning.right ?? []), columnDef.id!];
          nextPinning.left = nextPinning.left?.filter(
            (id) => id !== columnDef.id
          );
        }

        return { ...prev, columnPinning: nextPinning };
      });
    },

    // Index
    getIndex: () => {
      const order = tableState().columnOrder;
      return order.indexOf(columnDef.id!);
    },
  };
}
```

### **4. Validation & Normalization**

```typescript
/**
 * Validates column definition and returns normalized version.
 */
function validateColumnDef<TData, TValue>(
  columnDef: ColumnDef<TData, TValue>,
  table: Table<TData>
): ValidatedColumnDef<TData, TValue> {
  const errors: string[] = [];

  // Check for required fields
  if (!columnDef.accessorKey && !columnDef.accessorFn) {
    errors.push('Column must have either accessorKey or accessorFn');
  }

  // Validate ID
  let id = columnDef.id;
  if (!id) {
    if (columnDef.accessorKey) {
      id = columnDef.accessorKey;
    } else {
      errors.push('Column must have an id when using accessorFn');
    }
  }

  // Validate duplicate accessor definitions
  if (columnDef.accessorKey && columnDef.accessorFn) {
    errors.push('Column cannot have both accessorKey and accessorFn');
  }

  // Validate dot notation for accessorKey
  if (columnDef.accessorKey && columnDef.accessorKey.includes('..')) {
    errors.push('Invalid dot notation in accessorKey');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid column definition', errors, columnDef);
  }

  // Normalize with defaults
  return {
    ...columnDef,
    id: id!,
    size: columnDef.size ?? 150,
    minSize: columnDef.minSize ?? 50,
    maxSize: columnDef.maxSize ?? Infinity,
    enableSorting: columnDef.enableSorting ?? true,
    enableFiltering: columnDef.enableFiltering ?? true,
    enableResizing: columnDef.enableResizing ?? true,
    enableHiding: columnDef.enableHiding ?? true,
    enableReordering: columnDef.enableReordering ?? true,
    enablePinning: columnDef.enablePinning ?? false,
    meta: columnDef.meta ?? {},
  };
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No UI rendering or DOM manipulation
- ❌ No sorting/filtering algorithms (plugin system)
- ❌ No complex data transformations
- ❌ No framework-specific adapters
- ❌ No plugin system integration
- ❌ No caching beyond simple memoization

## 📁 **File Structure**

```
packages/core/src/column/
├── factory/
│   ├── create-column.ts         # Main factory function
│   ├── column-registry.ts       # Column management
│   └── accessor-system.ts       # Type-safe accessors
├── methods/
│   ├── size-methods.ts          # Sizing logic
│   ├── visibility-methods.ts    # Visibility logic
│   ├── sorting-methods.ts       # Sorting logic
│   ├── filtering-methods.ts     # Filtering logic
│   └── pinning-methods.ts       # Pinning logic
├── validation/
│   ├── validate-column.ts       # Definition validation
│   └── normalize-column.ts      # Option normalization
└── index.ts                     # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('Column System', () => {
  test('creates column with correct type inference', () => {
    interface User {
      name: string;
      age: number;
    }

    const column = createColumn({
      columnDef: { accessorKey: 'name' },
      table: mockTable(),
    });

    // Should infer string type
    expectTypeOf<
      (typeof column)['_internal']['accessor']['getValue']
    >().returns.toBeString();
  });

  test('manages column visibility state', () => {
    const column = createColumn({
      /* ... */
    });

    // Initially visible
    expect(column.getIsVisible()).toBe(true);

    // Toggle visibility
    column.toggleVisibility(false);
    expect(column.getIsVisible()).toBe(false);
  });

  test('handles column sizing with constraints', () => {
    const column = createColumn({
      columnDef: {
        accessorKey: 'test',
        size: 200,
        minSize: 100,
        maxSize: 300,
      },
      table: mockTable(),
    });

    expect(column.getSize()).toBe(200);

    // Respects min/max constraints
    column.setSize(50); // Should clamp to 100
    expect(column.getSize()).toBe(100);

    column.setSize(400); // Should clamp to 300
    expect(column.getSize()).toBe(300);
  });

  test('supports sorting lifecycle', () => {
    const column = createColumn({
      columnDef: { accessorKey: 'name', enableSorting: true },
      table: mockTable(),
    });

    // Initially not sorted
    expect(column.getIsSorted()).toBe(false);

    // Toggle sort
    column.toggleSorting(false); // asc
    expect(column.getIsSorted()).toBe(true);
    expect(column.getSortDirection()).toBe('asc');

    // Toggle direction
    column.toggleSorting(true); // desc
    expect(column.getSortDirection()).toBe('desc');

    // Remove sort
    column.toggleSorting(true); // should remove
    expect(column.getIsSorted()).toBe(false);
  });
});
```

## 💡 **Performance Optimizations**

```typescript
// 1. Lazy evaluation for expensive operations
class LazyColumnState {
  private cachedState?: TableState;
  private cachedResult?: any;

  getState(columnId: string, table: Table): any {
    const currentState = table.getState();
    if (this.cachedState !== currentState) {
      this.cachedState = currentState;
      this.cachedResult = computeColumnState(columnId, currentState);
    }
    return this.cachedResult;
  }
}

// 2. Batch state updates
const pendingUpdates = new Map<string, any>();
function scheduleColumnUpdate(columnId: string, update: any) {
  pendingUpdates.set(columnId, update);
  requestAnimationFrame(() => {
    applyPendingUpdates(pendingUpdates);
    pendingUpdates.clear();
  });
}

// 3. WeakMap for row value caching
const valueCache = new WeakMap<RowData, Map<ColumnId, any>>();
function getCachedValue(row: RowData, columnId: ColumnId, compute: () => any) {
  let rowCache = valueCache.get(row);
  if (!rowCache) {
    rowCache = new Map();
    valueCache.set(row, rowCache);
  }

  if (!rowCache.has(columnId)) {
    rowCache.set(columnId, compute());
  }

  return rowCache.get(columnId)!;
}
```

## 📊 **Success Metrics**

- ✅ Column creation with 1000 columns < 100ms
- ✅ State updates (size/visibility) < 1ms
- ✅ Memory usage scales linearly with column count
- ✅ Type inference works for complex nested paths
- ✅ 100% test coverage for state transitions
- ✅ No memory leaks in column registry

## 🎯 **AI Implementation Strategy**

1. **Start with factory function** - core column creation
2. **Implement accessor system** - type-safe data access
3. **Add column registry** - management and lookups
4. **Implement state methods** - size, visibility, sorting
5. **Add validation** - fail fast with helpful errors
6. **Optimize performance** - caching and lazy evaluation

**Critical:** The accessor system must maintain type safety while supporting both key and function accessors with optimal performance.

---

**Status:** Ready for implementation. Complex type inference required. Focus on performance and memory efficiency.
