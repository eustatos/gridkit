---
task_id: FILTER-001
epic_id: EPIC-002
module: @gridkit/features
file: src/features/filtering/types.ts, src/features/filtering/state.ts
priority: P1
complexity: medium
estimated_tokens: ~10,000
assignable_to_ai: yes
dependencies:
  - CORE-001
  - CORE-003
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Filtering State Management

## Context

Define the filtering state structure. Filters need to support multiple filter types (text, number, date) per column, with the ability to clear individual or all filters.

## Objectives

- [ ] Define `FilteringState` type
- [ ] Define `ColumnFilter` type
- [ ] Define filter value types
- [ ] Create state manipulation helpers
- [ ] Add comprehensive JSDoc

---

## Implementation Requirements

### 1. Types

**File: `src/features/filtering/types.ts`**

```typescript
import type { ColumnId } from '@gridkit/core/types';

/**
 * Filter value can be any type.
 * Specific filter functions will validate and use it.
 * 
 * @public
 */
export type FilterValue = unknown;

/**
 * Single column filter.
 * 
 * @public
 */
export interface ColumnFilter {
  /**
   * Column ID to filter
   */
  id: ColumnId;
  
  /**
   * Filter value (interpreted by filter function)
   */
  value: FilterValue;
}

/**
 * Filtering state.
 * Array of column filters (all applied with AND logic).
 * 
 * @example
 * ```typescript
 * const state: FilteringState = [
 *   { id: 'name', value: 'john' },      // Text filter
 *   { id: 'age', value: { min: 18 } },  // Number filter
 * ];
 * ```
 * 
 * @public
 */
export type FilteringState = ColumnFilter[];
```

### 2. State Helpers

**File: `src/features/filtering/state.ts`**

```typescript
import type { ColumnId } from '@gridkit/core/types';
import type { ColumnFilter, FilteringState, FilterValue } from './types';

/**
 * Set filter for a column.
 * Replaces existing filter for that column.
 * 
 * @param state - Current filtering state
 * @param columnId - Column to filter
 * @param value - Filter value
 * @returns New filtering state
 * 
 * @public
 */
export function setColumnFilter(
  state: FilteringState,
  columnId: ColumnId,
  value: FilterValue
): FilteringState {
  const existingFilter = state.find(f => f.id === columnId);
  
  if (existingFilter) {
    // Replace existing filter
    return state.map(f =>
      f.id === columnId ? { id: columnId, value } : f
    );
  }
  
  // Add new filter
  return [...state, { id: columnId, value }];
}

/**
 * Remove filter for a column.
 * 
 * @param state - Current filtering state
 * @param columnId - Column to clear
 * @returns New filtering state
 * 
 * @public
 */
export function removeColumnFilter(
  state: FilteringState,
  columnId: ColumnId
): FilteringState {
  return state.filter(f => f.id !== columnId);
}

/**
 * Get filter for a specific column.
 * 
 * @param state - Filtering state
 * @param columnId - Column ID
 * @returns Column filter or undefined
 * 
 * @public
 */
export function getColumnFilter(
  state: FilteringState,
  columnId: ColumnId
): ColumnFilter | undefined {
  return state.find(f => f.id === columnId);
}

/**
 * Get filter value for a column.
 * 
 * @param state - Filtering state
 * @param columnId - Column ID
 * @returns Filter value or undefined
 * 
 * @public
 */
export function getColumnFilterValue(
  state: FilteringState,
  columnId: ColumnId
): FilterValue {
  return getColumnFilter(state, columnId)?.value;
}

/**
 * Check if column has a filter.
 * 
 * @param state - Filtering state
 * @param columnId - Column ID
 * @returns True if column is filtered
 * 
 * @public
 */
export function isColumnFiltered(
  state: FilteringState,
  columnId: ColumnId
): boolean {
  return state.some(f => f.id === columnId);
}

/**
 * Clear all filters.
 * 
 * @returns Empty filtering state
 * 
 * @public
 */
export function clearFilters(): FilteringState {
  return [];
}

/**
 * Get count of active filters.
 * 
 * @param state - Filtering state
 * @returns Number of active filters
 * 
 * @public
 */
export function getFilterCount(state: FilteringState): number {
  return state.length;
}
```

---

## Test Requirements

```typescript
import { describe, it, expect } from 'vitest';
import {
  setColumnFilter,
  removeColumnFilter,
  getColumnFilter,
  getColumnFilterValue,
  isColumnFiltered,
  clearFilters,
  getFilterCount,
} from '../state';
import type { FilteringState } from '../types';

describe('Filtering State', () => {
  describe('setColumnFilter', () => {
    it('should add new filter', () => {
      const state: FilteringState = [];
      const result = setColumnFilter(state, 'name', 'john');
      
      expect(result).toEqual([{ id: 'name', value: 'john' }]);
    });

    it('should replace existing filter', () => {
      const state: FilteringState = [{ id: 'name', value: 'john' }];
      const result = setColumnFilter(state, 'name', 'jane');
      
      expect(result).toEqual([{ id: 'name', value: 'jane' }]);
    });

    it('should preserve other filters', () => {
      const state: FilteringState = [
        { id: 'name', value: 'john' },
        { id: 'age', value: 25 },
      ];
      const result = setColumnFilter(state, 'name', 'jane');
      
      expect(result).toEqual([
        { id: 'name', value: 'jane' },
        { id: 'age', value: 25 },
      ]);
    });
  });

  describe('removeColumnFilter', () => {
    it('should remove filter', () => {
      const state: FilteringState = [{ id: 'name', value: 'john' }];
      const result = removeColumnFilter(state, 'name');
      
      expect(result).toEqual([]);
    });

    it('should preserve other filters', () => {
      const state: FilteringState = [
        { id: 'name', value: 'john' },
        { id: 'age', value: 25 },
      ];
      const result = removeColumnFilter(state, 'name');
      
      expect(result).toEqual([{ id: 'age', value: 25 }]);
    });
  });

  describe('getColumnFilter', () => {
    it('should return filter for existing column', () => {
      const state: FilteringState = [{ id: 'name', value: 'john' }];
      const result = getColumnFilter(state, 'name');
      
      expect(result).toEqual({ id: 'name', value: 'john' });
    });

    it('should return undefined for non-existent filter', () => {
      const state: FilteringState = [];
      const result = getColumnFilter(state, 'name');
      
      expect(result).toBeUndefined();
    });
  });

  describe('isColumnFiltered', () => {
    it('should return true for filtered column', () => {
      const state: FilteringState = [{ id: 'name', value: 'john' }];
      expect(isColumnFiltered(state, 'name')).toBe(true);
    });

    it('should return false for non-filtered column', () => {
      const state: FilteringState = [];
      expect(isColumnFiltered(state, 'name')).toBe(false);
    });
  });

  describe('clearFilters', () => {
    it('should return empty array', () => {
      expect(clearFilters()).toEqual([]);
    });
  });

  describe('getFilterCount', () => {
    it('should return 0 for empty state', () => {
      expect(getFilterCount([])).toBe(0);
    });

    it('should return correct count', () => {
      const state: FilteringState = [
        { id: 'name', value: 'john' },
        { id: 'age', value: 25 },
      ];
      expect(getFilterCount(state)).toBe(2);
    });
  });
});
```

---

## Success Criteria

- [ ] All tests pass 100% coverage
- [ ] Immutability verified
- [ ] JSDoc complete
- [ ] TypeScript compiles

---

## Related Tasks

- **Depends on:** CORE-001, CORE-003
- **Blocks:** FILTER-002, FILTER-003, FILTER-004