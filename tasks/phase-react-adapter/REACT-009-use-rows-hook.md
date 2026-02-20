---
task_id: REACT-009
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useRows.ts
priority: P0
complexity: low
estimated_tokens: ~6,000
assignable_to_ai: yes
dependencies:
  - REACT-005
---

# Task: Implement useRows Hook

## Context

Create hooks for accessing table rows with reactive updates.

## Objectives

- [ ] Create useRows hook
- [ ] Support row filtering
- [ ] Handle pagination
- [ ] Provide type-safe row access

---

## Implementation

Create `src/hooks/useRows.ts`:

```typescript
import { useMemo } from 'react';
import type { Table, Row, RowData } from '@gridkit/core';
import { useTableState } from './useTableState';

export function useRows<TData extends RowData>(
  table: Table<TData>
): Row<TData>[] {
  const data = useTableState(table, (state) => state.data);
  
  return useMemo(() => {
    return table.getRowModel().rows;
  }, [table, data]);
}

export function usePaginatedRows<TData extends RowData>(
  table: Table<TData>
): Row<TData>[] {
  const pagination = useTableState(table, (state) => state.pagination);
  const rows = useRows(table);
  
  return useMemo(() => {
    if (!pagination) return rows;
    
    const { pageIndex = 0, pageSize = 10 } = pagination;
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    
    return rows.slice(start, end);
  }, [rows, pagination]);
}

export function useRow<TData extends RowData>(
  table: Table<TData>,
  rowId: string
): Row<TData> | undefined {
  const rows = useRows(table);
  
  return useMemo(
    () => rows.find((row) => row.id === rowId),
    [rows, rowId]
  );
}

export function useRowCount<TData extends RowData>(
  table: Table<TData>
): number {
  return useTableState(table, (state) => state.data.length);
}
```

---

## Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTable } from '../useTable';
import { useRows, useRowCount } from '../useRows';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useRows', () => {
  it('should return all rows', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: rowsResult } = renderHook(() =>
      useRows(tableResult.current.table)
    );
    
    expect(rowsResult.current).toHaveLength(testUsers.length);
  });
  
  it('should return row count', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: countResult } = renderHook(() =>
      useRowCount(tableResult.current.table)
    );
    
    expect(countResult.current).toBe(testUsers.length);
  });
});
```

---

## Files to Create

- [ ] `src/hooks/useRows.ts`
- [ ] `src/hooks/__tests__/useRows.test.tsx`
- [ ] Update `src/hooks/index.ts`

---

## Success Criteria

- [ ] Returns rows correctly
- [ ] Supports pagination
- [ ] Type-safe
- [ ] Tests pass
