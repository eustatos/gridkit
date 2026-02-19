import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - Basic Functionality', () => {
  describe('Initial State', () => {
    test('creates store with primitive initial state', () => {
      const store = createStore(0);
      expect(store.getState()).toBe(0);
    });

    test('creates store with object initial state', () => {
      const initialState = { count: 0, name: 'test' };
      const store = createStore(initialState);
      expect(store.getState()).toEqual(initialState);
    });

    test('creates store with array initial state', () => {
      const initialState = [1, 2, 3];
      const store = createStore(initialState);
      expect(store.getState()).toEqual(initialState);
    });

    test('creates store with nested objects', () => {
      const initialState = {
        user: { name: 'Alice', age: 30 },
        settings: { theme: 'dark', lang: 'en' },
      };
      const store = createStore(initialState);
      expect(store.getState()).toEqual(initialState);
    });
  });

  describe(' getState()', () => {
    test('returns immutable copy of state', () => {
      const store = createStore({ count: 0 });
      const state = store.getState();

      expect(state).toEqual({ count: 0 });

      // Attempt to modify returned state should not affect store
      // In strict mode this will throw, but we verify store is unchanged
      try {
        // @ts-expect-error - testing immutability
        state.count = 100;
      } catch {
        // Expected in strict mode
      }

      expect(store.getState().count).toBe(0);
    });

    test('returns frozen object in development', () => {
      const store = createStore({ count: 0 });
      const state = store.getState();

      // In Node.js/Vitest, Object.isFrozen works
      expect(Object.isFrozen(state)).toBe(true);
    });
  });

  describe(' setState()', () => {
    test('accepts direct value', () => {
      const store = createStore({ count: 0 });
      store.setState({ count: 5 });
      expect(store.getState()).toEqual({ count: 5 });
    });

    test('accepts updater function', () => {
      const store = createStore({ count: 0 });
      store.setState((prev) => ({ count: prev.count + 10 }));
      expect(store.getState()).toEqual({ count: 10 });
    });

    test('chain multiple updates', () => {
      const store = createStore({ count: 0 });
      store.setState((prev) => ({ count: prev.count + 1 }));
      store.setState((prev) => ({ count: prev.count + 2 }));
      store.setState((prev) => ({ count: prev.count + 3 }));
      expect(store.getState()).toEqual({ count: 6 });
    });

    test('handles async-like updates', () => {
      const store = createStore({ count: 0 });
      
      // Simulate multiple async updates
      for (let i = 0; i < 5; i++) {
        store.setState((prev) => ({ count: prev.count + 1 }));
      }

      expect(store.getState()).toEqual({ count: 5 });
    });
  });

  describe('Return Value', () => {
    test('returns false when state unchanged (direct value)', () => {
      const store = createStore({ count: 0 });
      const result1 = store.setState({ count: 0 });
      expect(result1).toBe(false);
    });

    test('returns false when state unchanged (updater)', () => {
      const store = createStore({ count: 0 });
      const result1 = store.setState((prev) => ({ count: prev.count }));
      expect(result1).toBe(false);
    });

    test('returns true when state changes (direct value)', () => {
      const store = createStore({ count: 0 });
      const result1 = store.setState({ count: 1 });
      expect(result1).toBe(true);
    });

    test('returns true when state changes (updater)', () => {
      const store = createStore({ count: 0 });
      const result1 = store.setState((prev) => ({ count: prev.count + 1 }));
      expect(result1).toBe(true);
    });

    test('returns true after false (state changed then unchanged)', () => {
      const store = createStore({ count: 0 });
      
      store.setState({ count: 0 }); // false
      const result2 = store.setState({ count: 1 }); // true
      expect(result2).toBe(true);
    });
  });
});
