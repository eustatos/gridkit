# Task: Remove Circular Dependencies

## Overview
Remove circular dependencies identified in the codebase.

## Identified Cycles

### Cycle 1: Column Types
**Files involved:**
- `types/column/ColumnDef.ts` → imports from `RenderContext.ts`
- `types/column/RenderContext.ts` → imports from `ColumnInstance.ts`
- `types/column/ColumnInstance.ts` → imports from `ColumnDef.ts`

**Solution:**
- Remove `HeaderRenderer`, `CellRenderer`, `FooterRenderer` types from `RenderContext.ts`
- Move them to `ColumnDef.ts` or create new `RendererTypes.ts`
- Remove import of `RenderContext.ts` from `ColumnDef.ts`
- Keep only type references (not implementations) to break the cycle

---

### Cycle 2: Eventful Table
**Files involved:**
- `events/types/eventful-table.ts` → imports from `table/factory/create-table.ts`
- `table/factory/create-table.ts` → imports from `table/instance/TableInstance.ts`
- `table/instance/TableInstance.ts` → imports from `events/index.ts`

**Solution:**
- Move `createEventfulTable` to a separate file in `events/factory/`
- Remove circular dependency by deferring table creation
- Use lazy initialization for event bridge

---

### Cycle 3: Cell and Row
**Files involved:**
- `types/row/Cell.ts` → imports from `types/row/Row.ts`
- `types/row/Row.ts` → imports from `types/row/Cell.ts`

**Solution:**
- Remove `row: Row<TData>` from `Cell` interface
- Keep only `rowId` and provide method to get row from table
- This breaks the cycle while maintaining functionality

---

### Cycle 4: Plugin System
**Files involved:**
- `index.ts` → exports from `plugin/index.ts`
- `plugin/index.ts` → exports from `plugin/events/index.ts`
- `plugin/events/index.ts` → exports `CrossPluginBridge`, `PluginEventForwarder`
- `plugin/events/CrossPluginBridge.ts` → imports `PluginEventForwarder`
- `plugin/events/PluginEventForwarder.ts` → imports from `events/` (index.ts)

**Solution:**
- Move `CrossPluginBridge` and `PluginEventForwarder` to `plugin/core/`
- Remove circular import in `PluginEventForwarder.ts`
- Use type-only imports where possible

---

## Implementation Steps

1. **Fix Cycle 1 (Column Types)** - Easiest to fix
2. **Fix Cycle 3 (Cell/Row)** - Requires minimal API changes
3. **Fix Cycle 4 (Plugin System)** - Restructure imports
4. **Fix Cycle 2 (Eventful Table)** - Most complex, requires refactoring

---

## Testing
- Run `npx madge --circular --extensions ts packages/core/src`
- Verify no circular dependencies remain
- Run all tests: `pnpm test:core`

---

## Files to Modify
- `packages/core/src/types/column/ColumnDef.ts`
- `packages/core/src/types/column/RenderContext.ts`
- `packages/core/src/types/column/ColumnInstance.ts`
- `packages/core/src/events/types/eventful-table.ts`
- `packages/core/src/table/factory/create-table.ts`
- `packages/core/src/table/instance/TableInstance.ts`
- `packages/core/src/types/row/Cell.ts`
- `packages/core/src/types/row/Row.ts`
- `packages/core/src/index.ts`
- `packages/core/src/plugin/index.ts`
- `packages/core/src/plugin/core/Plugin.ts`
- `packages/core/src/plugin/events/index.ts`
- `packages/core/src/plugin/events/CrossPluginBridge.ts`
- `packages/core/src/plugin/events/PluginEventForwarder.ts`

---

## Notes
- Preserve all functionality while breaking cycles
- Use type-only imports where possible
- Consider creating new files for shared types
- Ensure backward compatibility
