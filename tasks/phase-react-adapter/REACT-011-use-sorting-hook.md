---
task_id: REACT-011
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useSorting.ts
priority: P1
complexity: low
estimated_tokens: ~6,000
assignable_to_ai: yes
dependencies:
  - REACT-005
  - REACT-006
---

# Task: Implement useSorting Hook

## Context

Create hooks for managing table sorting state.

## Objectives

- [ ] Create useSorting hook
- [ ] Support multi-column sorting
- [ ] Handle sort toggling
- [ ] Provide sorting helpers

---

## Implementation

Create `src/hooks/useSorting.ts`:

```typescript
import { useCallback } from 'react';
import type { Table, RowData, SortingState } from '@gridkit/core';
import { useTableState } from './useTableState';

export interface UseSortingResult {
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  toggleSort: (columnId: string, desc?: boolean) => void;
  clearSorting: () => void;
  isSorted: (columnId: string) => boolean;
  getSortDirection: (columnId: string) => 'asc' | 'desc' | false;
}

export function useSorting<TData extends RowData>(
  table: Table<TData>
): UseSortingResult {
  const sorting = useTableState(table, (state) => state.sorting || []);
  
  const setSorting = useCallback(
    (newSorting: SortingState) => {
      table.setState((prev) => ({
        ...prev,
        sorting: newSorting,
      }));
    },
    [table]
  );
  
  const toggleSort = useCallback(
    (columnId: string, desc?: boolean) => {
      table.setState((prev) => {
        const currentSorting = prev.sorting || [];
        const existingIndex = currentSorting.findIndex((s) => s.id === columnId);
        
        if (existingIndex >= 0) {
          const existing = currentSorting[existingIndex];
          const newSorting = [...currentSorting];
          
          if (desc === undefined) {
            // Toggle
            newSorting[existingIndex] = { ...existing, desc: !existing.desc };
          } else if (desc === existing.desc) {
            // Remove
            newSorting.splice(existingIndex, 1);
          } else {
            // Update
            newSorting[existingIndex] = { ...existing, desc };
          }
          
          return { ...prev, sorting: newSorting };
        } else {
          // Add new sort
          return {
            ...prev,
            sorting: [...currentSorting, { id: columnId, desc: desc ?? false }],
          };
        }
      });
    },
    [table]
  );
  
  const clearSorting = useCallback(() => {
    table.setState((prev) => ({ ...prev, sorting: [] }));
  }, [table]);
  
  const isSorted = useCallback(
    (columnId: string) => sorting.some((s) => s.id === columnId),
    [sorting]
  );
  
  const getSortDirection = useCallback(
    (columnId: string): 'asc' | 'desc' | false => {
      const sort = sorting.find((s) => s.id === columnId);
      return sort ? (sort.desc ? 'desc' : 'asc') : false;
    },
    [sorting]
  );
  
  return {
    sorting,
    setSorting,
    toggleSort,
    clearSorting,
    isSorted,
    getSortDirection,
  };
}
```

---

## Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable } from '../useTable';
import { useSorting } from '../useSorting';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useSorting', () => {
  it('should toggle sort', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: sortingResult } = renderHook(() =>
      useSorting(tableResult.current.table)
    );
    
    act(() => {
      sortingResult.current.toggleSort('name');
    });
    
    expect(sortingResult.current.isSorted('name')).toBe(true);
    expect(sortingResult.current.getSortDirection('name')).toBe('asc');
  });
  
  it('should clear sorting', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: sortingResult } = renderHook(() =>
      useSorting(tableResult.current.table)
    );
    
    act(() => {
      sortingResult.current.toggleSort('name');
      sortingResult.current.clearSorting();
    });
    
    expect(sortingResult.current.sorting).toEqual([]);
  });
});
```

---

## Files to Create

- [ ] `src/hooks/useSorting.ts`
- [ ] `src/hooks/__tests__/useSorting.test.tsx`
- [ ] Update exports

---

## Success Criteria

- [ ] Sorting works
- [ ] Multi-column support
- [ ] Tests pass
