import { describe, it, expect } from 'vitest';
import { expectTypeOf } from 'vitest';
import type {
  RowData,
  ColumnId,
  RowId,
  AccessorValue,
  RequireKeys,
  DeepPartial,
  Updater,
  Listener,
  Unsubscribe,
  Comparator,
  Predicate,
} from '../base';

describe('Base Types', () => {
  describe('RowData', () => {
    it('should accept any object with string keys', () => {
      const data: RowData = { id: 1, name: 'Test' };
      expectTypeOf(data).toMatchTypeOf<Record<string, unknown>>();
    });

    it('should reject non-object types', () => {
      // @ts-expect-error - RowData must be an object
      const invalid: RowData = 'string';
      // @ts-expect-error - RowData must be an object
      const invalid2: RowData = 123;
      // @ts-expect-error - RowData must be an object
      const invalid3: RowData = null;
      // @ts-expect-error - RowData must be an object
      const invalid4: RowData = undefined;
    });

    it('should work with complex nested objects', () => {
      const complexData: RowData = {
        id: '123',
        name: 'John',
        metadata: {
          created: new Date(),
          tags: ['a', 'b', 'c'],
          nested: {
            deep: true,
          },
        },
      };

      expectTypeOf(complexData).toMatchTypeOf<RowData>();
    });
  });

  describe('ColumnId', () => {
    it('should be a string', () => {
      const id: ColumnId = 'column-1';
      expectTypeOf(id).toBeString();
    });

    it('should support dot notation', () => {
      const id: ColumnId = 'user.profile.name';
      expectTypeOf(id).toBeString();
    });

    it('should reject non-string values', () => {
      // @ts-expect-error - ColumnId must be string
      const invalid: ColumnId = 123;
      // @ts-expect-error - ColumnId must be string
      const invalid2: ColumnId = true;
      // @ts-expect-error - ColumnId must be string
      const invalid3: ColumnId = {};
    });
  });

  describe('RowId', () => {
    it('should accept string', () => {
      const id: RowId = 'row-1';
      expectTypeOf(id).toMatchTypeOf<string | number>();
    });

    it('should accept number', () => {
      const id: RowId = 123;
      expectTypeOf(id).toMatchTypeOf<string | number>();
    });

    it('should reject other types', () => {
      // @ts-expect-error - RowId must be string or number
      const invalid: RowId = true;
      // @ts-expect-error - RowId must be string or number
      const invalid2: RowId = {};
      // @ts-expect-error - RowId must be string or number
      const invalid3: RowId = null;
      // @ts-expect-error - RowId must be string or number
      const invalid4: RowId = undefined;
    });
  });

  describe('AccessorValue', () => {
    it('should extract simple property type', () => {
      interface User extends RowData {
        name: string;
        age: number;
      }

      type NameType = AccessorValue<User, 'name'>;
      expectTypeOf<NameType>().toBeString();

      type AgeType = AccessorValue<User, 'age'>;
      expectTypeOf<AgeType>().toBeNumber();
    });

    it('should extract nested property type', () => {
      interface User extends RowData {
        profile: {
          name: string;
          bio: string;
        };
      }

      type NameType = AccessorValue<User, 'profile.name'>;
      expectTypeOf<NameType>().toBeString();

      type BioType = AccessorValue<User, 'profile.bio'>;
      expectTypeOf<BioType>().toBeString();
    });

    it('should handle deep nesting (5+ levels)', () => {
      interface ComplexData extends RowData {
        a: {
          b: {
            c: {
              d: {
                e: {
                  value: number;
                };
              };
            };
          };
        };
      }

      type DeepValue = AccessorValue<ComplexData, 'a.b.c.d.e.value'>;
      expectTypeOf<DeepValue>().toBeNumber();
    });

    it('should return unknown for invalid key', () => {
      interface User extends RowData {
        name: string;
      }

      type InvalidType = AccessorValue<User, 'invalid'>;
      expectTypeOf<InvalidType>().toBeUnknown();
    });

    it('should return unknown for invalid nested path', () => {
      interface User extends RowData {
        profile: {
          name: string;
        };
      }

      type InvalidType = AccessorValue<User, 'profile.invalid'>;
      expectTypeOf<InvalidType>().toBeUnknown();

      type DeepInvalid = AccessorValue<User, 'profile.name.invalid'>;
      expectTypeOf<DeepInvalid>().toBeUnknown();
    });

    it('should work with optional properties', () => {
      interface User extends RowData {
        name?: string;
        profile?: {
          bio?: string;
        };
      }

      type OptionalName = AccessorValue<User, 'name'>;
      expectTypeOf<OptionalName>().toEqualTypeOf<string | undefined>();

      type OptionalBio = AccessorValue<User, 'profile.bio'>;
      expectTypeOf<OptionalBio>().toBeUnknown(); // Because profile might be undefined
    });

    it('should work with readonly properties', () => {
      interface User extends RowData {
        readonly id: string;
        readonly profile: {
          readonly name: string;
        };
      }

      type ReadonlyId = AccessorValue<User, 'id'>;
      expectTypeOf<ReadonlyId>().toBeString();

      type ReadonlyName = AccessorValue<User, 'profile.name'>;
      expectTypeOf<ReadonlyName>().toBeString();
    });

    it('should work with union types', () => {
      interface User extends RowData {
        status: 'active' | 'inactive' | 'pending';
        metadata: {
          type: 'user' | 'admin';
        };
      }

      type StatusType = AccessorValue<User, 'status'>;
      expectTypeOf<StatusType>().toEqualTypeOf<
        'active' | 'inactive' | 'pending'
      >();

      type MetadataType = AccessorValue<User, 'metadata.type'>;
      expectTypeOf<MetadataType>().toEqualTypeOf<'user' | 'admin'>();
    });

    it('should work with arrays', () => {
      interface User extends RowData {
        tags: string[];
        scores: number[];
      }

      type TagsType = AccessorValue<User, 'tags'>;
      expectTypeOf<TagsType>().toEqualTypeOf<string[]>();

      type ScoresType = AccessorValue<User, 'scores'>;
      expectTypeOf<ScoresType>().toEqualTypeOf<number[]>();
    });
  });

  describe('RequireKeys', () => {
    it('should make specific keys required', () => {
      interface Options {
        a?: string;
        b?: number;
        c?: boolean;
      }

      type RequiredA = RequireKeys<Options, 'a'>;
      expectTypeOf<RequiredA>().toMatchTypeOf<{
        a: string;
        b?: number;
        c?: boolean;
      }>();

      type RequiredAB = RequireKeys<Options, 'a' | 'b'>;
      expectTypeOf<RequiredAB>().toMatchTypeOf<{
        a: string;
        b: number;
        c?: boolean;
      }>();
    });

    it('should handle already required keys', () => {
      interface Mixed {
        required: string;
        optional?: number;
      }

      type RequiredAll = RequireKeys<Mixed, 'required' | 'optional'>;
      expectTypeOf<RequiredAll>().toMatchTypeOf<{
        required: string;
        optional: number;
      }>();
    });

    it('should reject invalid keys', () => {
      interface Options {
        a?: string;
      }

      // @ts-expect-error - 'invalid' is not a key of Options
      type Invalid = RequireKeys<Options, 'invalid'>;
    });
  });

  describe('DeepPartial', () => {
    it('should make nested properties optional', () => {
      interface Config {
        nested: {
          value: string;
          deep: {
            prop: number;
          };
        };
        other: boolean;
      }

      type PartialConfig = DeepPartial<Config>;

      const empty: PartialConfig = {};
      expectTypeOf(empty).toMatchTypeOf<PartialConfig>();

      const partialNested: PartialConfig = { nested: {} };
      expectTypeOf(partialNested).toMatchTypeOf<PartialConfig>();

      const partialDeep: PartialConfig = { nested: { deep: {} } };
      expectTypeOf(partialDeep).toMatchTypeOf<PartialConfig>();

      const full: PartialConfig = {
        nested: {
          value: 'test',
          deep: {
            prop: 123,
          },
        },
        other: true,
      };
      expectTypeOf(full).toMatchTypeOf<PartialConfig>();
    });

    it('should work with arrays', () => {
      interface WithArray {
        items: Array<{
          id: number;
          name: string;
        }>;
      }

      type PartialWithArray = DeepPartial<WithArray>;

      const partial: PartialWithArray = {
        items: [{ id: 1, name: 'test' }, { id: 2 }, {}],
      };
      expectTypeOf(partial).toMatchTypeOf<PartialWithArray>();
    });

    it('should work with readonly properties', () => {
      interface ReadonlyConfig {
        readonly id: string;
        readonly nested: {
          readonly value: number;
        };
      }

      type PartialReadonly = DeepPartial<ReadonlyConfig>;

      const partial: PartialReadonly = {
        id: 'test',
        nested: {},
      };
      expectTypeOf(partial).toMatchTypeOf<PartialReadonly>();
    });

    it('should handle primitive types', () => {
      type PartialString = DeepPartial<string>;
      expectTypeOf<PartialString>().toBeString();

      type PartialNumber = DeepPartial<number>;
      expectTypeOf<PartialNumber>().toBeNumber();

      type PartialBoolean = DeepPartial<boolean>;
      expectTypeOf<PartialBoolean>().toBeBoolean();
    });
  });

  describe('Updater', () => {
    it('should accept direct value', () => {
      const updater: Updater<number> = 42;
      expectTypeOf(updater).toMatchTypeOf<
        number | ((prev: number) => number)
      >();
    });

    it('should accept function', () => {
      const updater: Updater<number> = (prev) => prev + 1;
      expectTypeOf(updater).toMatchTypeOf<
        number | ((prev: number) => number)
      >();
    });

    it('should work with complex state', () => {
      interface AppState {
        count: number;
        user: {
          name: string;
          age: number;
        };
      }

      const valueUpdater: Updater<AppState> = {
        count: 1,
        user: { name: 'John', age: 30 },
      };
      expectTypeOf(valueUpdater).toMatchTypeOf<Updater<AppState>>();

      const functionUpdater: Updater<AppState> = (prev) => ({
        ...prev,
        count: prev.count + 1,
      });
      expectTypeOf(functionUpdater).toMatchTypeOf<Updater<AppState>>();
    });
  });

  describe('Listener', () => {
    it('should accept state listener function', () => {
      const listener: Listener<number> = (state) => {
        console.log(state);
      };
      expectTypeOf(listener).toBeFunction();
      expectTypeOf(listener).parameters.toEqualTypeOf<[number]>();
      expectTypeOf(listener).returns.toBeVoid();
    });

    it('should work with complex state', () => {
      interface AppState {
        data: string[];
        loading: boolean;
      }

      const listener: Listener<AppState> = (state) => {
        if (state.loading) {
          console.log('Loading...');
        }
      };
      expectTypeOf(listener).parameters.toEqualTypeOf<[AppState]>();
    });
  });

  describe('Unsubscribe', () => {
    it('should be a function that returns void', () => {
      const unsubscribe: Unsubscribe = () => {};
      expectTypeOf(unsubscribe).toBeFunction();
      expectTypeOf(unsubscribe).parameters.toEqualTypeOf<[]>();
      expectTypeOf(unsubscribe).returns.toBeVoid();
    });

    it('should be callable without arguments', () => {
      const unsubscribe: Unsubscribe = () => {};
      unsubscribe(); // Should not error
    });
  });

  describe('Comparator', () => {
    it('should accept comparison function', () => {
      const comparator: Comparator<number> = (a, b) => a - b;
      expectTypeOf(comparator).toBeFunction();
      expectTypeOf(comparator).parameters.toEqualTypeOf<[number, number]>();
      expectTypeOf(comparator).returns.toBeNumber();
    });

    it('should work with custom objects', () => {
      interface User {
        age: number;
        name: string;
      }

      const ageComparator: Comparator<User> = (a, b) => a.age - b.age;
      const nameComparator: Comparator<User> = (a, b) =>
        a.name.localeCompare(b.name);

      expectTypeOf(ageComparator).parameters.toEqualTypeOf<[User, User]>();
      expectTypeOf(nameComparator).parameters.toEqualTypeOf<[User, User]>();
    });
  });

  describe('Predicate', () => {
    it('should accept predicate function', () => {
      const isEven: Predicate<number> = (n) => n % 2 === 0;
      expectTypeOf(isEven).toBeFunction();
      expectTypeOf(isEven).parameters.toEqualTypeOf<[number]>();
      expectTypeOf(isEven).returns.toBeBoolean();
    });

    it('should work with complex objects', () => {
      interface Product {
        price: number;
        inStock: boolean;
      }

      const isAffordable: Predicate<Product> = (p) => p.price < 100;
      const isAvailable: Predicate<Product> = (p) => p.inStock;

      expectTypeOf(isAffordable).parameters.toEqualTypeOf<[Product]>();
      expectTypeOf(isAvailable).parameters.toEqualTypeOf<[Product]>();
    });
  });
});
