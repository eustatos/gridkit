---
task_id: SORT-001
epic_id: EPIC-002
module: @gridkit/features
file: src/features/sorting/types.ts, src/features/sorting/state.ts
priority: P1
complexity: low
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies:
  - CORE-001
  - CORE-002
  - CORE-003
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Sorting State Management

## Context

Define the sorting state structure and management logic. This is the foundation for all sorting functionality - it tracks which columns are sorted and in what order.

## Guidelines Reference

- `.github/AI_GUIDELINES.md` - State management patterns
- `CONTRIBUTING.md` - Naming conventions
- `docs/architecture/ARCHITECTURE.md` - Immutable state requirements

## Objectives

- [ ] Define `SortingState` type
- [ ] Define `ColumnSort` type (column + direction)
- [ ] Define `SortDirection` type (asc/desc)
- [ ] Create helper functions for state manipulation
- [ ] Add comprehensive JSDoc

---

## Implementation Requirements

### 1. Types

**File: `src/features/sorting/types.ts`**

```typescript
import type { ColumnId } from '@gridkit/core/types';

/**
 * Sort direction.
 * 
 * @public
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Single column sort configuration.
 * 
 * @public
 */
export interface ColumnSort {
  /**
   * Column ID to sort by
   */
  id: ColumnId;
  
  /**
   * Sort direction
   * @default 'asc'
   */
  desc: boolean;
}

/**
 * Sorting state.
 * Array of column sorts in order of application.
 * 
 * @example
 * ```typescript
 * // Single column sort
 * const state: SortingState = [
 *   { id: 'name', desc: false }
 * ];
 * 
 * // Multi-column sort
 * const state: SortingState = [
 *   { id: 'status', desc: false },  // Primary
 *   { id: 'name', desc: false }      // Secondary
 * ];
 * ```
 * 
 * @public
 */
export type SortingState = ColumnSort[];
```

### 2. State Helpers

**File: `src/features/sorting/state.ts`**

```typescript
import type { ColumnId } from '@gridkit/core/types';
import type { ColumnSort, SortingState } from './types';

/**
 * Toggle sort for a column.
 * Cycles through: asc -> desc -> none
 * 
 * @param state - Current sorting state
 * @param columnId - Column to toggle
 * @param isMulti - Whether to add to existing sorts (multi-column)
 * @returns New sorting state
 * 
 * @example
 * ```typescript
 * let state: SortingState = [];
 * 
 * // First click: asc
 * state = toggleSort(state, 'name', false);
 * // [{ id: 'name', desc: false }]
 * 
 * // Second click: desc
 * state = toggleSort(state, 'name', false);
 * // [{ id: 'name', desc: true }]
 * 
 * // Third click: remove
 * state = toggleSort(state, 'name', false);
 * // []
 * ```
 * 
 * @public
 */
export function toggleSort(
  state: SortingState,
  columnId: ColumnId,
  isMulti = false
): SortingState {
  const existingSort = state.find(s => s.id === columnId);
  
  if (!existingSort) {
    // First click: add asc
    const newSort: ColumnSort = { id: columnId, desc: false };
    return isMulti ? [...state, newSort] : [newSort];
  }
  
  if (!existingSort.desc) {
    // Second click: change to desc
    return state.map(s =>
      s.id === columnId ? { ...s, desc: true } : s
    );
  }
  
  // Third click: remove
  return state.filter(s => s.id !== columnId);
}

/**
 * Get sort for a specific column.
 * 
 * @param state - Sorting state
 * @param columnId - Column ID
 * @returns Column sort or undefined
 * 
 * @public
 */
export function getColumnSort(
  state: SortingState,
  columnId: ColumnId
): ColumnSort | undefined {
  return state.find(s => s.id === columnId);
}

/**
 * Check if column is sorted.
 * 
 * @param state - Sorting state
 * @param columnId - Column ID
 * @returns True if column is sorted
 * 
 * @public
 */
export function isColumnSorted(
  state: SortingState,
  columnId: ColumnId
): boolean {
  return state.some(s => s.id === columnId);
}

/**
 * Get next sort direction for a column.
 * Cycles: none -> asc -> desc -> none
 * 
 * @param state - Sorting state
 * @param columnId - Column ID
 * @returns Next direction or false (to clear)
 * 
 * @public
 */
export function getNextSortDirection(
  state: SortingState,
  columnId: ColumnId
): 'asc' | 'desc' | false {
  const sort = getColumnSort(state, columnId);
  
  if (!sort) return 'asc';
  if (!sort.desc) return 'desc';
  return false;
}

/**
 * Clear all sorting.
 * 
 * @returns Empty sorting state
 * 
 * @public
 */
export function clearSort(): SortingState {
  return [];
}

/**
 * Set sort for a column (replacing existing sorts).
 * 
 * @param columnId - Column ID
 * @param desc - Sort descending
 * @returns New sorting state
 * 
 * @public
 */
export function setSort(
  columnId: ColumnId,
  desc = false
): SortingState {
  return [{ id: columnId, desc }];
}
```

