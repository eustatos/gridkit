---
task_id: REACT-006
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useTableState.ts
priority: P0
complexity: low
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies:
  - REACT-005
guidelines:
  - .github/AI_GUIDELINES.md
---

# Task: Implement useTableState Hook

## Context

Create a hook that provides reactive access to table state with automatic re-renders when state changes. This hook simplifies accessing specific parts of table state without subscribing to the entire table.

## Objectives

- [ ] Create useTableState hook for reactive state access
- [ ] Support state selectors for optimization
- [ ] Handle state updates efficiently
- [ ] Provide TypeScript type inference
- [ ] Minimize unnecessary re-renders

---

## Implementation Requirements

### 1. Core Hook Implementation

Create `src/hooks/useTableState.ts`:

```typescript
import { useSyncExternalStore } from 'react';
import type { Table, TableState, RowData } from '@gridkit/core';

/**
 * Selector function type for extracting specific state
 */
export type StateSelector<TData extends RowData, TSelected = any> = (
  state: TableState<TData>
) => TSelected;

/**
 * Hook to subscribe to table state with optional selector
 * 
 * @template TData - Row data type
 * @template TSelected - Selected state type
 * @param table - Table instance
 * @param selector - Optional selector function for specific state
 * @returns Selected state or full state
 * 
 * @example
 * ```tsx
 * // Get full state
 * const state = useTableState(table);
 * 
 * // Get specific state with selector
 * const sorting = useTableState(table, state => state.sorting);
 * const rowCount = useTableState(table, state => state.data.length);
 * ```
 */
export function useTableState<TData extends RowData, TSelected = TableState<TData>>(
  table: Table<TData>,
  selector?: StateSelector<TData, TSelected>
): TSelected {
  return useSyncExternalStore(
    // Subscribe to changes
    (callback) => {
      return table.subscribe(callback);
    },
    
    // Get current state
    () => {
      const state = table.getState();
      return selector ? selector(state) : (state as unknown as TSelected);
    },
    
    // Get server snapshot (same as client for now)
    () => {
      const state = table.getState();
      return selector ? selector(state) : (state as unknown as TSelected);
    }
  );
}

/**
 * Hook to get specific state property
 * 
 * @example
 * ```tsx
 * const data = useTableStateProperty(table, 'data');
 * const sorting = useTableStateProperty(table, 'sorting');
 * ```
 */
export function useTableStateProperty<
  TData extends RowData,
  TKey extends keyof TableState<TData>
>(
  table: Table<TData>,
  key: TKey
): TableState<TData>[TKey] {
  return useTableState(table, (state) => state[key]);
}

/**
 * Hook to check if state has a specific property
 */
export function useHasState<TData extends RowData>(
  table: Table<TData>,
  key: keyof TableState<TData>
): boolean {
  return useTableState(table, (state) => key in state && state[key] !== undefined);
}
```

### 2. Add Convenience Hooks

Update `src/hooks/useTableState.ts` to include:

```typescript
/**
 * Hook to get table data
 */
export function useTableData<TData extends RowData>(
  table: Table<TData>
): TData[] {
  return useTableStateProperty(table, 'data');
}

/**
 * Hook to get sorting state
 */
export function useTableSorting<TData extends RowData>(
  table: Table<TData>
) {
  return useTableStateProperty(table, 'sorting');
}

/**
 * Hook to get filtering state
 */
export function useTableFiltering<TData extends RowData>(
  table: Table<TData>
) {
  return useTableStateProperty(table, 'filtering');
}

/**
 * Hook to get pagination state
 */
export function useTablePagination<TData extends RowData>(
  table: Table<TData>
) {
  return useTableStateProperty(table, 'pagination');
}

/**
 * Hook to get column visibility state
 */
export function useTableColumnVisibility<TData extends RowData>(
  table: Table<TData>
) {
  return useTableStateProperty(table, 'columnVisibility');
}
```

### 3. Export Hooks

Update `src/hooks/index.ts`:

```typescript
export { useTable } from './useTable';
export {
  useTableState,
  useTableStateProperty,
  useHasState,
  useTableData,
  useTableSorting,
  useTableFiltering,
  useTablePagination,
  useTableColumnVisibility,
} from './useTableState';

export type { StateSelector } from './useTableState';
```

### 4. Update Main Exports

Update `src/index.ts`:

```typescript
// ... existing exports

export {
  useTableState,
  useTableStateProperty,
  useTableData,
  useTableSorting,
  useTableFiltering,
  useTablePagination,
  useTableColumnVisibility,
} from './hooks/useTableState';

export type { StateSelector } from './hooks/useTableState';
```

---

## Test Requirements

