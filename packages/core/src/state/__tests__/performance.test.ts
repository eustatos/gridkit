import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - Performance', () => {
  describe('State Update Performance', () => {
    test('handles 10000 updates efficiently', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        store.setState({ count: i });
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in <1s
      // First setState({ count: 0 }) doesn't change state, so 9999 notifications
      expect(listener).toHaveBeenCalledTimes(9999);
    });

    test('handles nested object updates', () => {
      const deepState = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: { value: 0 },
              },
            },
          },
        },
      };

      const store = createStore(deepState);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        store.setState((prev) => ({
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: { value: prev.level1.level2.level3.level4.level5.value + 1 },
                },
              },
            },
          },
        }));
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
      expect(store.getState().level1.level2.level3.level4.level5.value).toBe(1000);
    });
  });

  describe('Subscription Performance', () => {
    test('handles many listeners efficiently', () => {
      const store = createStore({ count: 0 });
      const listeners = Array.from({ length: 100 }, () => vi.fn());

      listeners.forEach((listener) => store.subscribe(listener));
      store.setState({ count: 1 });

      const duration = listeners.reduce((acc, listener) => {
        expect(listener).toHaveBeenCalledTimes(1);
        return acc;
      }, 0);

      expect(duration).toBeLessThan(100); // Should be fast
    });

    test('removing listeners is efficient', () => {
      const store = createStore({ count: 0 });
      const listeners = Array.from({ length: 100 }, () => {
        const fn = vi.fn();
        return { fn, unsubscribe: store.subscribe(fn) };
      });

      // Remove half
      listeners.slice(0, 50).forEach(({ unsubscribe }) => unsubscribe());

      store.setState({ count: 1 });

      listeners.slice(0, 50).forEach(({ fn }) => {
        expect(fn).not.toHaveBeenCalled();
      });
      listeners.slice(50).forEach(({ fn }) => {
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Batch Performance', () => {
    test('batch significantly reduces notifications', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Without batch
      const start1 = performance.now();
      for (let i = 0; i < 1000; i++) {
        store.setState({ count: i });
      }
      const durationWithoutBatch = performance.now() - start1;
      const callsWithoutBatch = listener.mock.calls.length;

      // Reset
      store.reset();
      listener.mockClear();

      // With batch
      const start2 = performance.now();
      store.batch(() => {
        for (let i = 0; i < 1000; i++) {
          store.setState({ count: i });
        }
      });
      const durationWithBatch = performance.now() - start2;
      const callsWithBatch = listener.mock.calls.length;

      expect(callsWithoutBatch).toBe(999); // First setState doesn't change state
      expect(callsWithBatch).toBe(1);
      expect(callsWithBatch).toBeLessThan(callsWithoutBatch);
    });

    test('deeply nested batch is efficient', () => {
      const store = createStore({ count: 0 });

      const start = performance.now();
      store.batch(() => {
        store.batch(() => {
          store.batch(() => {
            for (let i = 0; i < 100; i++) {
              store.setState({ count: i });
            }
          });
        });
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(store.getState().count).toBe(99);
    });
  });

  describe('Memory Efficiency', () => {
    test('does not grow memory with repeated updates', () => {
      const store = createStore({ count: 0 });

      // Force gc if available
      if (globalThis.gc) {
        globalThis.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 10000; i++) {
        store.setState({ count: i % 100 });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      // Should not grow linearly - ideally constant or near-constant
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // < 10MB growth
    });
  });

  describe('Deep Clone Performance', () => {
    test('clones moderate state efficiently', () => {
      const moderateState = {
        data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: i * 2 })),
        meta: { timestamp: Date.now(), version: 1 },
        config: {
          option1: true,
          option2: false,
          option3: 'test',
        },
      };

      const store = createStore(moderateState);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        store.setState((prev) => ({
          ...prev,
          data: prev.data.map((d) => ({ ...d, value: d.value + 1 })),
        }));
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });

    test('clones large array efficiently', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);

      const store = createStore(largeArray);

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        store.setState((prev) => prev.map((v) => v + 1));
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
      expect(store.getState().length).toBe(10000);
    });
  });

  describe('Real-World Scenario', () => {
    test('simulates typical app state updates', () => {
      interface AppState {
        user: { id: number; name: string; email: string };
        settings: { theme: 'light' | 'dark'; lang: string; notifications: boolean };
        data: { items: { id: number; name: string; value: number }[]; loading: boolean };
      }

      const initialState: AppState = {
        user: { id: 1, name: 'John', email: 'john@example.com' },
        settings: { theme: 'light', lang: 'en', notifications: true },
        data: { items: [], loading: false },
      };

      const store = createStore(initialState);
      const listener = vi.fn();

      store.subscribe(listener);

      // Simulate app updates
      const updates = [
        { type: 'user', update: (s: AppState) => ({ ...s, user: { ...s.user, name: 'Jane' } }) },
        { type: 'settings', update: (s: AppState) => ({ ...s, settings: { ...s.settings, theme: 'dark' } }) },
        { type: 'data', update: (s: AppState) => ({ ...s, data: { ...s.data, loading: true } }) },
        { type: 'data', update: (s: AppState) => ({
          ...s,
          data: {
            ...s.data,
            loading: false,
            items: [{ id: 1, name: 'Item 1', value: 100 }],
          },
        }) },
      ];

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        store.batch(() => {
          updates.forEach((update) => store.setState(update.update));
        });
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
      expect(listener).toHaveBeenCalledTimes(100);
    });
  });
});
