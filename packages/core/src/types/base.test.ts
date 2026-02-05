import { describe, it, expect } from 'vitest';
import { expectTypeOf } from 'vitest';
import type { GridId, ColumnId, RowId, CellId } from './base';
import {
  createGridId,
  createColumnId,
  createRowId,
  createCellId,
} from './factory';
import type {
  AccessorValue,
  DeepPartial,
  RequireKeys,
  FirstElement,
  RestElements,
  IsUndefined,
  IsNull,
  NonNullable,
} from './utils';

/**
 * Tests for GridKit core types and factories.
 *
 * This suite verifies:
 * - Branded type safety
 * - Factory function validation
 * - Type inference utilities
 *
 * @module CoreTypesTests
 */

describe('Branded Types', () => {
  describe('GridId', () => {
    it('prevents string mixing', () => {
      // @ts-expect-error - GridId is not assignable to string
      const gridId: GridId = 'grid-1';

      // @ts-expect-error - string is not assignable to GridId
      const regularString: string = gridId;

      // This should work (factory creates GridId)
      const validGridId = createGridId('grid-1');
      expectTypeOf(validGridId).toMatchTypeOf<GridId>();
    });

    it('accepts GridKitError on validation failure', () => {
      expect(() => createGridId('')).toThrow();
      expect(() => createGridId('')).toThrow('Grid ID');
    });

    it('auto-generates UUID when no ID provided', () => {
      const id = createGridId();
      expect(id).toMatch(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
      expectTypeOf(id).toMatchTypeOf<GridId>();
    });
  });

  describe('ColumnId', () => {
    it('validates dot-notation format', () => {
      const validId = createColumnId('user.profile.name');
      expectTypeOf(validId).toMatchTypeOf<ColumnId>();
    });

    it('throws GridKitError on invalid paths', () => {
      expect(() => createColumnId('invalid..path')).toThrow();
      expect(() => createColumnId('invalid..path')).toThrow(
        'Invalid column path'
      );
    });
  });

  describe('RowId', () => {
    it('accepts both string and number', () => {
      const stringId = createRowId('row-1');
      expectTypeOf(stringId).toMatchTypeOf<RowId>();

      const numberId = createRowId(42);
      expectTypeOf(numberId).toMatchTypeOf<RowId>();
      expect(numberId).toBe('42');
    });

    it('converts numbers to strings', () => {
      const id = createRowId(123);
      expect(id).toBe('123');
      expectTypeOf(id).toMatchTypeOf<RowId>();
    });

    it('throws on empty string', () => {
      expect(() => createRowId('')).toThrow();
      expect(() => createRowId('')).toThrow('Row ID');
    });
  });

  describe('CellId', () => {
    it('creates composite ID from row and column', () => {
      const rowId = createRowId('row-1');
      const colId = createColumnId('name');
      const cellId = createCellId(rowId, colId);

      expect(cellId).toBe('row-1_name');
      expectTypeOf(cellId).toMatchTypeOf<CellId>();
    });
  });
});

describe('Factory Functions', () => {
  describe('createColumnId', () => {
    it('should support simple column names', () => {
      const id = createColumnId('name');
      expect(id).toBe('name');
    });

    it('should support nested paths', () => {
      const id = createColumnId('user.profile.name');
      expect(id).toBe('user.profile.name');
    });

    it('should reject paths starting with numbers', () => {
      expect(() => createColumnId('123invalid')).toThrow();
      expect(() => createColumnId('123invalid')).toThrow('Invalid column path');
    });

    it('should reject paths with special characters', () => {
      expect(() => createColumnId('user-profile')).toThrow();
      expect(() => createColumnId('user-profile')).toThrow(
        'Invalid column path'
      );
    });
  });
});

describe('Type Utilities', () => {
  interface UserData {
    id: number;
    profile: {
      name: string;
      age: number;
      settings: {
        theme: 'light' | 'dark';
        notifications: boolean;
      };
    };
  }

  describe('AccessorValue', () => {
    it('should extract simple property types', () => {
      type IdType = AccessorValue<UserData, 'id'>;
      expectTypeOf<IdType>().toEqualTypeOf<number>();
    });

    it('should extract nested property types', () => {
      type NameType = AccessorValue<UserData, 'profile.name'>;
      expectTypeOf<NameType>().toEqualTypeOf<string>();
    });

    it('should extract deeply nested property types', () => {
      type ThemeType = AccessorValue<UserData, 'profile.settings.theme'>;
      expectTypeOf<ThemeType>().toEqualTypeOf<'light' | 'dark'>();
    });

    it('should fail on invalid paths', () => {
      // @ts-expect-error - Avatar does not exist
      type AvatarType = AccessorValue<UserData, 'profile.avatar'>;
    });
  });

  describe('DeepPartial', () => {
    it('should handle nested objects', () => {
      const data: DeepPartial<UserData> = {
        profile: {
          name: 'John',
          settings: { theme: 'dark' },
        },
      };
      expectTypeOf(data).toMatchTypeOf<DeepPartial<UserData>>();
    });

    it('should be fully optional', () => {
      const empty: DeepPartial<UserData> = {};
      expectTypeOf(empty).toMatchTypeOf<DeepPartial<UserData>>();
    });
  });

  describe('RequireKeys', () => {
    interface OptionalUser {
      id?: number;
      name: string;
      email?: string;
    }

    it('should make specific keys required', () => {
      type UserWithEmail = RequireKeys<OptionalUser, 'email'>;

      // @ts-expect-error - id is still optional
      const user1: UserWithEmail = { name: 'John' };

      // This should work
      const user2: UserWithEmail = { name: 'John', email: 'john@example.com' };
      expectTypeOf(user2).toMatchTypeOf<UserWithEmail>();
    });
  });

  describe('Updater', () => {
    it('should accept direct values', () => {
      const updater: Updater<string> = 'new value';
      expectTypeOf(updater).toMatchTypeOf<Updater<string>>();
    });

    it('should accept functional updates', () => {
      const updater: Updater<number> = (prev: number) => prev + 1;
      expectTypeOf(updater).toMatchTypeOf<Updater<number>>();
    });
  });

  describe('Listener', () => {
    it('should accept functions that may return cleanup', () => {
      const listener1: Listener<string> = (value: string) => {
        console.log(value);
      };
      expectTypeOf(listener1).toMatchTypeOf<Listener<string>>();

      const listener2: Listener<number> = (value: number) => {
        return () => console.log('cleanup');
      };
      expectTypeOf(listener2).toMatchTypeOf<Listener<number>>();
    });
  });

  describe('Comparator', () => {
    it('should accept functions returning -1, 0, or 1', () => {
      const comparator: Comparator<string> = (a: string, b: string) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      };
      expectTypeOf(comparator).toMatchTypeOf<Comparator<string>>();
    });
  });

  describe('Predicate', () => {
    it('should accept functions with index and array parameters', () => {
      const predicate: Predicate<number> = (
        value: number,
        index: number,
        array: number[]
      ) => value % 2 === 0;
      expectTypeOf(predicate).toMatchTypeOf<Predicate<number>>();
    });
  });
});

