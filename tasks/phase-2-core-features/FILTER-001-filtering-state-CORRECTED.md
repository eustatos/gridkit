---
task_id: FILTER-001
epic_id: EPIC-002
module: @gridkit/core
file: src/features/filtering/helpers.ts
priority: P1
complexity: low
estimated_tokens: ~6,000
assignable_to_ai: yes
dependencies:
  - CORE-001
  - CORE-003
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Filtering State Helpers

## Context

The `FilteringState` type is already defined in `@gridkit/core/types/table/TableState.ts`.
We need to create helper functions for working with filtering state.

**Current Structure (already exists):**
```typescript
export interface FilteringState {
  id: ColumnId;
  value: string;
  operator?: FilterOperator;
}

// In TableState:
readonly filtering?: readonly FilteringState[];
```

## Objectives

- [ ] Create filtering state manipulation helpers
- [ ] Support all filter operators
- [ ] Add type-safe filter value handling
- [ ] Provide utilities for filter queries
- [ ] Add comprehensive JSDoc and tests

---

## Implementation Requirements

### 1. Extend FilteringState to support different value types

**File: `packages/core/src/types/table/TableState.ts`**

Update the `FilteringState` interface:

```typescript
/**
 * Filter value type - supports multiple data types.
 */
export type FilterValue = string | number | boolean | Date | { min?: number; max?: number } | unknown;

/**
 * Filtering configuration.
 */
export interface FilteringState {
  /**
   * Column ID to filter by.
   */
  id: ColumnId;

  /**
   * Filter value (type depends on operator and column type).
   */
  value: FilterValue;

  /**
   * Filter operator (default: 'equals').
   */
  operator?: FilterOperator;
}
```

### 2. State Helpers

**File: `packages/core/src/table/helpers/filtering-helpers.ts`**

```typescript
import type { ColumnId } from '@/types';
import type { FilteringState, FilterValue, FilterOperator } from '@/types/table/TableState';

/**
 * Set filter for a column.
 * Replaces existing filter for that column.
 * 
 * @param state - Current filtering state array
 * @param columnId - Column to filter
 * @param value - Filter value
 * @param operator - Filter operator (default: 'equals')
 * @returns New filtering state array
 * 
 * @public
 */
export function setColumnFilter(
  state: readonly FilteringState[],
  columnId: ColumnId,
  value: FilterValue,
  operator: FilterOperator = 'equals'
): FilteringState[] {
  const existingIndex = state.findIndex(f => f.id === columnId);
  
  if (existingIndex >= 0) {
    // Replace existing filter
    const newState = [...state];
    newState[existingIndex] = { id: columnId, value, operator };
    return newState;
  }
  
  // Add new filter
  return [...state, { id: columnId, value, operator }];
}

/**
 * Remove filter for a column.
 * 
 * @param state - Current filtering state array
 * @param columnId - Column to clear
 * @returns New filtering state array
 * 
 * @public
 */
export function removeColumnFilter(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilteringState[] {
  return state.filter(f => f.id !== columnId);
}

/**
 * Get filter for a specific column.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns Column filter or undefined
 * 
 * @public
 */
export function getColumnFilter(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilteringState | undefined {
  return state.find(f => f.id === columnId);
}

/**
 * Get filter value for a column.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns Filter value or undefined
 * 
 * @public
 */
export function getColumnFilterValue(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilterValue | undefined {
  return getColumnFilter(state, columnId)?.value;
}

/**
 * Get filter operator for a column.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns Filter operator or undefined
 * 
 * @public
 */
export function getColumnFilterOperator(
  state: readonly FilteringState[],
  columnId: ColumnId
): FilterOperator | undefined {
  return getColumnFilter(state, columnId)?.operator;
}

/**
 * Check if column has a filter.
 * 
 * @param state - Filtering state array
 * @param columnId - Column ID
 * @returns True if column is filtered
 * 
 * @public
 */
export function isColumnFiltered(
  state: readonly FilteringState[],
  columnId: ColumnId
): boolean {
  return state.some(f => f.id === columnId);
}

/**
 * Clear all filters.
 * 
 * @returns Empty filtering state array
 * 
 * @public
 */
export function clearAllFilters(): FilteringState[] {
  return [];
}

/**
 * Get count of active filters.
 * 
 * @param state - Filtering state array
 * @returns Number of active filters
 * 
 * @public
 */
export function getActiveFilterCount(state: readonly FilteringState[]): number {
  return state.length;
}

/**
 * Update filter operator for a column.
 * 
 * @param state - Current filtering state array
 * @param columnId - Column ID
 * @param operator - New operator
 * @returns New filtering state array
 * 
 * @public
 */
export function updateColumnFilterOperator(
  state: readonly FilteringState[],
  columnId: ColumnId,
  operator: FilterOperator
): FilteringState[] {
  const existingIndex = state.findIndex(f => f.id === columnId);
  
  if (existingIndex < 0) {
    return [...state]; // No change if filter doesn't exist
  }
  
  const newState = [...state];
  newState[existingIndex] = {
    ...newState[existingIndex],
    operator,
  };
  return newState;
}

/**
 * Get all filtered column IDs.
 * 
 * @param state - Filtering state array
 * @returns Array of filtered column IDs
 * 
 * @public
 */
export function getFilteredColumnIds(
  state: readonly FilteringState[]
): ColumnId[] {
  return state.map(f => f.id);
}
```

