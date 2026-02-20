import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTable } from '../useTable';
import { useColumns, useAllColumns, useColumn, useColumnVisibility } from '../useColumns';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useColumns', () => {
  describe('useColumns (visible columns)', () => {
    it('should return all columns when no columns are hidden', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: columnsResult } = renderHook(() =>
        useColumns(tableResult.current.table)
      );
      
      expect(columnsResult.current).toHaveLength(testColumns.length);
    });
    
    it('should filter out hidden columns', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: columnsResult } = renderHook(() =>
        useColumns(tableResult.current.table)
      );
      
      expect(columnsResult.current).toHaveLength(testColumns.length);
      
      // Hide a column
      act(() => {
        if (tableResult.current.table) {
          tableResult.current.table.setState((prev) => ({
            ...prev,
            columnVisibility: { name: false },
          }));
        }
      });
      
      // Force re-render by using a new hook
      const { result } = renderHook(() =>
        useColumns(tableResult.current.table!)
      );
      
      expect(result.current).toHaveLength(testColumns.length - 1);
      expect(result.current.find((c) => c.id === 'name')).toBeUndefined();
    });
    
    it('should return columns in correct order', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: columnsResult } = renderHook(() =>
        useColumns(tableResult.current.table)
      );
      
      // Check that first column is 'name'
      expect(columnsResult.current[0].id).toBe('name');
      // Check that second column is 'email'
      expect(columnsResult.current[1].id).toBe('email');
    });
  });
  
  describe('useAllColumns', () => {
    it('should return all columns including hidden ones', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: allColumnsResult } = renderHook(() =>
        useAllColumns(tableResult.current.table)
      );
      
      expect(allColumnsResult.current).toHaveLength(testColumns.length);
      
      // Hide a column
      act(() => {
        if (tableResult.current.table) {
          tableResult.current.table.setState((prev) => ({
            ...prev,
            columnVisibility: { name: false },
          }));
        }
      });
      
      const { result } = renderHook(() =>
        useAllColumns(tableResult.current.table!)
      );
      
      // useAllColumns should still return all columns
      expect(result.current).toHaveLength(testColumns.length);
      expect(result.current.find((c) => c.id === 'name')).toBeDefined();
    });
  });
  
  describe('useColumn', () => {
    it('should return specific column by ID', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: columnResult } = renderHook(() =>
        useColumn(tableResult.current.table!, 'name')
      );
      
      expect(columnResult.current).toBeDefined();
      expect(columnResult.current?.id).toBe('name');
    });
    
    it('should return undefined for non-existent column', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: columnResult } = renderHook(() =>
        useColumn(tableResult.current.table!, 'non-existent')
      );
      
      expect(columnResult.current).toBeUndefined();
    });
  });
  
  describe('useColumnVisibility', () => {
    it('should return true for visible columns', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: visibilityResult } = renderHook(() =>
        useColumnVisibility(tableResult.current.table!, 'name')
      );
      
      expect(visibilityResult.current).toBe(true);
    });
    
    it('should return false for hidden columns', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      // Hide the name column
      act(() => {
        if (tableResult.current.table) {
          tableResult.current.table.setState((prev) => ({
            ...prev,
            columnVisibility: { name: false },
          }));
        }
      });
      
      const { result: visibilityResult } = renderHook(() =>
        useColumnVisibility(tableResult.current.table!, 'name')
      );
      
      expect(visibilityResult.current).toBe(false);
    });
    
    it('should return true when columnVisibility is null', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      // Set columnVisibility to null
      act(() => {
        if (tableResult.current.table) {
          tableResult.current.table.setState((prev) => ({
            ...prev,
            columnVisibility: null,
          }));
        }
      });
      
      const { result: visibilityResult } = renderHook(() =>
        useColumnVisibility(tableResult.current.table!, 'name')
      );
      
      expect(visibilityResult.current).toBe(true);
    });
  });
});
