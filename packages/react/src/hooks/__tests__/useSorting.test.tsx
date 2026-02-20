import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import { useSorting } from '../useSorting';
import { useSelection } from '../useSelection';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useSorting', () => {
  describe('Basic Sorting', () => {
    it('should return initial empty sorting', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      expect(sortingResult.current.sorting).toEqual([]);
      expect(sortingResult.current.isSorted('name')).toBe(false);
      expect(sortingResult.current.getSortDirection('name')).toBe(false);
    });

    it('should toggle sort on a column', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(1);
      expect(sortingResult.current.sorting[0].id).toBe('name');
      expect(sortingResult.current.sorting[0].desc).toBe(false);
      expect(sortingResult.current.isSorted('name')).toBe(true);
      expect(sortingResult.current.getSortDirection('name')).toBe('asc');
    });

    it('should toggle sort direction', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name');
      });
      
      expect(sortingResult.current.getSortDirection('name')).toBe('asc');
      
      // Toggle to desc
      act(() => {
        sortingResult.current.toggleSort('name');
      });
      
      expect(sortingResult.current.sorting[0].desc).toBe(true);
      expect(sortingResult.current.getSortDirection('name')).toBe('desc');
    });

    it('should remove sort when toggling same direction twice', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name', false);
      });
      
      expect(sortingResult.current.sorting).toHaveLength(1);
      
      // Toggle again with same direction should remove
      act(() => {
        sortingResult.current.toggleSort('name', false);
      });
      
      expect(sortingResult.current.sorting).toHaveLength(0);
      expect(sortingResult.current.isSorted('name')).toBe(false);
    });
  });

  describe('Multi-Column Sorting', () => {
    it('should support multiple columns in sorting', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name');
        sortingResult.current.toggleSort('age');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(2);
      expect(sortingResult.current.sorting[0].id).toBe('name');
      expect(sortingResult.current.sorting[1].id).toBe('age');
      expect(sortingResult.current.isSorted('name')).toBe(true);
      expect(sortingResult.current.isSorted('age')).toBe(true);
    });

    it('should maintain sort order when adding multiple columns', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name', false);
        sortingResult.current.toggleSort('age', true);
        sortingResult.current.toggleSort('email', true);
      });
      
      expect(sortingResult.current.sorting).toHaveLength(3);
      expect(sortingResult.current.sorting[0].id).toBe('name');
      expect(sortingResult.current.sorting[0].desc).toBe(false);
      expect(sortingResult.current.sorting[1].id).toBe('age');
      expect(sortingResult.current.sorting[1].desc).toBe(true);
      expect(sortingResult.current.sorting[2].id).toBe('email');
      expect(sortingResult.current.sorting[2].desc).toBe(true);
    });

    it('should update existing column sort while maintaining position', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name', false);
        sortingResult.current.toggleSort('age', true);
        sortingResult.current.toggleSort('name', true); // Update existing, keep position
      });
      
      expect(sortingResult.current.sorting).toHaveLength(2);
      // 'name' should still be first (updated in place), 'age' second
      expect(sortingResult.current.sorting[0].id).toBe('name');
      expect(sortingResult.current.sorting[0].desc).toBe(true);
      expect(sortingResult.current.sorting[1].id).toBe('age');
      expect(sortingResult.current.sorting[1].desc).toBe(true);
    });
  });

  describe('Clear Sorting', () => {
    it('should clear all sorting', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name');
        sortingResult.current.toggleSort('age');
        sortingResult.current.toggleSort('email');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(3);
      
      act(() => {
        sortingResult.current.clearSorting();
      });
      
      expect(sortingResult.current.sorting).toEqual([]);
      expect(sortingResult.current.isSorted('name')).toBe(false);
      expect(sortingResult.current.isSorted('age')).toBe(false);
      expect(sortingResult.current.isSorted('email')).toBe(false);
    });

    it('should clear sorting on already empty state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.clearSorting();
      });
      
      expect(sortingResult.current.sorting).toEqual([]);
    });
  });

  describe('Set Sorting Directly', () => {
    it('should set sorting state directly', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      const newSorting = [
        { id: 'name', desc: true },
        { id: 'age', desc: false },
      ];
      
      act(() => {
        sortingResult.current.setSorting(newSorting);
      });
      
      expect(sortingResult.current.sorting).toEqual(newSorting);
    });
  });

  describe('Reactivity', () => {
    it('should update when sorting changes externally', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      expect(sortingResult.current.sorting).toEqual([]);
      
      // Change sorting via table setState
      act(() => {
        tableResult.current.table.setState((prev) => ({
          ...prev,
          sorting: [{ id: 'name', desc: true }],
        }));
      });
      
      await waitFor(() => {
        expect(sortingResult.current.sorting).toHaveLength(1);
        expect(sortingResult.current.sorting[0].id).toBe('name');
        expect(sortingResult.current.sorting[0].desc).toBe(true);
      });
    });

    it('should update isSorted when sorting changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      expect(sortingResult.current.isSorted('name')).toBe(false);
      
      act(() => {
        sortingResult.current.toggleSort('name');
      });
      
      expect(sortingResult.current.isSorted('name')).toBe(true);
      
      act(() => {
        sortingResult.current.clearSorting();
      });
      
      expect(sortingResult.current.isSorted('name')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: [], columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(1);
      expect(sortingResult.current.sorting[0].id).toBe('name');
    });

    it('should handle toggling non-existent column', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('non-existent-column');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(1);
      expect(sortingResult.current.sorting[0].id).toBe('non-existent-column');
    });

    it('should handle setting empty sorting array', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      expect(sortingResult.current.sorting).toEqual([]);
      
      act(() => {
        sortingResult.current.toggleSort('name');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(1);
      
      act(() => {
        sortingResult.current.setSorting([]);
      });
      
      expect(sortingResult.current.sorting).toHaveLength(0);
    });
  });

  describe('Helper Methods', () => {
    it('should provide getSortDirection for multiple columns', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name', false);
        sortingResult.current.toggleSort('age', true);
      });
      
      expect(sortingResult.current.getSortDirection('name')).toBe('asc');
      expect(sortingResult.current.getSortDirection('age')).toBe('desc');
      expect(sortingResult.current.getSortDirection('email')).toBe(false);
    });

    it('should provide isSorted method', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      expect(sortingResult.current.isSorted('name')).toBe(false);
      expect(sortingResult.current.isSorted('age')).toBe(false);
      
      act(() => {
        sortingResult.current.toggleSort('name');
        sortingResult.current.toggleSort('age');
      });
      
      expect(sortingResult.current.isSorted('name')).toBe(true);
      expect(sortingResult.current.isSorted('age')).toBe(true);
      expect(sortingResult.current.isSorted('email')).toBe(false);
    });

    it('should return current sorting state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      expect(sortingResult.current.sorting).toEqual([]);
      
      act(() => {
        sortingResult.current.toggleSort('name', false);
      });
      
      expect(sortingResult.current.sorting).toEqual([{ id: 'name', desc: false }]);
      
      act(() => {
        sortingResult.current.toggleSort('age', true);
      });
      
      expect(sortingResult.current.sorting).toHaveLength(2);
      expect(sortingResult.current.sorting).toEqual([
        { id: 'name', desc: false },
        { id: 'age', desc: true },
      ]);
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
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(result.current.table)
      );
      
      expect(sortingResult.current.sorting).toEqual([]);
      
      act(() => {
        sortingResult.current.toggleSort('name');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(1);
    });

    it('should work with useSelection hook together', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ 
          data: testUsers, 
          columns: testColumns,
          getRowId: (row) => row.id
        })
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        sortingResult.current.toggleSort('name');
        selectionResult.current.selectRow('1');
      });
      
      expect(sortingResult.current.sorting).toHaveLength(1);
      expect(selectionResult.current.selectedCount).toBe(1);
    });
  });
});