describe('Utility Types', () => {
  describe('FirstElement', () => {
    it('should extract first element from tuple', () => {
      type Tuple = [string, number, boolean];
      type First = FirstElement<Tuple>;
      expectTypeOf<First>().toEqualTypeOf<string>();
    });

    it('should handle empty tuple', () => {
      type Empty = FirstElement<[]>;
      expectTypeOf<Empty>().toEqualTypeOf<never>();
    });
  });

  describe('RestElements', () => {
    it('should extract rest elements from tuple', () => {
      type Tuple = [string, number, boolean];
      type Rest = RestElements<Tuple>;
      expectTypeOf<Rest>().toEqualTypeOf<[number, boolean]>();
    });
  });

  describe('IsUndefined', () => {
    it('should identify undefined', () => {
      type Test1 = IsUndefined<undefined>;
      expectTypeOf<Test1>().toEqualTypeOf<true>();
    });

    it('should not identify null', () => {
      type Test2 = IsUndefined<null>;
      expectTypeOf<Test2>().toEqualTypeOf<false>();
    });
  });

  describe('IsNull', () => {
    it('should identify null', () => {
      type Test1 = IsNull<null>;
      expectTypeOf<Test1>().toEqualTypeOf<true>();
    });

    it('should not identify undefined', () => {
      type Test2 = IsNull<undefined>;
      expectTypeOf<Test2>().toEqualTypeOf<false>();
    });
  });

  describe('NonNullable', () => {
    it('should remove null and undefined', () => {
      type Test = NonNullable<string | null | undefined>;
      expectTypeOf<Test>().toEqualTypeOf<string>();
    });
  });
});
