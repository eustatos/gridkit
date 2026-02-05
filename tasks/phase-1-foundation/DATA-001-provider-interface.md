# DATA-001: Data Provider Interface Definition

## Task Card

```
task_id: DATA-001
priority: P0
complexity: Low
estimated_tokens: ~8,000
ai_ready: true
dependencies: [CORE-001]
requires_review: true (strategy pattern foundation)
```

## 🎯 Objective

Define the `DataProvider` abstraction - the Strategy pattern interface for all data sources in GridKit. This interface enables pluggable data sources (static arrays, REST APIs, GraphQL, WebSocket, etc.) with consistent type-safe contracts.

## 📋 Implementation Scope

### **1. Core Provider Interface**

````typescript
/**
 * Data provider interface - Strategy pattern for data sources.
 * Abstracts data loading, saving, and real-time updates.
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
 * // Static array provider
 * const staticProvider: DataProvider<User> = {
 *   load: () => ({
 *     data: usersArray,
 *     totalCount: usersArray.length,
 *   }),
 * };
 *
 * // REST API provider
 * const apiProvider: DataProvider<User> = {
 *   load: async (params) => {
 *     const response = await fetch('/api/users', {
 *       method: 'POST',
 *       body: JSON.stringify(params),
 *     });
 *     return response.json();
 *   },
 * };
 * ```
 */
export interface DataProvider<TData extends RowData> {
  /**
   * Load data based on parameters.
   *
   * @param params - Load parameters (pagination, sorting, filtering)
   * @returns Data result (sync or async)
   *
   * @throws {DataError} When data cannot be loaded
   */
  load(params: LoadParams): DataResult<TData> | Promise<DataResult<TData>>;

  /**
   * Save data (optional - for mutable data sources).
   *
   * @param data - Data to save
   * @returns Save result (sync or async)
   *
   * @throws {DataError} When data cannot be saved
   */
  save?(data: TData[]): void | Promise<void>;

  /**
   * Subscribe to real-time updates (optional).
   *
   * @param listener - Callback for data updates
   * @returns Unsubscribe function
   */
  subscribe?(listener: DataListener<TData>): Unsubscribe;

  /**
   * Cancel pending operations (optional).
   * Useful for aborting in-flight requests.
   */
  cancel?(): void;

  /**
   * Provider metadata for debugging.
   */
  readonly meta: ProviderMeta;
}
````

### **2. Load Parameters Type**

```typescript
/**
 * Parameters for data loading operations.
 * Follows table state structure for consistency.
 */
export interface LoadParams {
  /**
   * Pagination parameters.
   */
  pagination?: PaginationParams;

  /**
   * Sorting configuration.
   */
  sorting?: SortingParams;

  /**
   * Filter configuration.
   */
  filtering?: FilteringParams;

  /**
   * Search term for global search.
   */
  search?: string;

  /**
   * Custom parameters for provider-specific needs.
   */
  custom?: Record<string, unknown>;

  /**
   * Signal for aborting requests.
   */
  signal?: AbortSignal;
}

/**
 * Pagination parameters.
 */
export interface PaginationParams {
  /**
   * Current page index (0-based).
   */
  pageIndex: number;

  /**
   * Number of rows per page.
   */
  pageSize: number;

  /**
   * Total row count (if known).
   */
  totalCount?: number;
}

/**
 * Sorting parameters.
 */
export type SortingParams = Array<{
  /**
   * Column ID to sort by.
   */
  id: ColumnId;

  /**
   * Sort direction (true = descending).
   */
  desc: boolean;

  /**
   * Custom sort function (overrides default).
   */
  sortFn?: Comparator<any>;
}>;

/**
 * Filtering parameters.
 */
export type FilteringParams = Array<{
  /**
   * Column ID to filter.
   */
  id: ColumnId;

  /**
   * Filter value.
   */
  value: unknown;

  /**
   * Filter operator (equals, contains, etc.).
   */
  operator?: FilterOperator;

  /**
   * Custom filter function (overrides default).
   */
  filterFn?: Predicate<any>;
}>;

/**
 * Supported filter operators.
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'notIn'
  | 'custom';
```

### **3. Data Result Types**