Create `src/hooks/__tests__/useTableState.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import {
  useTableState,
  useTableStateProperty,
  useTableData,
  useTableSorting,
} from '../useTableState';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useTableState', () => {
  describe('full state subscription', () => {
    it('should return current state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: stateResult } = renderHook(() =>
        useTableState(tableResult.current.table)
      );
      
      expect(stateResult.current).toBeDefined();
      expect(stateResult.current.data).toEqual(testUsers);
    });
    
    it('should update when state changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: stateResult } = renderHook(() =>
        useTableState(tableResult.current.table)
      );
      
      const initialState = stateResult.current;
      
      // Update state
      tableResult.current.table.setState((prev) => ({
        ...prev,
        sorting: [{ id: 'name', desc: false }],
      }));
      
      await waitFor(() => {
        expect(stateResult.current).not.toBe(initialState);
        expect(stateResult.current.sorting).toEqual([{ id: 'name', desc: false }]);
      });
    });
  });
  
  describe('state selectors', () => {
    it('should select specific state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: {
            sorting: [{ id: 'name', desc: true }],
          },
        })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useTableState(tableResult.current.table, (state) => state.sorting)
      );
      
      expect(sortingResult.current).toEqual([{ id: 'name', desc: true }]);
    });
    
    it('should only re-render when selected state changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      let renderCount = 0;
      const { result: sortingResult } = renderHook(() => {
        renderCount++;
        return useTableState(tableResult.current.table, (state) => state.sorting);
      });
      
      const initialCount = renderCount;
      
      // Change unrelated state (shouldn't trigger re-render)
      tableResult.current.table.setState((prev) => ({
        ...prev,
        pagination: { pageIndex: 1, pageSize: 10 },
      }));
      
      await waitFor(() => {
        // Should not re-render because sorting didn't change
        expect(renderCount).toBe(initialCount);
      }, { timeout: 100 });
      
      // Change sorting (should trigger re-render)
      tableResult.current.table.setState((prev) => ({
        ...prev,
        sorting: [{ id: 'name', desc: false }],
      }));
      
      await waitFor(() => {
        expect(renderCount).toBeGreaterThan(initialCount);
      });
    });
  });
  
  describe('useTableStateProperty', () => {
    it('should get specific property', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: dataResult } = renderHook(() =>
        useTableStateProperty(tableResult.current.table, 'data')
      );
      
      expect(dataResult.current).toEqual(testUsers);
    });
    
    it('should update when property changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useTableStateProperty(tableResult.current.table, 'sorting')
      );
      
      expect(sortingResult.current).toBeUndefined();
      
      tableResult.current.table.setState((prev) => ({
        ...prev,
        sorting: [{ id: 'name', desc: true }],
      }));
      
      await waitFor(() => {
        expect(sortingResult.current).toEqual([{ id: 'name', desc: true }]);
      });
    });
  });
  
  describe('convenience hooks', () => {
    it('useTableData should return data', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: dataResult } = renderHook(() =>
        useTableData(tableResult.current.table)
      );
      
      expect(dataResult.current).toEqual(testUsers);
    });
    
    it('useTableSorting should return sorting state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { sorting: [{ id: 'age', desc: true }] },
        })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useTableSorting(tableResult.current.table)
      );
      
      expect(sortingResult.current).toEqual([{ id: 'age', desc: true }]);
    });
  });
  
  describe('performance', () => {
    it('should not cause memory leaks', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { unmount } = renderHook(() =>
        useTableState(tableResult.current.table)
      );
      
      unmount();
      
      // Should not throw or leak
      expect(true).toBe(true);
    });
  });
});
```

---

## Edge Cases to Handle

- [ ] Undefined state properties
- [ ] Null selectors
- [ ] Rapid state updates
- [ ] Component unmount during state update
- [ ] Selector returning same reference
- [ ] Deep equality for complex selectors

---

## Performance Requirements

- Selector evaluation: < 1ms
- Re-render only when selected state changes
- No memory leaks from subscriptions
- Efficient shallow comparison

---

## Files to Create/Modify

- [ ] `src/hooks/useTableState.ts` - Implementation
- [ ] `src/hooks/__tests__/useTableState.test.tsx` - Tests
- [ ] `src/hooks/index.ts` - Exports
- [ ] `src/index.ts` - Main exports

---

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] Selector optimization works
- [ ] No unnecessary re-renders
- [ ] TypeScript inference correct
- [ ] Convenience hooks work
- [ ] Memory efficient
- [ ] useSyncExternalStore used correctly

---

## Self-Check

- [ ] useSyncExternalStore used (React 18)
- [ ] Selectors properly memoized
- [ ] All state properties accessible
- [ ] Convenience hooks exported
- [ ] Tests cover edge cases
- [ ] No memory leaks
- [ ] TypeScript types correct

---

## Notes for AI

- Use useSyncExternalStore for state subscription
- Selectors optimize re-renders
- Support both full state and partial state
- Provide convenience hooks for common cases
- Ensure TypeScript type inference works
- Test performance with selectors
- Handle edge cases gracefully
