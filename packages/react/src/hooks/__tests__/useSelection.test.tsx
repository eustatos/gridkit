import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import { useSelection } from '../useSelection';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useSelection', () => {
  describe('Basic Selection', () => {
    it('should return initial empty selection', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      expect(selectionResult.current.selectedCount).toBe(0);
      expect(selectionResult.current.selectedRows).toEqual([]);
    });

    it('should select a single row', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      expect(selectionResult.current.selectedCount).toBe(0);
      
      act(() => {
        selectionResult.current.selectRow('1');
      });
      
      expect(selectionResult.current.selectedCount).toBe(1);
      expect(selectionResult.current.selectedRows).toEqual(['1']);
      expect(selectionResult.current.isRowSelected('1')).toBe(true);
    });

    it('should deselect a single row', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      // First select a row
      act(() => {
        selectionResult.current.selectRow('1');
      });
      
      expect(selectionResult.current.selectedCount).toBe(1);
      
      // Then deselect
      act(() => {
        selectionResult.current.deselectRow('1');
      });
      
      expect(selectionResult.current.selectedCount).toBe(0);
      expect(selectionResult.current.isRowSelected('1')).toBe(false);
    });

    it('should toggle row selection', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      // Toggle on
      act(() => {
        selectionResult.current.toggleRowSelection('1');
      });
      
      expect(selectionResult.current.selectedCount).toBe(1);
      expect(selectionResult.current.isRowSelected('1')).toBe(true);
      
      // Toggle off
      act(() => {
        selectionResult.current.toggleRowSelection('1');
      });
      
      expect(selectionResult.current.selectedCount).toBe(0);
      expect(selectionResult.current.isRowSelected('1')).toBe(false);
    });
  });

  describe('Multiple Selection', () => {
    it('should select multiple rows', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.selectRow('1');
        selectionResult.current.selectRow('3');
        selectionResult.current.selectRow('5');
      });
      
      expect(selectionResult.current.selectedCount).toBe(3);
      expect(selectionResult.current.selectedRows).toEqual(['1', '3', '5']);
    });

    it('should deselect multiple rows', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      // Select multiple
      act(() => {
        selectionResult.current.selectRow('1');
        selectionResult.current.selectRow('3');
        selectionResult.current.selectRow('5');
      });
      
      expect(selectionResult.current.selectedCount).toBe(3);
      
      // Deselect some
      act(() => {
        selectionResult.current.deselectRow('3');
      });
      
      expect(selectionResult.current.selectedCount).toBe(2);
      expect(selectionResult.current.selectedRows).toEqual(['1', '5']);
    });

    it('should handle deselecting non-selected row', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      // Deselect a row that's not selected
      act(() => {
        selectionResult.current.deselectRow('100');
      });
      
      expect(selectionResult.current.selectedCount).toBe(0);
    });

    it('should handle selecting same row multiple times', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.selectRow('1');
        selectionResult.current.selectRow('1');
        selectionResult.current.selectRow('1');
      });
      
      // Should still be only 1
      expect(selectionResult.current.selectedCount).toBe(1);
    });
  });

  describe('Select All', () => {
    it('should select all rows', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.selectAll();
      });
      
      expect(selectionResult.current.selectedCount).toBe(testUsers.length);
      expect(selectionResult.current.selectedRows).toHaveLength(testUsers.length);
    });

    it('should select all rows after deselecting some', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      // Select all
      act(() => {
        selectionResult.current.selectAll();
      });
      
      expect(selectionResult.current.selectedCount).toBe(testUsers.length);
      
      // Deselect one
      act(() => {
        selectionResult.current.deselectRow('1');
      });
      
      expect(selectionResult.current.selectedCount).toBe(testUsers.length - 1);
      
      // Select all again (should select everything)
      act(() => {
        selectionResult.current.selectAll();
      });
      
      expect(selectionResult.current.selectedCount).toBe(testUsers.length);
    });
  });

  describe('Clear Selection', () => {
    it('should clear all selection', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.selectRow('1');
        selectionResult.current.selectRow('3');
        selectionResult.current.selectRow('5');
      });
      
      expect(selectionResult.current.selectedCount).toBe(3);
      
      act(() => {
        selectionResult.current.clearSelection();
      });
      
      expect(selectionResult.current.selectedCount).toBe(0);
      expect(selectionResult.current.selectedRows).toEqual([]);
    });

    it('should clear selection on empty state', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.clearSelection();
      });
      
      expect(selectionResult.current.selectedCount).toBe(0);
    });
  });

  describe('Reactivity', () => {
    it('should update when rows are added', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.selectAll();
      });
      
      expect(selectionResult.current.selectedCount).toBe(5);
      
      // Add a new row
      tableResult.current.table.setState((prev) => ({
        ...prev,
        data: [
          ...prev.data,
          { id: '6', name: 'Frank', email: 'frank@example.com', age: 40, active: true },
        ],
      }));
      
      // Select all again to include new row
      act(() => {
        selectionResult.current.selectAll();
      });
      
      await waitFor(() => {
        expect(selectionResult.current.selectedCount).toBe(6);
      });
    });

    it('should update when table selection changes externally', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      // Select row via table setState
      act(() => {
        tableResult.current.table.setState((prev) => ({
          ...prev,
          rowSelection: { '1': true, '3': true },
        }));
      });
      
      await waitFor(() => {
        expect(selectionResult.current.selectedCount).toBe(2);
        expect(selectionResult.current.isRowSelected('1')).toBe(true);
        expect(selectionResult.current.isRowSelected('3')).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: [], columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.selectAll();
      });
      
      expect(selectionResult.current.selectedCount).toBe(0);
    });

    it('should handle deselecting non-existent row gracefully', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      // Try to deselect non-existent row - should not throw
      act(() => {
        selectionResult.current.deselectRow('non-existent-id');
      });
      
      expect(selectionResult.current.selectedCount).toBe(0);
    });
  });

  describe('Helper Methods', () => {
    it('should provide isRowSelected method', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      expect(selectionResult.current.isRowSelected('1')).toBe(false);
      
      act(() => {
        selectionResult.current.selectRow('1');
      });
      
      expect(selectionResult.current.isRowSelected('1')).toBe(true);
      expect(selectionResult.current.isRowSelected('2')).toBe(false);
    });

    it('should return selected row IDs as an array', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectionResult } = renderHook(() =>
        useSelection(tableResult.current.table)
      );
      
      act(() => {
        selectionResult.current.selectRow('3');
        selectionResult.current.selectRow('1');
        selectionResult.current.selectRow('5');
      });
      
      // Should contain all selected rows (order may vary)
      const selectedIds = selectionResult.current.selectedRows;
      expect(selectedIds).toHaveLength(3);
      expect(selectedIds).toContain('1');
      expect(selectedIds).toContain('3');
      expect(selectedIds).toContain('5');
    });
  });
});
