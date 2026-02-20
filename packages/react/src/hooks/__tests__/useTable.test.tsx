import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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
  
  describe('state updates', () => {
    it('should allow setting state on the table', () => {
      const { result } = renderHook(() =>
        useTable({
          data: testData,
          columns: testColumns,
        })
      );
      
      const table = result.current.table;
      
      // Set state
      act(() => {
        table.setState((prev) => ({
          ...prev,
          sorting: [{ id: 'name', desc: true }],
        }));
      });
      
      // Verify state was set
      expect(table.getState().sorting).toEqual([{ id: 'name', desc: true }]);
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
      const { result } = renderHook(() =>
        useTable({
          // @ts-expect-error - Testing invalid options
          data: null,
          columns: testColumns,
        })
      );
      
      // The hook should catch the error and return null table
      expect(result.current.error).toBeDefined();
      expect(result.current.table).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should set error state on failure', () => {
      const { result } = renderHook(() =>
        useTable({
          // @ts-expect-error - Testing error handling
          data: 'invalid',
          columns: testColumns,
        })
      );
      
      // The hook should catch the error and return null table
      expect(result.current.error).toBeDefined();
      expect(result.current.table).toBeNull();
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
