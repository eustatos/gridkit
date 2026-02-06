/**
 * State update function or direct value.
 */
export type Updater<T> = T | ((prev: T) => T);

/**
 * State change listener.
 */
export type StateListener<T> = (state: T) => void;

/**
 * Store configuration options.
 */
export interface StoreOptions {
  /**
   * Enable debug mode with performance logging.
   * @default false
   */
  debug?: boolean;

  /**
   * Threshold for slow update warnings (ms).
   * @default 16 (60fps frame budget)
   */
  slowUpdateThreshold?: number;

  /**
   * Enable state change history for debugging.
   * @default false
   */
  enableHistory?: boolean;

  /**
   * Maximum history size when enabled.
   * @default 100
   */
  maxHistorySize?: number;

  /**
   * Enable state validation on updates.
   * @default false
   */
  validateState?: boolean;
}

/**
 * Subscription options.
 */
export interface SubscribeOptions {
  /**
   * Call listener immediately with current state.
   * @default false
   */
  fireImmediately?: boolean;

  /**
   * Only notify when state passes predicate.
   */
  predicate?: (state: any) => boolean;

  /**
   * Equality function to prevent unnecessary notifications.
   */
  equalityFn?: (a: any, b: any) => boolean;
}

/**
 * Reactive state store with immutable updates.
 * Provides pub/sub pattern with automatic cleanup.
 *
 * @template TState - State type (must be serializable)
 *
 * @example
 * ```typescript
 * interface AppState {
 *   count: number;
 *   user: { name: string };
 * }
 *
 * const store = createStore<AppState>({
 *   count: 0,
 *   user: { name: 'Alice' },
 * });
 *
 * // Subscribe to changes
 * const unsubscribe = store.subscribe(state => {
 *   console.log('State updated:', state);
 * });
 *
 * // Update state immutably
 * store.setState(prev => ({
 *   ...prev,
 *   count: prev.count + 1,
 * }));
 *
 * // Cleanup
 * unsubscribe();
 * store.destroy();
 * ```
 */
export interface Store<TState> {
  /**
   * Get current immutable state.
   * Returns a frozen copy for safety.
   */
  getState(): Readonly<TState>;

  /**
   * Update state immutably.
   * Returns true if state changed.
   */
  setState(updater: Updater<TState>): boolean;

  /**
   * Subscribe to state changes.
   * Returns cleanup function for memory safety.
   */
  subscribe(
    listener: StateListener<TState>,
    options?: SubscribeOptions
  ): Unsubscribe;

  /**
   * Batch multiple updates in single notification.
   */
  batch(updater: () => void): void;

  /**
   * Reset to initial state.
   */
  reset(): void;

  /**
   * Destroy store and cleanup resources.
   */
  destroy(): void;
}

/**
 * Unsubscribe function returned by subscribe.
 */
export type Unsubscribe = () => void;