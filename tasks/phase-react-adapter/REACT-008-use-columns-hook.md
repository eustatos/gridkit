---
task_id: REACT-008
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useColumns.ts
priority: P0
complexity: low
estimated_tokens: ~6,000
assignable_to_ai: yes
dependencies:
  - REACT-005
---

# Task: Implement useColumns Hook

## Context

Create hooks for accessing and managing table columns reactively.

## Objectives

- [ ] Create useColumns hook
- [ ] Support column visibility management
- [ ] Handle column ordering
- [ ] Provide type-safe column access

---

## Implementation

Create `src/hooks/useColumns.ts`:

```typescript
import { useMemo } from 'react';
import type { Table, Column, RowData } from '@gridkit/core';
import { useTableState } from './useTableState';

export function useColumns<TData extends RowData>(
  table: Table<TData>
): Column<TData>[] {
  const columnVisibility = useTableState(
    table,
    (state) => state.columnVisibility
  );
  
  return useMemo(() => {
    return table.getAllColumns().filter((col) => {
      if (!columnVisibility) return true;
      return columnVisibility[col.id] !== false;
    });
  }, [table, columnVisibility]);
}

export function useVisibleColumns<TData extends RowData>(
  table: Table<TData>
): Column<TData>[] {
  return useColumns(table);
}

export function useAllColumns<TData extends RowData>(
  table: Table<TData>
): Column<TData>[] {
  return useMemo(() => table.getAllColumns(), [table]);
}

export function useColumn<TData extends RowData>(
  table: Table<TData>,
  columnId: string
): Column<TData> | undefined {
  return useMemo(
    () => table.getColumn(columnId),
    [table, columnId]
  );
}
```

---

## Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTable } from '../useTable';
import { useColumns, useColumn } from '../useColumns';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useColumns', () => {
  it('should return all columns', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: columnsResult } = renderHook(() =>
      useColumns(tableResult.current.table)
    );
    
    expect(columnsResult.current).toHaveLength(testColumns.length);
  });
  
  it('should filter hidden columns', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: columnsResult } = renderHook(() =>
      useColumns(tableResult.current.table)
    );
    
    // Hide a column
    tableResult.current.table.setState((prev) => ({
      ...prev,
      columnVisibility: { name: false },
    }));
    
    expect(columnsResult.current.length).toBeLessThan(testColumns.length);
  });
});
```

---

## Files to Create

- [ ] `src/hooks/useColumns.ts`
- [ ] `src/hooks/__tests__/useColumns.test.tsx`
- [ ] Update `src/hooks/index.ts`

---

## Success Criteria

- [ ] Returns visible columns
- [ ] Handles column visibility
- [ ] Type-safe
- [ ] Tests pass
