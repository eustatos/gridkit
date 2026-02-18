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

import type {
  DataProvider,
  DataResult,
  DataListener,
  DataEvent,
  DataMeta,
  ProviderMeta,
  ProviderCapabilities,
  ProviderFeatures,
  LoadParams,
  PaginationParams,
  SortingParams,
  FilteringParams,
  FilterOperator,
} from '../../types';
import type { RowData, Unsubscribe } from '@gridkit/core/types';

import { createDataError } from '../utils/errors';
import { createStaticProvider } from './factory';

// === Constants ===

const VERSION = '1.0.0';
const DEFAULT_OPTIONS: Required<StaticProviderOptions> = {
  applySorting: false,
  applyFiltering: false,
  applySearch: false,
  applyPagination: false,
  validateData: false,
};

// === Public Interface ===

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
}

/**
 * Static data provider for in-memory data arrays.
 */
export class StaticDataProvider<TData extends RowData>
  implements DataProvider<TData>
{
  // === Private State ===

  private data: TData[] = [];
  private listeners = new Set<DataListener<TData>>();
  private abortController?: AbortController;
  private version = 0;
  private readonly options: Required<StaticProviderOptions>;

  // === Public API ===

  /**
   * Creates a new static data provider.
   *
   * @param initialData - Initial data array (default: empty array)
   * @param options - Provider configuration
   */
  constructor(
    initialData: TData[] = [],
    options: StaticProviderOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.data = this.deepClone(initialData);
    this.validateInitialData();
  }

  // === DataProvider Interface ===

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
                (params.pagination.pageIndex + 1) *
                  params.pagination.pageSize <
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
        } as DataMeta,
      };
    } catch (error) {
      throw createDataError(
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
      throw createDataError(
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
      version: VERSION,
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
      } as ProviderCapabilities,
      features: {
        realtime: false,
        offline: true,
        conflictResolution: false,
        validation: this.options.validateData ?? false,
        encryption: false,
        compression: false,
        queryOptimization: false,
      } as ProviderFeatures,
      config: this.options,
    };
  }

  // === Static Factory Methods ===

  /**
   * Creates a new static data provider (static factory method).
   *
   * @param data - Initial data array
   * @param options - Provider options
   * @returns Static data provider instance
   */
  static create<TData extends RowData>(
    data: TData[] = [],
    options: StaticProviderOptions = {}
  ): StaticDataProvider<TData> {
    return new StaticDataProvider(data, options);
  }

  /**
   * Creates a static provider from existing data (shorthand).
   * @deprecated Use StaticDataProvider.create() instead.
   */
  static static<TData extends RowData>(
    data: TData[] = [],
    options: StaticProviderOptions = {}
  ): StaticDataProvider<TData> {
    return createStaticProvider(data, options);
  }

  // === Internal Methods ===

  private validateInitialData(): void {
    if (!Array.isArray(this.data)) {
      throw createDataError(
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
      throw createDataError(
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
}
