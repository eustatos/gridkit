---
task_id: PAGE-001
epic_id: EPIC-002
module: @gridkit/features
file: src/features/pagination/types.ts, src/features/pagination/state.ts
priority: P1
complexity: low
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies:
  - CORE-001
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Pagination State Management

## Context

Define pagination state structure and helper functions. Pagination tracks current page index and page size, with helpers for navigation.

## Objectives

- [ ] Define `PaginationState` type
- [ ] Define `PaginationOptions` type
- [ ] Create navigation helpers (first, prev, next, last)
- [ ] Add page calculation utilities
- [ ] Add comprehensive JSDoc

---

## Implementation Requirements

### 1. Types

**File: `src/features/pagination/types.ts`**

```typescript
/**
 * Pagination state.
 * 
 * @public
 */
export interface PaginationState {
  /**
   * Current page index (0-based)
   * @default 0
   */
  pageIndex: number;
  
  /**
   * Number of items per page
   * @default 10
   */
  pageSize: number;
}

/**
 * Pagination metadata.
 * Calculated values based on state and total count.
 * 
 * @public
 */
export interface PaginationMeta {
  /**
   * Total number of items
   */
  totalCount: number;
  
  /**
   * Total number of pages
   */
  pageCount: number;
  
  /**
   * Whether there's a previous page
   */
  canPreviousPage: boolean;
  
  /**
   * Whether there's a next page
   */
  canNextPage: boolean;
  
  /**
   * Index of first item on current page
   */
  startIndex: number;
  
  /**
   * Index of last item on current page (exclusive)
   */
  endIndex: number;
}
```

### 2. State Helpers

**File: `src/features/pagination/state.ts`**

```typescript
import type { PaginationState, PaginationMeta } from './types';

/**
 * Calculate pagination metadata.
 * 
 * @param state - Pagination state
 * @param totalCount - Total number of items
 * @returns Pagination metadata
 * 
 * @public
 */
export function getPaginationMeta(
  state: PaginationState,
  totalCount: number
): PaginationMeta {
  const { pageIndex, pageSize } = state;
  const pageCount = Math.ceil(totalCount / pageSize);
  
  return {
    totalCount,
    pageCount,
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex < pageCount - 1,
    startIndex: pageIndex * pageSize,
    endIndex: Math.min((pageIndex + 1) * pageSize, totalCount),
  };
}

/**
 * Go to first page.
 * 
 * @param state - Current pagination state
 * @returns New state with pageIndex = 0
 * 
 * @public
 */
export function firstPage(state: PaginationState): PaginationState {
  return { ...state, pageIndex: 0 };
}

/**
 * Go to previous page.
 * 
 * @param state - Current pagination state
 * @returns New state with decremented pageIndex
 * 
 * @public
 */
export function previousPage(state: PaginationState): PaginationState {
  return {
    ...state,
    pageIndex: Math.max(0, state.pageIndex - 1),
  };
}

/**
 * Go to next page.
 * 
 * @param state - Current pagination state
 * @param totalCount - Total number of items
 * @returns New state with incremented pageIndex
 * 
 * @public
 */
export function nextPage(
  state: PaginationState,
  totalCount: number
): PaginationState {
  const pageCount = Math.ceil(totalCount / state.pageSize);
  return {
    ...state,
    pageIndex: Math.min(pageCount - 1, state.pageIndex + 1),
  };
}

/**
 * Go to last page.
 * 
 * @param state - Current pagination state
 * @param totalCount - Total number of items
 * @returns New state with pageIndex = last page
 * 
 * @public
 */
export function lastPage(
  state: PaginationState,
  totalCount: number
): PaginationState {
  const pageCount = Math.ceil(totalCount / state.pageSize);
  return { ...state, pageIndex: Math.max(0, pageCount - 1) };
}

/**
 * Go to specific page.
 * 
 * @param state - Current pagination state
 * @param pageIndex - Target page index
 * @param totalCount - Total number of items
 * @returns New state with clamped pageIndex
 * 
 * @public
 */
export function gotoPage(
  state: PaginationState,
  pageIndex: number,
  totalCount: number
): PaginationState {
  const pageCount = Math.ceil(totalCount / state.pageSize);
  const clampedIndex = Math.max(0, Math.min(pageCount - 1, pageIndex));
  return { ...state, pageIndex: clampedIndex };
}

/**
 * Set page size.
 * Resets to first page when page size changes.
 * 
 * @param state - Current pagination state
 * @param pageSize - New page size
 * @returns New state with updated pageSize and pageIndex = 0
 * 
 * @public
 */
export function setPageSize(
  state: PaginationState,
  pageSize: number
): PaginationState {
  return {
    pageIndex: 0, // Reset to first page
    pageSize: Math.max(1, pageSize), // Ensure >= 1
  };
}

/**
 * Get page range for display.
 * 
 * @param state - Pagination state
 * @param totalCount - Total items
 * @returns Array of page numbers to display
 * 
 * @example
 * ```typescript
 * // For 10 pages, current page 5
 * getPageRange(state, 100); // [3, 4, 5, 6, 7]
 * ```
 * 
 * @public
 */
export function getPageRange(
  state: PaginationState,
  totalCount: number,
  maxPages = 5
): number[] {
  const pageCount = Math.ceil(totalCount / state.pageSize);
  const { pageIndex } = state;
  
  if (pageCount <= maxPages) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }
  
  const half = Math.floor(maxPages / 2);
  let start = Math.max(0, pageIndex - half);
  let end = Math.min(pageCount, start + maxPages);
  
  if (end - start < maxPages) {
    start = Math.max(0, end - maxPages);
  }
  
  return Array.from({ length: end - start }, (_, i) => start + i);
}
```

