import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../../packages/core/src/state';

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
    const listener = vi.fn();

    store.subscribe(listener);
    store.setState({ count: 1 });

    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  test('supports batching updates', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();

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
    const listener = vi.fn();

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

  test('reset restores initial state', () => {
    const initialState = { count: 0, name: 'test' };
    const store = createStore(initialState);

    // Modify state
    store.setState({ count: 5, name: 'modified' });
    expect(store.getState()).toEqual({ count: 5, name: 'modified' });

    // Reset to initial state
    store.reset();
    expect(store.getState()).toEqual(initialState);
  });

  test('subscribe with fireImmediately option', () => {
    const store = createStore({ count: 1 });
    const listener = vi.fn();

    store.subscribe(listener, { fireImmediately: true });

    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  test('setState returns false when state unchanged', () => {
    const store = createStore({ count: 0 });
    
    // No change
    const result = store.setState({ count: 0 });
    expect(result).toBe(false);
  });

  test('setState returns true when state changed', () => {
    const store = createStore({ count: 0 });
    
    // Change state
    const result = store.setState({ count: 1 });
    expect(result).toBe(true);
  });
});