# TypeScript Type System Analysis

**Version:** 1.0.0  
**Last Updated:** 2024-02-18  
**Status:** Draft

---

## Executive Summary

GridKit's TypeScript type system provides **compile-time safety** for table data, columns, and rows. This document analyzes the current implementation and identifies issues with `RowData` constraints and type inference.

---

## 1. Current Type System Architecture

### 1.1 Branded Types (✅ Working)

GridKit uses unique symbol branding for ID types:

```typescript
declare const __rowId: unique symbol;
export type RowId = (string | number) & { readonly [__rowId]: never };

declare const __columnId: unique symbol;
export type ColumnId = string & { readonly [__columnId]: never };
```

**Status:** ✅ Working correctly
- Zero runtime overhead
- Compile-time safety
- Full IDE support

### 1.2 RowData Base Type (⚠️ Needs Review)

```typescript
export interface RowData {
  [key: string]: unknown;
}
```

**Current Issues:**
- Too permissive (allows any object)
- No constraint validation at compile time
- Missing runtime validation

---

## 2. Type System Analysis

### 2.1 Type Hierarchy

```
RowData (base interface)
  ├── User-defined types (extends RowData implicitly)
  │   ├── User { id: number; name: string; }
  │   └── Admin { id: number; permissions: string[]; }
  │
ColumnDef<TData extends RowData, TValue>
  ├── accessorKey: AccessorKey<TData> (string path)
  └── accessorFn: AccessorFn<TData, TValue> (function)
  │
Table<TData extends RowData>
  ├── columns: ColumnDef<TData>[]
  ├── data: TData[]
  └── state: TableState<TData>
```

### 2.2 Generic Inference Chain

```typescript
// Step 1: User defines data type
interface User {
  id: number;
  name: string;
  profile: {
    email: string;
  };
}

// Step 2: Type inference from TableOptions
createTable<User>({ ... })
  → TData inferred as User
  → Columns use User for accessorKey inference
  → AccessorKey<User> = 'id' | 'name' | 'profile' | 'profile.email'

// Step 3: ColumnDef inference
ColumnDef<User, string>
  → accessorKey: AccessorKey<User> (inferred from key)
  → TValue: string (inferred from accessorKey path)

// Step 4: Runtime methods
Column<User, string>
  → getValue(): string (type-safe)
  → getFilterValue(): string
```

---

## 3. Identified Issues

### Issue 3.1: Import Path Resolution Failures

**Error:**
```
TS2307: Cannot find module '@/types/table/Table'
```

**Affected Files:**
- `packages/core/src/column/factory/build-column-methods.ts`
- `packages/core/src/column/factory/column-registry.ts`
- `packages/core/src/column/factory/create-column.ts`
- `packages/core/src/column/factory/validate-column.ts`

**Root Cause:**
TypeScript cannot resolve `@/types` alias in some files.

**Current tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

**Issue:** The `baseUrl` is set to `./src`, so `@/*` should work, but there may be:
1. Missing `tsconfig.json` references in package.json
2. Circular dependencies
3. Incorrect path mappings

### Issue 3.2: Type Parameter Inference Failures

**Error:**
```
TS6205: All type parameters are unused
```

**Example:**
```typescript
export function buildColumnMethods<TData extends RowData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
): ColumnMethods<TData, TValue> {
  // TData and TValue are used, but TS thinks they're unused
}
```

**Root Cause:** Type parameters used only in:
1. Function parameters (✅ valid)
2. Return type (✅ valid)

This might be a TypeScript bug or misconfiguration.

### Issue 3.3: Missing Type Re-exports

**Error:**
```
Cannot find module '@/types/column/ColumnInstance'
```

**Issue:** Some files import types that should be re-exported from `@/types` but aren't.

**Current State:**
- `@/types/column` exports types from `types/column/index.ts`
- `@/types` re-exports from `types/index.ts`
- Some intermediate types not exported

---

## 4. Type Safety Analysis

### 4.1 AccessorKey Type Safety

```typescript
// Current implementation
export type AccessorKey<TData extends RowData> =
  StringKeys<TData> extends infer K
    ? K extends string
      ? | K
        | (TData[K] extends RowData ? `${K}.${AccessorKey<TData[K]>}` : never)
      : never
    : never;
```

**Analysis:**
- ✅ Recursive path inference
- ✅ Compile-time path validation
- ✅ Supports dot notation
- ⚠️ Complex type definitions
- ⚠️ May cause performance issues with deeply nested objects

### 4.2 AccessorValue Type Safety

```typescript
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
```

**Analysis:**
- ✅ Full type safety for nested access
- ✅ Fails at compile-time for invalid paths
- ✅ Works with `as const` assertions
- ⚠️ Can be slow with complex nested types

### 4.3 ColumnDef Generic Inference

```typescript
export interface ColumnDef<TData extends RowData, TValue = unknown> {
  accessorKey?: AccessorKey<TData>;
  accessorFn?: AccessorFn<TData, TValue>;
  // ...
}
```

**Analysis:**
- ✅ `TData` constrained to `RowData`
- ✅ `TValue` defaults to `unknown`
- ⚠️ Inference fails if both `accessorKey` and `accessorFn` provided
- ⚠️ No mutual exclusion enforcement

---

## 5. Recommended Fixes

### Fix 5.1: Resolve Import Path Issues

