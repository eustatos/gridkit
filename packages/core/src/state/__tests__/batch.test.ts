import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - batch()', () => {
  describe('Basic Batching', () => {
    test('batches multiple updates', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState({ count: 1 });
        store.setState({ count: 2 });
        store.setState({ count: 3 });
      });

      // Should only notify once
      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getState()).toEqual({ count: 3 });
    });

    test('batches with nested batch calls', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState({ count: 1 });
        
        store.batch(() => {
          store.setState({ count: 2 });
        });
      });

      // Each batch notifies on completion
      expect(listener).toHaveBeenCalledTimes(2);
      expect(store.getState()).toEqual({ count: 2 });
    });
  });

  describe('Update Tracking', () => {
    test('tracks hasPendingUpdate correctly', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        // No state change
        store.setState({ count: 0 });
      });

      // Should not notify if no actual change
      expect(listener).not.toHaveBeenCalled();
    });

    test('notifies when batch causes change', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState({ count: 1 });
        store.setState({ count: 2 });
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 2 });
    });
  });

  describe('Nested Batching', () => {
    test('flattens nested batches', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState({ count: 1 });
        store.batch(() => {
          store.setState({ count: 2 });
          store.batch(() => {
            store.setState({ count: 3 });
          });
        });
      });

      // Each batch notifies on completion
      expect(listener).toHaveBeenCalledTimes(3);
      expect(store.getState()).toEqual({ count: 3 });
    });

    test('maintains batch state properly', () => {
      const store = createStore({ count: 0, nestedBatchCount: 0 });
      const listener = vi.fn();
      let batchDepth = 0;

      store.subscribe((state) => {
        listener(state);
        // Track when notifications happen
        if (batchDepth > 0) {
          throw new Error('Should not notify during batch');
        }
      });

      store.batch(() => {
        batchDepth++;
        store.setState({ count: 1 });
        
        store.batch(() => {
          batchDepth++;
          store.setState({ count: 2 });
          batchDepth--;
        });
        
        batchDepth--;
      });

      // Only 1 notification at the end (when batchDepth returns to 0)
      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getState()).toEqual({ count: 2 });
    });
  });

  describe('Error Handling', () => {
    test('does not notify if batch throws', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      try {
        store.batch(() => {
          store.setState({ count: 1 });
          throw new Error('Batch error');
        });
      } catch {
        // Expected
      }

      // Should not have notified due to error
      expect(listener).not.toHaveBeenCalled();
    });

    test('resets batch state after error', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // First batch with error
      try {
        store.batch(() => {
          store.setState({ count: 1 });
          throw new Error('Batch error');
        });
      } catch {
        // Expected
      }

      // Second batch should work normally
      store.batch(() => {
        store.setState({ count: 2 });
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getState()).toEqual({ count: 2 });
    });
  });

  describe('Edge Cases', () => {
    test('empty batch does nothing', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        // Empty
      });

      expect(listener).not.toHaveBeenCalled();
    });

    test('nested batch with different state paths', () => {
      const store = createStore({ a: 0, b: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState({ a: 1 });
        store.batch(() => {
          store.setState({ b: 2 });
        });
      });

      // Each batch notifies on completion
      expect(listener).toHaveBeenCalledTimes(2);
    });

    test('batch with primitive state', () => {
      const store = createStore(0);
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState(1);
        store.setState(2);
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getState()).toBe(2);
    });

    test('batch with array state', () => {
      const store = createStore([1, 2, 3]);
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState([4, 5, 6]);
        store.setState([7, 8, 9]);
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getState()).toEqual([7, 8, 9]);
    });
  });

  describe('Performance', () => {
    test('batch reduces listener calls significantly', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Without batch - 999 calls (first setState({ count: 0 }) doesn't change state)
      for (let i = 0; i < 1000; i++) {
        store.setState({ count: i });
      }

      const callsWithoutBatch = listener.mock.calls.length;

      // Reset
      store.reset();
      listener.mockClear();

      // With batch - 1 call
      store.batch(() => {
        for (let i = 0; i < 1000; i++) {
          store.setState({ count: i });
        }
      });

      const callsWithBatch = listener.mock.calls.length;

      expect(callsWithBatch).toBe(1);
      expect(callsWithoutBatch).toBe(999);
      expect(callsWithBatch).toBeLessThan(callsWithoutBatch);
    });
  });
});
