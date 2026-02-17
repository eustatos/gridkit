# 📋 Planning Phase - Lint and Build Fixes

## 🎯 Overview

This phase addresses all critical TypeScript compilation errors and ESLint violations identified in the core package (`@gridkit/core`). The goal is to restore build integrity and code quality before proceeding to feature development.

**Status**: 🟡 **In Progress**  
**Last Updated**: 2025-04-05  
**Context**: Initial lint/build analysis complete, now planning remediation tasks

---

## 📊 Current State

### Build Failure Summary
- **Total Errors**: ~150 TypeScript compilation errors
- **Affected Files**: ~30 source files across multiple modules
- **Impact**: Build completely broken - cannot generate distributable

### Error Categories

| Category | Count | Description |
|----------|-------|-------------|
| **Unused Variables/Imports** | ~40 | `TS6133`, `TS6196` - Dead code |
| **Type Constraint Violations** | ~50 | `TS2344`, `TS2345` - Missing `RowData` constraints |
| **Type Mismatches** | ~30 | `TS2322`, `TS2339`, `TS2353` - Incorrect types |
| **Missing Dependencies** | ~15 | `TS2305`, `TS2307` - Import errors |
| **Possible Undefined** | ~15 | `TS2532`, `TS18048` - Missing null checks |
| **Other Issues** | ~10 | Mixed issues (duplicates, missing props, etc.) |

---

## 🚧 Task Breakdown

### **Task Group A: Foundational Type Fixes** (Priority: 🔴 CRITICAL)

**Scope**: Fix core type infrastructure that affects all other files  
**Estimated Files**: 5-7 files  
**Estimated Complexity**: High

#### Tasks:
1. **Fix RowData and ColumnId Type Definitions**
   - Define proper `RowData` type constraint
   - Create branded `ColumnId` type
   - Fix generic type constraints in factory methods
   - Update all method signatures to use correct types

2. **Fix Type Import Issues**
   - Resolve missing exports from `@/types/` paths
   - Fix circular dependency issues
   - Clean up duplicate type definitions

3. **Fix WeakRef/FinalizationRegistry Support**
   - Check TypeScript configuration for ES2021+ targets
   - Add polyfill if needed or fix build target

---

### **Task Group B: Factory and Registry Fixes** (Priority: 🔴 CRITICAL)

**Scope**: Core factory and registry systems  
**Estimated Files**: 4-5 files  
**Estimated Complexity**: Medium-High

#### Tasks:
1. **Column Factory Systems**
   - Fix `accessor-system.ts` type constraints
   - Fix `build-column-methods.ts` unused generics
   - Fix `column-registry.ts` type mismatches

2. **Row Factory Systems**
   - Fix `create-row-factory.ts` type constraints
   - Fix row initialization and validation

3. **Table Factory Systems**
   - Fix `create-table.ts` type inference
   - Fix `normalization.ts` type handling
   - Fix `validation.ts` duplicate exports

---

### **Task Group C: Method Implementation Fixes** (Priority: 🟡 HIGH)

**Scope**: Column and row method implementations  
**Estimated Files**: 8-10 files  
**Estimated Complexity**: Medium

#### Tasks:
1. **Column Methods**
   - Fix filtering methods (`filtering-methods.ts`)
   - Fix pinning methods (`pinning-methods.ts`)
   - Fix sorting methods (`sorting-methods.ts`)
   - Fix size methods (`size-methods.ts`)
   - Fix visibility methods (`visibility-methods.ts`)
   - Fix index methods (`index-methods.ts`)

2. **Event System Fixes**
   - Fix `EventBus.ts` type issues
   - Fix middleware compatibility
   - Fix priority system issues

---

### **Task Group D: Plugin System Fixes** (Priority: 🟡 HIGH)

**Scope**: Plugin infrastructure and cross-plugin communication  
**Estimated Files**: 6-8 files  
**Estimated Complexity**: High

#### Tasks:
1. **Core Plugin System**
   - Fix `Plugin.ts` and `PluginManager.ts` type issues
   - Fix `ConfigManager.ts` and `ConfigValidator.ts`
   - Fix `CrossPluginBridge.ts` type mismatches

2. **Lifecycle Management**
   - Fix `Initializer.ts` error handling
   - Fix `Destroyer.ts` async lifecycle management
   - Fix plugin registration/deregistration types

3. **Isolation and Security**
   - Fix `EventSandbox.ts` imports and types
   - Fix `EventValidator.ts` type issues

---

### **Task Group E: State Management Fixes** (Priority: 🟡 HIGH)

