# Task A2: Fix WeakRef/FinalizationRegistry Support

**Priority**: 🔴 CRITICAL  
**Status**: 🟡 IN PROGRESS  
**Files Affected**: 2 files  
**Estimated Complexity**: Medium  
**Blocks**: State management tasks

---

## ⚡ TL;DR

Fix `TS2304: Cannot find name 'WeakRef'` errors by updating TypeScript configuration and/or adding proper type declarations.

---

## 📋 Current Issues

### Error Statistics
- **Error Code**: `TS2304`
- **Total Occurrences**: 6
- **Affected Files**: 2 files
- **Impact**: Memory management systems cannot compile

### Affected Files

1. `src/state/create-store.ts` (6 errors)
   - WeakRef usage: 4 occurrences
   - FinalizationRegistry usage: 2 occurrences

### Error Locations

```typescript
// src/state/create-store.ts:42,45,102,103,156
const ref = new WeakRef(target);      // Line 42, 102, 156
const registry = new FinalizationRegistry(); // Line 103, 156
```

---

## 🔍 Root Cause

TypeScript's ES2020 target does not include `WeakRef` and `FinalizationRegistry` in the default lib. These are ES2021+ features.

---

## ✅ Solution Plan

### Option 1: Update TypeScript Configuration (Recommended)

**File**: `packages/core/tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["ES2021", "DOM"],
    "target": "ES2021"
  }
}
```

**Pros**:
- ✅ No code changes needed
- ✅ Native implementation
- ✅ Best performance

**Cons**:
- ❌ Requires Node.js 14.5+ (should be fine for project)

---

### Option 2: Polyfill Implementation

If Option 1 doesn't work, create polyfill types:

**File**: `src/utils/polyfills.ts` (NEW)

```typescript
/**
 * Polyfill type definitions for WeakRef and FinalizationRegistry
 * These are ES2021+ features not included in ES2020 lib
 */

export type WeakRefPolyfill<T extends object> = {
  deref(): T | undefined;
};

export type FinalizationRegistryPolyfill = {
  register(target: object, heldValue: unknown, unregisterToken?: unknown): void;
  unregister(token: unknown): void;
};
```

**File**: `src/state/create-store.ts` - Update to use polyfills

---

## 📝 Implementation Tasks

### Task 2.1: Update TypeScript Configuration
- [ ] Update `packages/core/tsconfig.json`
- [ ] Change `lib` to `["ES2021", "DOM"]`
- [ ] Change `target` to `"ES2021"`
- **Files**: 1 file
- **Lines**: 2 lines changed
- **Test**: `pnpm run build`

### Task 2.2: Verify WeakRef Usage
- [ ] Check `src/state/create-store.ts` for proper type inference
- [ ] Run `pnpm run build`
- [ ] Verify no TS2304 errors
- **Files**: 1 file
- **Lines**: 0 lines changed (just config)
- **Test**: `pnpm run build` (should pass)

---

## 🧪 Testing Strategy

### Build Testing
```bash
pnpm run build --filter @gridkit/core

# Expected: No TS2304 errors
# Expected: WeakRef usage compiles correctly
```

### Type Testing
```bash
pnpm run type-check

# Expected: No implicit any types in WeakRef usage
```

---

## 📊 Success Criteria

### Build Quality
- ✅ All 6 `TS2304` errors resolved
- ✅ Build completes successfully
- ✅ Memory management systems compile

### Code Quality
- ✅ No polyfills needed (if using Option 1)
- ✅ Proper TypeScript version compatibility
- ✅ No runtime overhead

---

## ⚠️ Risks & Mitigation

1. **Node.js Version Compatibility**
   - **Risk**: WeakRef requires Node.js 14.5+
   - **Mitigation**: Check package.json engines field, should be compatible

2. **Polyfill Performance**
   - **Risk**: Polyfill might be slower than native
   - **Mitigation**: Prefer Option 1 (config update) over polyfill

---

## 📝 Notes

- **Context**: This fix enables memory-efficient state management
- **Dependencies**: None (standalone task)
- **Blockers**: Blocks Task F (State Management)
- **Estimated Time**: 30 minutes

---

**Status**: 🟡 IN PROGRESS  
**Started**: 2025-04-05  
**Last Updated**: 2025-04-05  
**Next Step**: Update `packages/core/tsconfig.json` to use ES2021