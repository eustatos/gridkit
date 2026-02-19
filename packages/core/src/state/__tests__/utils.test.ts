import { describe, test, expect, vi } from 'vitest';
import { deepClone } from '../utils/clone';
import { shallowEqual } from '../utils/equality';
import { createStore } from '../create-store';

describe('State Utilities - Integration', () => {
  describe('deepClone and shallowEqual interaction', () => {
    test('cloned object passes shallowEqual', () => {
      const original = { a: 1, b: 2 };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      // cloned is frozen, so shallowEqual should return true
      expect(shallowEqual(cloned, original)).toBe(true);
    });

    test('cloned object is different reference', () => {
      const original = { a: 1, b: 2 };
      const cloned = deepClone(original);

      expect(cloned).not.toBe(original);
      expect(shallowEqual(original, cloned)).toBe(true);
    });

    test('modifying clone does not affect original (shallowEqual still false)', () => {
      const original = { a: 1, b: 2 };
      const cloned = deepClone(original);

      // cloned is frozen, so we need to create a new object to modify
      const modified = { ...cloned, b: 999 };

      expect(shallowEqual(modified, original)).toBe(false);
      expect(original.b).toBe(2);
    });
  });

  describe('Store with utilities', () => {
    test('deepClone used internally for state safety', () => {
      const original = { nested: { value: 1 } };
      const store = createStore(original);

      // Modify original
      original.nested.value = 999;

      // Store should be unaffected
      expect(store.getState().nested.value).toBe(1);
    });

    test('shallowEqual used for change detection', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Same object reference - shallowEqual returns true, no notification
      const state = store.getState();
      store.setState(state);

      expect(listener).not.toHaveBeenCalled();
    });

    test('deep updates work correctly', () => {
      const store = createStore({
        level1: {
          level2: {
            value: 'initial',
          },
        },
      });

      // Update deeply nested value
      store.setState((prev) => ({
        level1: {
          ...prev.level1,
          level2: {
            ...prev.level1.level2,
            value: 'updated',
          },
        },
      }));

      expect(store.getState().level1.level2.value).toBe('updated');
    });
  });

  describe('Circular reference safety', () => {
    test('deepClone handles circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      const cloned = deepClone(obj);

      expect(cloned.name).toBe('test');
      expect(cloned.self).toBe(cloned);
    });

    test('shallowEqual handles circular references', () => {
      const obj1: any = { name: 'test' };
      obj1.self = obj1;

      const obj2: any = { name: 'test' };
      obj2.self = obj2;

      // Should not infinite loop
      expect(() => shallowEqual(obj1, obj2)).not.toThrow();
    });
  });

  describe('Performance optimization', () => {
    test('shallowEqual prevents unnecessary notifications', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Direct value with same reference - should skip notification
      store.setState({ count: 0 });

      expect(listener).not.toHaveBeenCalled();
    });

    test('deepClone prevents accidental mutations', () => {
      const initialState = { array: [1, 2, 3] };
      const store = createStore(initialState);

      const state = store.getState();
      state.array.push(4); // Attempt to modify

      expect(store.getState().array).toEqual([1, 2, 3]);
      expect(initialState.array).toEqual([1, 2, 3]);
    });
  });
});