**Step 1:** Verify tsconfig.json structure

```json
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/__tests__", "**/examples/**"]
}
```

**Step 2:** Add path aliases to vitest config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3:** Verify all imports use `@/types`

```typescript
// ✅ Correct
import type { RowData } from '@/types';
import type { Table } from '@/types/table/Table';

// ❌ Incorrect
import type { RowData } from '@/types/base';
```

### Fix 5.2: Add Missing Type Re-exports

**Update `types/column/index.ts`:**

```typescript
export type {
  Column,
  ColumnDef,
  ColumnMeta,
  ColumnValue,
  AccessorKey,
  AccessorFn,
  AccessorValue,
  HeaderContext,
  CellContext,
  FooterContext,
  HeaderRenderer,
  CellRenderer,
  FooterRenderer,
  ColumnId,
  ColumnGroupId,
  Comparator,
  FilterFn,
  AggregationFn,
  ColumnFormat,
  CellMeta,
  CellValidation,
  ValidationResult,
  ColumnUtils,
} from './SupportingTypes';
```

### Fix 5.3: Add RowData Runtime Validation

**Current:**
```typescript
export interface RowData {
  [key: string]: unknown;
}
```

**Recommended:**
```typescript
export interface RowData {
  [key: string]: unknown;
}

// Runtime validation
export function isRowData(value: unknown): value is RowData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Helper to constrain types
export type EnsureRowData<T> = T extends RowData ? T : never;
```

### Fix 5.4: Add Strict RowData Extension

**Recommended pattern for users:**

```typescript
// Base type (do not edit)
export interface RowData {
  [key: string]: unknown;
}

// User types (should extend RowData)
interface User extends RowData {
  id: number;
  name: string;
  email: string;
}

// OR use intersection
type User = {
  id: number;
  name: string;
  email: string;
} & RowData;
```

---

## 6. Type Testing Strategy

### 6.1 Runtime Tests

```typescript
import { describe, it, expect } from 'vitest';
import { RowData, isRowData } from '@gridkit/core/types';

describe('RowData', () => {
  it('should validate RowData objects', () => {
    expect(isRowData({ id: 1, name: 'test' })).toBe(true);
    expect(isRowData([])).toBe(false);
    expect(isRowData(null)).toBe(false);
    expect(isRowData(undefined)).toBe(false);
  });
});
```

### 6.2 Compile-time Tests

```typescript
// @ts-expect-error - should fail
type Invalid1 = AccessorValue<User, 'non.existent'>;

// @ts-expect-error - should fail
type Invalid2 = AccessorValue<User, 'profile.avatar'>;

// ✅ Valid paths
type Valid1 = AccessorValue<User, 'id'>; // number
type Valid2 = AccessorValue<User, 'profile.email'>; // string
```

---

## 7. Performance Considerations

### 7.1 Type Evaluation Time

Complex type definitions can slow TypeScript compilation:

| Type | Complexity | Impact |
|------|-----------|--------|
| `AccessorKey<T>` | O(n) | Low |
| `AccessorValue<T, K>` | O(n) | Low |
| `DeepPartial<T>` | O(n²) | Medium |
| Generic inference | O(n) | Low |

**Recommendation:** Monitor build times and optimize complex types if needed.

### 7.2 Bundle Size Impact

Type-only exports have zero runtime impact:

```typescript
// ✅ Type-only export (no runtime cost)
import type { RowData } from '@/types';

// ❌ Runtime import (increases bundle size)
import { RowData } from '@/types';
```

---

## 8. Migration Guide

### 8.1 Updating to Strict Types

**Before:**
```typescript
interface User {
  id: number;
  name: string;
}

const table = createTable({
  data: users,
  columns: [{ accessorKey: 'name' }],
});
```

**After:**
```typescript
interface User extends RowData {
  id: number;
  name: string;
}

const table = createTable<User>({
  data: users,
  columns: [{ accessorKey: 'name' as const }],
});
```

### 8.2 Updating Accessor Paths

**Before:**
```typescript
const columns: ColumnDef<User>[] = [
  { accessorKey: 'profile.name', header: 'Name' },
];
```

**After:**
```typescript
const columns: ColumnDef<User>[] = [
  { accessorKey: 'profile.name' as const, header: 'Name' },
];
```

---

## 9. Best Practices Summary

### ✅ Do:

1. Define types before using them
2. Use `accessorKey` with `as const` for dot notation
3. Use `accessorFn` for computed values
4. Extend `RowData` for user types
5. Use generic parameters explicitly when needed

### ❌ Don't:

1. Use `any` type
2. Mix different ID types
3. Use deeply nested accessors (> 3 levels)
4. Modify RowData interface
5. Bypass type checking with type assertions

---

## 10. Tools & Resources

### 10.1 Type Checking

```bash
# Check types
npx tsc --noEmit

# Check types with pretty output
npx tsc --noEmit --pretty

# Watch mode
npx tsc --noEmit --watch
```

### 10.2 Type Playground

Use [TypeScript Playground](https://www.typescriptlang.org/play) to test type definitions.

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-02-18 | Initial analysis |

---

**Next Steps:**
1. Fix import path issues (Fix 5.1)
2. Add missing type re-exports (Fix 5.2)
3. Add runtime validation (Fix 5.3)
4. Add type tests to CI/CD
5. Document common patterns for users
