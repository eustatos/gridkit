# DATA-002: Static Data Provider Implementation

## Task Card

```
task_id: DATA-002
priority: P0
complexity: Low
estimated_tokens: ~10,000
ai_ready: true
dependencies: [DATA-001]
requires_review: true (reference implementation)
```

## 🎯 Objective

Implement the `StaticDataProvider` - the simplest data provider that works with in-memory arrays. This serves as the default provider for GridKit and provides a reference implementation for the DataProvider interface.

## 📋 Implementation Scope

### **1. Core Provider Class**

````typescript
/**
 * Static data provider for in-memory data arrays.
 * This is the default provider when data is passed as an array.
 *
 * @template TData - Row data type
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const users: User[] = [
 *   { id: 1, name: 'Alice', email: 'alice@example.com' },
 *   { id: 2, name: 'Bob', email: 'bob@example.com' },
 * ];
 *
 * // Create provider
 * const provider = new StaticDataProvider<User>(users);
 *
 * // Load data
 * const result = await provider.load({});
 * console.log(result.data); // All users
 *
 * // Update data
 * provider.setData([...users, { id: 3, name: 'Charlie' }]);
 * ```
 */
export class StaticDataProvider<
  TData extends RowData,
> implements DataProvider<TData> {
  private data: TData[];
  private listeners = new Set<DataListener<TData>>();
  private abortController?: AbortController;
  private version = 0;

  /**
   * Creates a new static data provider.
   *
   * @param initialData - Initial data array (default: empty array)
   * @param options - Provider configuration
   */
  constructor(
    initialData: TData[] = [],
    private options: StaticProviderOptions = {}
  ) {
    this.data = this.deepClone(initialData);
    this.validateInitialData();
  }

  // === Core DataProvider Interface ===

  /**
   * Load data from the in-memory array.
   * Applies basic client-side operations if enabled.
   */
  async load(params: LoadParams): Promise<DataResult<TData>> {
    const startTime = performance.now();

    try {
      // Check for cancellation
      this.checkCancellation(params.signal);

      // Clone data to prevent mutations
      let resultData = this.deepClone(this.data);

      // Apply client-side operations if requested
      if (params.sorting && this.options.applySorting) {
        resultData = this.applySorting(resultData, params.sorting);
      }

      if (params.filtering && this.options.applyFiltering) {
        resultData = this.applyFiltering(resultData, params.filtering);
      }

      if (params.search && this.options.applySearch) {
        resultData = this.applySearch(resultData, params.search);
      }

      if (params.pagination && this.options.applyPagination) {
        resultData = this.applyPagination(resultData, params.pagination);
      }

      const duration = performance.now() - startTime;

      return {
        data: resultData,
        totalCount: this.data.length,
        pageInfo: params.pagination
          ? {
              pageIndex: params.pagination.pageIndex,
              pageSize: params.pagination.pageSize,
              totalPages: Math.ceil(
                this.data.length / params.pagination.pageSize
              ),
              hasNextPage:
                (params.pagination.pageIndex + 1) * params.pagination.pageSize <
                this.data.length,
              hasPreviousPage: params.pagination.pageIndex > 0,
            }
          : undefined,
        meta: {
          source: 'static',
          version: this.version.toString(),
          duration,
          appliedOperations: {
            sorting: !!params.sorting,
            filtering: !!params.filtering,
            search: !!params.search,
            pagination: !!params.pagination,
          },
        },
      };
    } catch (error) {
      throw this.createDataError(
        'DATA_LOAD_FAILED',
        'Failed to load data',
        error
      );
    }
  }

  /**
   * Save data to the in-memory array.
   * Replaces the current data with new data.
   */
  async save(newData: TData[]): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate new data
      this.validateData(newData);

      // Deep clone to prevent external mutations
      const clonedData = this.deepClone(newData);

      // Store old data for rollback
      const oldData = this.data;
      const oldVersion = this.version;

      // Update data
      this.data = clonedData;
      this.version++;

      // Notify listeners
      this.notifyListeners({
        type: 'data:changed',
        data: this.data,
        meta: {
          source: 'save',
          operationId: `save-${Date.now()}`,
          duration: performance.now() - startTime,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      throw this.createDataError(
        'DATA_SAVE_FAILED',
        'Failed to save data',
        error
      );
    }
  }

  /**
   * Subscribe to data changes.
   */
  subscribe(listener: DataListener<TData>): Unsubscribe {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Cancel any pending operations.
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  // === Public API Methods ===

  /**
   * Get current data (immutable).
   */
  getData(): Readonly<TData[]> {
    return this.deepClone(this.data);
  }

  /**
   * Replace all data.
   */
  setData(newData: TData[]): void {
    this.save(newData).catch((error) => {
      console.error('Failed to set data:', error);
    });
  }

  /**
   * Add data to existing array.
   */
  addData(...items: TData[]): void {
    this.setData([...this.data, ...items]);
  }

  /**
   * Update specific items by predicate.
   */
  updateData(
    predicate: (item: TData, index: number) => boolean,
    updater: (item: TData) => TData
  ): void {
    const newData = this.data.map((item, index) =>
      predicate(item, index) ? updater(item) : item
    );
    this.setData(newData);
  }

  /**
   * Remove items by predicate.
   */
  removeData(predicate: (item: TData, index: number) => boolean): void {
    const newData = this.data.filter((item, index) => !predicate(item, index));
    this.setData(newData);
  }

  /**
   * Clear all data.
   */
  clearData(): void {
    this.setData([]);
  }

  /**
   * Get provider metadata.
   */
  get meta(): ProviderMeta {
    return {
      name: 'StaticDataProvider',
      version: '1.0.0',
      capabilities: {
        canLoad: true,
        canSave: true,
        canSubscribe: true,
        supportsPagination: this.options.applyPagination ?? false,
        supportsSorting: this.options.applySorting ?? false,
        supportsFiltering: this.options.applyFiltering ?? false,
        supportsSearch: this.options.applySearch ?? false,
        supportsBatch: true,
        supportsTransactions: false,
        supportsCaching: false,
      },
      features: {
        realtime: false,
        offline: true,
        conflictResolution: false,
        validation: this.options.validateData ?? false,
        encryption: false,
        compression: false,
        queryOptimization: false,
      },
      config: this.options,
    };
  }

  // === Internal Methods ===

  private validateInitialData(): void {
    if (!Array.isArray(this.data)) {
      throw this.createDataError(
        'DATA_INVALID_FORMAT',
        'Initial data must be an array'
      );
    }

    if (this.options.validateData) {
      this.validateData(this.data);
    }
  }

  private validateData(data: TData[]): void {
    if (!Array.isArray(data)) {
      throw this.createDataError(
        'DATA_INVALID_FORMAT',
        'Data must be an array'
      );
    }

    // Additional validation can be added here
    // based on options.validateData configuration
  }

  private deepClone<T>(data: T): T {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.deepClone(item)) as T;
    }

    if (data instanceof Date) {
      return new Date(data.getTime()) as T;
    }

    const cloned: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        cloned[key] = this.deepClone(data[key]);
      }
    }

    return cloned;
  }

  private applySorting(data: TData[], sorting: SortingParams): TData[] {
    return [...data].sort((a, b) => {
      for (const sort of sorting) {
        const aValue = this.getValueByPath(a, sort.id);
        const bValue = this.getValueByPath(b, sort.id);

        const compare = sort.sortFn
          ? sort.sortFn(aValue, bValue)
          : this.defaultCompare(aValue, bValue);

        if (compare !== 0) {
          return sort.desc ? -compare : compare;
        }
      }
      return 0;
    });
  }

  private applyFiltering(data: TData[], filtering: FilteringParams): TData[] {
    return data.filter((item) => {
      return filtering.every((filter) => {
        const value = this.getValueByPath(item, filter.id);

        if (filter.filterFn) {
          return filter.filterFn(value, filter.value);
        }

        return this.applyFilterOperator(value, filter.value, filter.operator);
      });
    });
  }

  private applySearch(data: TData[], search: string): TData[] {
    const searchLower = search.toLowerCase();

    return data.filter((item) => {
      return Object.values(item).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchLower);
        }
        return false;
      });
    });
  }

  private applyPagination(
    data: TData[],
    pagination: PaginationParams
  ): TData[] {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return data.slice(start, end);
  }

  private getValueByPath(obj: any, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  private defaultCompare(a: unknown, b: unknown): number {
    if (a === b) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    return String(a).localeCompare(String(b));
  }

  private applyFilterOperator(
    value: unknown,
    filterValue: unknown,
    operator: FilterOperator = 'equals'
  ): boolean {
    switch (operator) {
      case 'equals':
        return value === filterValue;
      case 'notEquals':
        return value !== filterValue;
      case 'contains':
        return (
          typeof value === 'string' &&
          typeof filterValue === 'string' &&
          value.includes(filterValue)
        );
      case 'startsWith':
        return (
          typeof value === 'string' &&
          typeof filterValue === 'string' &&
          value.startsWith(filterValue)
        );
      case 'endsWith':
        return (
          typeof value === 'string' &&
          typeof filterValue === 'string' &&
          value.endsWith(filterValue)
        );
      case 'greaterThan':
        return (
          typeof value === 'number' &&
          typeof filterValue === 'number' &&
          value > filterValue
        );
      case 'lessThan':
        return (
          typeof value === 'number' &&
          typeof filterValue === 'number' &&
          value < filterValue
        );
      case 'between':
        return (
          Array.isArray(filterValue) &&
          filterValue.length === 2 &&
          typeof value === 'number' &&
          value >= filterValue[0] &&
          value <= filterValue[1]
        );
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(value);
      case 'notIn':
        return Array.isArray(filterValue) && !filterValue.includes(value);
      default:
        return true;
    }
  }

  private checkCancellation(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }
  }

  private notifyListeners(event: DataEvent<TData>): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in data listener:', error);
      }
    }
  }

  private createDataError(
    code: DataErrorCode,
    message: string,
    originalError?: unknown
  ): DataError {
    return {
      code,
      message,
      originalError,
      timestamp: Date.now(),
    };
  }
}
````