---

## Test Requirements

**File: `packages/core/src/table/helpers/__tests__/filtering-helpers.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  setColumnFilter,
  removeColumnFilter,
  getColumnFilter,
  getColumnFilterValue,
  getColumnFilterOperator,
  isColumnFiltered,
  clearAllFilters,
  getActiveFilterCount,
  updateColumnFilterOperator,
  getFilteredColumnIds,
} from '../filtering-helpers';
import type { FilteringState } from '@/types/table/TableState';

describe('Filtering Helpers', () => {
  describe('setColumnFilter', () => {
    it('should add new filter with default operator', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'name', 'john');
      
      expect(result).toEqual([
        { id: 'name', value: 'john', operator: 'equals' }
      ]);
    });

    it('should add new filter with custom operator', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'name', 'john', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'john', operator: 'contains' }
      ]);
    });

    it('should replace existing filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = setColumnFilter(state, 'name', 'jane', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'jane', operator: 'contains' }
      ]);
    });

    it('should preserve other filters', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ];
      const result = setColumnFilter(state, 'name', 'jane', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'jane', operator: 'contains' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ]);
    });

    it('should support number values', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'age', 25, 'greaterThan');
      
      expect(result).toEqual([
        { id: 'age', value: 25, operator: 'greaterThan' }
      ]);
    });

    it('should support range values', () => {
      const state: FilteringState[] = [];
      const result = setColumnFilter(state, 'age', { min: 18, max: 65 }, 'between');
      
      expect(result).toEqual([
        { id: 'age', value: { min: 18, max: 65 }, operator: 'between' }
      ]);
    });
  });

  describe('removeColumnFilter', () => {
    it('should remove filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = removeColumnFilter(state, 'name');
      
      expect(result).toEqual([]);
    });

    it('should preserve other filters', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ];
      const result = removeColumnFilter(state, 'name');
      
      expect(result).toEqual([
        { id: 'age', value: 25, operator: 'greaterThan' }
      ]);
    });

    it('should handle non-existent filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = removeColumnFilter(state, 'email');
      
      expect(result).toEqual(state);
    });
  });

  describe('getColumnFilter', () => {
    it('should return filter for existing column', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = getColumnFilter(state, 'name');
      
      expect(result).toEqual({ id: 'name', value: 'john', operator: 'equals' });
    });

    it('should return undefined for non-existent filter', () => {
      const state: FilteringState[] = [];
      const result = getColumnFilter(state, 'name');
      
      expect(result).toBeUndefined();
    });
  });

  describe('getColumnFilterValue', () => {
    it('should return filter value', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = getColumnFilterValue(state, 'name');
      
      expect(result).toBe('john');
    });

    it('should return undefined for non-existent filter', () => {
      const state: FilteringState[] = [];
      const result = getColumnFilterValue(state, 'name');
      
      expect(result).toBeUndefined();
    });
  });

  describe('getColumnFilterOperator', () => {
    it('should return filter operator', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'contains' }
      ];
      const result = getColumnFilterOperator(state, 'name');
      
      expect(result).toBe('contains');
    });

    it('should return undefined for non-existent filter', () => {
      const state: FilteringState[] = [];
      const result = getColumnFilterOperator(state, 'name');
      
      expect(result).toBeUndefined();
    });
  });

  describe('isColumnFiltered', () => {
    it('should return true for filtered column', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      expect(isColumnFiltered(state, 'name')).toBe(true);
    });

    it('should return false for non-filtered column', () => {
      const state: FilteringState[] = [];
      expect(isColumnFiltered(state, 'name')).toBe(false);
    });
  });

  describe('clearAllFilters', () => {
    it('should return empty array', () => {
      expect(clearAllFilters()).toEqual([]);
    });
  });

  describe('getActiveFilterCount', () => {
    it('should return 0 for empty state', () => {
      expect(getActiveFilterCount([])).toBe(0);
    });

    it('should return correct count', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
      ];
      expect(getActiveFilterCount(state)).toBe(2);
    });
  });

  describe('updateColumnFilterOperator', () => {
    it('should update operator for existing filter', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = updateColumnFilterOperator(state, 'name', 'contains');
      
      expect(result).toEqual([
        { id: 'name', value: 'john', operator: 'contains' }
      ]);
    });

    it('should not change state if filter does not exist', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const result = updateColumnFilterOperator(state, 'email', 'contains');
      
      expect(result).toEqual(state);
      expect(result).not.toBe(state); // Should return new array
    });
  });

  describe('getFilteredColumnIds', () => {
    it('should return empty array for no filters', () => {
      const state: FilteringState[] = [];
      expect(getFilteredColumnIds(state)).toEqual([]);
    });

    it('should return all filtered column IDs', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' },
        { id: 'age', value: 25, operator: 'greaterThan' },
        { id: 'email', value: '@test', operator: 'contains' },
      ];
      expect(getFilteredColumnIds(state)).toEqual(['name', 'age', 'email']);
    });
  });

  describe('Immutability', () => {
    it('setColumnFilter should not mutate original state', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const original = [...state];
      
      setColumnFilter(state, 'age', 25);
      
      expect(state).toEqual(original);
    });

    it('removeColumnFilter should not mutate original state', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const original = [...state];
      
      removeColumnFilter(state, 'name');
      
      expect(state).toEqual(original);
    });

    it('updateColumnFilterOperator should not mutate original state', () => {
      const state: FilteringState[] = [
        { id: 'name', value: 'john', operator: 'equals' }
      ];
      const original = [...state];
      
      updateColumnFilterOperator(state, 'name', 'contains');
      
      expect(state).toEqual(original);
    });
  });
});
```

---

## Files to Create/Update

- [ ] Update `packages/core/src/types/table/TableState.ts` (change FilteringState.value type)
- [ ] Create `packages/core/src/table/helpers/filtering-helpers.ts`
- [ ] Create `packages/core/src/table/helpers/__tests__/filtering-helpers.test.ts`
- [ ] Create `packages/core/src/table/helpers/index.ts` (if not exists)
- [ ] Update `packages/core/src/table/index.ts` to export helpers
- [ ] Update `packages/core/src/index.ts` to export helpers

---

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] Immutability verified (original state never mutated)
- [ ] JSDoc complete for all public functions
- [ ] TypeScript compiles without errors
- [ ] Supports all FilterOperator types
- [ ] Works with existing filtering-methods.ts

---

## Related Tasks

- **Depends on:** CORE-001, CORE-003
- **Blocks:** FILTER-002 (Filter Functions), FILTER-003 (Client-side Filtering)
- **Related:** Column filtering methods already exist in `column/methods/filtering-methods.ts`