```typescript
/**
 * Result from data provider load operation.
 */
export interface DataResult<TData extends RowData> {
  /**
   * Loaded data rows.
   */
  data: TData[];

  /**
   * Total row count (for pagination).
   * If undefined, client-side pagination is assumed.
   */
  totalCount?: number;

  /**
   * Page information.
   */
  pageInfo?: PageInfo;

  /**
   * Server-side processing information.
   */
  serverInfo?: ServerInfo;

  /**
   * Additional metadata.
   */
  meta?: DataMeta;

  /**
   * Load duration in milliseconds.
   */
  duration?: number;

  /**
   * Error information (if any).
   */
  error?: DataErrorInfo;
}

/**
 * Page information for paginated results.
 */
export interface PageInfo {
  /**
   * Current page index.
   */
  pageIndex: number;

  /**
   * Page size.
   */
  pageSize: number;

  /**
   * Total number of pages.
   */
  totalPages?: number;

  /**
   * Has next page.
   */
  hasNextPage?: boolean;

  /**
   * Has previous page.
   */
  hasPreviousPage?: boolean;
}

/**
 * Server-side processing information.
 */
export interface ServerInfo {
  /**
   * Server processing time in milliseconds.
   */
  processingTime?: number;

  /**
   * Server memory usage.
   */
  memoryUsage?: number;

  /**
   * Server-side filtering applied.
   */
  filtered?: boolean;

  /**
   * Server-side sorting applied.
   */
  sorted?: boolean;

  /**
   * Query execution plan.
   */
  executionPlan?: unknown;
}

/**
 * Data metadata.
 */
export interface DataMeta {
  /**
   * Data source identifier.
   */
  source?: string;

  /**
   * Data version/timestamp.
   */
  version?: string | number;

  /**
   * Data schema information.
   */
  schema?: DataSchema;

  /**
   * Cache information.
   */
  cache?: CacheInfo;

  /**
   * Custom metadata.
   */
  [key: string]: unknown;
}

/**
 * Data schema information.
 */
export interface DataSchema {
  /**
   * Column definitions.
   */
  columns?: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    format?: string;
  }>;

  /**
   * Primary keys.
   */
  primaryKeys?: string[];

  /**
   * Foreign keys.
   */
  foreignKeys?: Array<{
    column: string;
    references: string;
  }>;
}
```

### **4. Event and Error Types**

```typescript
/**
 * Data update listener.
 */
export type DataListener<TData extends RowData> = (
  event: DataEvent<TData>
) => void;

/**
 * Data change event.
 */
export interface DataEvent<TData extends RowData> {
  /**
   * Event type.
   */
  type: DataEventType;

  /**
   * Event data.
   */
  data: TData[];

  /**
   * Affected row IDs.
   */
  rowIds?: RowId[];

  /**
   * Change metadata.
   */
  meta?: DataEventMeta;

  /**
   * Event timestamp.
   */
  timestamp: number;
}

/**
 * Data event types.
 */
export type DataEventType =
  | 'data:loaded' // Initial load
  | 'data:changed' // Data modified
  | 'data:added' // Rows added
  | 'data:updated' // Rows updated
  | 'data:removed' // Rows removed
  | 'data:refreshed' // Full refresh
  | 'data:error' // Error occurred
  | 'data:progress' // Loading progress
  | 'data:cancelled'; // Operation cancelled

/**
 * Data event metadata.
 */
export interface DataEventMeta {
  /**
   * Operation source.
   */
  source?: string;

  /**
   * Operation ID.
   */
  operationId?: string;

  /**
   * Progress information.
   */
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };

  /**
   * Custom metadata.
   */
  [key: string]: unknown;
}

/**
 * Data error information.
 */
export interface DataErrorInfo {
  /**
   * Error code.
   */
  code: DataErrorCode;

  /**
   * Error message.
   */
  message: string;

  /**
   * Original error (if any).
   */
  originalError?: unknown;

  /**
   * Error context.
   */
  context?: Record<string, unknown>;

  /**
   * Error timestamp.
   */
  timestamp: number;
}

/**
 * Data error codes.
 */
export type DataErrorCode =
  | 'DATA_LOAD_FAILED'
  | 'DATA_SAVE_FAILED'
  | 'DATA_VALIDATION_FAILED'
  | 'DATA_CONNECTION_FAILED'
  | 'DATA_TIMEOUT'
  | 'DATA_UNAUTHORIZED'
  | 'DATA_FORBIDDEN'
  | 'DATA_NOT_FOUND'
  | 'DATA_CONFLICT'
  | 'DATA_INVALID_FORMAT'
  | 'DATA_QUOTA_EXCEEDED'
  | 'DATA_CANCELLED';
```

### **5. Supporting Types**