---

## Test Requirements

**File: `src/features/sorting/__tests__/state.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  toggleSort,
  getColumnSort,
  isColumnSorted,
  getNextSortDirection,
  clearSort,
  setSort,
} from '../state';
import type { SortingState } from '../types';

describe('Sorting State', () => {
  describe('toggleSort', () => {
    it('should add asc sort on first click', () => {
      const state: SortingState = [];
      const result = toggleSort(state, 'name');
      
      expect(result).toEqual([{ id: 'name', desc: false }]);
    });

    it('should change to desc on second click', () => {
      const state: SortingState = [{ id: 'name', desc: false }];
      const result = toggleSort(state, 'name');
      
      expect(result).toEqual([{ id: 'name', desc: true }]);
    });

    it('should remove sort on third click', () => {
      const state: SortingState = [{ id: 'name', desc: true }];
      const result = toggleSort(state, 'name');
      
      expect(result).toEqual([]);
    });

    it('should replace existing sorts in single-column mode', () => {
      const state: SortingState = [
        { id: 'name', desc: false },
        { id: 'age', desc: true },
      ];
      const result = toggleSort(state, 'email', false);
      
      expect(result).toEqual([{ id: 'email', desc: false }]);
    });

    it('should add to existing sorts in multi-column mode', () => {
      const state: SortingState = [{ id: 'name', desc: false }];
      const result = toggleSort(state, 'age', true);
      
      expect(result).toEqual([
        { id: 'name', desc: false },
        { id: 'age', desc: false },
      ]);
    });
  });

  describe('getColumnSort', () => {
    it('should return sort for existing column', () => {
      const state: SortingState = [{ id: 'name', desc: false }];
      const result = getColumnSort(state, 'name');
      
      expect(result).toEqual({ id: 'name', desc: false });
    });

    it('should return undefined for non-existent column', () => {
      const state: SortingState = [{ id: 'name', desc: false }];
      const result = getColumnSort(state, 'age');
      
      expect(result).toBeUndefined();
    });
  });

  describe('isColumnSorted', () => {
    it('should return true for sorted column', () => {
      const state: SortingState = [{ id: 'name', desc: false }];
      expect(isColumnSorted(state, 'name')).toBe(true);
    });

    it('should return false for non-sorted column', () => {
      const state: SortingState = [{ id: 'name', desc: false }];
      expect(isColumnSorted(state, 'age')).toBe(false);
    });
  });

  describe('getNextSortDirection', () => {
    it('should return asc for unsorted column', () => {
      const state: SortingState = [];
      expect(getNextSortDirection(state, 'name')).toBe('asc');
    });

    it('should return desc for asc sorted column', () => {
      const state: SortingState = [{ id: 'name', desc: false }];
      expect(getNextSortDirection(state, 'name')).toBe('desc');
    });

    it('should return false for desc sorted column', () => {
      const state: SortingState = [{ id: 'name', desc: true }];
      expect(getNextSortDirection(state, 'name')).toBe(false);
    });
  });

  describe('clearSort', () => {
    it('should return empty array', () => {
      expect(clearSort()).toEqual([]);
    });
  });

  describe('setSort', () => {
    it('should create single sort with asc by default', () => {
      const result = setSort('name');
      expect(result).toEqual([{ id: 'name', desc: false }]);
    });

    it('should create single sort with desc', () => {
      const result = setSort('name', true);
      expect(result).toEqual([{ id: 'name', desc: true }]);
    });
  });
});
```

---

## Edge Cases

- [ ] Empty state
- [ ] Multi-column sort order preservation
- [ ] Toggle with isMulti flag
- [ ] Invalid column IDs
- [ ] State immutability

---

## Performance Requirements

- State operations: **< 1ms**
- No array mutations (immutable updates)

---

## Files to Create/Modify

- [ ] `src/features/sorting/types.ts`
- [ ] `src/features/sorting/state.ts`
- [ ] `src/features/sorting/__tests__/state.test.ts`
- [ ] `src/features/sorting/index.ts` - Exports

---

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] TypeScript compiles
- [ ] JSDoc complete
- [ ] Immutability verified
- [ ] Follows AI_GUIDELINES.md

---

## Related Tasks

- **Depends on:** CORE-001, CORE-002, CORE-003
- **Blocks:** SORT-002, SORT-003

---

## Notes for AI

- Keep it simple - this is just state management
- Ensure all operations are immutable
- Test the toggle cycle thoroughly (asc -> desc -> none)
- Multi-column sort is just array ordering