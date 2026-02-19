import { describe, test, expect } from 'vitest';
import { shallowEqual } from '../utils/equality';

describe('shallowEqual', () => {
  describe('Same Reference', () => {
    test('returns true for same object', () => {
      const obj = { a: 1 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    test('returns true for same array', () => {
      const arr = [1, 2, 3];
      expect(shallowEqual(arr, arr)).toBe(true);
    });

    test('returns true for same primitive', () => {
      expect(shallowEqual(42, 42)).toBe(true);
      expect(shallowEqual('test', 'test')).toBe(true);
      expect(shallowEqual(true, true)).toBe(true);
    });
  });

  describe('Primitives', () => {
    test('equals numbers', () => {
      expect(shallowEqual(0, 0)).toBe(true);
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual(-1, -1)).toBe(true);
    });

    test('not equals different numbers', () => {
      expect(shallowEqual(0, 1)).toBe(false);
      expect(shallowEqual(1, 2)).toBe(false);
    });

    test('equals strings', () => {
      expect(shallowEqual('', '')).toBe(true);
      expect(shallowEqual('test', 'test')).toBe(true);
      expect(shallowEqual('hello world', 'hello world')).toBe(true);
    });

    test('not equals different strings', () => {
      expect(shallowEqual('a', 'b')).toBe(false);
      expect(shallowEqual('test', 'Test')).toBe(false);
    });

    test('equals booleans', () => {
      expect(shallowEqual(true, true)).toBe(true);
      expect(shallowEqual(false, false)).toBe(true);
    });

    test('not equals different booleans', () => {
      expect(shallowEqual(true, false)).toBe(false);
    });

    test('equals null', () => {
      expect(shallowEqual(null, null)).toBe(true);
    });

    test('equals undefined', () => {
      expect(shallowEqual(undefined, undefined)).toBe(true);
    });
  });

  describe('Objects', () => {
    test('equals same properties', () => {
      expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    test('not equals different properties', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    test('not equals different number of properties', () => {
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    test('not equals different property order', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    test('equals empty objects', () => {
      expect(shallowEqual({}, {})).toBe(true);
    });

    test('handles null properties', () => {
      expect(shallowEqual({ a: null }, { a: null })).toBe(true);
      expect(shallowEqual({ a: null }, { a: undefined })).toBe(false);
    });
  });

  describe('Arrays', () => {
    test('equals same arrays', () => {
      expect(shallowEqual([1, 2], [1, 2])).toBe(true);
      expect(shallowEqual([], [])).toBe(true);
    });

    test('not equals different arrays', () => {
      expect(shallowEqual([1, 2], [1, 3])).toBe(false);
      expect(shallowEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(shallowEqual([], [1])).toBe(false);
    });

    test('handles sparse arrays', () => {
      expect(shallowEqual([1, , 3], [1, , 3])).toBe(true);
    });
  });

  describe('Mixed Types', () => {
    test('not equals different types', () => {
      expect(shallowEqual(1, '1')).toBe(false);
      expect(shallowEqual(1, true)).toBe(false);
      expect(shallowEqual({}, [])).toBe(false);
    });

    test('not equals object vs primitive', () => {
      expect(shallowEqual({ a: 1 }, 1)).toBe(false);
      expect(shallowEqual({ a: 1 }, 'test')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles NaN', () => {
      expect(shallowEqual(NaN, NaN)).toBe(false);
    });

    test('handles -0 and 0', () => {
      expect(shallowEqual(-0, 0)).toBe(true);
    });

    test('handles objects with prototype chain', () => {
      class MyClass {
        value: number;
        constructor(value: number) {
          this.value = value;
        }
      }

      expect(shallowEqual(new MyClass(1), new MyClass(1))).toBe(true);
      expect(shallowEqual(new MyClass(1), new MyClass(2))).toBe(false);
    });

    test('handles circular references (infinite loop protection)', () => {
      const obj1: any = { a: 1 };
      const obj2: any = { a: 1 };
      
      obj1.self = obj1;
      obj2.self = obj2;
      
      // Should not infinite loop
      expect(() => shallowEqual(obj1, obj2)).not.toThrow();
    });
  });
});
