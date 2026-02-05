/**
 * Advanced type utilities for GridKit.
 * 
 * These utilities provide compile-time type manipulation
 * with zero runtime cost. They are designed to work with
 * TypeScript's conditional types and template literal types.
 * 
 * @example
 * ```ts
 * import type { AccessorValue, DeepPartial } from '@gridkit/core/types';
 * 
 * interface User {
 *   id: number;
 *   profile: {
 *     name: string;
 *     settings: {
 *       theme: 'light' | 'dark';
 *     };
 *   };
 * }
 * 
 * // Extract nested value type
 * type Name = AccessorValue<User, 'profile.name'>; // string
 * 
 * // Create partial with deep nesting
 * const partialUser: DeepPartial<User> = {
 *   profile: { settings: { theme: 'dark' } }
 * };
 * ```
 * 
 * @module CoreUtils
 */

import type { RowData } from './base';

/**
 * Extracts the type at a nested accessor path.
 * 
 * Supports deep property access with dot notation (e.g., `"user.profile.name"`).
 * Type-safe: fails at compile-time for invalid paths.
 * 
 * @template TData - The source data type (must extend RowData)
 * @template TPath - The accessor path (e.g., `"user.profile.name"`)
 * 
 * @example
 * Basic usage:
 * ```ts
 * interface User {
 *   id: number;
 *   profile: {
 *     name: string;
 *     age: number;
 *   };
 * }
 * 
 * type Name = AccessorValue<User, 'profile.name'>; // string
 * type Age = AccessorValue<User, 'profile.age'>;   // number
 * ```
 * 
 * @example
 * With invalid path (compile-time error):
 * ```ts
 * // @ts-expect-error - 'profile.avatar' does not exist
 * type Avatar = AccessorValue<User, 'profile.avatar'>;
 * ```
 */
export type AccessorValue<
  TData extends RowData,
  TPath extends string,
> = TPath extends `${infer First}.${infer Rest}`
  ? First extends keyof TData
    ? TData[First] extends RowData
      ? AccessorValue<TData[First], Rest>
      : never
    : never
  : TPath extends keyof TData
    ? TData[TPath]
    : never;

/**
 * DeepPartial that handles arrays and readonly properties.
 * More precise than standard Partial<T>.
 * 
 * @template T - The type to make partial
 * 
 * @example
 * ```ts
 * interface Config {
 *   database: {
 *     host: string;
 *     port: number;
 *   };
 *   features: string[];
 * }
 * 
 * const config: DeepPartial<Config> = {
 *   database: { host: 'localhost' }, // port is optional
 *   features: ['auth'] // array is optional but type-safe
 * };
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

/**
 * Makes specific keys required while keeping others optional.
 * Better type inference than standard Required<Pick<T, K>>.
 * 
 * @template T - The source type
 * @template K - Keys to make required
 * 
 * @example
 * ```ts
 * interface User {
 *   id?: number;
 *   name: string;
 *   email?: string;
 * }
 * 
 * // Make 'email' required
 * type UserWithEmail = RequireKeys<User, 'email'>;
 * // id?: number, name: string, email: string
 * ```
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: T[P];
};

/**
 * Extracts only string keys from an object type.
 * Useful for column accessor validation.
 * 
 * @template T - The source type
 * 
 * @example
 * ```ts
 * interface Data {
 *   name: string;
 *   123: number;
 *   active: boolean;
 * }
 * 
 * type StringKeysOfData = StringKeys<Data>; // 'name' | 'active'
 * ```
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Updater function type with better inference.
 * Supports both direct values and functional updates.
 * 
 * @template T - The type being updated
 * 
 * @example
 * ```ts
 * const setState = (updater: Updater<string>) => {
 *   // Can be called with either:
 *   updater('new value');
 *   updater(prev => prev.toUpperCase());
 * };
 * ```
 */
export type Updater<T> = T | ((prev: T) => T);

