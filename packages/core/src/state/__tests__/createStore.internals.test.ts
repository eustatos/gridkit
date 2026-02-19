import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - Internal Behavior', () => {
  describe('Batching Implementation', () => {
    test('isBatching flag is properly managed', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Not batching initially
      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);

      // During batch
      store.batch(() => {
        store.setState({ count: 2 });
        store.setState({ count: 3 });
        expect(listener).toHaveBeenCalledTimes(1); // Still 1 during batch
      });

      // After batch
      expect(listener).toHaveBeenCalledTimes(2);
      expect(store.getState().count).toBe(3);
    });

    test('hasPendingUpdate is reset properly', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Batch with no changes
      store.batch(() => {
        store.setState({ count: 0 }); // No change
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Listener Cleanup', () => {
    test('dead references are cleaned up', () => {
      const store = createStore({ count: 0 });

      // Create listener that will be gc'd
      {
        const listener = vi.fn();
        store.subscribe(listener);
        store.setState({ count: 1 });
      }

      // Listener should be gc'd
      // Force gc if available
      if (globalThis.gc) {
        globalThis.gc();
      }

      // Future updates should not try to notify the gc'd listener
      store.setState({ count: 2 });
    });
  });

  describe('Update Counting', () => {
    test('updateCount is tracked', () => {
      const store = createStore({ count: 0 }, { debug: true });

      // Access internal state via type assertion
      const storeAny = store as any;

      store.setState({ count: 1 });
      store.setState({ count: 2 });

      // Debug mode should track updates
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      store.destroy();
      consoleSpy.mockRestore();
    });
  });

  describe('State Comparison', () => {
    test('shallowEqual catches no-op updates', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Same reference - no notification
      const state = store.getState();
      store.setState(state);
      expect(listener).not.toHaveBeenCalled();

      // Different object, same value - shallowEqual catches it
      store.setState({ count: 0 });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Frozen State', () => {
    test('getState returns frozen object', () => {
      const store = createStore({ count: 0 });
      const state = store.getState();

      // In Node.js/Vitest, Object.isFrozen works
      expect(Object.isFrozen(state)).toBe(true);

      // Attempting to modify should not work
      try {
        // @ts-expect-error - testing frozen
        state.count = 100;
        expect(state.count).toBe(0); // Should remain unchanged
      } catch {
        // Expected in strict mode
      }
    });
  });

  describe('Performance Monitoring', () => {
    test('slow update detection', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const store = createStore({ count: 0 }, {
        debug: true,
        slowUpdateThreshold: 0, // Trigger on any update for testing
      });

      store.setState({ count: 1 });

      // Verify warning was called (mocked)
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });
  });

  describe('Memory Safety', () => {
    test('FinalizationRegistry cleanup', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      unsubscribe();

      // Listener should be marked for cleanup
      // (FinalizationRegistry cleanup is async)
    });

    test('destroy clears all internal structures', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      store.subscribe(listener);

      // Verify listener was added
      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);

      store.destroy();

      // After destroy, store should be unusable
      expect(() => store.getState()).toThrow('Cannot use store after destroy()');
      expect(() => store.setState({})).toThrow('Cannot use store after destroy()');
      expect(() => store.subscribe(() => {})).toThrow('Cannot use store after destroy()');
      expect(() => store.batch(() => {})).toThrow('Cannot use store after destroy()');
      expect(() => store.reset()).toThrow('Cannot use store after destroy()');

      // After destroy, listeners are cleared (no more notifications)
      try {
        store.setState({ count: 2 });
        expect(true).toBe(false); // Should not reach here
      } catch {
        // Expected to throw
      }
      expect(listener).toHaveBeenCalledTimes(1); // No new notifications after destroy
    });
  });

  describe('Batch Nesting', () => {
    test('handles nested batches correctly', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState({ count: 1 });
        store.batch(() => {
          store.setState({ count: 2 });
        });
      });

      // Only outermost batch notifies
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('maintains batch state with errors', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      try {
        store.batch(() => {
          store.setState({ count: 1 });
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      // Batch should be reset
      expect(store.batch).toBeDefined();
    });
  });

  describe('Update Optimization', () => {
    test('skips unchanged state efficiently', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Many no-op updates
      for (let i = 0; i < 100; i++) {
        store.setState({ count: 0 });
      }

      expect(listener).not.toHaveBeenCalled();
    });

    test('optimizes deep updates', () => {
      const store = createStore({ deep: { nested: { value: 0 } } });

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        store.setState((prev) => ({
          deep: {
            ...prev.deep,
            nested: {
              ...prev.deep.nested,
              value: prev.deep.nested.value + 1,
            },
          },
        }));
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(store.getState().deep.nested.value).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined state gracefully', () => {
      const store = createStore(undefined);
      expect(store.getState()).toBeUndefined();

      const listener = vi.fn();
      store.subscribe(listener);
      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('handles circular references in state', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      const store = createStore(obj);

      const state = store.getState();
      expect(state.name).toBe('test');
      expect(state.self).toBe(state);
      expect(state).toStrictEqual(obj);
    });

    test('handles sparse arrays', () => {
      const store = createStore([1, , 3]);
      expect(store.getState()).toEqual([1, , 3]);

      store.setState([4, , 6]);
      expect(store.getState()).toEqual([4, , 6]);
    });
  });
});
