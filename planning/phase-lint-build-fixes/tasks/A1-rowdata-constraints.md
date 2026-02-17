# Task A1: Fix RowData Constraint Errors

**Priority**: 🔴 CRITICAL  
**Status**: 🟡 IN PROGRESS  
**Files Affected**: 5 files  
**Estimated Complexity**: High  
**Blocks**: All other tasks

---

## ⚡ TL;DR

Fix all `TS2344: Type 'TData' does not satisfy the constraint 'RowData'` errors by updating type constraints in factory methods to use helper types.

---

## 📋 Current Issues

### Error Statistics
- **Error Code**: `TS2344`
- **Total Occurrences**: ~25
- **Affected Files**: 5 files
- **Impact**: Build completely broken

### Affected Files

1. `src/column/factory/accessor-system.ts` (4 errors)
2. `src/column/factory/build-column-methods.ts` (4 errors)
3. `src/column/factory/create-column.ts` (2 errors)
4. `src/row/create-row-factory.ts` (6 errors)
5. `src/table/builders/model-builder.ts` (10 errors)

---

## 🔍 Root Cause

All factory methods use generic constraints like `TData extends RowData`, but `RowData` interface is defined as:

```typescript
export interface RowData {
  [key: string]: unknown;
}
```

This constraint is too loose and TypeScript cannot verify that `TData` satisfies it in method implementations.

---

## ✅ Solution Plan

### Step 1: Create Helper Type (1 file)

**File**: `src/types/helpers.ts` (NEW)

```typescript
/**
 * Helper type to constrain generic types to RowData
 * Prevents TS2344 errors while maintaining type safety
 */
export type EnsureRowData<T> = T extends RowData ? T : never;
```

### Step 2: Update Factory Methods (5 files)

Replace `TData extends RowData` with `TData` and use `EnsureRowData<TData>` in constraints.

#### Pattern to Apply

```typescript
// ❌ Old (fails)
export function createAccessor<TData extends RowData, TValue>(
  accessor: AccessorFn<TData, TValue>
) { }

// ✅ New (works)
import type { EnsureRowData } from '@/types/helpers';

export function createAccessor<TData, TValue>(
  accessor: AccessorFn<EnsureRowData<TData>, TValue>
) { }
```

---

## 📝 Implementation Tasks

### Task 1.1: Create Helper Types File
- [ ] Create `src/types/helpers.ts`
- [ ] Add `EnsureRowData<T>` type
- [ ] Add JSDoc with examples
- **Files**: 1 file
- **Lines**: ~20 lines
- **Test**: `pnpm run type-check`

### Task 1.2: Fix accessor-system.ts
- [ ] Update `createAccessor` function
- [ ] Update `clearAccessorCache` function
- [ ] Add proper type constraints
- **Files**: 1 file
- **Lines**: ~10 lines changed
- **Test**: `pnpm run build` (should pass)

### Task 1.3: Fix build-column-methods.ts
- [ ] Update `buildAccessorFn` function
- [ ] Update `buildGetter` function
- [ ] Remove unused type parameters
- **Files**: 1 file
- **Lines**: ~15 lines changed
- **Test**: `pnpm run build` (should pass)

### Task 1.4: Fix create-column.ts
- [ ] Update `createColumn` function
- [ ] Fix `createColumnUtils` type issue
- **Files**: 1 file
- **Lines**: ~8 lines changed
- **Test**: `pnpm run build` (should pass)

### Task 1.5: Fix create-row-factory.ts
- [ ] Update `createRow` function
- [ ] Update `createRows` function
- [ ] Fix initialization type
- **Files**: 1 file
- **Lines**: ~20 lines changed
- **Test**: `pnpm run build` (should pass)

### Task 1.6: Fix model-builder.ts
- [ ] Update `buildModel` function
- [ ] Update `buildRowModel` function
- [ ] Fix generic constraints
- **Files**: 1 file
- **Lines**: ~25 lines changed
- **Test**: `pnpm run build` (should pass)

---

## 🧪 Testing Strategy

### Build Testing
```bash
# After each file change
pnpm run build --filter @gridkit/core

# Expected: No TS2344 errors
```

### Type Testing
```bash
pnpm run type-check

# Expected: No implicit any types
```

### Lint Testing
```bash
pnpm run lint

# Expected: No new warnings
```

---

## 📊 Success Criteria

### Build Quality
- ✅ All 25 `TS2344` errors resolved
- ✅ Build completes successfully
- ✅ Bundle size < 100KB

### Code Quality
- ✅ No `any` types introduced
- ✅ All public APIs have explicit return types
- ✅ Proper JSDoc documentation
- ✅ No unused imports/variables

---

## ⚠️ Risks & Mitigation

1. **Breaking Changes**: Helper types might affect type inference
   - **Mitigation**: Test with real usage patterns, optimize if needed

2. **Type Overhead**: Helper types might increase compile time
   - **Mitigation**: Keep helpers simple, avoid nested generics

---

## 📝 Notes

- **Context**: This is the foundation for all type safety in the project
- **Dependencies**: No dependencies on other tasks
- **Blockers**: Blocks all other tasks
- **Estimated Time**: 2-3 hours

---

**Status**: 🟡 IN PROGRESS  
**Started**: 2025-04-05  
**Last Updated**: 2025-04-05  
**Next Step**: Create `src/types/helpers.ts` with `EnsureRowData<T>` type
