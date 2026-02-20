import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import { usePagination } from '../usePagination';
import { useSorting } from '../useSorting';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('usePagination', () => {
  describe('Basic Pagination', () => {
    it('should return initial pagination state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(0);
      expect(paginationResult.current.pageSize).toBe(10);
      expect(paginationResult.current.pageCount).toBe(1);
    });

    it('should handle initial pagination state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: {
            pagination: { pageIndex: 1, pageSize: 2 },
          },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(1);
      expect(paginationResult.current.pageSize).toBe(2);
      expect(paginationResult.current.pageCount).toBe(3);
    });
  });

  describe('Page Navigation', () => {
    it('should navigate to next page', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(0);
      expect(paginationResult.current.canNextPage).toBe(true);
      expect(paginationResult.current.canPreviousPage).toBe(false);
      
      act(() => {
        paginationResult.current.nextPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(1);
      expect(paginationResult.current.canNextPage).toBe(true);
      expect(paginationResult.current.canPreviousPage).toBe(true);
    });

    it('should navigate to previous page', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 2, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(2);
      
      act(() => {
        paginationResult.current.previousPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(1);
    });

    it('should navigate to first page', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 2, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(2);
      
      act(() => {
        paginationResult.current.firstPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(0);
    });

    it('should navigate to last page', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(0);
      
      act(() => {
        paginationResult.current.lastPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(2);
    });

    it('should prevent navigation beyond bounds', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      // Try to go previous from first page
      act(() => {
        paginationResult.current.previousPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(0);
      expect(paginationResult.current.canPreviousPage).toBe(false);
      
      // Navigate to last page
      act(() => {
        paginationResult.current.lastPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(2);
      
      // Try to go next from last page
      act(() => {
        paginationResult.current.nextPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(2);
      expect(paginationResult.current.canNextPage).toBe(false);
    });
  });

  describe('Page Size Changes', () => {
    it('should change page size and reset to first page', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 2, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(2);
      expect(paginationResult.current.pageSize).toBe(2);
      expect(paginationResult.current.pageCount).toBe(3);
      
      act(() => {
        paginationResult.current.setPageSize(5);
      });
      
      expect(paginationResult.current.pageSize).toBe(5);
      expect(paginationResult.current.pageIndex).toBe(0);
      expect(paginationResult.current.pageCount).toBe(1);
    });

    it('should update page count when page size changes', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageCount).toBe(3);
      
      act(() => {
        paginationResult.current.setPageSize(1);
      });
      
      expect(paginationResult.current.pageCount).toBe(5);
      
      act(() => {
        paginationResult.current.setPageSize(10);
      });
      
      expect(paginationResult.current.pageCount).toBe(1);
    });
  });

  describe('Set Page Index', () => {
    it('should set page index directly', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      act(() => {
        paginationResult.current.setPageIndex(2);
      });
      
      expect(paginationResult.current.pageIndex).toBe(2);
    });

    it('should clamp page index to valid range', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      // Try to set negative page index
      act(() => {
        paginationResult.current.setPageIndex(-5);
      });
      
      expect(paginationResult.current.pageIndex).toBe(0);
      
      // Try to set page index beyond last page
      act(() => {
        paginationResult.current.setPageIndex(100);
      });
      
      expect(paginationResult.current.pageIndex).toBe(2);
    });
  });

  describe('Reactivity', () => {
    it('should update when pagination changes externally', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(0);
      
      // Change pagination via table setState
      act(() => {
        tableResult.current.table.setState((prev) => ({
          ...prev,
          pagination: {
            pageIndex: 1,
            pageSize: 2,
          },
        }));
      });
      
      await waitFor(() => {
        expect(paginationResult.current.pageIndex).toBe(1);
      });
    });

    it('should update canNextPage and canPreviousPage when pageIndex changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      // Initial state: pageIndex 0, 5 items, page size 2 = 3 pages (0, 1, 2)
      // canPreviousPage = 0 > 0 = false
      // canNextPage = 0 < 2 = true
      expect(paginationResult.current.canPreviousPage).toBe(false);
      expect(paginationResult.current.canNextPage).toBe(true);
      
      act(() => {
        paginationResult.current.firstPage();
      });
      
      // Still at pageIndex 0
      expect(paginationResult.current.canPreviousPage).toBe(false);
      expect(paginationResult.current.canNextPage).toBe(true);
      
      act(() => {
        paginationResult.current.lastPage();
      });
      
      // Now at pageIndex 2 (last page)
      // canPreviousPage = 2 > 0 = true
      // canNextPage = 2 < 2 = false
      expect(paginationResult.current.canPreviousPage).toBe(true);
      expect(paginationResult.current.canNextPage).toBe(false);
    });

    it('should update when data changes via table setState', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers.slice(0, 3), // 3 items
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      // 3 items with page size 2 = 2 pages
      expect(paginationResult.current.pageCount).toBe(2);
      
      // Add more data via table setState
      act(() => {
        tableResult.current.table.setState((prev) => ({
          ...prev,
          data: testUsers, // 5 items
        }));
      });
      
      await waitFor(() => {
        expect(paginationResult.current.pageCount).toBe(3);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: [],
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageCount).toBe(0);
      expect(paginationResult.current.pageIndex).toBe(0);
      expect(paginationResult.current.canPreviousPage).toBe(false);
      expect(paginationResult.current.canNextPage).toBe(false);
    });

    it('should handle zero page size gracefully', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 0 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      // With zero page size, pageCount should be Infinity or a large number
      expect(paginationResult.current.pageCount).toBeGreaterThan(0);
    });

    it('should handle undefined pagination state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(0);
      expect(paginationResult.current.pageSize).toBe(10);
    });
  });

  describe('Integration', () => {
    it('should work with useTable hook', () => {
      const { result } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
        })
      );
      
      expect(result.current.table).toBeDefined();
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(result.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(0);
      expect(paginationResult.current.pageSize).toBe(2);
      
      act(() => {
        paginationResult.current.nextPage();
      });
      
      expect(paginationResult.current.pageIndex).toBe(1);
    });

    it('should work with other hooks together', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: {
            pagination: { pageIndex: 0, pageSize: 2 },
            sorting: [{ id: 'name', desc: false }],
          },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      const { result: sortingResult } = renderHook(() =>
        useSorting(tableResult.current.table)
      );
      
      act(() => {
        paginationResult.current.nextPage();
        sortingResult.current.toggleSort('age', true);
      });
      
      expect(paginationResult.current.pageIndex).toBe(1);
      expect(sortingResult.current.sorting).toEqual([
        { id: 'name', desc: false },
        { id: 'age', desc: true },
      ]);
    });
  });

  describe('Helper Methods', () => {
    it('should provide all navigation methods', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 1, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      // Check all methods exist
      expect(paginationResult.current.setPageIndex).toBeInstanceOf(Function);
      expect(paginationResult.current.setPageSize).toBeInstanceOf(Function);
      expect(paginationResult.current.nextPage).toBeInstanceOf(Function);
      expect(paginationResult.current.previousPage).toBeInstanceOf(Function);
      expect(paginationResult.current.firstPage).toBeInstanceOf(Function);
      expect(paginationResult.current.lastPage).toBeInstanceOf(Function);
    });

    it('should return accurate pagination info', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          initialState: { pagination: { pageIndex: 1, pageSize: 2 } },
        })
      );
      
      const { result: paginationResult } = renderHook(() =>
        usePagination(tableResult.current.table)
      );
      
      expect(paginationResult.current.pageIndex).toBe(1);
      expect(paginationResult.current.pageSize).toBe(2);
      expect(paginationResult.current.pageCount).toBe(3);
      expect(paginationResult.current.canPreviousPage).toBe(true);
      expect(paginationResult.current.canNextPage).toBe(true);
    });
  });
});
