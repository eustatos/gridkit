# TypeScript Type Troubleshooting Guide

**Version:** 1.0.0  
**Last Updated:** 2024-02-18  
**Status:** Draft

---

## Executive Summary

GridKit TypeScript type system provides **compile-time safety** for table data, columns, and rows through branded types, generics, and advanced type utilities. However, developers may encounter type errors related to `RowData`, accessors, and generic inference.

This guide helps you diagnose and fix common type issues.

---

## 1. Core Type System Overview

### 1.1 Branded Types

GridKit uses **unique symbol branding** for type safety with zero runtime overhead:

```typescript
// Before (unsafe)
type RowId = string | number; // ❌ Can mix with any string/number

// After (safe)
declare const __rowId: unique symbol;
export type RowId = (string | number) & { readonly [__rowId]: never };
// ✅ compile-time safe, runtime string/number
```

**Benefits:**
- Prevents ID mixing (e.g., `RowId` vs `ColumnId`)
- Zero runtime overhead (removed at compile time)
- Full type inference in IDE

### 1.2 RowData Base Type

All row data **must extend `RowData`**:

```typescript
// Base type
export interface RowData {
  [key: string]: unknown;
}

// Your data should extend this
interface User extends RowData {
  id: number;
  name: string;
  profile: {
    email: string;
    age: number;
  };
}
```

**Why?**
- Enables type inference for columns, accessors, and cells
- Provides index signature for dynamic access
- Allows nested path type inference

---

## 2. Common Type Issues & Solutions

### Issue 1: `TData does not satisfy the RowData constraint`

**Error:**
```typescript
// ❌ Error: Type 'number' does not satisfy the constraint 'RowData'
const table = createTable<number>({ ... });
```

**Solution:**
```typescript
// ✅ Use object type
interface User {
  id: number;
  name: string;
}

// User extends RowData implicitly (object types do)
const table = createTable<User>({ ... });
```

**Why?** `RowData` is defined as `{ [key: string]: unknown }` - only objects satisfy this.

---

### Issue 2: Accessor path type inference fails

**Error:**
```typescript
interface User {
  id: number;
  profile: {
    name: string;
  };
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'profile.name', // ❌ Type 'string' is not assignable
    header: 'Name',
  },
];
```

**Solution:**
```typescript
// ✅ Use explicit generic parameter
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'profile.name' as const, // ✅ Type inferred correctly
    header: 'Name',
  },
];
```

**Alternative:**
```typescript
// ✅ Use accessorFn for complex logic
const columns: ColumnDef<User>[] = [
  {
    accessorFn: (row) => row.profile.name,
    header: 'Name',
  },
];
```

---

### Issue 3: Column value type mismatch

**Error:**
```typescript
interface User {
  id: number;
  name: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    cell: (info) => <div>{info.getValue()}</div>, // ❌ info.getValue() is unknown
  },
];
```

**Solution:**
```typescript
// ✅ Explicit generic on ColumnDef
const columns: ColumnDef<User, number>[] = [
  {
    accessorKey: 'id',
    cell: (info) => <div>{info.getValue<number>()}</div>, // ✅ Type: number
  },
];
```

**Or:**
```typescript
// ✅ Type inference from accessorKey
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id', // ✅ TValue inferred as number
    cell: (info) => <div>{info.getValue()}</div>, // ✅ Type: number
  },
];
```

---

### Issue 4: Circular dependencies in types

**Error:**
```
Error: Cannot find module '@/types/column/ColumnInstance'
```

**Solution:**
Check your `tsconfig.json` paths:

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

**Also ensure:**
1. All imports use `@/` alias
2. No relative imports like `../../types`
3. Build order is correct (base types before column types)

---

### Issue 5: Generic type inference fails

**Error:**
```typescript
// ❌ Cannot infer TData
const table = createTable({
  data: users,
  columns: [
    {
      accessorKey: 'name',
      header: 'Name',
    },
  ],
});
```

**Solution:**
```typescript
// ✅ Explicit type parameter
const table = createTable<User>({
  data: users,
  columns: [
    {
      accessorKey: 'name',
      header: 'Name',
    },
  ],
});
```

**Alternative:**
```typescript
// ✅ Type inference from data
const table = createTable({
  data: users as User[],
  columns: [...],
});
```

---

## 3. Type Utilities Reference

### 3.1 AccessorValue

Extract nested value type:

```typescript
import type { AccessorValue } from '@gridkit/core/types';

interface User {
  id: number;
  profile: {
    name: string;
    settings: {
      theme: 'light' | 'dark';
    };
  };
}

type Name = AccessorValue<User, 'profile.name'>;     // string
type Theme = AccessorValue<User, 'profile.settings.theme'>; // 'light' | 'dark'
```

**Benefits:**
- ✅ Compile-time path validation
- ✅ Auto-completion for paths
- ❌ Fails at compile-time for invalid paths

---

### 3.2 DeepPartial

Create partial with deep nesting:

```typescript
import type { DeepPartial } from '@gridkit/core/types';

interface Config {
  database: {
    host: string;
    port: number;
  };
  features: string[];
}

const config: DeepPartial<Config> = {
  database: { host: 'localhost' }, // ✅ port is optional
  features: ['auth'], // ✅ array is optional
};
```

---

### 3.3 RequireKeys

Make specific keys required:

```typescript
import type { RequireKeys } from '@gridkit/core/types';

interface User {
  id?: number;
  name: string;
  email?: string;
}

type UserWithEmail = RequireKeys<User, 'email'>;
// Result: id?: number, name: string, email: string (required)
```

---

## 4. Best Practices

### 4.1 Define Types Before Table Creation

```typescript
// ✅ Define type first
interface User {
  id: number;
  name: string;
  email: string;
}

// ✅ Then use it
const table = createTable<User>({
  data: [],
  columns: [],
});
```

### 4.2 Use accessorKey for Simple Paths

```typescript
// ✅ accessorKey with dot notation
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'profile.name',
    header: 'Name',
  },
];
```

### 4.3 Use accessorFn for Complex Logic

```typescript
// ✅ accessorFn for computed values
const columns: ColumnDef<User>[] = [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: 'Full Name',
  },
];
```

### 4.4 Explicit Generic for Complex Columns

```typescript
// ✅ Explicit generic for computed columns
const columns: ColumnDef<User, string>[] = [
  {
    accessorFn: (row) => row.email.split('@')[0],
    header: 'Username',
  },
];
```

### 4.5 Type Row Data at Source

```typescript
// ✅ Type at data source
interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

// ✅ Type inferred automatically
const table = createTable<User>({ data: users, columns: [] });
```

---

## 5. Debugging Tips

### 5.1 Check Type Constraints

```typescript
// Add this temporarily to see what type is inferred
type Test = Parameters<typeof createTable>[0]['data'][number];
// Hover over 'Test' in your IDE to see the type
```

### 5.2 Verify RowData Extension

```typescript
// Check if your type extends RowData
type IsRowData<T> = T extends RowData ? 'Yes' : 'No';
type Test = IsRowData<User>; // Should be 'Yes'
```

### 5.3 Use TypeScript Playground

Paste your code in [TypeScript Playground](https://www.typescriptlang.org/play) to debug type errors.

---

## 6. Migration Guide

### From Loose Types to Strict Types

**Before:**
```typescript
interface User {
  id: number;
  name: string;
  // ❌ No RowData extension
}

// ❌ No generic parameter
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
  // ✅ Extends RowData
}

// ✅ Explicit generic
const table = createTable<User>({
  data: users,
  columns: [{ accessorKey: 'name' as const }],
});
```

---

## 7. Advanced Patterns

### 7.1 Nested Data Types

```typescript
interface User extends RowData {
  id: number;
  profile: {
    name: string;
    settings: {
      notifications: boolean;
    };
  };
}

// ✅ Type-safe nested access
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'profile.settings.notifications' as const,
    header: 'Notifications',
  },
];
```

### 7.2 Union Types

```typescript
interface Admin extends RowData {
  role: 'admin';
  permissions: string[];
}

interface User extends RowData {
  role: 'user';
  preferences: string[];
}

type Account = Admin | User;

// ✅ Handle union types
const columns: ColumnDef<Account>[] = [
  {
    accessorFn: (row) => row.role === 'admin' ? row.permissions : row.preferences,
    header: 'Access',
  },
];
```

### 7.3 Generic Table Helper

```typescript
// Helper for type-safe table creation
function createTypedTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  return createTable(options);
}

// Usage
const table = createTypedTable<User>({
  data: users,
  columns: [],
});
```

---

## 8. Type Testing

### 8.1 Using Vitest expectTypeOf

```typescript
import { expectTypeOf } from 'vitest';
import type { RowData } from '@gridkit/core/types';

interface User extends RowData {
  id: number;
  name: string;
}

test('type inference', () => {
  expectTypeOf<RowData>().toMatchTypeOf<User>();
  
  expectTypeOf<User>().exclude<RowData>().toBeNever();
});
```

### 8.2 Compile-time Type Tests

```typescript
// @ts-expect-error - should fail
type Invalid = AccessorValue<User, 'non.existent.path'>;

// ✅ Valid path compiles
type Valid = AccessorValue<User, 'profile.name'>;
```

---

## 9. Performance Considerations

### 9.1 Type-Only Imports

```typescript
// ✅ Type-only import (no runtime overhead)
import type { RowData } from '@/types';

// ❌ Runtime import for types (increases bundle size)
import { RowData } from '@/types';
```

### 9.2 Avoid Type Assertions

```typescript
// ❌ Type assertion (bypasses type checking)
const value = row['profile.name'] as string;

// ✅ Type-safe accessor
const value = row.profile.name; // with proper type inference
```

---

## 10. Common Error Codes

| Error Code | Cause | Solution |
|------------|-------|----------|
| `ROW_INVALID_ID` | Row ID not extending `RowId` | Use `createRowId()` factory |
| `COLUMN_INVALID_ACCESSOR` | Invalid accessor path | Use `accessorKey` with valid path or `accessorFn` |
| `TABLE_INVALID_OPTIONS` | Missing required options | Add required fields to table options |
| `TS2344` | Type does not satisfy RowData | Extend `RowData` or use object type |

---

## 11. Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [GridKit Type System](../packages/core/src/types/)
- [TypeScript Playground](https://www.typescriptlang.org/play)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-02-18 | Initial guide |

---

**Next Steps:**
1. Review type system architecture
2. Add type tests to CI/CD
3. Document common patterns in plugin system
