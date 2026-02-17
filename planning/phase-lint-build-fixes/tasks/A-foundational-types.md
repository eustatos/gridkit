# Task A: Foundational Type Fixes

**Priority**: 🔴 CRITICAL  
**Status**: 🟡 IN PROGRESS  
**Files Affected**: 5-7 files  
**Estimated Complexity**: High  
**Blocks**: All other tasks

---

## 🎯 Objective

Fix core type infrastructure that affects all other files. This is the foundation for all type safety in the project.

---

## 📋 Current Issues

### Primary Issues
1. **RowData Type Constraint**
   - Error: `TS2344: Type 'TData' does not satisfy the constraint 'RowData'.`
   - Count: ~25 occurrences
   - Files: Multiple factory methods, column methods, table builders

2. **ColumnId/RowId Branded Types**  
   - Error: `TS2345: Argument of type 'string' is not assignable to parameter of type 'ColumnId'.`
   - Count: ~15 occurrences
   - Files: Column methods, event system

3. **WeakRef/FinalizationRegistry**
   - Error: `TS2304: Cannot find name 'WeakRef'.`
   - Count: ~6 occurrences
   - Files: `create-store.ts`

4. **Type Parameter Constraints**
   - Error: `TS2344: Type 'TData' does not satisfy the constraint 'RowData'.`
   - Count: ~30+ occurrences
   - Files: All generic factory methods

---

## 🔍 Root Cause Analysis

### RowData Type Issue

**Current Definition** (`src/types/base.ts`):
```typescript
export interface RowData {
  [key: string]: unknown;
}
```

**Problem**: The interface has no required properties, so TypeScript cannot guarantee that generic types `TData` actually conform to this constraint when used in method signatures.

**Impact**: All factory methods that expect `TData extends RowData` fail to type-check because the constraint is too loose.

### Branded Types Issue

**Current Definition**:
```typescript
declare const __columnId: unique symbol;
export type ColumnId = string & { readonly [__columnId]: never };
```

**Problem**: String literals like `'id'` cannot be assigned to `ColumnId` because they don't have the branded symbol.

**Impact**: All API methods that should accept string IDs fail type-checking.

### WeakRef Issue

**Current**: `TS2304: Cannot find name 'WeakRef'.`

**Problem**: TypeScript's ES2020 target doesn't include `WeakRef` in the default lib.

**Impact**: Memory management systems using WeakRef cannot compile.

---

## ✅ Solution Plan

### Fix 1: RowData Type Constraint

**Approach**: Create a proper generic constraint helper

**Implementation**:
```typescript
// src/types/helpers.ts (NEW)
/**
 * Helper type to constrain generic types to RowData
 * Use this instead of direct RowData constraints
 */
export type RowDataConstraint<T> = T extends RowData ? T : never;

// Update base.ts to add proper utility
export type EnsureRowData<T> = T extends RowData ? T : never;
```

**Files Modified**:
- `src/types/base.ts` - Add helper types
- All factory methods - Use helper types instead of direct constraints

**Test**: Run `pnpm run build` - all `TS2344` errors should be resolved

---

### Fix 2: ColumnId/RowId Type Compatibility

**Approach**: Create converter functions

**Implementation**:
```typescript
// src/types/factory.ts - ADD
/**
 * Convert string to ColumnId with branded type
 */
export function createColumnId(id: string): ColumnId {
  return id as ColumnId;
}

/**
 * Convert string to RowId with branded type
 */
export function createRowId(id: string | number): RowId {
  return id as RowId;
}
```

**Alternative Approach**: Use type guards

```typescript
export function isColumnId(value: unknown): value is ColumnId {
  return typeof value === 'string' && value.includes('__columnId');
}
```

**Files Modified**:
- `src/types/factory.ts` - Add converter functions
- All API methods - Use converters for string-to-ID conversion

**Test**: Run `pnpm run lint` - verify no type errors in ID handling

---

### Fix 3: WeakRef/FinalizationRegistry Support

**Approach**: Add proper TypeScript lib configuration

**Implementation**:
```json
// packages/core/tsconfig.json - ADD
{
  "compilerOptions": {
    "lib": ["ES2021", "DOM"],
    "target": "ES2021"
  }
}
```

**Alternative**: Create polyfills

```typescript
// src/utils/polyfills.ts (NEW)
export type WeakRefPolyfill<T extends object> = {
  deref(): T | undefined;
};

export type FinalizationRegistryPolyfill = {
  register(target: object, heldValue: unknown, unregisterToken?: unknown): void;
  unregister(token: unknown): void;
};
```

