# Task A5: Fix Undefined Handling and Missing Properties

**Priority**: 🟡 HIGH  
**Status**: 🟡 IN PROGRESS  
**Files Affected**: 4 files  
**Estimated Complexity**: Medium  
**Blocks**: Plugin system tasks

---

## ⚡ TL;DR

Fix `TS2532`, `TS18048`, and `TS2339` errors by adding proper null checks and handling potentially undefined values.

---

## 📋 Current Issues

### Error Statistics
- **Error Codes**: `TS2532`, `TS18048`, `TS2339`
- **Total Occurrences**: ~15
- **Affected Files**: 4 files
- **Impact**: Runtime errors possible from null dereferences

### Affected Files

1. `src/events/EventBus.ts` (8 errors)
   - TS2532: 5 (object possibly undefined)
   - TS18048: 3 (possibly undefined)
   - TS2339: 3 (property does not exist)

2. `src/events/utils/priority.ts` (1 error)
   - TS2353: 1 (missing property)

3. `src/plugin/events/CrossPluginBridge.ts` (3 errors)
   - TS1361: 1 (import type issue)
   - TS7006: 2 (implicitly any)

4. `src/plugin/lifecycle/Destroyer.ts` (3 errors)
   - TS2345: 3 (possibly undefined error)

---

## 🔍 Root Cause

TypeScript detects:
- Objects that might be undefined (TS2532)
- Variables that might be undefined (TS18048)
- Properties that don't exist on types (TS2339)
- Import type vs value issues (TS1361)
- Missing type annotations (TS7006)

---

## ✅ Solution Plan

### Pattern for Each File

**Step 1**: Identify undefined candidates
```typescript
// ❌ Fails
const result = findSomething();
const value = result.property; // TS2532 if result is possibly undefined
```

**Step 2**: Add proper checks
```typescript
// ✅ Options
// 1. Non-null assertion (if guaranteed)
const value = result!.property;

// 2. Optional chaining
const value = result?.property;

// 3. Explicit check
if (result) {
  const value = result.property;
}
```

---

## 📝 Implementation Tasks

### Task 5.1: Fix EventBus.ts
- [ ] Add null checks for event arrays
- [ ] Handle possibly undefined callbacks
- [ ] Fix TS2339 errors for missing properties
- **Files**: 1 file
- **Lines**: ~8 lines changed
- **Test**: `pnpm run build`

### Task 5.2: Fix priority.ts
- [ ] Add missing `getProcessedTasks` property
- [ ] Fix type issues
- **Files**: 1 file
- **Lines**: ~5 lines changed
- **Test**: `pnpm run build`

### Task 5.3: Fix CrossPluginBridge.ts
- [ ] Fix `import type` vs `import` issue
- [ ] Add type annotations for parameters
- **Files**: 1 file
- **Lines**: ~3 lines changed
- **Test**: `pnpm run build`

### Task 5.4: Fix Destroyer.ts
- [ ] Add null checks for error parameters
- [ ] Handle possibly undefined results
- **Files**: 1 file
- **Lines**: ~3 lines changed
- **Test**: `pnpm run build`

---

## 🧪 Testing Strategy

### Build Testing
```bash
pnpm run build --filter @gridkit/core

# Expected: No TS2532, TS18048, TS2339 errors
```

### Type Testing
```bash
pnpm run type-check

# Expected: No implicit any types
```

---

## 📊 Success Criteria

### Build Quality
- ✅ All undefined handling errors resolved
- ✅ Build completes successfully

### Safety
- ✅ No runtime null dereferences
- ✅ Proper error handling

---

## ⚠️ Risks & Mitigation

1. **Overuse of Non-Null Assertion**
   - **Risk**: `!` operator can hide real issues
   - **Mitigation**: Use only when value is guaranteed, add comments

2. **Optional Chaining Performance**
   - **Risk**: `?.` might add runtime overhead
   - **Mitigation**: Use in non-hot paths, measure if critical

---

## 📝 Notes

- **Context**: Prevents runtime errors from null dereferences
- **Dependencies**: None (standalone task)
- **Blockers**: Blocks Task E (Plugin System Fixes)
- **Estimated Time**: 1.5 hours

---

**Status**: 🟡 IN PROGRESS  
**Started**: 2025-04-05  
**Last Updated**: 2025-04-05  
**Next Step**: Fix `EventBus.ts` undefined handling