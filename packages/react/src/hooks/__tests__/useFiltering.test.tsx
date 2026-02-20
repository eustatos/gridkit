import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import { useFiltering } from '../useFiltering';
import { useSorting } from '../useSorting';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useFiltering', () => {
  describe('Basic Filtering', () => {
    it('should return initial empty filters', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      expect(filteringResult.current.filters).toEqual([]);
      expect(filteringResult.current.isColumnFiltered('name')).toBe(false);
      expect(filteringResult.current.getColumnFilter('name')).toBeUndefined();
    });

    it('should set column filter with default operator', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      expect(filteringResult.current.filters[0].id).toBe('name');
      expect(filteringResult.current.filters[0].value).toBe('Alice');
      expect(filteringResult.current.filters[0].operator).toBe('contains');
      expect(filteringResult.current.getColumnFilter('name')).toBe('Alice');
      expect(filteringResult.current.isColumnFiltered('name')).toBe(true);
    });

    it('should set column filter with specific operator', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice', 'equals');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      expect(filteringResult.current.filters[0].operator).toBe('equals');
    });

    it('should update existing column filter', () => {
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
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Bob');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      expect(filteringResult.current.getColumnFilter('name')).toBe('Bob');
    });

    it('should clear column filter', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      
      act(() => {
        filteringResult.current.clearColumnFilter('name');
      });
      
      expect(filteringResult.current.filters).toEqual([]);
      expect(filteringResult.current.isColumnFiltered('name')).toBe(false);
    });

    it('should clear all filters', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
        filteringResult.current.setColumnFilter('email', 'example.com');
        filteringResult.current.setColumnFilter('age', 30);
      });
      
      expect(filteringResult.current.filters).toHaveLength(3);
      
      act(() => {
        filteringResult.current.clearAllFilters();
      });
      
      expect(filteringResult.current.filters).toEqual([]);
      expect(filteringResult.current.isColumnFiltered('name')).toBe(false);
      expect(filteringResult.current.isColumnFiltered('email')).toBe(false);
      expect(filteringResult.current.isColumnFiltered('age')).toBe(false);
    });
  });

  describe('Multi-Column Filtering', () => {
    it('should support multiple column filters', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
        filteringResult.current.setColumnFilter('email', '@example.com');
        filteringResult.current.setColumnFilter('age', 30);
      });
      
      expect(filteringResult.current.filters).toHaveLength(3);
      expect(filteringResult.current.filters[0].id).toBe('name');
      expect(filteringResult.current.filters[1].id).toBe('email');
      expect(filteringResult.current.filters[2].id).toBe('age');
    });

    it('should maintain filter order', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
        filteringResult.current.setColumnFilter('email', '@example.com');
        filteringResult.current.setColumnFilter('age', 30);
      });
      
      expect(filteringResult.current.filters[0].id).toBe('name');
      expect(filteringResult.current.filters[1].id).toBe('email');
      expect(filteringResult.current.filters[2].id).toBe('age');
    });
  });

  describe('Set Filters Directly', () => {
    it('should set filters state directly', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      const newFilters = [
        { id: 'name', value: 'Alice', operator: 'equals' },
        { id: 'email', value: '@example.com', operator: 'contains' },
      ];
      
      act(() => {
        filteringResult.current.setFilters(newFilters);
      });
      
      expect(filteringResult.current.filters).toEqual(newFilters);
    });
  });

  describe('Reactivity', () => {
    it('should update when filters change externally', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      expect(filteringResult.current.filters).toEqual([]);
      
      // Change filters via table setState
      act(() => {
        tableResult.current.table.setState((prev) => ({
          ...prev,
          filtering: [{ id: 'name', value: 'Alice', operator: 'equals' }],
        }));
      });
      
      await waitFor(() => {
        expect(filteringResult.current.filters).toHaveLength(1);
        expect(filteringResult.current.filters[0].id).toBe('name');
        expect(filteringResult.current.filters[0].value).toBe('Alice');
      });
    });

    it('should update isColumnFiltered when filters change', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      expect(filteringResult.current.isColumnFiltered('name')).toBe(false);
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.isColumnFiltered('name')).toBe(true);
      
      act(() => {
        filteringResult.current.clearAllFilters();
      });
      
      expect(filteringResult.current.isColumnFiltered('name')).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should provide getColumnFilterOperator', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice', 'equals');
        filteringResult.current.setColumnFilter('email', '@example.com');
      });
      
      expect(filteringResult.current.getColumnFilterOperator('name')).toBe('equals');
      expect(filteringResult.current.getColumnFilterOperator('email')).toBe('contains');
      expect(filteringResult.current.getColumnFilterOperator('age')).toBeUndefined();
    });

    it('should provide getColumnFilter method', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
        filteringResult.current.setColumnFilter('age', 30);
      });
      
      expect(filteringResult.current.getColumnFilter('name')).toBe('Alice');
      expect(filteringResult.current.getColumnFilter('age')).toBe(30);
      expect(filteringResult.current.getColumnFilter('email')).toBeUndefined();
    });

    it('should return current filters state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      expect(filteringResult.current.filters).toEqual([]);
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      expect(filteringResult.current.filters[0]).toEqual({
        id: 'name',
        value: 'Alice',
        operator: 'contains',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: [], columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      expect(filteringResult.current.filters[0].id).toBe('name');
    });

    it('should handle setting filter on non-existent column', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('non-existent-column', 'value');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      expect(filteringResult.current.filters[0].id).toBe('non-existent-column');
    });

    it('should handle clearing non-existent column filter', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.clearColumnFilter('non-existent-column');
      });
      
      expect(filteringResult.current.filters).toEqual([]);
    });

    it('should handle setting null filter value', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      
      act(() => {
        filteringResult.current.setColumnFilter('name', null);
      });
      
      expect(filteringResult.current.filters).toHaveLength(0);
    });

    it('should handle setting undefined filter value', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      
      act(() => {
        filteringResult.current.setColumnFilter('name', undefined);
      });
      
      expect(filteringResult.current.filters).toHaveLength(0);
    });

    it('should handle setting empty string filter value', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      
      act(() => {
        filteringResult.current.setColumnFilter('name', '');
      });
      
      expect(filteringResult.current.filters).toHaveLength(0);
    });

    it('should handle setting empty filters array', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      expect(filteringResult.current.filters).toEqual([]);
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      
      act(() => {
        filteringResult.current.setFilters([]);
      });
      
      expect(filteringResult.current.filters).toHaveLength(0);
    });
  });

  describe('Integration', () => {
    it('should work with useTable hook', () => {
      const { result } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
        })
      );
      
      expect(result.current.table).toBeDefined();
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(result.current.table)
      );
      
      expect(filteringResult.current.filters).toEqual([]);
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
    });

    it('should work with useSorting hook together', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ 
          data: testUsers, 
          columns: testColumns,
        })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice');
        sortingResult.current.toggleSort('age');
      });
      
      expect(filteringResult.current.filters).toHaveLength(1);
      expect(sortingResult.current.sorting).toHaveLength(1);
    });

    it('should handle complex filter scenarios', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: filteringResult } = renderHook(() =>
        useFiltering(tableResult.current.table)
      );
      
      // Set filters
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Alice', 'equals');
        filteringResult.current.setColumnFilter('email', '@example.com');
        filteringResult.current.setColumnFilter('age', 30, 'greaterOrEqual');
      });
      
      expect(filteringResult.current.filters).toHaveLength(3);
      
      // Update one filter
      act(() => {
        filteringResult.current.setColumnFilter('name', 'Bob', 'equals');
      });
      expect(filteringResult.current.filters).toHaveLength(3);
      expect(filteringResult.current.getColumnFilter('name')).toBe('Bob');
      
      // Clear one filter
      act(() => {
        filteringResult.current.clearColumnFilter('email');
      });
      expect(filteringResult.current.filters).toHaveLength(2);
      
      // Add new filter
      act(() => {
        filteringResult.current.setColumnFilter('active', true);
      });
      expect(filteringResult.current.filters).toHaveLength(3);
    });
  });
});