**Scope**: State storage and update mechanisms  
**Estimated Files**: 2-3 files  
**estimated Complexity**: Medium

#### Tasks:
1. **Store Implementation**
   - Fix `create-store.ts` WeakRef usage
   - Fix clone utility type issues

2. **Builder Systems**
   - Fix `model-builder.ts` type constraints
   - Fix `state-builder.ts` initial state types

---

### **Task Group F: Cleanup and Quality** (Priority: 🟢 MEDIUM)

**Scope**: Code quality and documentation  
**Estimated Files**: 10+ files  
**Estimated Complexity**: Low-Medium

#### Tasks:
1. **Remove Unused Code**
   - Delete unused imports, variables, functions
   - Clean up commented code
   - Remove example files that are not needed

2. **Fix Type Mismatches**
   - Resolve all `TS2322`, `TS2339`, `TS2353` errors
   - Add proper type guards where needed

3. **Add Error Handling**
   - Fix missing null checks
   - Add proper error boundaries

---

## 📈 Success Criteria

### Build Quality Gates
- ✅ All TypeScript compilation errors resolved
- ✅ `npm run build` succeeds without errors
- ✅ `npm run lint` passes with no warnings
- ✅ Bundle size within acceptable limits (<100KB)

### Code Quality Gates
- ✅ 100% type coverage (no `any`, `unknown` without guards)
- ✅ All exports properly typed
- ✅ No unused imports/variables
- ✅ Proper error handling and type guards

### Documentation Gates
- ✅ All public APIs documented with JSDoc
- ✅ Type definitions have clear documentation
- ✅ Example usage provided for complex patterns

---

## 🛠️ Execution Plan

### Phase 1: Foundation (Days 1-2)
1. Fix core type definitions (`RowData`, `ColumnId`, etc.)
2. Resolve import issues and missing exports
3. FixWeakRef/FinalizationRegistry configuration

### Phase 2: Factory Systems (Days 2-3)
1. Fix column factory systems
2. Fix row factory systems  
3. Fix table factory systems

### Phase 3: Method Implementations (Days 3-4)
1. Fix column method implementations
2. Fix event system issues
3. Fix plugin system issues

### Phase 4: State Management (Days 4-5)
1. Fix state store implementations
2. Fix builder systems

### Phase 5: Cleanup and Validation (Days 5-6)
1. Remove unused code
2. Fix remaining type mismatches
3. Run full validation suite

### Phase 6: Documentation (Day 6-7)
1. Document all public APIs
2. Update examples
3. Create migration guide if needed

---

## 📝 Important Notes

### Type Safety Standards (per `.ai/rules/00-tldr-quick-start.md`)
- ❌ **NEVER** use `any` type
- ✅ **ALWAYS** use explicit return types
- ✅ **ALWAYS** use fixtures for testing
- ✅ **MEASURE** performance before and after changes
- ✅ **UPDATE** context file at every significant milestone

### Branch Strategy
- **Current Branch**: `main` or `dev`
- **Working Branch**: `fix/lint-build-errors`
- **PR Strategy**: Small, focused PRs (max 3-5 files per PR)

### Testing Strategy
- Run `npm run build` after each task group
- Run `npm run lint` after each file change
- Run `npm run test` after major refactoring
- Measure bundle size with `npm run build:analyze`

---

## 🎯 Quick Start

### For Individual Tasks:
1. Read the specific task description in `tasks/` folder
2. Check existing patterns in similar modules
3. Understand dependencies before making changes
4. Create fixtures if needed (`tests/fixtures/`)
5. Update `.ai/context/current-context.md`
6. Make changes in small, testable commits

### For Review:
1. Run `npm run lint:fix` before committing
2. Run `npm run build` to verify no errors
3. Update context file with decisions made
4. Create PR with clear description and test plan

---

## 📚 Related Documentation

- **TypeScript Standards**: `.ai/rules/01-typescript-standards.md`
- **Testing Standards**: `.ai/rules/02-testing-standards.md`
- **Performance Standards**: `.ai/rules/03-performance-standards.md`
- **Context Management**: `.ai/rules/04-context-management.md`
- **Documentation Standards**: `.ai/rules/05-documentation-standards.md`

---

**Next Step**: Start with **Task Group A: Foundational Type Fixes** as it blocks all other work.

**Context for Continuation**: 
- **Last Completed**: Lint/build analysis complete
- **Next Task**: Fix `RowData` type definition and constraints
- **Blockers**: None currently
- **Decisions Made**: Will use branded types for `ColumnId` and `RowId`