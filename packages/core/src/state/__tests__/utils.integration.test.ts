import { describe, test, expect, vi } from 'vitest';
import { deepClone } from '../utils/clone';
import { shallowEqual } from '../utils/equality';
import { createStore } from '../create-store';

describe('State Utilities Integration', () => {
  describe('clone vs equality interaction', () => {
    test('deepClone preserves structure for equality', () => {
      const original = {
        a: 1,
        b: {
          c: 2,
          d: [3, 4],
        },
      };

      const cloned = deepClone(original);

      // deepClone creates a deep copy with same values
      expect(cloned).toEqual(original);
      // But they are different references
      expect(cloned).not.toBe(original);
      // shallowEqual only checks top-level properties
      expect(shallowEqual(cloned, original)).toBe(false);
    });

    test('modifying clone breaks shallowEqual', () => {
      const original = { a: 1, b: 2 };
      const cloned = deepClone(original);

      cloned.b = 999;

      expect(shallowEqual(cloned, original)).toBe(false);
    });
  });

  describe('createStore uses utilities correctly', () => {
    test('deepClone protects initial state', () => {
      const original = { nested: { value: 1 } };
      const store = createStore(original);

      // Modify original after store creation
      original.nested.value = 999;

      // Store should be unaffected
      expect(store.getState().nested.value).toBe(1);
    });

    test('shallowEqual prevents duplicate notifications', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Same object reference
      store.setState({ count: 0 });
      expect(listener).not.toHaveBeenCalled();

      // Different object, same value
      store.setState({ count: 0 });
      expect(listener).not.toHaveBeenCalled();

      // Different value
      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('deep updates work with utilities', () => {
      const store = createStore({
        level1: {
          level2: {
            value: 'initial',
          },
        },
      });

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

  describe('Performance with utilities', () => {
    test('shallowEqual is fast for objects', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      const other = { a: 1, b: 2, c: 3, d: 4, e: 5 };

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        shallowEqual(obj, other);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Should be very fast
    });

    test('deepClone handles moderate objects efficiently', () => {
      const obj = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7,
        h: 8,
        i: 9,
        j: 10,
      };

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        deepClone(obj);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Edge Cases with Utilities', () => {
    test('deepClone handles circular references safely', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      const cloned = deepClone(obj);

      expect(cloned.name).toBe('test');
      expect(cloned.self).toBe(cloned);
      expect(cloned.self).not.toBe(obj.self);
    });

    test('shallowEqual handles null/undefined', () => {
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(undefined, undefined)).toBe(true);
      expect(shallowEqual(null, undefined)).toBe(false);
    });

    test('deepClone handles null/undefined', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(undefined)).toBeUndefined();
    });

    test('shallowEqual handles NaN', () => {
      expect(shallowEqual(NaN, NaN)).toBe(false); // NaN !== NaN
    });
  });

  describe('Real-World Scenario', () => {
    test('form state management with utilities', () => {
      const store = createStore({
        values: { username: '', email: '' },
        errors: {} as { username?: string; email?: string },
        isValid: false,
      });

      const listener = vi.fn();
      store.subscribe(listener);

      // Simulate form validation
      store.setState((prev) => {
        const errors: typeof prev.errors = {};
        if (!prev.values.username) errors.username = 'Required';
        if (!prev.values.email.includes('@')) errors.email = 'Invalid';

        return {
          ...prev,
          errors,
          isValid: Object.keys(errors).length === 0,
        };
      });

      expect(store.getState().isValid).toBe(false);
      expect(store.getState().errors.username).toBe('Required');

      // Update values
      store.batch(() => {
        store.setState((prev) => ({
          ...prev,
          values: { ...prev.values, username: 'user' },
        }));
        store.setState((prev) => ({
          ...prev,
          values: { ...prev.values, email: 'user@example.com' },
        }));
      });

      // Re-validate
      store.setState((prev) => {
        const errors: typeof prev.errors = {};
        if (!prev.values.username) errors.username = 'Required';
        if (!prev.values.email.includes('@')) errors.email = 'Invalid';

        return {
          ...prev,
          errors,
          isValid: Object.keys(errors).length === 0,
        };
      });

      expect(store.getState().isValid).toBe(true);
      expect(listener).toHaveBeenCalledTimes(3); // Initial validation + 2 value changes + final validation
    });
  });
});
