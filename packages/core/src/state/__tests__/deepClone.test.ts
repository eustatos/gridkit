import { describe, test, expect } from 'vitest';
import { deepClone } from '../utils/clone';

describe('deepClone', () => {
  describe('Primitive Types', () => {
    test('clones numbers', () => {
      const original = 42;
      const cloned = deepClone(original);
      
      expect(cloned).toBe(original);
      expect(cloned).toBe(42);
    });

    test('clones strings', () => {
      const original = 'hello world';
      const cloned = deepClone(original);
      
      expect(cloned).toBe(original);
      expect(cloned).toBe('hello world');
    });

    test('clones booleans', () => {
      const original = true;
      const cloned = deepClone(original);
      
      expect(cloned).toBe(original);
      expect(cloned).toBe(true);
    });

    test('clones null', () => {
      const original = null;
      const cloned = deepClone(original);
      
      expect(cloned).toBe(original);
      expect(cloned).toBeNull();
    });

    test('clones undefined', () => {
      const original = undefined;
      const cloned = deepClone(original);
      
      expect(cloned).toBe(original);
      expect(cloned).toBeUndefined();
    });

    test('clones symbols', () => {
      const original = Symbol('test');
      const cloned = deepClone(original);
      
      expect(cloned).toBe(original);
    });
  });

  describe('Objects', () => {
    test('clones empty object', () => {
      const original = {};
      const cloned = deepClone(original);
      
      expect(cloned).toEqual({});
      expect(cloned).not.toBe(original);
    });

    test('clones simple object', () => {
      const original = { a: 1, b: 2 };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test('clones nested objects', () => {
      const original = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.level1).not.toBe(original.level1);
      expect(cloned.level1.level2).not.toBe(original.level1.level2);
    });

    test('handles circular references', () => {
      const original: any = { name: 'test' };
      original.self = original;
      
      const cloned = deepClone(original);
      
      expect(cloned.name).toBe('test');
      expect(cloned.self).toBe(cloned);
      expect(cloned.self).not.toBe(original);
    });

    test('clones object with methods', () => {
      const original = {
        value: 42,
        method: () => 42,
      };
      const cloned = deepClone(original);
      
      expect(cloned.value).toBe(42);
      expect(cloned.method()).toBe(42);
      expect(cloned).not.toBe(original);
    });
  });

  describe('Arrays', () => {
    test('clones empty array', () => {
      const original: number[] = [];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual([]);
      expect(cloned).not.toBe(original);
    });

    test('clones simple array', () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test('clones nested arrays', () => {
      const original = [[1, 2], [3, 4]];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
    });

    test('clones array of objects', () => {
      const original = [{ a: 1 }, { b: 2 }];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
    });
  });

  describe('Special Objects', () => {
    test('clones Date objects', () => {
      const original = new Date('2024-01-01');
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned).toBeInstanceOf(Date);
    });

    test('clones RegExp objects', () => {
      const original = /test/gi;
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned).toBeInstanceOf(RegExp);
    });

    test('clones Map', () => {
      const original = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned).toBeInstanceOf(Map);
    });

    test('clones Set', () => {
      const original = new Set([1, 2, 3]);
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned).toBeInstanceOf(Set);
    });
  });

  describe('Mutations', () => {
    test('modifying cloned object does not affect original', () => {
      const original = { nested: { value: 1 } };
      const cloned = deepClone(original);
      
      cloned.nested.value = 999;
      
      expect(original.nested.value).toBe(1);
      expect(cloned.nested.value).toBe(999);
    });

    test('modifying cloned array does not affect original', () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);
      
      cloned.push(4);
      
      expect(original).toEqual([1, 2, 3]);
      expect(cloned).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Edge Cases', () => {
    test('clones object with undefined properties', () => {
      const original = { a: 1, b: undefined };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
    });

    test('clones sparse array', () => {
      const original = [1, , 3];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test('clones object with prototype', () => {
      class MyClass {
        value: number;
        constructor(value: number) {
          this.value = value;
        }
      }
      
      const original = new MyClass(42);
      const cloned = deepClone(original);
      
      expect(cloned.value).toBe(42);
      expect(cloned).not.toBe(original);
      expect(cloned).not.toBeInstanceOf(MyClass);
    });

    test('clones BigInt', () => {
      const original = BigInt(12345678901234567890n);
      const cloned = deepClone(original);
      
      expect(cloned).toBe(original);
      expect(cloned).toBe(BigInt(12345678901234567890n));
    });
  });
});