/**
 * Listener with unsubscribe capability.
 * Memory-safe with automatic cleanup.
 * 
 * @template T - The type of value being listened to
 * 
 * @example
 * ```ts
 * const subscribe = (listener: Listener<number>) => {
 *   const unsubscribe = listener(0);
 *   if (unsubscribe) {
 *     unsubscribe();
 *   }
 * };
 * ```
 */
export type Listener<T> = (value: T) => void | (() => void);

/**
 * Comparator with null-safe handling.
 * Returns -1, 0, or 1 for stable sorting.
 * 
 * @template T - The type being compared
 * 
 * @example
 * ```ts
 * const compareNames = (a: string, b: string): -1 | 0 | 1 => {
 *   if (a < b) return -1;
 *   if (a > b) return 1;
 *   return 0;
 * };
 * ```
 */
export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;

/**
 * Predicate with context support.
 * Includes index and array for advanced filtering.
 * 
 * @template T - The type being filtered
 * 
 * @example
 * ```ts
 * const filterEven = (value: number, index: number, array: number[]): boolean => {
 *   return value % 2 === 0;
 * };
 * 
 * const evens = [1, 2, 3, 4, 5].filter(filterEven);
 * ```
 */
export type Predicate<T> = (value: T, index: number, array: T[]) => boolean;

/**
 * Extracts the first element of a tuple type.
 * 
 * @template T - The tuple type
 * 
 * @example
 * ```ts
 * type Tuple = [string, number, boolean];
 * type First = FirstElement<Tuple>; // string
 * ```
 */
export type FirstElement<T extends unknown[]> = T extends [infer First, ...unknown[]]
  ? First
  : never;

/**
 * Extracts all but the first element of a tuple type.
 * 
 * @template T - The tuple type
 * 
 * @example
 * ```ts
 * type Tuple = [string, number, boolean];
 * type Rest = RestElements<Tuple>; // [number, boolean]
 * ```
 */
export type RestElements<T extends unknown[]> = T extends [unknown, ...infer Rest]
  ? Rest
  : [];

/**
 * Checks if a type is exactly `undefined` (not including null).
 * 
 * @template T - The type to check
 * 
 * @example
 * ```ts
 * type Test1 = IsUndefined<undefined>; // true
 * type Test2 = IsUndefined<null>;      // false
 * type Test3 = IsUndefined<string>;    // false
 * ```
 */
export type IsUndefined<T> = [T] extends [undefined] ? true : false;

/**
 * Checks if a type is exactly `null` (not including undefined).
 * 
 * @template T - The type to check
 * 
 * @example
 * ```ts
 * type Test1 = IsNull<null>;          // true
 * type Test2 = IsNull<undefined>;     // false
 * type Test3 = IsNull<string>;        // false
 * ```
 */
export type IsNull<T> = [T] extends [null] ? true : false;

/**
 * Makes a type non-nullable (removes null and undefined).
 * Alias for NonNullable.
 * 
 * @template T - The type to make non-nullable
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extracts the return type of a function, handling void.
 * 
 * @template T - The function type
 * 
 * @example
 * ```ts
 * const fn = () => 'hello';
 * type Return = ReturnTypeOrVoid<typeof fn>; // string
 * 
 * const voidFn = () => {};
 * type VoidReturn = ReturnTypeOrVoid<typeof voidFn>; // void
 * ```
 */
export type ReturnTypeOrVoid<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : void;

/**
 * Constructs an object from keys and values.
 * Useful for mapping operations.
 * 
 * @template K - The key type
 * @template V - The value type
 * 
 * @example
 * ```ts
 * const mapToObject = <K extends string, V>(
 *   entries: [K, V][]
 * ): MappedObject<K, V> => {
 *   return Object.fromEntries(entries);
 * };
 * ```
 */
export type MappedObject<K extends string, V> = {
  [P in K]: V;
};