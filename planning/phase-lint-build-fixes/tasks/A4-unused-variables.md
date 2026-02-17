"# Task A4: Fix Unused Variables and Imports\n\n**Priority**: 🟢 MEDIUM  \n**Status**: 🟡 IN PROGRESS  \n**Files Affected**: 5 files  \n**Estimated Complexity**: Low  \n**Blocks**: Cleanup tasks\n\n---\n\n## ⚡ TL;DR\n\nFix all `TS6133` (unused variables) and `TS6196` (unused declarations) errors by removing unused imports, variables, and types.\n\n---\n\n## 📋 Current Issues\n\n### Error Statistics\n- **Error Code**: `TS6133`, `TS6196`\n- **Total Occurrences**: ~40\n- **Affected Files**: 5 files\n- **Impact**: Build warnings, dead code\n\n### Affected Files (Summary)\n\n1. `src/column/factory/accessor-system.ts` (2 errors)\n2. `src/column/factory/build-column-methods.ts` (3 errors)\n3. `src/column/factory/create-column.ts` (1 error)\n4. `src/column/factory/column-registry.ts` (1 error)\n5. `src/column/validation/validate-column.ts` (2 errors)\n\n---\n
## 🔍 Root Cause

TypeScript's `noUnusedLocals` and `noUnusedParameters` flags detect:
- Unused imports
- Unused variables
- Unused function parameters
- Unused type parameters

---

## ✅ Solution Plan

### Pattern for Each File

**Step 1**: Identify unused items
```typescript
// ❌ Examples
import { RowData } from '@/types'; // unused
const tableState = state;          // unused
function method<T>(param: T) { }   // T unused
```

**Step 2**: Remove or use
```typescript
// ✅ Options
// 1. Remove if truly unused
// 2. Add comment if kept for documentation
// 3. Use in code if needed
```

---

## 📝 Implementation Tasks

### Task 4.1: Fix accessor-system.ts
- [ ] Remove unused `RowData` import
- [ ] Add JSDoc if removal affects documentation
- **Files**: 1 file
- **Lines**: ~2 lines changed
- **Test**: `pnpm run lint`

### Task 4.2: Fix build-column-methods.ts
- [ ] Remove unused `RowData` import
- [ ] Remove unused `tableState` variable
- [ ] Remove unused type parameter
- **Files**: 1 file
- **Lines**: ~3 lines changed
- **Test**: `pnpm run lint`

### Task 4.3: Fix create-column.ts
- [ ] Remove unused `GridKitError` import
- **Files**: 1 file
- **Lines**: ~1 line changed
- **Test**: `pnpm run lint`

### Task 4.4: Fix column-registry.ts
- [ ] Remove unused imports
- **Files**: 1 file
- **Lines**: ~1 line changed
- **Test**: `pnpm run lint`

### Task 4.5: Fix validate-column.ts
- [ ] Remove unused `table` variable
- **Files**: 1 file
- **Lines**: ~1 line changed
- **Test**: `pnpm run lint`

---

## 🧪 Testing Strategy

### Lint Testing
```bash
pnpm run lint --filter @gridkit/core

# Expected: No TS6133/TS6196 errors
```

### Build Testing
```bash
pnpm run build --filter @gridkit/core

# Expected: Clean build
```

---

## 📊 Success Criteria

### Code Quality
- ✅ All `TS6133` errors resolved
- ✅ All `TS6196` errors resolved
- ✅ No dead code left

### Performance
- ✅ Bundle size unchanged or improved

---

## ⚠️ Risks & Mitigation

1. **Removing Necessary Imports**
   - **Risk**: Removing import that's used in JSDoc
   - **Mitigation**: Check all references before removal

2. **Breaking Documentation**
   - **Risk**: Removing type used only in documentation
   - **Mitigation**: Replace with inline type annotation

---

## 📝 Notes

- **Context**: Improves code quality, reduces bundle size
- **Dependencies**: None (can be done after other tasks)
- **Estimated Time**: 30 minutes

---

**Status**: 🟡 IN PROGRESS  \n**Started**: 2025-04-05  \n**Last Updated**: 2025-04-05  \n**Next Step**: Fix `accessor-system.ts` unused imports"