**Files Modified**:
- `packages/core/tsconfig.json` - Update lib configuration
- `src/state/create-store.ts` - Update to use proper types

**Test**: Run `pnpm run build` - verify no WeakRef errors

---

## 📝 Implementation Tasks

### Step 1: Create Helper Types

**File**: `src/types/helpers.ts` (NEW)

- [ ] Create `RowDataConstraint<T>` helper type
- [ ] Create `EnsureRowData<T>` utility type
- [ ] Add proper JSDoc documentation

**Test**: `pnpm run build` - should pass without errors

---

### Step 2: Update Base Types

**File**: `src/types/base.ts`

- [ ] Add helper types to exports
- [ ] Update JSDoc with usage examples
- [ ] Add migration notes

**Test**: `pnpm run lint` - verify no unused imports

---

### Step 3: Create ID Converter Functions

**File**: `src/types/factory.ts`

- [ ] Add `createColumnId()` function
- [ ] Add `createRowId()` function
- [ ] Add type guards if using alternative approach

**Test**: `pnpm run test` - verify converter functions work

---

### Step 4: Update Factory Methods

**Files**: 
- `src/column/factory/accessor-system.ts`
- `src/column/factory/build-column-methods.ts`
- `src/column/factory/create-column.ts`
- `src/row/create-row-factory.ts`
- `src/table/builders/model-builder.ts`
- `src/table/factory/normalization.ts`

- [ ] Replace `TData extends RowData` with helper type
- [ ] Update all generic constraints
- [ ] Add proper null checks

**Test**: `pnpm run build` - verify all TS2344 errors resolved

---

### Step 5: Update Column Methods

**Files**:
- `src/column/methods/filtering-methods.ts`
- `src/column/methods/pinning-methods.ts`
- `src/column/methods/size-methods.ts`
- `src/column/methods/sorting-methods.ts`
- `src/column/methods/visibility-methods.ts`
- `src/column/methods/index-methods.ts`

- [ ] Use `createColumnId()` for string IDs
- [ ] Update all method signatures
- [ ] Add type guards where needed

**Test**: `pnpm run build` - verify all TS2345 errors resolved

---

### Step 6: Fix WeakRef Support

**Files**:
- `packages/core/tsconfig.json`
- `src/state/create-store.ts`

- [ ] Update lib configuration to ES2021+
- [ ] Replace WeakRef usage with proper types
- [ ] Add fallback if needed

**Test**: `pnpm run build` - verify no WeakRef errors

---

## 🧪 Testing Strategy

### Build Testing
```bash
# After each step, verify build
pnpm run build

# Expected: No TS2344, TS2345 errors
```

### Lint Testing
```bash
# Verify no new issues introduced
pnpm run lint

# Expected: No new warnings
```

### Type Coverage Testing
```bash
# Verify no implicit any types
pnpm run type-check

# Expected: 100% type coverage
```

---

## 📊 Success Criteria

### Build Quality
- ✅ All `TS2344` errors resolved (RowData constraints)
- ✅ All `TS2345` errors resolved (ColumnId/RowId types)
- ✅ All `TS2304` errors resolved (WeakRef support)
- ✅ Build completes successfully

### Code Quality
- ✅ No `any` types introduced
- ✅ All public APIs have explicit return types
- ✅ Proper JSDoc documentation
- ✅ No unused imports/variables

### Performance
- ✅ No runtime overhead from helper types
- ✅ Type checking under 10 seconds
- ✅ Bundle size unchanged or improved

---

## 🚨 Known Risks

1. **Breaking Changes**: ID converter functions might affect public API
   - **Mitigation**: Keep internal usage only, add migration guide

2. **Type Inference**: Helper types might reduce type inference quality
   - **Mitigation**: Test with real usage patterns, optimize if needed

3. **WeakRef Polyfill**: If polyfill approach used, memory safety concerns
   - **Mitigation**: Prefer TypeScript lib configuration over polyfills

---

## 📝 Migration Guide

### For API Users

No changes required - these fixes are internal type infrastructure.

### For Contributors

When adding new generic methods:

```typescript
// ❌ Old way (will fail)
export function myMethod<TData extends RowData>(data: TData) { }

// ✅ New way (will work)
import type { EnsureRowData } from '@gridkit/core/types';

export function myMethod<TData>(data: EnsureRowData<TData>) { }
```

---

## 🔗 Related Issues

- Blocks: Task B (Factory Fixes)
- Blocks: Task C (Method Fixes)
- Blocks: Task F (State Management)

---

**Status**: 🟡 IN PROGRESS  
**Started**: 2025-04-05  
**Last Updated**: 2025-04-05  
**Next Step**: Create helper types in `src/types/helpers.ts`