### **2. Factory Function and Options**

```typescript
/**
 * Static provider configuration options.
 */
export interface StaticProviderOptions {
  /**
   * Enable client-side sorting.
   * @default false (table handles sorting)
   */
  applySorting?: boolean;

  /**
   * Enable client-side filtering.
   * @default false (table handles filtering)
   */
  applyFiltering?: boolean;

  /**
   * Enable client-side search.
   * @default false (table handles search)
   */
  applySearch?: boolean;

  /**
   * Enable client-side pagination.
   * @default false (table handles pagination)
   */
  applyPagination?: boolean;

  /**
   * Validate data on load/save.
   * @default false
   */
  validateData?: boolean;

  /**
   * Validate schema on load/save.
   */
  validateSchema?: DataSchema;

  /**
   * Enable data compression.
   * @default false
   */
  compressData?: boolean;

  /**
   * Maximum data size in bytes.
   * @default Infinity
   */
  maxDataSize?: number;
}

/**
 * Creates a new static data provider.
 *
 * @template TData - Row data type
 * @param data - Initial data array
 * @param options - Provider options
 * @returns Static data provider instance
 */
export function createStaticProvider<TData extends RowData>(
  data: TData[] = [],
  options: StaticProviderOptions = {}
): StaticDataProvider<TData> {
  return new StaticDataProvider(data, options);
}

/**
 * Creates a static provider from existing data.
 * Shorthand for createStaticProvider.
 */
export function staticProvider<TData extends RowData>(
  data: TData[] = [],
  options: StaticProviderOptions = {}
): StaticDataProvider<TData> {
  return createStaticProvider(data, options);
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No complex query optimization
- ❌ No external data source integration
- ❌ No advanced caching mechanisms
- ❌ No real-time synchronization
- ❌ No complex validation beyond basic type checking
- ❌ No encryption or compression algorithms

## 📁 **File Structure**

```
packages/data/src/providers/static/
├── StaticDataProvider.ts    # Main implementation
├── options.ts              # Configuration types
├── factory.ts             # Factory functions
├── utils/                 # Internal utilities
│   ├── filtering.ts      # Filtering logic
│   ├── sorting.ts       # Sorting logic
│   └── validation.ts    # Data validation
└── index.ts             # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('StaticDataProvider', () => {
  interface User {
    id: number;
    name: string;
    email: string;
    age: number;
  }

  const users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
  ];

  test('creates provider with initial data', () => {
    const provider = new StaticDataProvider(users);
    expect(provider.getData()).toEqual(users);
  });

  test('load returns all data by default', async () => {
    const provider = new StaticDataProvider(users);
    const result = await provider.load({});

    expect(result.data).toEqual(users);
    expect(result.totalCount).toBe(3);
  });

  test('applies client-side sorting when enabled', async () => {
    const provider = new StaticDataProvider(users, { applySorting: true });

    const result = await provider.load({
      sorting: [{ id: 'name' as ColumnId, desc: false }],
    });

    expect(result.data[0].name).toBe('Alice');
    expect(result.data[1].name).toBe('Bob');
    expect(result.data[2].name).toBe('Charlie');
  });

  test('saves and updates data', async () => {
    const provider = new StaticDataProvider(users);

    const newUser = {
      id: 4,
      name: 'David',
      email: 'david@example.com',
      age: 28,
    };
    await provider.save([...users, newUser]);

    expect(provider.getData()).toHaveLength(4);
    expect(provider.getData()[3].name).toBe('David');
  });

  test('notifies subscribers on data change', async () => {
    const provider = new StaticDataProvider(users);
    const listener = jest.fn();

    provider.subscribe(listener);
    await provider.save([...users, { id: 4, name: 'David', age: 28 }]);

    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].type).toBe('data:changed');
  });

  test('factory function creates provider', () => {
    const provider = createStaticProvider(users);
    expect(provider).toBeInstanceOf(StaticDataProvider);
    expect(provider.getData()).toEqual(users);
  });

  test('handles large datasets efficiently', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: Math.floor(Math.random() * 100),
    }));

    const start = performance.now();
    const provider = new StaticDataProvider(largeData);
    const result = await provider.load({});
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100); // < 100ms for 10k rows
    expect(result.data).toHaveLength(10000);
  });
});
```

## 💡 **Performance Optimizations**

```typescript
// 1. Lazy cloning for large arrays
private lazyClone<T>(data: T[]): T[] {
  if (data.length > 1000) {
    // For large arrays, return original reference if no modifications needed
    return data;
  }
  return this.deepClone(data);
}

