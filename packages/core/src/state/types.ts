/**
 * GridKit State Store Types
 * 
 * This module contains the types and interfaces for the reactive state store.
 * The store provides immutable state management with pub/sub pattern.
 * 
 * @module @gridkit/core/state
 */

import type { Updater, Listener, Unsubscribe } from '../types/base';

/**
 * Store interface for reactive state management.
 * 
 * @template T - The state type
 * 
 * @example
 * Basic usage:
 * ```typescript
 * interface AppState {
 *   count: number;
 *   user: User | null;
 * }
 * 
 * const store: Store<AppState> = createStore({
 *   count: 0,
 *   user: null,
 * });
 * 
 * // Subscribe to changes
 * const unsubscribe = store.subscribe((state) => {
 *   console.log('State updated:', state);
 * });
 * 
 * // Update state
 * store.setState(prev => ({ ...prev, count: prev.count + 1 }));
 * 
 * // Cleanup
 * unsubscribe();
 * ```
 * 
 * @public
 */
export interface Store<T> {
  /**
   * Get current state (immutable).
   * 
   * @returns Current state
   * 
   * @example
   * ```typescript
   * const currentState = store.getState();
   * console.log('Current count:', currentState.count);
   * ```
   */
  getState(): T;
  
  /**
   * Update state immutably.
   * 
   * @param updater - New state or updater function
   * 
   * @example
   * Direct state update:
   * ```typescript
   * store.setState({ count: 10, user: null });
   * ```
   * 
   * @example
   * Updater function (recommended for complex updates):
   * ```typescript
   * store.setState(prev => ({ 
   *   ...prev, 
   *   count: prev.count + 1 
   * }));
   * ```
   * 
   * @throws {Error} If store is destroyed
   */
  setState(updater: Updater<T>): void;
  
  /**
   * Subscribe to state changes.
   * Listener is called immediately with current state if `fireImmediately` is true,
   * then on every state update.
   * 
   * @param listener - Callback function that receives the new state
   * @param fireImmediately - Whether to call listener immediately with current state
   * @returns Unsubscribe function to remove the listener
   * 
   * @example
   * Basic subscription:
   * ```typescript
   * const unsubscribe = store.subscribe((state) => {
   *   console.log('State changed:', state);
   * });
   * ```
   * 
   * @example
   * With immediate notification:
   * ```typescript
   * store.subscribe((state) => {
   *   console.log('Initial state:', state);
   * }, true);
   * ```
   * 
   * @throws {Error} If store is destroyed
   */
  subscribe(listener: Listener<T>, fireImmediately?: boolean): Unsubscribe;
  
  /**
   * Reset state to initial value.
   * 
   * @example
   * ```typescript
   * store.setState({ count: 10 });
   * console.log(store.getState().count); // 10
   * 
   * store.reset();
   * console.log(store.getState().count); // 0 (initial value)
   * ```
   * 
   * @throws {Error} If store is destroyed
   */
  reset(): void;
  
  /**
   * Destroy store and remove all listeners.
   * Store cannot be used after calling this.
   * 
   * @example
   * ```typescript
   * store.destroy();
   * 
   * // These will throw errors:
   * // store.getState();
   * // store.setState({ count: 1 });
   * // store.subscribe(() => {});
   * ```
   */
  destroy(): void;
}