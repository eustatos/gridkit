---
task_id: REACT-010
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useSelection.ts
priority: P1
complexity: medium
estimated_tokens: ~7,000
assignable_to_ai: yes
dependencies:
  - REACT-005
  - REACT-006
---

# Task: Implement useSelection Hook

## Context

Create hooks for managing row selection state in a React-friendly way.

## Objectives

- [ ] Create useSelection hook
- [ ] Support single and multiple selection
- [ ] Handle selection state updates
- [ ] Provide selection helpers

---

## Implementation

Create `src/hooks/useSelection.ts`:

```typescript
import { useCallback } from 'react';
import type { Table, RowData } from '@gridkit/core';
import { useTableState } from './useTableState';

export interface UseSelectionResult<TData extends RowData> {
  selectedRows: string[];
  isRowSelected: (rowId: string) => boolean;
  toggleRowSelection: (rowId: string) => void;
  selectRow: (rowId: string) => void;
  deselectRow: (rowId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectedCount: number;
}

export function useSelection<TData extends RowData>(
  table: Table<TData>
): UseSelectionResult<TData> {
  const rowSelection = useTableState(table, (state) => state.rowSelection || {});
  
  const selectedRows = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  );
  
  const isRowSelected = useCallback(
    (rowId: string) => !!rowSelection[rowId],
    [rowSelection]
  );
  
  const toggleRowSelection = useCallback(
    (rowId: string) => {
      table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...prev.rowSelection,
          [rowId]: !prev.rowSelection?.[rowId],
        },
      }));
    },
    [table]
  );
  
  const selectRow = useCallback(
    (rowId: string) => {
      table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...prev.rowSelection,
          [rowId]: true,
        },
      }));
    },
    [table]
  );
  
  const deselectRow = useCallback(
    (rowId: string) => {
      table.setState((prev) => {
        const newSelection = { ...prev.rowSelection };
        delete newSelection[rowId];
        return { ...prev, rowSelection: newSelection };
      });
    },
    [table]
  );
  
  const selectAll = useCallback(() => {
    const allRows = table.getRowModel().rows;
    const newSelection: Record<string, boolean> = {};
    allRows.forEach((row) => {
      newSelection[row.id] = true;
    });
    table.setState((prev) => ({
      ...prev,
      rowSelection: newSelection,
    }));
  }, [table]);
  
  const clearSelection = useCallback(() => {
    table.setState((prev) => ({
      ...prev,
      rowSelection: {},
    }));
  }, [table]);
  
  return {
    selectedRows,
    isRowSelected,
    toggleRowSelection,
    selectRow,
    deselectRow,
    selectAll,
    clearSelection,
    selectedCount: selectedRows.length,
  };
}
```

---

## Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable } from '../useTable';
import { useSelection } from '../useSelection';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useSelection', () => {
  it('should select and deselect rows', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: selectionResult } = renderHook(() =>
      useSelection(tableResult.current.table)
    );
    
    expect(selectionResult.current.selectedCount).toBe(0);
    
    act(() => {
      selectionResult.current.selectRow('1');
    });
    
    expect(selectionResult.current.selectedCount).toBe(1);
    expect(selectionResult.current.isRowSelected('1')).toBe(true);
  });
  
  it('should select all rows', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: selectionResult } = renderHook(() =>
      useSelection(tableResult.current.table)
    );
    
    act(() => {
      selectionResult.current.selectAll();
    });
    
    expect(selectionResult.current.selectedCount).toBe(testUsers.length);
  });
  
  it('should clear selection', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const { result: selectionResult } = renderHook(() =>
      useSelection(tableResult.current.table)
    );
    
    act(() => {
      selectionResult.current.selectAll();
      selectionResult.current.clearSelection();
    });
    
    expect(selectionResult.current.selectedCount).toBe(0);
  });
});
```

---

## Files to Create

- [ ] `src/hooks/useSelection.ts`
- [ ] `src/hooks/__tests__/useSelection.test.tsx`
- [ ] Update exports

---

## Success Criteria

- [ ] Selection works
- [ ] Select all works
- [ ] Clear selection works
- [ ] Tests pass
