---
task_id: CORE-011
epic_id: EPIC-001
module: @gridkit/core
file: src/core/state/create-store.ts
priority: P0
complexity: medium
estimated_tokens: ~12,000
assignable_to_ai: yes
dependencies:
  - CORE-001
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
  - docs/patterns/factory-pattern.md
---

# Task: Implement State Store

## Context

Implement a lightweight, reactive state store for table state management. This is the foundation for all state updates - it must be:
- Immutable (all updates create new state)
- Observable (subscribers notified on changes)
- Performant (minimal overhead)
- Type-safe (full TypeScript support)

This store is used internally by the table to manage all state (sorting, filtering, selection, etc.).

## Guidelines Reference

- `.github/AI_GUIDELINES.md` - Factory pattern, performance
- `CONTRIBUTING.md` - Code organization
- `docs/architecture/ARCHITECTURE.md` - State management pattern

## Objectives

- [ ] Implement `createStore<T>()` factory function
- [ ] Implement `Store<T>` interface
- [ ] Support both direct state and updater functions
- [ ] Implement pub/sub pattern for subscribers
- [ ] Add lifecycle methods (reset, destroy)
- [ ] Ensure immutability
- [ ] Add comprehensive tests

---

## Implementation Requirements

### 1. Store Interface

**File: `src/core/state/types.ts`**

```typescript
import type { Updater, Listener, Unsubscribe } from '../types/base';

/**
 * Store interface for reactive state management.
 * 
 * @template T - The state type
 * 
 * @public
 */
export interface Store<T> {
  /**
   * Get current state (immutable).
   * 
   * @returns Current state
   */
  getState(): T;
  
  /**
   * Update state immutably.
   * 
   * @param updater - New state or updater function
   * 
   * @example
   * ```typescript
   * // Direct state
   * store.setState(newState);
   * 
   * // Updater function (recommended)
   * store.setState(prev => ({ ...prev, count: prev.count + 1 }));
   * ```
   */
  setState(updater: Updater<T>): void;
  
  /**
   * Subscribe to state changes.
   * Listener is called immediately with current state,
   * then on every state update.
   * 
   * @param listener - Callback function
   * @param fireImmediately - Whether to call listener immediately
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = store.subscribe((state) => {
   *   console.log('State:', state);
   * });
   * 
   * // Later
   * unsubscribe();
   * ```
   */
  subscribe(listener: Listener<T>, fireImmediately?: boolean): Unsubscribe;
  
  /**
   * Reset state to initial value.
   */
  reset(): void;
  
  /**
   * Destroy store and remove all listeners.
   * Store cannot be used after calling this.
   */
  destroy(): void;
}
```

### 2. Store Implementation

**File: `src/core/state/create-store.ts`**

```typescript
import type { Updater, Listener, Unsubscribe } from '../types/base';
import type { Store } from './types';

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
export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener<T>>();
  let isDestroyed = false;
  
  const store: Store<T> = {
    getState: () => {
      if (isDestroyed) {
        throw new Error('Cannot get state from destroyed store');
      }
      return state;
    },
    
    setState: (updater: Updater<T>) => {
      if (isDestroyed) {
        throw new Error('Cannot set state on destroyed store');
      }
      
      const newState = typeof updater === 'function'
        ? (updater as (prev: T) => T)(state)
        : updater;
      
      // Only update if state actually changed
      if (newState !== state) {
        state = newState;
        
        // Notify all listeners
        listeners.forEach(listener => {
          listener(state);
        });
      }
    },
    
    subscribe: (listener: Listener<T>, fireImmediately = false) => {
      if (isDestroyed) {
        throw new Error('Cannot subscribe to destroyed store');
      }
      
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
    
    reset: () => {
      if (isDestroyed) {
        throw new Error('Cannot reset destroyed store');
      }
      
      state = initialState;
      
      // Notify listeners of reset
      listeners.forEach(listener => {
        listener(state);
      });
    },
    
    destroy: () => {
      isDestroyed = true;
      listeners.clear();
    },
  };
  
  return store;
}
```

---

## Test Requirements

**File: `src/core/state/__tests__/create-store.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../create-store';

interface TestState {
  count: number;
  name: string;
}

