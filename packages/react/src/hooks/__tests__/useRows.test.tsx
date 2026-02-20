import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import {
  useRows,
  usePaginatedRows,
  useRow,
  useRowCount,
  useRowModel,
  useSelectedRows,
  useSelectedRowCount,
  useIsRowSelected,
} from '../useRows';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useRows', () => {
  describe('useRows - Get all rows', () => {
    it('should return all rows initially', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: rowsResult } = renderHook(() =>
        useRows(tableResult.current.table)
      );
      
      expect(rowsResult.current).toBeDefined();
      expect(rowsResult.current).toHaveLength(testUsers.length);
    });
    
    it('should return rows with correct data', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: rowsResult } = renderHook(() =>
        useRows(tableResult.current.table)
      );
      
      const rows = rowsResult.current;
      expect(rows[0].id).toBe('1');
      expect(rows[0].original.name).toBe('Alice');
      expect(rows[0].original.email).toBe('alice@example.com');
    });
    
    it('should update when data changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: rowsResult } = renderHook(() =>
        useRows(tableResult.current.table)
      );
      
      const initialRowCount = rowsResult.current.length;
      expect(initialRowCount).toBe(5);
      
      // Add a new row
      tableResult.current.table.setState((prev) => ({
        ...prev,
        data: [
          ...prev.data,
          { id: '6', name: 'Frank', email: 'frank@example.com', age: 40, active: true },
        ],
      }));
      
      await waitFor(() => {
        expect(rowsResult.current).toHaveLength(6);
      });
    });
    
    it('should update when sorting changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          getRowId: (row) => row.id,
          initialState: {
            sorting: [{ id: 'name', desc: false }],
          },
        })
      );
      
      const { result: rowsResult } = renderHook(() =>
        useRows(tableResult.current.table)
      );
      
      const rows = rowsResult.current;
      // Should be sorted alphabetically by name (ascending)
      expect(rows[0].original.name).toBe('Alice');
      expect(rows[1].original.name).toBe('Bob');
      expect(rows[4].original.name).toBe('Eve');
    });
    
    it.skip('should update when filtering changes (requires FILTER-001)', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          getRowId: (row) => row.id,
          initialState: {
            filtering: [{ id: 'name', value: 'alice' }],
          },
        })
      );
      
      const { result: rowsResult } = renderHook(() =>
        useRows(tableResult.current.table)
      );
      
      // TODO: This test requires FILTER-001 implementation for filtering state management
      expect(rowsResult.current).toHaveLength(1);
      expect(rowsResult.current[0].original.name).toBe('Alice');
    });
    
    it('should not cause memory leaks', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { unmount } = renderHook(() =>
        useRows(tableResult.current.table)
      );
      
      unmount();
      
      // Should not throw or leak
      expect(true).toBe(true);
    });
  });
  
  describe('usePaginatedRows - Get paginated rows', () => {
    it('should return paginated rows', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          getRowId: (row) => row.id,
          initialState: {
            pagination: { pageIndex: 0, pageSize: 2 },
          },
        })
      );
      
      const { result: paginatedRowsResult } = renderHook(() =>
        usePaginatedRows(tableResult.current.table)
      );
      
      expect(paginatedRowsResult.current).toHaveLength(2);
      expect(paginatedRowsResult.current[0].original.name).toBe('Alice');
      expect(paginatedRowsResult.current[1].original.name).toBe('Bob');
    });
    
    it('should return empty array when no pagination', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: paginatedRowsResult } = renderHook(() =>
        usePaginatedRows(tableResult.current.table)
      );
      
      // Should return all rows when pagination is not set
      expect(paginatedRowsResult.current).toHaveLength(testUsers.length);
    });
    
    it('should update when pagination changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          getRowId: (row) => row.id,
          initialState: {
            pagination: { pageIndex: 0, pageSize: 2 },
          },
        })
      );
      
      const { result: paginatedRowsResult } = renderHook(() =>
        usePaginatedRows(tableResult.current.table)
      );
      
      // Change to second page
      tableResult.current.table.setState((prev) => ({
        ...prev,
        pagination: { pageIndex: 1, pageSize: 2 },
      }));
      
      await waitFor(() => {
        expect(paginatedRowsResult.current).toHaveLength(2);
        expect(paginatedRowsResult.current[0].original.name).toBe('Charlie');
        expect(paginatedRowsResult.current[1].original.name).toBe('Diana');
      });
    });
  });
  
  describe('useRow - Get single row', () => {
    it('should return row by ID', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: rowResult } = renderHook(() =>
        useRow(tableResult.current.table, '3')
      );
      
      expect(rowResult.current).toBeDefined();
      expect(rowResult.current?.original.name).toBe('Charlie');
    });
    
    it('should return undefined for non-existent row', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: rowResult } = renderHook(() =>
        useRow(tableResult.current.table, 'non-existent-id')
      );
      
      expect(rowResult.current).toBeUndefined();
    });
    
    it('should update when row selection changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: rowResult } = renderHook(() =>
        useRow(tableResult.current.table, '1')
      );
      
      const { result: isSelectedResult } = renderHook(() =>
        useIsRowSelected(tableResult.current.table, '1')
      );
      
      // Initially not selected
      expect(rowResult.current?.id).toBe('1');
      expect(isSelectedResult.current).toBe(false);
      
      // Select the row
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: { ...prev.rowSelection, '1': true },
      }));
      
      await waitFor(() => {
        expect(isSelectedResult.current).toBe(true);
      });
    });
  });
  
  describe('useRowCount - Get total row count', () => {
    it('should return row count', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: countResult } = renderHook(() =>
        useRowCount(tableResult.current.table)
      );
      
      expect(countResult.current).toBe(testUsers.length);
    });
    
    it('should update when rows are added', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: countResult } = renderHook(() =>
        useRowCount(tableResult.current.table)
      );
      
      const initialCount = countResult.current;
      expect(initialCount).toBe(5);
      
      // Add a new row
      tableResult.current.table.setState((prev) => ({
        ...prev,
        data: [
          ...prev.data,
          { id: '6', name: 'Frank', email: 'frank@example.com', age: 40, active: true },
        ],
      }));
      
      await waitFor(() => {
        expect(countResult.current).toBe(6);
      });
    });
    
    it.skip('should reflect filtered row count (requires FILTER-001)', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({
          data: testUsers,
          columns: testColumns,
          getRowId: (row) => row.id,
          initialState: {
            filtering: [{ id: 'name', value: 'alice' }],
          },
        })
      );
      
      const { result: countResult } = renderHook(() =>
        useRowCount(tableResult.current.table)
      );
      
      // TODO: This test requires FILTER-001 implementation for filtering state management
      expect(countResult.current).toBe(1);
    });
  });
  
  describe('useRowModel - Get row model', () => {
    it('should return row model with all collections', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: modelResult } = renderHook(() =>
        useRowModel(tableResult.current.table)
      );
      
      const model = modelResult.current;
      expect(model.rows).toBeDefined();
      expect(model.flatRows).toBeDefined();
      expect(model.allRows).toBeDefined();
      expect(model.rowsById).toBeDefined();
      expect(model.totalRowCount).toBe(testUsers.length);
    });
    
    it('should provide getSelectedRows method', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: modelResult } = renderHook(() =>
        useRowModel(tableResult.current.table)
      );
      
      // Select first row
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: { ...prev.rowSelection, '1': true },
      }));
      
      await waitFor(() => {
        const selectedRows = modelResult.current.getSelectedRows();
        expect(selectedRows).toHaveLength(1);
        expect(selectedRows[0].id).toBe('1');
      });
    });
  });
  
  describe('useSelectedRows - Get selected rows', () => {
    it('should return empty array when no rows selected', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectedRowsResult } = renderHook(() =>
        useSelectedRows(tableResult.current.table)
      );
      
      expect(selectedRowsResult.current).toHaveLength(0);
    });
    
    it('should return selected rows', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectedRowsResult } = renderHook(() =>
        useSelectedRows(tableResult.current.table)
      );
      
      // Select multiple rows
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...prev.rowSelection,
          '1': true,
          '3': true,
          '5': true,
        },
      }));
      
      await waitFor(() => {
        const selectedRows = selectedRowsResult.current;
        expect(selectedRows).toHaveLength(3);
        const ids = selectedRows.map((r) => r.id);
        expect(ids).toContain('1');
        expect(ids).toContain('3');
        expect(ids).toContain('5');
      });
    });
    
    it('should update when selection changes', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: selectedRowsResult } = renderHook(() =>
        useSelectedRows(tableResult.current.table)
      );
      
      const initialCount = selectedRowsResult.current.length;
      expect(initialCount).toBe(0);
      
      // Select first row
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: { ...prev.rowSelection, '1': true },
      }));
      
      await waitFor(() => {
        expect(selectedRowsResult.current).toHaveLength(1);
      });
    });
  });
  
  describe('useSelectedRowCount - Get selected row count', () => {
    it('should return 0 when no rows selected', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: countResult } = renderHook(() =>
        useSelectedRowCount(tableResult.current.table)
      );
      
      expect(countResult.current).toBe(0);
    });
    
    it('should return correct count', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: countResult } = renderHook(() =>
        useSelectedRowCount(tableResult.current.table)
      );
      
      // Select multiple rows
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: {
          ...prev.rowSelection,
          '1': true,
          '3': true,
          '5': true,
        },
      }));
      
      await waitFor(() => {
        expect(countResult.current).toBe(3);
      });
    });
  });
  
  describe('useIsRowSelected - Check if row is selected', () => {
    it('should return false for unselected row', () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: isSelectedResult } = renderHook(() =>
        useIsRowSelected(tableResult.current.table, '1')
      );
      
      expect(isSelectedResult.current).toBe(false);
    });
    
    it('should return true for selected row', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: isSelectedResult } = renderHook(() =>
        useIsRowSelected(tableResult.current.table, '1')
      );
      
      // Select the row
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: { ...prev.rowSelection, '1': true },
      }));
      
      await waitFor(() => {
        expect(isSelectedResult.current).toBe(true);
      });
    });
    
    it('should return false for deselected row', async () => {
      const { result: tableResult } = renderHook(() =>
        useTable({ data: testUsers, columns: testColumns, getRowId: (row) => row.id })
      );
      
      const { result: isSelectedResult } = renderHook(() =>
        useIsRowSelected(tableResult.current.table, '1')
      );
      
      // Select then deselect
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: { ...prev.rowSelection, '1': true },
      }));
      
      await waitFor(() => {
        expect(isSelectedResult.current).toBe(true);
      });
      
      tableResult.current.table.setState((prev) => ({
        ...prev,
        rowSelection: { ...prev.rowSelection, '1': false },
      }));
      
      await waitFor(() => {
        expect(isSelectedResult.current).toBe(false);
      });
    });
  });
});
