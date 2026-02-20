---
task_id: REACT-013
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/usePagination.ts
priority: P1
complexity: low
estimated_tokens: ~6,000
assignable_to_ai: yes
dependencies:
  - REACT-005
  - REACT-006
---

# Task: Implement usePagination Hook

## Context

Create hooks for managing table pagination state.

## Objectives

- [ ] Create usePagination hook
- [ ] Support page navigation
- [ ] Handle page size changes
- [ ] Provide pagination helpers

---

## Implementation

Create `src/hooks/usePagination.ts`:

```typescript
import { useCallback } from 'react';
import type { Table, RowData, PaginationState } from '@gridkit/core';
import { useTableState } from './useTableState';

export interface UsePaginationResult {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
}

export function usePagination<TData extends RowData>(
  table: Table<TData>
): UsePaginationResult {
  const pagination = useTableState(
    table,
    (state) => state.pagination || { pageIndex: 0, pageSize: 10 }
  );
  
  const rowCount = useTableState(table, (state) => state.data.length);
  
  const { pageIndex, pageSize } = pagination;
  const pageCount = Math.ceil(rowCount / pageSize);
  
  const setPageIndex = useCallback(
    (index: number) => {
      table.setState((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          pageIndex: Math.max(0, Math.min(index, pageCount - 1)),
          pageSize: prev.pagination?.pageSize || 10,
        },
      }));
    },
    [table, pageCount]
  );
  
  const setPageSize = useCallback(
    (size: number) => {
      table.setState((prev) => ({
        ...prev,
        pagination: {
          pageIndex: 0,
          pageSize: size,
        },
      }));
    },
    [table]
  );
  
  const nextPage = useCallback(() => {
    setPageIndex(pageIndex + 1);
  }, [setPageIndex, pageIndex]);
  
  const previousPage = useCallback(() => {
    setPageIndex(pageIndex - 1);
  }, [setPageIndex, pageIndex]);
  
  const firstPage = useCallback(() => {
    setPageIndex(0);
  }, [setPageIndex]);
  
  const lastPage = useCallback(() => {
    setPageIndex(pageCount - 1);
  }, [setPageIndex, pageCount]);
  
  return {
    pageIndex,
    pageSize,
    pageCount,
    canPreviousPage: pageIndex > 0,
    canNextPage: pageIndex < pageCount - 1,
    setPageIndex,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
  };
}
```

---

## Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable } from '../useTable';
import { usePagination } from '../usePagination';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('usePagination', () => {
  it('should navigate pages', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({
        data: testUsers,
        columns: testColumns,
        initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
      })
    );
    
    const { result: paginationResult } = renderHook(() =>
      usePagination(tableResult.current.table)
    );
    
    expect(paginationResult.current.pageIndex).toBe(0);
    expect(paginationResult.current.canNextPage).toBe(true);
    
    act(() => {
      paginationResult.current.nextPage();
    });
    
    expect(paginationResult.current.pageIndex).toBe(1);
  });
  
  it('should change page size', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: paginationResult } = renderHook(() =>
      usePagination(tableResult.current.table)
    );
    
    act(() => {
      paginationResult.current.setPageSize(5);
    });
    
    expect(paginationResult.current.pageSize).toBe(5);
    expect(paginationResult.current.pageIndex).toBe(0);
  });
});
```

---

## Files to Create

- [ ] `src/hooks/usePagination.ts`
- [ ] `src/hooks/__tests__/usePagination.test.tsx`
- [ ] Update exports

---

## Success Criteria

- [ ] Pagination works
- [ ] Page navigation works
- [ ] Page size changes work
- [ ] Tests pass
