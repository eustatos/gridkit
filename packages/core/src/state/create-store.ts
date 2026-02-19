import { Store, StoreOptions, Updater, StateListener } from './types';
import { deepClone } from './utils/clone';
import { shallowEqual } from './utils/equality';
import { validateNotDestroyed } from './utils/validation';

/**
 * Computes new state with immutability guarantees.
 */
function computeNewState<TState>(
  currentState: TState,
  updater: Updater<TState>
): TState {
  if (typeof updater === 'function') {
    const updaterFn = updater as (prev: TState) => TState;

    // For functions, ensure they don't mutate current state
    const clonedState = deepClone(currentState);
    const result = updaterFn(clonedState);

    // Ensure function returns a new object
    if (result === clonedState) {
      console.warn('[Store] Updater function returned same reference');
    }

    return result;
  }

  // Direct value - must be different reference
  if (updater === currentState) {
    console.warn('[Store] setState called with same reference');
    return currentState;
  }

  return updater;
}

/**
 * Safely notifies all listeners with error boundaries.
 */
function notifyListeners<TState>(
  listeners: Set<WeakRef<StateListener<TState>>>,
  state: TState
): void {
  const deadRefs: WeakRef<StateListener<TState>>[] = [];

  for (const ref of listeners) {
    const listener = ref.deref();

    if (!listener) {
      // Listener was garbage collected
      deadRefs.push(ref);
      continue;
    }

    safeNotify(listener, state);
  }

  // Clean up dead references
  deadRefs.forEach((ref) => listeners.delete(ref));
}

/**
 * Safely calls listener with error handling.
 */
function safeNotify<TState>(
  listener: StateListener<TState>,
  state: TState
): void {
  try {
    listener(state);
  } catch (error) {
    console.error('[Store] Error in listener:', error);
    // Don't throw - preserve other listeners
  }
}

/**
 * Cleanup handler for FinalizationRegistry.
 */
function cleanupListener(listenerId: symbol): void {
  // Called when listener is garbage collected
  // Additional cleanup if needed
}

/**
 * Creates a reactive state store.
 *
 * @template TState - State type
 * @param initialState - Initial state (will be deep cloned)
 * @param options - Store configuration
 */
export function createStore<TState>(
  initialState: TState,
  options: StoreOptions = {}
): Store<TState> {
  // Deep clone initial state to prevent mutations
  let currentState = deepClone(initialState);
  let isDestroyed = false;

  // Use WeakRef for automatic cleanup
  const listeners = new Set<WeakRef<StateListener<TState>>>();
  const cleanupRegistry = new FinalizationRegistry<symbol>(cleanupListener);

  // Performance tracking
  let updateCount = 0;
  let lastUpdateTime = 0;

  // Batch state
  let isBatching = false;
  let hasPendingUpdate = false;
  let batchDepth = 0;

  // Store instance
  const store: Store<TState> = {
    getState: () => {
      validateNotDestroyed(isDestroyed);
      return Object.freeze(deepClone(currentState));
    },

    setState: (updater) => {
      validateNotDestroyed(isDestroyed);

      const startTime = performance.now();
      const newState = computeNewState(currentState, updater);

      // Skip if state unchanged
      if (shallowEqual(currentState, newState)) {
        return false;
      }

      // Update state reference
      currentState = newState;
      updateCount++;
      lastUpdateTime = Date.now();

      // Notify listeners (unless batching)
      if (!isBatching) {
        notifyListeners(listeners, currentState);
      } else {
        hasPendingUpdate = true;
      }

      // Performance logging
      const duration = performance.now() - startTime;
      if (options.debug && duration > (options.slowUpdateThreshold ?? 16)) {
        console.warn(`[Store] Slow state update: ${duration.toFixed(2)}ms`);
      }

      return true;
    },

    subscribe: (listener, options = {}) => {
      validateNotDestroyed(isDestroyed);

      // Create WeakRef for automatic cleanup
      const listenerRef = new WeakRef(listener);
      const listenerId = Symbol('listener');

      // Track for cleanup
      listeners.add(listenerRef);
      cleanupRegistry.register(listener, listenerId);

      // Fire immediately if requested
      if (options.fireImmediately) {
        safeNotify(listener, currentState);
      }

      // Return unsubscribe function
      return () => {
        listeners.delete(listenerRef);
        cleanupRegistry.unregister(listener);
      };
    },

    batch: (updater) => {
      validateNotDestroyed(isDestroyed);

      const wasBatching = isBatching;
      const wasPending = hasPendingUpdate;
      const wasDepth = batchDepth;
      
      isBatching = true;
      batchDepth++;
      hasPendingUpdate = false;

      let success = false;
      try {
        updater();
        success = true;
      } finally {
        batchDepth--;
        
        if (success && hasPendingUpdate && batchDepth === 0) {
          // Only notify on successful outermost batch completion
          notifyListeners(listeners, currentState);
          hasPendingUpdate = false;
        }
        
        if (batchDepth === 0) {
          // Outermost batch completed
          isBatching = false;
        } else {
          // Restore previous batch state for nested batches
          isBatching = wasBatching;
          hasPendingUpdate = wasPending || hasPendingUpdate;
        }
      }
    },

    reset: () => {
      validateNotDestroyed(isDestroyed);

      store.setState(() => deepClone(initialState));
    },

    destroy: () => {
      if (isDestroyed) return;

      // Clear all listeners
      listeners.clear();
      // Note: FinalizationRegistry doesn't have unregisterAll in all environments
      // cleanupRegistry.unregisterAll?.();

      // Clear state references
      currentState = null as any;
      isDestroyed = true;

      // Performance summary
      if (options.debug) {
        console.log(`[Store] Destroyed after ${updateCount} updates`);
      }
    },
  };

  return store;
}
