# 🚧 Phase: Lint and Build Fixes

## 🎯 Overview

This phase addresses all critical TypeScript compilation errors and ESLint violations identified in the core package (`@gridkit/core`).

**Status**: 🟡 **In Progress**  
**Last Updated**: 2025-04-05

---

## 📊 Current State

### Build Failure Summary
- **Total Errors**: ~150 TypeScript compilation errors
- **Affected Files**: ~30 source files

### Error Categories

| Category | Count |
|----------|-------|
| Unused Variables/Imports | ~40 |
| Type Constraint Violations | ~50 |
| Type Mismatches | ~30 |
| Missing Dependencies | ~15 |
| Possible Undefined | ~15 |

---

## 🚀 Quick Start

### Individual Tasks (per 00-tldr-quick-start.md)

Tasks are sized: **Max 5 files**, **Max 300 lines** of new code per task.

**Available Tasks**:
1. `tasks/A1-rowdata-constraints.md` - RowData constraint errors (5 files)
2. `tasks/A2-weakref-support.md` - WeakRef/FinalizationRegistry (2 files)
3. `tasks/A3-branded-types.md` - Branded type converters (3 files)
4. `tasks/A4-unused-variables.md` - Unused variables/imports (5 files)
5. `tasks/A5-undefined-handling.md` - Undefined handling (4 files)

**Recommended Order**: A1 → A2 → A3 → A4 → A5

---

## 📋 Task Details

### Task A1: RowData Constraint Fixes
**Priority**: 🔴 CRITICAL  
**Files**: 5 files  
**Errors**: ~25 `TS2344` errors  
**Description**: Fix RowData generic constraints in factory methods

### Task A2: WeakRef/FinalizationRegistry Support  
**Priority**: 🔴 CRITICAL  
**Files**: 2 files  
**Errors**: ~6 `TS2304` errors  
**Description**: Update TypeScript configuration for ES2021+ features

### Task A3: Branded Type Converter Functions
**Priority**: 🔴 CRITICAL  
**Files**: 3 files  
**Errors**: ~15 `TS2345` errors  
**Description**: Create converter functions for ColumnId/RowId branded types

### Task A4: Unused Variables and Imports
**Priority**: 🟢 MEDIUM  
**Files**: 5 files  
**Errors**: ~40 `TS6133`, `TS6196` errors  
**Description**: Remove dead code, unused imports, and variables

### Task A5: Undefined Handling and Missing Properties
**Priority**: 🟡 HIGH  
**Files**: 4 files  
**Errors**: ~15 `TS2532`, `TS18048`, `TS2339` errors  
**Description**: Add proper null checks and undefined handling

---

## 🛠️ Execution Plan

1. Task A1 (RowData) - Foundation for all types
2. Task A2 (WeakRef) - Enables state management
3. Task A3 (Branded Types) - Enables ID handling
4. Task A4 (Unused Variables) - Cleanup after A1-A3
5. Task A5 (Undefined Handling) - Runtime safety

---

**Next Step**: Start with **Task A1: RowData Constraint Fixes**
