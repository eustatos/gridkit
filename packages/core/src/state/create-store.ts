/**
 * Creates a reactive store for state management.
 * 
 * Implements a simple pub/sub pattern with immutable state updates.
 * All state updates create new state objects.
 * 
 * @template T - The state type
 * 
 * @param initialState - Initial state value
 * @returns Store instance
 * 
 * @example
 * Basic usage:
 * ```typescript
 * interface AppState {
 *   count: number;
 *   user: User | null;
 * }
 * 
 * const store = createStore<AppState>({
 *   count: 0,
 *   user: null,
 * });
 * 
 * // Subscribe to changes
 * const unsubscribe = store.subscribe((state) => {
 *   console.log('Count:', state.count);
 * });
 * 
 * // Update state
 * store.setState(prev => ({ ...prev, count: prev.count + 1 }));
 * 
 * // Cleanup
 * unsubscribe();
 * ```
 * 
 * @example
 * With immediate notification:
 * ```typescript
 * // Listener called immediately with current state
 * store.subscribe((state) => {
 *   console.log('Initial state:', state);
 * }, true);
 * ```
 * 
 * @public
 */
export function createStore<T>(initialState: T) {
  let state: T = initialState;
  const listeners = new Set<(state: T) => void>();
  let isDestroyed = false;
  
  /**
   * Check if store is destroyed and throw if it is.
   */
  function checkDestroyed(): void {
    if (isDestroyed) {
      throw new Error('Cannot perform operation on destroyed store');
    }
  }
  
  const store = {
    getState(): T {
      checkDestroyed();
      return state;
    },
    
    setState(updater: T | ((prev: T) => T)): void {
      checkDestroyed();
      
      const newState = typeof updater === 'function'
        ? (updater as (prev: T) => T)(state)
        : updater;
      
      // Only update if state actually changed (reference equality)
      if (newState !== state) {
        state = newState;
        
        // Notify all listeners with the new state
        // Use Array.from to create a snapshot in case listeners
        // unsubscribe during iteration
        const listenersSnapshot = Array.from(listeners);
        listenersSnapshot.forEach(listener => {
          listener(state);
        });
      }
    },
    
    subscribe(listener: (state: T) => void, fireImmediately = false): () => void {
      checkDestroyed();
      
      listeners.add(listener);
      
      // Optionally fire immediately with current state
      if (fireImmediately) {
        listener(state);
      }
      
      // Return unsubscribe function
      return () => {
        listeners.delete(listener);
      };
    },
    
    reset(): void {
      checkDestroyed();
      
      // Only reset if state is different from initial
      if (state !== initialState) {
        state = initialState;
        
        // Notify listeners of reset
        const listenersSnapshot = Array.from(listeners);
        listenersSnapshot.forEach(listener => {
          listener(state);
        });
      }
    },
    
    destroy(): void {
      if (!isDestroyed) {
        isDestroyed = true;
        listeners.clear();
      }
    },
  };
  
  return store;
}