// 2. Optimized filtering with early exit
private optimizedFilter(
  data: TData[],
  predicate: (item: TData) => boolean
): TData[] {
  const result: TData[] = [];
  for (let i = 0; i < data.length; i++) {
    if (predicate(data[i])) {
      result.push(data[i]);
    }
  }
  return result;
}

// 3. Memory-efficient operations
class DataBuffer {
  private buffer: TData[] = [];

  add(item: TData): void {
    this.buffer.push(item);
    if (this.buffer.length > 1000) {
      this.flush();
    }
  }

  private flush(): void {
    // Process buffer in batches
  }
}
```

## 📊 **Success Metrics**

- ✅ Loads 10,000 rows in < 100ms
- ✅ Memory usage stable after 1000 operations
- ✅ No memory leaks with subscribe/unsubscribe cycles
- ✅ Immutable data guarantees (deep cloning)
- ✅ 100% test coverage for all public methods
- ✅ Clear error messages for invalid operations

## 🎯 **AI Implementation Instructions**

1. **Start with core class implementation** - implement DataProvider interface
2. **Add data manipulation methods** - getData, setData, addData, etc.
3. **Implement client-side operations** - sorting, filtering, search, pagination
4. **Add subscription system** - for data change notifications
5. **Implement factory functions** - createStaticProvider, staticProvider
6. **Write comprehensive tests** - focus on performance and edge cases

**Critical:** This provider must be memory-efficient and performant with large datasets. Use deep cloning only when necessary to prevent memory bloat.

---

**Status:** Ready for implementation. This is the reference implementation for all data providers - ensure it's robust and efficient.