```typescript
/**
 * Provider metadata.
 */
export interface ProviderMeta {
  /**
   * Provider name.
   */
  name: string;

  /**
   * Provider version.
   */
  version: string;

  /**
   * Provider capabilities.
   */
  capabilities: ProviderCapabilities;

  /**
   * Supported features.
   */
  features: ProviderFeatures;

  /**
   * Configuration options.
   */
  config?: Record<string, unknown>;
}

/**
 * Provider capabilities.
 */
export interface ProviderCapabilities {
  /**
   * Supports loading data.
   */
  canLoad: boolean;

  /**
   * Supports saving data.
   */
  canSave: boolean;

  /**
   * Supports real-time updates.
   */
  canSubscribe: boolean;

  /**
   * Supports pagination.
   */
  supportsPagination: boolean;

  /**
   * Supports server-side sorting.
   */
  supportsSorting: boolean;

  /**
   * Supports server-side filtering.
   */
  supportsFiltering: boolean;

  /**
   * Supports search.
   */
  supportsSearch: boolean;

  /**
   * Supports batch operations.
   */
  supportsBatch: boolean;

  /**
   * Supports transactions.
   */
  supportsTransactions: boolean;

  /**
   * Supports caching.
   */
  supportsCaching: boolean;
}

/**
 * Provider features.
 */
export interface ProviderFeatures {
  /**
   * Real-time updates.
   */
  realtime?: boolean;

  /**
   * Offline support.
   */
  offline?: boolean;

  /**
   * Conflict resolution.
   */
  conflictResolution?: boolean;

  /**
   * Data validation.
   */
  validation?: boolean;

  /**
   * Data encryption.
   */
  encryption?: boolean;

  /**
   * Compression.
   */
  compression?: boolean;

  /**
   * Query optimization.
   */
  queryOptimization?: boolean;
}

/**
 * Cache information.
 */
export interface CacheInfo {
  /**
   * Cache hit/miss.
   */
  hit: boolean;

  /**
   * Cache key.
   */
  key?: string;

  /**
   * Cache age in milliseconds.
   */
  age?: number;

  /**
   * Cache size.
   */
  size?: number;

  /**
   * Cache strategy.
   */
  strategy?: CacheStrategy;
}

/**
 * Cache strategies.
 */
export type CacheStrategy =
  | 'none'
  | 'memory'
  | 'disk'
  | 'network'
  | 'hybrid'
  | 'custom';
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No provider implementations (separate tasks)
- ❌ No data transformation logic
- ❌ No caching implementations
- ❌ No error recovery logic
- ❌ No framework-specific adapters
- ❌ No complex query builders

## 📁 **File Structure**

```
packages/data/src/types/
├── provider.ts           # Main interface
├── params.ts            # Load parameters
├── result.ts            # Data result types
├── events.ts            # Event types
├── errors.ts            # Error types
├── metadata.ts          # Metadata types
└── index.ts            # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('DataProvider Interface', () => {
  test('defines correct method signatures', () => {
    type Provider = DataProvider<any>;

    expectTypeOf<Provider['load']>()
      .toBeFunction()
      .returns.toMatchTypeOf<DataResult<any> | Promise<DataResult<any>>>();

    expectTypeOf<Provider['save']>().toBeFunction().toBeOptional();

    expectTypeOf<Provider['subscribe']>().toBeFunction().toBeOptional();
  });

  test('LoadParams has correct structure', () => {
    const params: LoadParams = {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      sorting: [
        {
          id: 'name' as ColumnId,
          desc: false,
        },
      ],
      filtering: [
        {
          id: 'status' as ColumnId,
          value: 'active',
          operator: 'equals',
        },
      ],
      search: 'john',
      signal: new AbortController().signal,
    };

    expect(params.pagination?.pageIndex).toBe(0);
    expect(params.sorting?.[0]?.id).toBe('name');
  });

  test('DataResult includes all required fields', () => {
    const result: DataResult<any> = {
      data: [{ id: 1, name: 'Test' }],
      totalCount: 1,
      pageInfo: {
        pageIndex: 0,
        pageSize: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      meta: {
        source: 'static',
        version: '1.0',
      },
    };

    expect(result.data).toBeDefined();
    expect(result.totalCount).toBe(1);
  });
});
```

## 💡 **Design Patterns**

```typescript
// 1. Strategy Pattern for pluggable data sources
interface DataStrategy<T> {
  load(params: LoadParams): Promise<DataResult<T>>;
  // ... other operations
}

// 2. Builder Pattern for complex parameter construction
class LoadParamsBuilder {
  private params: Partial<LoadParams> = {};

  pagination(page: number, size: number) {
    this.params.pagination = { pageIndex: page, pageSize: size };
    return this;
  }

  build(): LoadParams {
    return this.params as LoadParams;
  }
}

// 3. Factory Pattern for provider creation
function createProvider<T>(type: ProviderType, config: any): DataProvider<T> {
  switch (type) {
    case 'static':
      return new StaticProvider<T>(config);
    case 'rest':
      return new RestProvider<T>(config);
    case 'graphql':
      return new GraphQLProvider<T>(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
```

## 📊 **Success Metrics**

- ✅ Interface supports all common data source types
- ✅ TypeScript provides full IntelliSense for all methods
- ✅ All optional methods clearly marked
- ✅ Error types cover all common failure scenarios
- ✅ Metadata enables provider discovery and introspection
- ✅ 100% type test coverage

## 🎯 **AI Implementation Instructions**

1. **Start with main `DataProvider` interface** - core contract
2. **Define `LoadParams` types** - for data loading
3. **Create `DataResult` types** - for operation results
4. **Add event and error types** - for async operations
5. **Implement supporting metadata types** - for introspection
6. **Write comprehensive type tests** - verify all scenarios

**Critical:** This interface must be flexible enough to support all planned data providers (static, REST, GraphQL, WebSocket, IndexedDB) while remaining type-safe.

---

**Status:** Ready for implementation. Foundation for all data providers. Focus on flexibility and type safety.
