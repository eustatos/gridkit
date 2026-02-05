# CORE-001: Base Type System Implementation

## Task Card

```
task_id: CORE-001
priority: P0
complexity: Low
estimated_tokens: ~8,000
ai_ready: true
dependencies: []
requires_review: true (foundation types)
```

## 🎯 Objective

Implement the foundational TypeScript types that all GridKit modules will use. These types must be strictly typed, framework-agnostic, and provide excellent developer experience through intelligent type inference.

## 📋 Implementation Scope

### **1. Branded ID Types (Memory-Safe)**

```typescript
/**
 * Branded type for Grid IDs with runtime validation.
 * Prevents ID mixing and enables compile-time safety.
 */
declare const __gridId: unique symbol;
export type GridId = string & { readonly [__gridId]: never };

/**
 * Branded type for Column IDs with structure validation.
 * Ensures consistent ID format and prevents collisions.
 */
declare const __columnId: unique symbol;
export type ColumnId = string & { readonly [__columnId]: never };

/**
 * Branded type for Row IDs with flexible but safe typing.
 * Supports both string and number while maintaining type safety.
 */
declare const __rowId: unique symbol;
export type RowId = (string | number) & { readonly [__rowId]: never };

/**
 * Branded type for Cell IDs with composite structure.
 * Format: `${RowId}_${ColumnId}` for O(1) lookups.
 */
declare const __cellId: unique symbol;
export type CellId = string & { readonly [__cellId]: never };
```

### **2. Smart Factory Functions**

```typescript
/**
 * Creates a validated GridId with optional prefix.
 * Auto-generates UUID v4 if no value provided.
 */
export function createGridId(id?: string): GridId {
  const value = id ?? generateUUID();
  validateIdFormat(value, 'grid');
  return value as GridId;
}

/**
 * Creates a ColumnId with dot-notation support validation.
 * Ensures valid JavaScript property access patterns.
 */
export function createColumnId(path: string): ColumnId {
  if (!isValidColumnPath(path)) {
    throw new GridError('INVALID_COLUMN_PATH', `Invalid column path: ${path}`);
  }
  return path as ColumnId;
}

/**
 * Creates a RowId with automatic type conversion.
 * Numbers are converted to strings for consistency.
 */
export function createRowId(id: string | number): RowId {
  const value = typeof id === 'number' ? id.toString() : id;
  validateRowId(value);
  return value as RowId;
}

/**
 * Creates a CellId from row and column IDs.
 * Uses deterministic composition for consistency.
 */
export function createCellId(rowId: RowId, columnId: ColumnId): CellId {
  return `${rowId}_${columnId}` as CellId;
}
```

### **3. Advanced Utility Types (Zero-Runtime)**

```typescript
/**
 * Extracts value type from nested accessor path.
 * Supports optional properties and undefined handling.
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
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: T[P];
};

/**
 * Extracts only string keys from an object type.
 * Useful for column accessor validation.
 */
export type StringKeys<T> = Extract<keyof T, string>;
```

### **4. Function Type Utilities**

```typescript
/**
 * Updater function type with better inference.
 * Supports both direct values and functional updates.
 */
export type Updater<T> = T | ((prev: T) => T);

/**
 * Listener with unsubscribe capability.
 * Memory-safe with automatic cleanup.
 */
export type Listener<T> = (value: T) => void | (() => void);

/**
 * Comparator with null-safe handling.
 * Returns -1, 0, or 1 for stable sorting.
 */
export type Comparator<T> = (a: T, b: T) => -1 | 0 | 1;

/**
 * Predicate with context support.
 * Includes index and array for advanced filtering.
 */
export type Predicate<T> = (value: T, index: number, array: T[]) => boolean;
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No runtime validation logic beyond basic ID validation
- ❌ No complex type manipulation utilities (use existing TypeScript)
- ❌ No framework-specific types (React, Vue, etc.)
- ❌ No business logic or algorithms
- ❌ No performance optimizations (these are compile-time types)

## 📁 **File Structure**

```
packages/core/src/types/
├── base.ts              # Core branded types & utilities
├── factory.ts           # ID creation functions
├── utils.ts            # Advanced type utilities
└── index.ts           # Public exports (tree-shakeable)
```

## 🧪 **Test Requirements**

```typescript
// MUST TEST these specific scenarios:
describe('Branded Types', () => {
  test('GridId prevents string mixing', () => {
    const gridId: GridId = createGridId('grid-1');
    const regularString: string = 'grid-1';

    // @ts-expect-error - Should not be assignable
    const error: GridId = regularString;
  });

  test('AccessorValue infers nested types', () => {
    interface Data {
      user: { profile: { name: string } };
    }

    type NameType = AccessorValue<Data, 'user.profile.name'>;
    // Should infer `string`, not `any` or `unknown`
  });

  test('Factory functions validate input', () => {
    // Should throw on invalid column paths
    expect(() => createColumnId('invalid..path')).toThrow();
  });
});
```

## 💡 **Key Implementation Patterns**

```typescript
// 1. Use `declare const` for brand symbols (zero runtime cost)
declare const __brand: unique symbol;

// 2. Factory functions should validate but be minimal
function validateIdFormat(id: string, type: string): void {
  if (!id.trim()) throw new Error(`${type} ID cannot be empty`);
}

// 3. Export types in tree-shakeable way
export type { GridId, ColumnId, RowId, CellId };
export { createGridId, createColumnId, createRowId, createCellId };
```

## 🔍 **TypeScript Configuration**

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

## 📊 **Success Metrics**

- ✅ Zero `any` types in exports
- ✅ < 500 bytes gzipped (types only, no runtime)
- ✅ 100% type test coverage with `expectTypeOf`
- ✅ All factory functions have JSDoc examples
- ✅ Branded types prevent accidental mixing
- ✅ Tree-shakeable exports

## 🎯 **AI Implementation Instructions**

1. **Start with branded types** - get the foundation right
2. **Implement factory functions** - minimal validation only
3. **Add utility types** - focus on type inference
4. **Write comprehensive type tests** - use `expectTypeOf`
5. **Ensure strict mode compliance** - no implicit `any`

**Remember:** This is COMPILE-TIME only. No runtime logic beyond basic validation. Focus on type safety and developer experience.

---

**Ready for implementation?** All dependencies are satisfied, scope is clearly defined, and patterns are provided.
