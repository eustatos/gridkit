/**
 * GridKit Core Types
 * 
 * This module contains the foundational TypeScript types that all other
 * GridKit modules depend on. These types are designed to be:
 * - Strictly typed (no `any`)
 * - Framework-agnostic
 * - Extensible via generics
 * - Well-documented with examples
 * 
 * @module @gridkit/core/types
 */

/**
 * Base constraint for row data.
 * All row data must extend this type to ensure type safety.
 * 
 * @template TData - The specific row data type
 * 
 * @example
 * Basic usage:
 * ```typescript
 * interface User extends RowData {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 * ```
 * 
 * @example
 * With nested properties:
 * ```typescript
 * interface Product extends RowData {
 *   id: string;
 *   details: {
 *     name: string;
 *     price: number;
 *     category: string;
 *   };
 *   inventory: {
 *     stock: number;
 *     warehouse: string;
 *   };
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
 * const columnId: ColumnId = 'user.name';
 * const nestedColumnId: ColumnId = 'user.profile.avatar.url';
 * const simpleId: ColumnId = 'id';
 * ```
 * 
 * @public
 */
export type ColumnId = string;

/**
 * Unique identifier for a row.
 * Can be string or number for flexibility with different data sources.
 * 
 * @example
 * ```typescript
 * const stringId: RowId = 'user-123';
 * const numericId: RowId = 123;
 * const uuid: RowId = '550e8400-e29b-41d4-a716-446655440000';
 * ```
 * 
 * @public
 */
export type RowId = string | number;

/**
 * Extracts the value type for a given accessor key.
 * Supports dot notation for nested properties.
 * 
 * @template TData - The row data type, must extend RowData
 * @template TKey - The accessor key (supports dot notation)
 * 
 * @example
 * Simple property access:
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 * 
 * type NameType = AccessorValue<User, 'name'>; // string
 * type AgeType = AccessorValue<User, 'age'>; // number
 * ```
 * 
 * @example
 * Nested property access:
 * ```typescript
 * interface User {
 *   profile: {
 *     name: string;
 *     bio: string;
 *   };
 * }
 * 
 * type NameType = AccessorValue<User, 'profile.name'>; // string
 * type BioType = AccessorValue<User, 'profile.bio'>; // string
 * ```
 * 
 * @example
 * Deep nesting (5+ levels):
 * ```typescript
 * interface ComplexData {
 *   a: {
 *     b: {
 *       c: {
 *         d: {
 *           e: {
 *             value: number;
 *           };
 *         };
 *       };
 *     };
 *   };
 * }
 * 
 * type DeepValue = AccessorValue<ComplexData, 'a.b.c.d.e.value'>; // number
 * ```
 * 
 * @example
 * Invalid key returns unknown:
 * ```typescript
 * interface User {
 *   name: string;
 * }
 * 
 * type InvalidType = AccessorValue<User, 'invalid'>; // unknown
 * type NestedInvalid = AccessorValue<User, 'profile.invalid'>; // unknown
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
 * @template K - Keys to make required (must be keys of T)
 * 
 * @example
 * ```typescript
 * interface Options {
 *   a?: string;
 *   b?: number;
 *   c?: boolean;
 * }
 * 
 * type RequiredA = RequireKeys<Options, 'a'>;
 * // { a: string; b?: number; c?: boolean }
 * 
 * type RequiredAB = RequireKeys<Options, 'a' | 'b'>;
 * // { a: string; b: number; c?: boolean }
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
 *     deep: {
 *       prop: number;
 *     };
 *   };
 *   other: boolean;
 * }
 * 
 * type PartialConfig = DeepPartial<Config>;
 * // {
 * //   nested?: {
 * //     value?: string;
 * //     deep?: {
 * //       prop?: number;
 * //     };
 * //   };
 * //   other?: boolean;
 * // }
 * ```
 * 
 * @example
 * With arrays:
 * ```typescript
 * interface WithArray {
 *   items: Array<{
 *     id: number;
 *     name: string;
 *   }>;
 * }
 * 
 * type PartialWithArray = DeepPartial<WithArray>;
 * // {
 * //   items?: Array<{
 * //     id?: number;
 * //     name?: string;
 * //   }>;
 * // }
 * ```
 * 
 * @public
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
    }
  : T;

/**
 * A function that updates state immutably.
 * Can be a direct value or an updater function.
 * 
 * @template T - The state type
 * 
 * @example
 * Direct value:
 * ```typescript
 * const updater: Updater<number> = 42;
 * ```
 * 
 * @example
 * Updater function:
 * ```typescript
 * const updater: Updater<number> = (prev) => prev + 1;
 * ```
 * 
 * @example
 * Complex state update:
 * ```typescript
 * interface AppState {
 *   count: number;
 *   user: {
 *     name: string;
 *     age: number;
 *   };
 * }
 * 
 * const stateUpdater: Updater<AppState> = (prev) => ({
 *   ...prev,
 *   count: prev.count + 1,
 *   user: {
 *     ...prev.user,
 *     age: prev.user.age + 1,
 *   },
 * });
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
 *   // Perform side effects based on state changes
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
 * 
 * // Later, when you want to stop listening:
 * unsubscribe();
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
 * const numericComparator: Comparator<number> = (a, b) => a - b;
 * [3, 1, 2].sort(numericComparator); // [1, 2, 3]
 * 
 * const stringComparator: Comparator<string> = (a, b) => 
 *   a.localeCompare(b);
 * ['c', 'a', 'b'].sort(stringComparator); // ['a', 'b', 'c']
 * 
 * const dateComparator: Comparator<Date> = (a, b) => 
 *   a.getTime() - b.getTime();
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
 * 
 * const isAdult: Predicate<User> = (user) => user.age >= 18;
 * const adults = users.filter(isAdult);
 * ```
 * 
 * @public
 */
export type Predicate<T> = (value: T) => boolean;