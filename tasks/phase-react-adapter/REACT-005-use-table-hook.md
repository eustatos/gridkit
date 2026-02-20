---
task_id: REACT-005
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useTable.ts
priority: P0
complexity: medium
estimated_tokens: ~12,000
assignable_to_ai: yes
dependencies:
  - REACT-001
  - REACT-002
  - REACT-003
  - REACT-004
guidelines:
  - .github/AI_GUIDELINES.md
  - packages/core/src/table/factory/create-table.ts
---

# Task: Implement useTable Hook

## Context

Implement the core `useTable` hook that creates and manages a GridKit table instance in React. This is the primary hook for using GridKit in React applications. It should handle table lifecycle, state synchronization, and re-render optimization.

## Guidelines Reference

Before implementing, review:
- `.github/AI_GUIDELINES.md` - React patterns
- `packages/core/src/table/factory/create-table.ts` - Table creation
- `packages/core/src/state/create-store.ts` - State management
- React hooks best practices (useMemo, useEffect, useCallback)

## Objectives

- [ ] Create useTable hook with optimal performance
- [ ] Handle table lifecycle (mount, update, unmount)
- [ ] Sync table state with React re-renders
- [ ] Implement proper cleanup
- [ ] Support debug mode
- [ ] Handle errors gracefully

---

## Implementation Requirements

### 1. Core Hook Implementation

Create `src/hooks/useTable.ts`:

```typescript
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createTable, type Table, type TableOptions, type RowData } from '@gridkit/core';
import type { UseTableOptions } from '../types';

/**
 * Core hook for creating and managing a GridKit table instance
 * 
 * @template TData - The row data type
 * @param options - Table configuration options
 * @returns Table instance with state management
 * 
 * @example
 * ```tsx
 * const { table } = useTable({
 *   data: myData,
 *   columns: myColumns,
 * });
 * 
 * // Use table.getState(), table.setState(), etc.
 * ```
 */
export function useTable<TData extends RowData>(
  options: UseTableOptions<TData>
): {
  table: Table<TData>;
  isLoading: boolean;
  error: Error | null;
} {
  const { deps = [], debug = false, ...tableOptions } = options;
  
  // Track errors
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Table instance ref (persistent across renders)
  const tableRef = useRef<Table<TData> | null>(null);
  
  // Force re-render when table state changes
  const [, forceUpdate] = useState({});
  const forceRerender = useCallback(() => {
    forceUpdate({});
  }, []);
  
  // Create table instance (only when deps change)
  const table = useMemo(() => {
    try {
      if (debug) {
        console.log('[useTable] Creating table instance', { options: tableOptions });
      }
      
      setIsLoading(true);
      setError(null);
      
      // Cleanup previous instance if exists
      if (tableRef.current) {
        if (debug) {
          console.log('[useTable] Cleaning up previous instance');
        }
        // Cleanup logic here (if core provides destroy method)
      }
      
      // Create new instance
      const newTable = createTable<TData>(tableOptions);
      tableRef.current = newTable;
      
      setIsLoading(false);
      
      return newTable;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  
  // Subscribe to table state changes
  useEffect(() => {
    if (!table) return;
    
    if (debug) {
      console.log('[useTable] Subscribing to table state changes');
    }
    
    // Subscribe to state changes to trigger re-renders
    const unsubscribe = table.subscribe(() => {
      if (debug) {
        console.log('[useTable] Table state changed, re-rendering');
      }
      forceRerender();
    });
    
    return () => {
      if (debug) {
        console.log('[useTable] Unsubscribing from table state changes');
      }
      unsubscribe();
    };
  }, [table, debug, forceRerender]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debug && tableRef.current) {
        console.log('[useTable] Component unmounting, cleaning up table');
      }
      // Cleanup table resources
      tableRef.current = null;
    };
  }, [debug]);
  
  return {
    table,
    isLoading,
    error,
  };
}
```

### 2. Export Hook

Update `src/hooks/index.ts`:

```typescript
/**
 * React hooks for GridKit
 */

export { useTable } from './useTable';
export type { UseTableOptions } from '../types';
```

### 3. Add to Main Exports

Update `src/index.ts`:

```typescript
// ... existing exports

// Hooks
export { useTable } from './hooks/useTable';
export type { UseTableOptions } from './types';
```

---

## Test Requirements

Create `src/hooks/__tests__/useTable.test.tsx`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import type { RowData, ColumnDef } from '@gridkit/core';

interface TestData extends RowData {
  id: string;
  name: string;
  age: number;
}

const testData: TestData[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
  { id: '3', name: 'Charlie', age: 35 },
];

const testColumns: ColumnDef<TestData>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'age', accessorKey: 'age', header: 'Age' },
];

