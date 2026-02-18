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

/**
 * Provider type for runtime type checking.
 */
export type ProviderType = 'static' | 'rest' | 'graphql' | 'websocket' | 'indexeddb' | 'custom';