---

## Test Requirements

```typescript
import { describe, it, expect } from 'vitest';
import {
  getPaginationMeta,
  firstPage,
  previousPage,
  nextPage,
  lastPage,
  gotoPage,
  setPageSize,
  getPageRange,
} from '../state';
import type { PaginationState } from '../types';

describe('Pagination State', () => {
  describe('getPaginationMeta', () => {
    it('should calculate metadata correctly', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      const meta = getPaginationMeta(state, 25);
      
      expect(meta.totalCount).toBe(25);
      expect(meta.pageCount).toBe(3);
      expect(meta.canPreviousPage).toBe(false);
      expect(meta.canNextPage).toBe(true);
      expect(meta.startIndex).toBe(0);
      expect(meta.endIndex).toBe(10);
    });

    it('should handle last page correctly', () => {
      const state: PaginationState = { pageIndex: 2, pageSize: 10 };
      const meta = getPaginationMeta(state, 25);
      
      expect(meta.canPreviousPage).toBe(true);
      expect(meta.canNextPage).toBe(false);
      expect(meta.startIndex).toBe(20);
      expect(meta.endIndex).toBe(25);
    });
  });

  describe('navigation', () => {
    it('firstPage should reset to page 0', () => {
      const state: PaginationState = { pageIndex: 5, pageSize: 10 };
      const result = firstPage(state);
      
      expect(result.pageIndex).toBe(0);
    });

    it('previousPage should decrement', () => {
      const state: PaginationState = { pageIndex: 5, pageSize: 10 };
      const result = previousPage(state);
      
      expect(result.pageIndex).toBe(4);
    });

    it('previousPage should not go below 0', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      const result = previousPage(state);
      
      expect(result.pageIndex).toBe(0);
    });

    it('nextPage should increment', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      const result = nextPage(state, 100);
      
      expect(result.pageIndex).toBe(1);
    });

    it('nextPage should not exceed page count', () => {
      const state: PaginationState = { pageIndex: 9, pageSize: 10 };
      const result = nextPage(state, 100);
      
      expect(result.pageIndex).toBe(9);
    });

    it('lastPage should go to last page', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      const result = lastPage(state, 95);
      
      expect(result.pageIndex).toBe(9); // ceil(95/10) - 1 = 9
    });

    it('gotoPage should clamp to valid range', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      
      expect(gotoPage(state, -1, 100).pageIndex).toBe(0);
      expect(gotoPage(state, 5, 100).pageIndex).toBe(5);
      expect(gotoPage(state, 999, 100).pageIndex).toBe(9);
    });
  });

  describe('setPageSize', () => {
    it('should update page size and reset to first page', () => {
      const state: PaginationState = { pageIndex: 5, pageSize: 10 };
      const result = setPageSize(state, 25);
      
      expect(result.pageSize).toBe(25);
      expect(result.pageIndex).toBe(0);
    });

    it('should ensure page size >= 1', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      const result = setPageSize(state, 0);
      
      expect(result.pageSize).toBe(1);
    });
  });

  describe('getPageRange', () => {
    it('should return all pages if count <= maxPages', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      const range = getPageRange(state, 30, 5);
      
      expect(range).toEqual([0, 1, 2]);
    });

    it('should return centered range for middle pages', () => {
      const state: PaginationState = { pageIndex: 5, pageSize: 10 };
      const range = getPageRange(state, 100, 5);
      
      expect(range).toEqual([3, 4, 5, 6, 7]);
    });

    it('should handle first pages', () => {
      const state: PaginationState = { pageIndex: 0, pageSize: 10 };
      const range = getPageRange(state, 100, 5);
      
      expect(range).toEqual([0, 1, 2, 3, 4]);
    });

    it('should handle last pages', () => {
      const state: PaginationState = { pageIndex: 9, pageSize: 10 };
      const range = getPageRange(state, 100, 5);
      
      expect(range).toEqual([5, 6, 7, 8, 9]);
    });
  });
});
```

---

## Success Criteria

- [ ] All tests pass 100% coverage
- [ ] Immutability verified
- [ ] Edge cases handled
- [ ] JSDoc complete

---

## Related Tasks

- **Depends on:** CORE-001
- **Blocks:** PAGE-002 (client pagination), PAGE-003 (server pagination)