describe('useTable', () => {
  describe('initialization', () => {
    it('should create table instance', () => {
      const { result } = renderHook(() =>
        useTable({
          data: testData,
          columns: testColumns,
        })
      );
      
      expect(result.current.table).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    
    it('should handle empty data', () => {
      const { result } = renderHook(() =>
        useTable({
          data: [],
          columns: testColumns,
        })
      );
      
      expect(result.current.table).toBeDefined();
      expect(result.current.table.getState().data).toEqual([]);
    });
    
    it('should handle initial state', () => {
      const { result } = renderHook(() =>
        useTable({
          data: testData,
          columns: testColumns,
          initialState: {
            sorting: [{ id: 'name', desc: false }],
          },
        })
      );
      
      const state = result.current.table.getState();
      expect(state.sorting).toEqual([{ id: 'name', desc: false }]);
    });
  });
  
  describe('re-renders', () => {
    it('should re-render when state changes', async () => {
      const { result } = renderHook(() =>
        useTable({
          data: testData,
          columns: testColumns,
        })
      );
      
      const renderCount = { count: 0 };
      const { rerender } = renderHook(() => {
        renderCount.count++;
        return result.current.table.getState();
      });
      
      const initialCount = renderCount.count;
      
      // Change state
      result.current.table.setState((prev) => ({
        ...prev,
        sorting: [{ id: 'name', desc: true }],
      }));
      
      await waitFor(() => {
        expect(renderCount.count).toBeGreaterThan(initialCount);
      });
    });
    
    it('should recreate table when deps change', () => {
      let deps = [1];
      const { result, rerender } = renderHook(
        ({ deps }) =>
          useTable({
            data: testData,
            columns: testColumns,
            deps,
          }),
        { initialProps: { deps } }
      );
      
      const firstTable = result.current.table;
      
      // Change deps
      deps = [2];
      rerender({ deps });
      
      const secondTable = result.current.table;
      expect(secondTable).not.toBe(firstTable);
    });
  });
  
  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useTable({
          data: testData,
          columns: testColumns,
        })
      );
      
      const table = result.current.table;
      expect(table).toBeDefined();
      
      unmount();
      
      // Verify cleanup happened (no errors thrown)
      expect(true).toBe(true);
    });
  });
  
  describe('error handling', () => {
    it('should handle invalid options gracefully', () => {
      // This should throw during render
      expect(() => {
        renderHook(() =>
          useTable({
            // @ts-expect-error - Testing invalid options
            data: null,
            columns: testColumns,
          })
        );
      }).toThrow();
    });
    
    it('should set error state on failure', () => {
      const { result } = renderHook(() =>
        useTable({
          // @ts-expect-error - Testing error handling
          data: 'invalid',
          columns: testColumns,
        })
      );
      
      expect(result.current.error).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('debug mode', () => {
    it('should log when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      renderHook(() =>
        useTable({
          data: testData,
          columns: testColumns,
          debug: true,
        })
      );
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls.some(call => 
        call[0].includes('[useTable]')
      )).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('performance', () => {
    it('should not recreate table on every render', () => {
      const { result, rerender } = renderHook(() =>
        useTable({
          data: testData,
          columns: testColumns,
        })
      );
      
      const firstTable = result.current.table;
      
      // Re-render without changing props
      rerender();
      
      const secondTable = result.current.table;
      expect(secondTable).toBe(firstTable);
    });
  });
});
```

---

## Edge Cases to Handle

- [ ] Null/undefined data
- [ ] Empty data array
- [ ] Invalid column definitions
- [ ] Circular dependencies in deps array
- [ ] State updates during unmount
- [ ] Multiple rapid state changes
- [ ] Large datasets (10,000+ rows)
- [ ] Memory leaks from subscriptions

---

## Performance Requirements

- Hook initialization: < 10ms for 1,000 rows
- State update re-render: < 5ms
- No unnecessary table recreation
- Proper cleanup (no memory leaks)
- Optimize with useMemo and useCallback

---

## Files to Create/Modify

- [ ] `src/hooks/useTable.ts` - Hook implementation
- [ ] `src/hooks/__tests__/useTable.test.tsx` - Tests
- [ ] `src/hooks/index.ts` - Export hook
- [ ] `src/index.ts` - Main exports

---

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] TypeScript compiles without errors
- [ ] No memory leaks detected
- [ ] Performance benchmarks met
- [ ] Debug mode works correctly
- [ ] Error handling comprehensive
- [ ] Re-renders optimized
- [ ] Cleanup happens on unmount

---

## Self-Check

- [ ] Hook follows React hooks rules
- [ ] useMemo/useCallback used correctly
- [ ] No unnecessary re-renders
- [ ] Subscriptions cleaned up
- [ ] Error boundaries work
- [ ] Debug logs helpful
- [ ] Tests cover all scenarios
- [ ] JSDoc complete

---

## Notes for AI

- Follow React hooks best practices
- Use useRef for persistent table instance
- Subscribe to table state for re-renders
- Clean up subscriptions in useEffect
- Handle errors gracefully
- Support debug mode with console.log
- Optimize with React.memo patterns
- Test with React Testing Library
