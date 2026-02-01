---
task_id: CORE-001
epic_id: EPIC-001
module: @gridkit/core
file: src/core/types/base.ts
priority: P0
complexity: low
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies: []
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Define Base TypeScript Types

## Context

GridKit needs foundation types that all other modules will use. These types must be:
- Strictly typed (no `any`)
- Framework-agnostic
- Extensible via generics
- Well-documented with JSDoc

This is the **FIRST task** - everything depends on these types being correct.

## Guidelines Reference

Before implementing, review:
- `.github/AI_GUIDELINES.md` - TypeScript strict mode requirements
- `CONTRIBUTING.md` - Naming conventions
- `docs/architecture/ARCHITECTURE.md` - Understand overall type system

## Objectives

- [ ] Define `RowData` base constraint type
- [ ] Define `ColumnId` and `RowId` types
- [ ] Create utility types for type safety (`AccessorValue`, `RequireKeys`, `DeepPartial`)
- [ ] Define common function types (`Updater`, `Listener`, `Comparator`, `Predicate`)
- [ ] Add comprehensive JSDoc with examples

---

## Implementation Requirements

### 1. Base Data Types

**File: `src/core/types/base.ts`**

```typescript
/**
 * Base constraint for row data.
 * All row data must extend this type to ensure type safety.
 * 
 * @example
 * ```typescript
 * interface User extends RowData {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 * ```
 * 
 * @public
 */
export type RowData = Record<string, unknown>;

/**
 * Unique identifier for a column.
 * Must be a string to support dot notation accessors.
 * 
 * @example
 * ```typescript
 * const columnId: ColumnId = 'user.profile.name';
 * ```
 * 
 * @public
 */
export type ColumnId = string;

/**
 * Unique identifier for a row.
 * Can be string or number for flexibility.
 * 
 * @example
 * ```typescript
 * const rowId: RowId = 'user-123';
 * const numericId: RowId = 123;
 * ```
 * 
 * @public
 */
export type RowId = string | number;
```

### 2. Utility Types

```typescript
/**
 * Extracts the value type for a given accessor key.
 * Supports dot notation for nested properties.
 * 
 * @template TData - The row data type
 * @template TKey - The accessor key (supports dot notation)
 * 
 * @example
 * ```typescript
 * interface User {
 *   profile: {
 *     name: string;
 *   };
 * }
 * 
 * type NameType = AccessorValue<User, 'profile.name'>; // string
 * ```
 * 
 * @public
 */
export type AccessorValue<
  TData extends RowData,
  TKey extends string
> = TKey extends `${infer TFirst}.${infer TRest}`
  ? TFirst extends keyof TData
    ? TData[TFirst] extends RowData
      ? AccessorValue<TData[TFirst], TRest>
      : unknown
    : unknown
  : TKey extends keyof TData
  ? TData[TKey]
  : unknown;

/**
 * Makes specific properties of a type required.
 * 
 * @template T - The base type
 * @template K - Keys to make required
 * 
 * @example
 * ```typescript
 * interface Options {
 *   a?: string;
 *   b?: number;
 * }
 * 
 * type Required = RequireKeys<Options, 'a'>; // { a: string; b?: number }
 * ```
 * 
 * @public
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial type - makes all properties optional recursively.
 * 
 * @template T - The type to make deep partial
 * 
 * @example
 * ```typescript
 * interface Config {
 *   nested: {
 *     value: string;
 *   };
 * }
 * 
 * type PartialConfig = DeepPartial<Config>;
 * // { nested?: { value?: string } }
 * ```
 * 
 * @public
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### 3. Function Types

```typescript
/**
 * A function that updates state immutably.
 * Can be a direct value or an updater function.
 * 
 * @template T - The state type
 * 
 * @example
 * ```typescript
 * const updater: Updater<number> = 42;
 * const fnUpdater: Updater<number> = (prev) => prev + 1;
 * ```
 * 
 * @public
 */
export type Updater<T> = T | ((prev: T) => T);

/**
 * A listener function that receives state updates.
 * 
 * @template T - The state type
 * 
 * @example
 * ```typescript
 * const listener: Listener<AppState> = (state) => {
 *   console.log('State updated:', state);
 * };
 * ```
 * 
 * @public
 */
export type Listener<T> = (state: T) => void;

/**
 * A function that unsubscribes a listener.
 * 
 * @example
 * ```typescript
 * const unsubscribe = store.subscribe(listener);
 * unsubscribe(); // Stop listening
 * ```
 * 
 * @public
 */
export type Unsubscribe = () => void;

/**
 * A comparator function for sorting.
 * Returns negative if a < b, positive if a > b, zero if equal.
 * 
 * @template T - The type being compared
 * 
 * @example
 * ```typescript
 * const comparator: Comparator<number> = (a, b) => a - b;
 * [3, 1, 2].sort(comparator); // [1, 2, 3]
 * ```
 * 
 * @public
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * A predicate function for filtering.
 * 
 * @template T - The type being filtered
 * 
 * @example
 * ```typescript
 * const isEven: Predicate<number> = (n) => n % 2 === 0;
 * [1, 2, 3, 4].filter(isEven); // [2, 4]
 * ```
 * 
 * @public
 */
export type Predicate<T> = (value: T) => boolean;
```

---

## Test Requirements

Create `src/core/types/__tests__/base.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type {
  RowData,
  ColumnId,
  RowId,
  AccessorValue,
  RequireKeys,
  DeepPartial,
  Updater,
} from '../base';

describe('Base Types', () => {
  describe('RowData', () => {
    it('should accept any object with string keys', () => {
      const data: RowData = { id: 1, name: 'Test' };
      expectTypeOf(data).toMatchTypeOf<Record<string, unknown>>();
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
    });

    it('should handle deep nesting', () => {
      interface User extends RowData {
        data: {
          profile: {
            contact: {
              email: string;
            };
          };
        };
      }

      type EmailType = AccessorValue<User, 'data.profile.contact.email'>;
      expectTypeOf<EmailType>().toBeString();
    });

    it('should return unknown for invalid key', () => {
      interface User extends RowData {
        name: string;
      }

      type InvalidType = AccessorValue<User, 'invalid'>;
      expectTypeOf<InvalidType>().toBeUnknown();
    });
  });

  describe('RequireKeys', () => {
    it('should make specific keys required', () => {
      interface Options {
        a?: string;
        b?: number;
        c?: boolean;
      }

      type Required = RequireKeys<Options, 'a' | 'b'>;
      
      expectTypeOf<Required>().toMatchTypeOf<{
        a: string;
        b: number;
        c?: boolean;
      }>();
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
      }

      type Partial = DeepPartial<Config>;
      
      const partial: Partial = {};
      const partialNested: Partial = { nested: {} };
      const partialDeep: Partial = { nested: { deep: {} } };
      
      expectTypeOf(partial).toMatchTypeOf<Partial>();
      expectTypeOf(partialNested).toMatchTypeOf<Partial>();
      expectTypeOf(partialDeep).toMatchTypeOf<Partial>();
    });
  });

  describe('Updater', () => {
    it('should accept direct value', () => {
      const updater: Updater<number> = 42;
      expectTypeOf(updater).toMatchTypeOf<number | ((prev: number) => number)>();
    });

    it('should accept function', () => {
      const updater: Updater<number> = (prev) => prev + 1;
      expectTypeOf(updater).toMatchTypeOf<number | ((prev: number) => number)>();
    });
  });
});
```

---

## Edge Cases to Handle

- [ ] TypeScript inference works correctly for all utility types
- [ ] Generic constraints are properly enforced
- [ ] Dot notation types work for deeply nested objects (5+ levels)
- [ ] Types work with `readonly` modifiers
- [ ] Types work with optional properties
- [ ] Types work with union types
- [ ] `AccessorValue` returns `unknown` for invalid paths (not `any`)

---

## Performance Requirements

N/A - These are compile-time types only

---

## Files to Create/Modify

- [ ] `src/core/types/base.ts` - Type definitions
- [ ] `src/core/types/__tests__/base.test.ts` - Type tests
- [ ] `src/core/types/index.ts` - Re-exports

**`src/core/types/index.ts`:**
```typescript
export type {
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
} from './base';
```

---

## Success Criteria

- [ ] All type tests pass
- [ ] TypeScript compiles with strict mode
- [ ] JSDoc complete for all exports
- [ ] No `any` types used
- [ ] Type inference works in VS Code (test with example usage)
- [ ] Follows patterns in AI_GUIDELINES.md
- [ ] All edge cases covered

---

## Related Tasks

- **Blocks:** CORE-002, CORE-003, CORE-004, COLUMN-001, ROW-001, DATA-001 (all other tasks depend on these types)

---

## Notes for AI

- These types are the foundation - be extra careful with correctness
- Test types thoroughly with `expectTypeOf` from vitest
- Ensure JSDoc examples actually compile
- Consider future extensibility (can we add more utility types later?)
- The `AccessorValue` type is complex - test it with many scenarios
- Make sure `unknown` is used instead of `any` for invalid cases