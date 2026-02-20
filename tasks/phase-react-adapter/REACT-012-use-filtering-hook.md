---
task_id: REACT-012
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useFiltering.ts
priority: P1
complexity: low
estimated_tokens: ~6,000
assignable_to_ai: yes
dependencies:
  - REACT-005
  - REACT-006
---

# Task: Implement useFiltering Hook

## Context

Create hooks for managing table filtering state.

## Objectives

- [ ] Create useFiltering hook
- [ ] Support column-level filters
- [ ] Handle global search
- [ ] Provide filtering helpers

---

## Implementation

Create `src/hooks/useFiltering.ts`:

```typescript
import { useCallback } from 'react';
import type { Table, RowData, FilteringState } from '@gridkit/core';
import { useTableState } from './useTableState';

export interface UseFilteringResult {
  filters: FilteringState;
  setFilters: (filters: FilteringState) => void;
  setColumnFilter: (columnId: string, value: any) => void;
  clearColumnFilter: (columnId: string) => void;
  clearAllFilters: () => void;
  getColumnFilter: (columnId: string) => any;
}

export function useFiltering<TData extends RowData>(
  table: Table<TData>
): UseFilteringResult {
  const filters = useTableState(table, (state) => state.filtering || []);
  
  const setFilters = useCallback(
    (newFilters: FilteringState) => {
      table.setState((prev) => ({
        ...prev,
        filtering: newFilters,
      }));
    },
    [table]
  );
  
  const setColumnFilter = useCallback(
    (columnId: string, value: any) => {
      table.setState((prev) => {
        const currentFilters = prev.filtering || [];
        const existingIndex = currentFilters.findIndex((f) => f.id === columnId);
        
        if (value == null || value === '') {
          // Remove filter
          const newFilters = currentFilters.filter((f) => f.id !== columnId);
          return { ...prev, filtering: newFilters };
        }
        
        if (existingIndex >= 0) {
          // Update existing filter
          const newFilters = [...currentFilters];
          newFilters[existingIndex] = {
            ...newFilters[existingIndex],
            value,
          };
          return { ...prev, filtering: newFilters };
        } else {
          // Add new filter
          return {
            ...prev,
            filtering: [
              ...currentFilters,
              { id: columnId, value, operator: 'contains' },
            ],
          };
        }
      });
    },
    [table]
  );
  
  const clearColumnFilter = useCallback(
    (columnId: string) => {
      setColumnFilter(columnId, undefined);
    },
    [setColumnFilter]
  );
  
  const clearAllFilters = useCallback(() => {
    table.setState((prev) => ({ ...prev, filtering: [] }));
  }, [table]);
  
  const getColumnFilter = useCallback(
    (columnId: string) => {
      const filter = filters.find((f) => f.id === columnId);
      return filter?.value;
    },
    [filters]
  );
  
  return {
    filters,
    setFilters,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    getColumnFilter,
  };
}
```

---

## Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable } from '../useTable';
import { useFiltering } from '../useFiltering';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useFiltering', () => {
  it('should set column filter', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: filteringResult } = renderHook(() =>
      useFiltering(tableResult.current.table)
    );
    
    act(() => {
      filteringResult.current.setColumnFilter('name', 'Alice');
    });
    
    expect(filteringResult.current.getColumnFilter('name')).toBe('Alice');
  });
  
  it('should clear filters', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: filteringResult } = renderHook(() =>
      useFiltering(tableResult.current.table)
    );
    
    act(() => {
      filteringResult.current.setColumnFilter('name', 'Alice');
      filteringResult.current.clearAllFilters();
    });
    
    expect(filteringResult.current.filters).toEqual([]);
  });
});
```

---

## Files to Create

- [ ] `src/hooks/useFiltering.ts`
- [ ] `src/hooks/__tests__/useFiltering.test.tsx`
- [ ] Update exports

---

## Success Criteria

- [ ] Filtering works
- [ ] Column filters work
- [ ] Clear filters works
- [ ] Tests pass
