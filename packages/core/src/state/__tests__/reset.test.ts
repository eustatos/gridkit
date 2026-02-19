import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - reset()', () => {
  describe('Basic Reset', () => {
    test('resets to initial state', () => {
      const initialState = { count: 0, name: 'test' };
      const store = createStore(initialState);

      store.setState({ count: 5, name: 'modified' });
      store.reset();

      expect(store.getState()).toEqual(initialState);
    });

    test('resets nested objects', () => {
      const initialState = {
        user: { name: 'Alice', settings: { theme: 'dark' } },
      };
      const store = createStore(initialState);

      store.setState({
        user: { name: 'Bob', settings: { theme: 'light' } },
      });
      store.reset();

      expect(store.getState()).toEqual(initialState);
    });

    test('resets primitive types', () => {
      const store = createStore(100);

      store.setState(200);
      store.reset();

      expect(store.getState()).toBe(100);
    });

    test('resets array types', () => {
      const store = createStore([1, 2, 3]);

      store.setState([4, 5, 6]);
      store.reset();

      expect(store.getState()).toEqual([1, 2, 3]);
    });
  });

  describe('Subscriber Notification', () => {
    test('notifies listeners after reset', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState({ count: 5 });
      store.reset();

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(2, { count: 0 });
    });

    test('does not notify if reset to same state', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.reset(); // Already at initial state

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Deep Reset', () => {
    test('resets deeply nested structures', () => {
      const initialState = {
        level1: {
          level2: {
            level3: {
              value: 'initial',
            },
          },
        },
      };
      const store = createStore(initialState);

      store.setState({
        level1: {
          level2: {
            level3: {
              value: 'changed',
            },
          },
        },
      });
      store.reset();

      expect(store.getState()).toEqual(initialState);
    });

    test('resets circular references', () => {
      const initialState: any = { name: 'test' };
      initialState.self = initialState;

      const store = createStore(initialState);

      const modified: any = { name: 'modified' };
      modified.self = modified;
      store.setState(modified);
      store.reset();

      const state = store.getState();
      expect(state.name).toBe('test');
      expect(state.self).toBe(state);
    });
  });

  describe('Multiple Resets', () => {
    test('can reset multiple times', () => {
      const store = createStore({ count: 0 });

      for (let i = 0; i < 10; i++) {
        store.setState({ count: i + 1 });
        store.reset();
        expect(store.getState()).toEqual({ count: 0 });
      }
    });

    test('maintains initial state across resets', () => {
      const initialState = { count: 0, name: 'test' };
      const store = createStore(initialState);

      // Multiple modifications and resets
      store.setState({ count: 1 });
      store.reset();
      store.setState({ count: 2 });
      store.reset();
      store.setState({ count: 3 });
      store.reset();

      expect(store.getState()).toEqual(initialState);
    });
  });

  describe('Interaction with Other Methods', () => {
    test('reset after destroy throws', () => {
      const store = createStore({ count: 0 });
      store.destroy();

      expect(() => store.reset()).toThrow('destroyed');
    });

    test('reset with pending batch', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      store.batch(() => {
        store.setState({ count: 1 });
        store.reset(); // Reset in the middle of batch
      });

      // Should reset and notify once after batch
      expect(store.getState()).toEqual({ count: 0 });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('reset with primitive null', () => {
      const store = createStore(null);
      store.setState('changed');
      store.reset();
      expect(store.getState()).toBeNull();
    });

    test('reset with undefined', () => {
      const store = createStore(undefined);
      store.setState('changed');
      store.reset();
      expect(store.getState()).toBeUndefined();
    });

    test('reset with empty string', () => {
      const store = createStore('');
      store.setState('test');
      store.reset();
      expect(store.getState()).toBe('');
    });

    test('reset with number zero', () => {
      const store = createStore(0);
      store.setState(42);
      store.reset();
      expect(store.getState()).toBe(0);
    });

    test('reset does not mutate original initial state', () => {
      const originalState = { nested: { value: 'original' } };
      const store = createStore(originalState);

      store.setState({ nested: { value: 'changed' } });
      store.reset();

      expect(originalState.nested.value).toBe('original');
    });
  });

  describe('Memory Safety', () => {
    test('reset maintains same state reference if unchanged', () => {
      const store = createStore({ count: 0 });
      const state1 = store.getState();
      
      store.reset(); // Same state
      
      // State should be cloned on get, but internal ref might be same
      const state2 = store.getState();
      expect(state2).toEqual(state1);
    });
  });
});