describe('createStore', () => {
  describe('initialization', () => {
    it('should create store with initial state', () => {
      const store = createStore<TestState>({
        count: 0,
        name: 'test',
      });
      
      expect(store.getState()).toEqual({
        count: 0,
        name: 'test',
      });
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const store = createStore({ count: 42 });
      
      expect(store.getState().count).toBe(42);
    });
    
    it('should throw when store is destroyed', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.getState()).toThrow('destroyed');
    });
  });

  describe('setState', () => {
    it('should update state with direct value', () => {
      const store = createStore({ count: 0 });
      
      store.setState({ count: 10 });
      
      expect(store.getState().count).toBe(10);
    });

    it('should update state with updater function', () => {
      const store = createStore({ count: 0 });
      
      store.setState(prev => ({ count: prev.count + 1 }));
      
      expect(store.getState().count).toBe(1);
    });

    it('should create new state object (immutability)', () => {
      const store = createStore({ count: 0 });
      const oldState = store.getState();
      
      store.setState(prev => ({ count: prev.count + 1 }));
      const newState = store.getState();
      
      expect(newState).not.toBe(oldState);
    });

    it('should not notify listeners if state unchanged', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      
      // Set to same reference
      const currentState = store.getState();
      store.setState(currentState);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should throw when store is destroyed', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.setState({ count: 1 })).toThrow('destroyed');
    });
  });

  describe('subscribe', () => {
    it('should call listener on state change', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      store.setState({ count: 1 });
      
      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });

    it('should call listener immediately when fireImmediately is true', () => {
      const store = createStore({ count: 42 });
      const listener = vi.fn();
      
      store.subscribe(listener, true);
      
      expect(listener).toHaveBeenCalledWith({ count: 42 });
    });

    it('should not call listener immediately by default', () => {
      const store = createStore({ count: 42 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const store = createStore({ count: 0 });
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      store.subscribe(listener1);
      store.subscribe(listener2);
      
      store.setState({ count: 1 });
      
      expect(listener1).toHaveBeenCalledWith({ count: 1 });
      expect(listener2).toHaveBeenCalledWith({ count: 1 });
    });

    it('should return unsubscribe function', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      const unsubscribe = store.subscribe(listener);
      
      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      store.setState({ count: 2 });
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle unsubscribe multiple times safely', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      const unsubscribe = store.subscribe(listener);
      
      unsubscribe();
      unsubscribe(); // Should not throw
      
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should throw when subscribing to destroyed store', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.subscribe(() => {})).toThrow('destroyed');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = createStore({ count: 0 });
      
      store.setState({ count: 10 });
      expect(store.getState().count).toBe(10);
      
      store.reset();
      expect(store.getState().count).toBe(0);
    });

    it('should notify listeners on reset', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      store.setState({ count: 10 });
      
      listener.mockClear();
      
      store.reset();
      
      expect(listener).toHaveBeenCalledWith({ count: 0 });
    });

    it('should throw when store is destroyed', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.reset()).toThrow('destroyed');
    });
  });

  describe('destroy', () => {
    it('should clear all listeners', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      store.destroy();
      
      // setState would throw, but listeners are cleared
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow multiple destroy calls', () => {
      const store = createStore({ count: 0 });
      
      store.destroy();
      
      expect(() => store.destroy()).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle many listeners efficiently', () => {
      const store = createStore({ count: 0 });
      const listeners = Array.from({ length: 1000 }, () => vi.fn());
      
      listeners.forEach(l => store.subscribe(l));
      
      const start = performance.now();
      store.setState({ count: 1 });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10); // < 10ms for 1000 listeners
      listeners.forEach(l => expect(l).toHaveBeenCalled());
    });

    it('should handle rapid updates efficiently', () => {
      const store = createStore({ count: 0 });
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        store.setState(prev => ({ count: prev.count + 1 }));
      }
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50); // < 50ms for 1000 updates
      expect(store.getState().count).toBe(1000);
    });
  });

  describe('memory', () => {
    it('should not leak memory with unsubscribe', () => {
      const store = createStore({ count: 0 });
      const unsubscribes: Array<() => void> = [];
      
      // Add and remove many listeners
      for (let i = 0; i < 1000; i++) {
        const unsub = store.subscribe(() => {});
        unsubscribes.push(unsub);
      }
      
      // Unsubscribe all
      unsubscribes.forEach(unsub => unsub());
      
      // After unsubscribe, internal Set should be empty
      // (We can't test this directly, but state updates should be fast)
      const start = performance.now();
      store.setState({ count: 1 });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1); // Should be instant with no listeners
    });
  });
});
```

---

## Edge Cases

- [ ] Empty initial state
- [ ] setState with same reference (should not notify)
- [ ] Multiple rapid updates
- [ ] Unsubscribe during notification
- [ ] Subscribe/unsubscribe in listener
- [ ] Destroy during notification
- [ ] Many listeners (1000+)

---

## Performance Requirements

- setState with 100 listeners: **< 5ms**
- getState: **< 0.1ms** (just return reference)
- subscribe/unsubscribe: **< 0.5ms**
- No memory leaks on unsubscribe

---

## Files to Create/Modify

- [ ] `src/core/state/types.ts` - Store interface
- [ ] `src/core/state/create-store.ts` - Implementation
- [ ] `src/core/state/__tests__/create-store.test.ts` - Tests
- [ ] `src/core/state/index.ts` - Exports
- [ ] `src/core/index.ts` - Re-export createStore

**`src/core/state/index.ts`:**
```typescript
export { createStore } from './create-store';
export type { Store } from './types';
```

---

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] TypeScript compiles without errors
- [ ] Performance benchmarks met
- [ ] No memory leaks verified
- [ ] Immutability verified (state objects never mutated)
- [ ] Follows factory pattern from AI_GUIDELINES.md
- [ ] JSDoc complete with examples

---

## Related Tasks

- **Depends on:** CORE-001 (base types)
- **Blocks:** CORE-010 (table factory uses this store)

---

## Notes for AI

- Keep it simple - this is just pub/sub with immutability
- Use Set for listeners (O(1) add/delete)
- Don't notify listeners if state reference unchanged
- Test memory leaks with many subscribe/unsubscribe cycles
- Ensure listeners are called AFTER state is updated
- Consider edge case: listener modifying state during notification (should work)