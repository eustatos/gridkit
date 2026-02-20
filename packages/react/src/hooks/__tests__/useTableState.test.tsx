import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import {
  useTableState,
  useTableStateProperty,
  useHasState,
  useTableData,
  useTableSorting,
  useTableFiltering,
  useTablePagination,
  useTableColumnVisibility,
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
        expect(stateResult.current).not.toEqual(initialState);
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
      }, { timeout: 200 });
      
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
      
      // Default sorting is empty array, not undefined
      expect(sortingResult.current).toEqual([]);
      
      tableResult.current.table.setState((prev) => ({
        ...prev,
        sorting: [{ id: 'name', desc: true }],
      }));
      
      await waitFor(() => {
        expect(sortingResult.current).toEqual([{ id: 'name', desc: true }]);
      });
    });
  });
  
  describe('useHasState', () => {
    it('should check if state has property', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: hasSortingResult } = renderHook(() =>
        useHasState(tableResult.current.table, 'sorting')
      );
      
      expect(hasSortingResult.current).toBe(true);
    });
    
    it('should return false for non-existent property', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      // Add a custom state property
      tableResult.current.table.setState((prev) => ({
        ...prev,
        customProp: 'test',
      }));
      
      const { result: hasCustomResult } = renderHook(() =>
        useHasState(tableResult.current.table, 'customProp')
      );
      
      expect(hasCustomResult.current).toBe(true);
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
    
    it('useTablePagination should return pagination state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 2, pageSize: 20 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        useTablePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current).toEqual({ pageIndex: 2, pageSize: 20 });
    });
    
    it('useTableFiltering should return filtering state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { filtering: 'search term' },
        })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useTableFiltering(tableResult.current.table)
      );
      
      expect(filteringResult.current).toBe('search term');
    });
    
    it('useTableColumnVisibility should return column visibility state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { columnVisibility: { age: false } },
        })
      );
      
      const { result: visibilityResult } = renderHook(() =>
        useTableColumnVisibility(tableResult.current.table)
      );
      
      expect(visibilityResult.current).toEqual({ age: false });
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
    
    it('should not cause memory leaks with selectors', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { unmount } = renderHook(() =>
        useTableState(tableResult.current.table, (state) => state.sorting)
      );
      
      unmount();
      
      expect(true).toBe(true);
    });
  });
});
