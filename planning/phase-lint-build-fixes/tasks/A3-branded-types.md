# Task A3: Fix Branded Type Converter Functions

**Priority**: 🔴 CRITICAL  
**Status**: 🟡 IN PROGRESS  
**Files Affected**: 3 files  
**Estimated Complexity**: Medium  
**Blocks**: Method implementation tasks

---

## ⚡ TL;DR

Fix `TS2345: Argument of type 'string' is not assignable to parameter of type 'ColumnId'` errors by creating converter functions for branded types.

---

## 📋 Current Issues

### Error Statistics
- **Error Code**: `TS2345`
- **Total Occurrences**: ~15
- **Affected Files**: 3 files
- **Impact**: Column/Row ID handling fails type-checking

### Affected Files

1. `src/column/methods/pinning-methods.ts` (6 errors)
2. `src/column/methods/size-methods.ts` (2 errors)
3. `src/column/methods/visibility-methods.ts` (2 errors)

### Error Pattern

```typescript
// ❌ Fails - string literal 'id' doesn't have branded symbol
const pinnedColumns = state.columnPinning.left.includes('id');

// Type: 'string' is not assignable to 'ColumnId'
```

---

## 🔍 Root Cause

Branded types use TypeScript's unique symbol pattern:

```typescript
declare const __columnId: unique symbol;
export type ColumnId = string & { readonly [__columnId]: never };
```

String literals like `'id'` cannot be assigned to `ColumnId` because they don't have the branded symbol.

---

## ✅ Solution Plan

### Step 1: Create Converter Functions

**File**: `src/types/factory.ts` - ADD

```typescript
/**
 * Convert string to ColumnId with branded type
 * Use for API methods that accept string IDs
 */
export function createColumnId(id: string): ColumnId {
  return id as ColumnId;
}

/**
 * Convert string to RowId with branded type
 * Use for API methods that accept string IDs
 */
export function createRowId(id: string | number): RowId {
  return id as RowId;
}

/**
 * Convert string to GridId with branded type
 * Use for API methods that accept string IDs
 */
export function createGridId(id: string): GridId {
  return id as GridId;
}
```

### Step 2: Update Type-Guard Functions

**File**: `src/types/utils.ts` - ADD

```typescript
/**
 * Type guard for ColumnId
 */
export function isColumnId(value: unknown): value is ColumnId {
  return typeof value === 'string';
}

/**
 * Type guard for RowId
 */
export function isRowId(value: unknown): value is RowId {
  return typeof value === 'string' || typeof value === 'number';
}
```

---

## 📝 Implementation Tasks

### Task 3.1: Create Converter Functions
- [ ] Add `createColumnId()` to `src/types/factory.ts`
- [ ] Add `createRowId()` to `src/types/factory.ts`
- [ ] Add `createGridId()` to `src/types/factory.ts`
- [ ] Add JSDoc with examples
- **Files**: 1 file
- **Lines**: ~30 lines added
- **Test**: `pnpm run lint`

### Task 3.2: Add Type Guards
- [ ] Add `isColumnId()` to `src/types/utils.ts`
- [ ] Add `isRowId()` to `src/types/utils.ts`
- [ ] Export from types index
- **Files**: 1 file
- **Lines**: ~20 lines added
- **Test**: `pnpm run test`

### Task 3.3: Update Method Files
- [ ] Update `src/column/methods/pinning-methods.ts`
- [ ] Update `src/column/methods/size-methods.ts`
- [ ] Update `src/column/methods/visibility-methods.ts`
- **Files**: 3 files
- **Lines**: ~15 lines changed
- **Test**: `pnpm run build` (should pass)

---

## 🧪 Testing Strategy

### Build Testing
```bash
pnpm run build --filter @gridkit/core

# Expected: No TS2345 errors
# Expected: String-to-ID conversion works
```

### Type Testing
```bash
pnpm run type-check

# Expected: No implicit any types
```

---

## 📊 Success Criteria

### Build Quality
- ✅ All 15 `TS2345` errors resolved
- ✅ Build completes successfully

### Code Quality
- ✅ No `any` types in converters
- ✅ Proper JSDoc documentation
- ✅ No runtime overhead

---

## ⚠️ Risks & Mitigation

1. **Type Safety**: Casting strings to branded types bypasses type checking
   - **Mitigation**: Document that converters should only be used for trusted input

2. **Breaking Changes**: New functions might conflict with existing APIs
   - **Mitigation**: Keep converters internal, use only in factory methods

---

## 📝 Notes

- **Context**: Enables proper ID handling throughout the codebase
- **Dependencies**: None (standalone task)
- **Blockers**: Blocks Task C (Method Implementation Fixes)
- **Estimated Time**: 1 hour

---

**Status**: 🟡 IN PROGRESS  
**Started**: 2025-04-05  
**Last Updated**: 2025-04-05  
**Next Step**: Add converter functions to `src/types/factory.ts`