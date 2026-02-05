# CORE-011: Immutable State Store Implementation

## Task Card

```
task_id: CORE-011
priority: P0
complexity: Medium
estimated_tokens: ~12,000
ai_ready: true
dependencies: [CORE-001]
requires_review: true (reactive state foundation)
```

## 🎯 Objective

Implement a lightweight, reactive state store with immutable updates and efficient pub/sub. This store serves as the foundation for GridKit's reactive state management, providing predictable updates and memory-safe subscriptions.

## 📋 Implementation Scope

### **1. Store Core Interface**

````typescript
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
````

### **2. Main Factory Implementation**

```typescript
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
      if (options.debug && duration > options.slowUpdateThreshold) {
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

      isBatching = true;
      hasPendingUpdate = false;

      try {
        updater();
      } finally {
        isBatching = false;
        if (hasPendingUpdate) {
          notifyListeners(listeners, currentState);
          hasPendingUpdate = false;
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
      cleanupRegistry.unregisterAll?.();

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
```

### **3. State Computation Utilities**

```typescript
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
 * Deep clone with circular reference handling.
 */
function deepClone<T>(obj: T): T {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  // Handle dates
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle regular objects
  const cloned: any = {};
  const seen = new WeakMap();

  const stack = [{ original: obj, cloned }];

  while (stack.length > 0) {
    const { original, cloned } = stack.pop()!;

    // Track visited objects for circular references
    seen.set(original, cloned);

    for (const key in original) {
      if (Object.prototype.hasOwnProperty.call(original, key)) {
        const value = original[key];

        // Handle circular references
        if (value && typeof value === 'object') {
          if (seen.has(value)) {
            cloned[key] = seen.get(value);
            continue;
          }

          // Create new object/array
          let newValue: any;
          if (Array.isArray(value)) {
            newValue = [];
          } else if (value instanceof Date) {
            newValue = new Date(value.getTime());
          } else {
            newValue = {};
          }

          cloned[key] = newValue;
          stack.push({ original: value, cloned: newValue });
        } else {
          // Primitive value
          cloned[key] = value;
        }
      }
    }
  }

  return cloned as T;
}
```

### **4. Listener Management**

```typescript
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
```

### **5. Performance Optimizations**

```typescript
/**
 * Shallow equality check for state comparison.
 * Optimized for common state shapes.
 */
function shallowEqual<T>(a: T, b: T): boolean {
  // Same reference
  if (a === b) return true;

  // Different types or null
  if (typeof a !== typeof b || a === null || b === null) {
    return false;
  }

  // Compare object keys
  if (typeof a === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if ((a as any)[key] !== (b as any)[key]) {
        return false;
      }
    }

    return true;
  }

  // Primitives
  return a === b;
}

/**
 * Validates store is not destroyed.
 */
function validateNotDestroyed(isDestroyed: boolean): void {
  if (isDestroyed) {
    throw new GridError('STORE_DESTROYED', 'Cannot use store after destroy()', {
      timestamp: Date.now(),
    });
  }
}
```

### **6. Supporting Types**

```typescript
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
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No complex state persistence (localStorage, etc.)
- ❌ No middleware or enhancers
- ❌ No time-travel debugging (separate task)
- ❌ No Redux DevTools integration (separate package)
- ❌ No complex state selectors or memoization
- ❌ No framework-specific integrations

## 📁 **File Structure**

```
packages/core/src/state/
├── create-store.ts          # Main factory
├── types.ts                # Core interfaces
├── utils/                  # Internal utilities
│   ├── clone.ts           # Deep cloning
│   ├── equality.ts        # Equality checks
│   └── validation.ts      # State validation
└── index.ts              # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('createStore', () => {
  test('creates store with initial state', () => {
    const store = createStore({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  test('updates state immutably', () => {
    const store = createStore({ count: 0 });
    const oldState = store.getState();

    store.setState((prev) => ({ count: prev.count + 1 }));
    const newState = store.getState();

    expect(newState.count).toBe(1);
    expect(newState).not.toBe(oldState);
  });

  test('notifies subscribers on changes', () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();

    store.subscribe(listener);
    store.setState({ count: 1 });

    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  test('supports batching updates', () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();

    store.subscribe(listener);

    store.batch(() => {
      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.setState({ count: 3 });
    });

    // Should only notify once after batch
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().count).toBe(3);
  });

  test('cleans up on destroy', () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();

    store.subscribe(listener);
    store.destroy();

    expect(() => store.setState({ count: 1 })).toThrow('destroyed');
    expect(listener).not.toHaveBeenCalled();
  });

  test('handles deep state efficiently', () => {
    const deepState = {
      level1: {
        level2: {
          level3: { value: 'deep' },
        },
      },
    };

    const store = createStore(deepState);

    // Update deep property
    store.setState((prev) => ({
      ...prev,
      level1: {
        ...prev.level1,
        level2: {
          ...prev.level1.level2,
          level3: { value: 'updated' },
        },
      },
    }));

    expect(store.getState().level1.level2.level3.value).toBe('updated');
    // Original should remain unchanged
    expect(deepState.level1.level2.level3.value).toBe('deep');
  });
});
```

## 💡 **Performance Optimizations**

```typescript
// 1. Use WeakRef for automatic GC of listeners
const ref = new WeakRef(listener);
listeners.add(ref);

// 2. Batch microtask for multiple updates
queueMicrotask(() => {
  if (hasPendingUpdate) {
    notifyListeners(listeners, currentState);
  }
});

// 3. Skip equality checks for primitives
if (typeof currentState !== 'object' || currentState === null) {
  return currentState === newState;
}
```

## 📊 **Success Metrics**

- ✅ 1000 updates with 100 listeners < 50ms
- ✅ Memory usage stable after 10k subscribe/unsubscribe cycles
- ✅ Deep cloning handles 10-level nested objects < 5ms
- ✅ No memory leaks after destroy()
- ✅ Immutability guaranteed (Object.freeze)
- ✅ 100% test coverage for edge cases

## 🎯 **AI Implementation Instructions**

1. **Start with core store interface** - get immutability right
2. **Implement listener management** - with WeakRef for GC
3. **Add deep cloning** - handle circular references
4. **Implement batching** - for performance
5. **Add validation and error handling** - fail safely
6. **Write performance tests** - verify efficiency

**Critical:** The store must be memory-safe. WeakRef and FinalizationRegistry are essential for automatic cleanup of garbage-collected listeners.

---

**Status:** Ready for implementation. Focus on memory safety and performance.
