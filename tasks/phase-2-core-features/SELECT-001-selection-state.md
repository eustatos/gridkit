---
task_id: SELECT-001
epic_id: EPIC-002
module: @gridkit/features
file: src/features/selection/types.ts, src/features/selection/state.ts
priority: P1
complexity: medium
estimated_tokens: ~12,000
assignable_to_ai: yes
dependencies:
  - CORE-001
  - CORE-004
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Selection State Management

## Context

Define selection state and helpers for managing row selection. Must support single, multiple, and range selection modes.

## Objectives

- [ ] Define `SelectionState` type (map of rowId -> boolean)
- [ ] Create selection helpers (select, deselect, toggle)
- [ ] Implement range selection logic
- [ ] Implement select all/none
- [ ] Add comprehensive JSDoc

---

## Implementation Requirements

### 1. Types

**File: `src/features/selection/types.ts`**

```typescript
import type { RowId } from '@gridkit/core/types';

/**
 * Selection state.
 * Maps row ID to selection boolean.
 * 
 * @example
 * ```typescript
 * const state: SelectionState = {
 *   'user-1': true,
 *   'user-3': true,
 *   'user-5': true,
 * };
 * ```
 * 
 * @public
 */
export type SelectionState = Record<RowId, boolean>;

/**
 * Selection mode.
 * 
 * @public
 */
export type SelectionMode = 'single' | 'multiple' | 'range';
```

### 2. State Helpers

**File: `src/features/selection/state.ts`**

```typescript
import type { RowId } from '@gridkit/core/types';
import type { SelectionState } from './types';

/**
 * Toggle row selection.
 * 
 * @param state - Current selection state
 * @param rowId - Row to toggle
 * @param mode - Selection mode
 * @returns New selection state
 * 
 * @public
 */
export function toggleRowSelection(
  state: SelectionState,
  rowId: RowId,
  mode: 'single' | 'multiple' = 'multiple'
): SelectionState {
  const isSelected = state[rowId] === true;
  
  if (mode === 'single') {
    // Single mode: clear others
    return isSelected ? {} : { [rowId]: true };
  }
  
  // Multiple mode: toggle this row
  if (isSelected) {
    const newState = { ...state };
    delete newState[rowId];
    return newState;
  }
  
  return { ...state, [rowId]: true };
}

/**
 * Select range of rows.
 * 
 * @param state - Current selection state
 * @param rowIds - Array of row IDs
 * @param startIndex - Start of range
 * @param endIndex - End of range (inclusive)
 * @returns New selection state
 * 
 * @public
 */
export function selectRange(
  state: SelectionState,
  rowIds: RowId[],
  startIndex: number,
  endIndex: number
): SelectionState {
  const newState = { ...state };
  
  const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
  
  for (let i = min; i <= max; i++) {
    if (rowIds[i] !== undefined) {
      newState[rowIds[i]] = true;
    }
  }
  
  return newState;
}

/**
 * Select all rows.
 * 
 * @param rowIds - Array of all row IDs
 * @returns Selection state with all rows selected
 * 
 * @public
 */
export function selectAll(rowIds: RowId[]): SelectionState {
  const state: SelectionState = {};
  for (const id of rowIds) {
    state[id] = true;
  }
  return state;
}

/**
 * Deselect all rows.
 * 
 * @returns Empty selection state
 * 
 * @public
 */
export function deselectAll(): SelectionState {
  return {};
}

/**
 * Get selected row IDs.
 * 
 * @param state - Selection state
 * @returns Array of selected row IDs
 * 
 * @public
 */
export function getSelectedRowIds(state: SelectionState): RowId[] {
  return Object.keys(state).filter(id => state[id] === true);
}

/**
 * Get selected row count.
 * 
 * @param state - Selection state
 * @returns Number of selected rows
 * 
 * @public
 */
export function getSelectedRowCount(state: SelectionState): number {
  return getSelectedRowIds(state).length;
}

/**
 * Check if row is selected.
 * 
 * @param state - Selection state
 * @param rowId - Row ID
 * @returns True if selected
 * 
 * @public
 */
export function isRowSelected(
  state: SelectionState,
  rowId: RowId
): boolean {
  return state[rowId] === true;
}

/**
 * Check if all rows are selected.
 * 
 * @param state - Selection state
 * @param rowIds - All available row IDs
 * @returns True if all selected
 * 
 * @public
 */
export function isAllSelected(
  state: SelectionState,
  rowIds: RowId[]
): boolean {
  if (rowIds.length === 0) return false;
  return rowIds.every(id => state[id] === true);
}

/**
 * Check if some (but not all) rows are selected.
 * 
 * @param state - Selection state
 * @param rowIds - All available row IDs
 * @returns True if partially selected
 * 
 * @public
 */
export function isSomeSelected(
  state: SelectionState,
  rowIds: RowId[]
): boolean {
  if (rowIds.length === 0) return false;
  const selectedCount = rowIds.filter(id => state[id] === true).length;
  return selectedCount > 0 && selectedCount < rowIds.length;
}
```

---

## Test Requirements

Test all helpers with edge cases (empty selections, single/multiple modes, range selection).

---

## Success Criteria

- [ ] All tests pass 100% coverage
- [ ] Immutability verified
- [ ] Range selection works correctly
- [ ] JSDoc complete

---

## Related Tasks

- **Depends on:** CORE-001, CORE-004
- **Blocks:** SELECT-002, SELECT-003