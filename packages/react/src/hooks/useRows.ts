import { useMemo } from 'react';
import type { Table, Row, RowData, RowModel } from '@gridkit/core';
import { useTableState } from './useTableState';

/**
 * Hook to get all rows from the table with reactive updates.
 * Returns rows from the current row model (after sorting/filtering).
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Array of row instances
 * 
 * @example
 * ```tsx
 * const rows = useRows(table);
 * rows.forEach(row => {
 *   console.log(row.id, row.original);
 * });
 * ```
 */
export function useRows<TData extends RowData>(
  table: Table<TData>
): Row<TData>[] {
  const data = useTableState(table, (state) => state.data);
  const sorting = useTableState(table, (state) => state.sorting);
  const filtering = useTableState(table, (state) => state.filtering);
  
  return useMemo(() => {
    const rowModel = table.getRowModel();
    return rowModel.rows;
  }, [table, data, sorting, filtering]);
}

/**
 * Hook to get paginated rows from the table.
 * Returns only the rows for the current page.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Array of row instances for current page
 * 
 * @example
 * ```tsx
 * const paginatedRows = usePaginatedRows(table);
 * ```
 */
export function usePaginatedRows<TData extends RowData>(
  table: Table<TData>
): Row<TData>[] {
  const pagination = useTableState(table, (state) => state.pagination);
  const rows = useRows(table);
  
  return useMemo(() => {
    if (!pagination) return rows;
    
    const { pageIndex = 0, pageSize = 10 } = pagination;
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    
    return rows.slice(start, end);
  }, [rows, pagination]);
}

/**
 * Hook to get a specific row by ID.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param rowId - The row identifier
 * @returns Row instance or undefined if not found
 * 
 * @example
 * ```tsx
 * const row = useRow(table, 'user-123');
 * if (row) {
 *   console.log(row.getValue('name'));
 * }
 * ```
 */
export function useRow<TData extends RowData>(
  table: Table<TData>,
  rowId: string
): Row<TData> | undefined {
  const rows = useRows(table);
  const rowSelection = useTableState(table, (state) => state.rowSelection);
  
  return useMemo(
    () => rows.find((row) => row.id === rowId),
    [rows, rowId, rowSelection]
  );
}

/**
 * Hook to get the total row count.
 * Returns the number of rows before pagination.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Number of rows
 * 
 * @example
 * ```tsx
 * const rowCount = useRowCount(table);
 * ```
 */
export function useRowCount<TData extends RowData>(
  table: Table<TData>
): number {
  const data = useTableState(table, (state) => state.data);
  const rows = useRows(table);
  
  return useMemo(() => {
    // Return total row count from row model (after sorting/filtering)
    return rows.length;
  }, [rows, data]);
}

/**
 * Hook to get all rows as a RowModel object for advanced usage.
 * Provides access to filtered, sorted, and paginated row collections.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns RowModel with various row collections and utilities
 * 
 * @example
 * ```tsx
 * const rowModel = useRowModel(table);
 * const total = rowModel.totalRowCount;
 * const selected = rowModel.getSelectedRows();
 * ```
 */
export function useRowModel<TData extends RowData>(
  table: Table<TData>
): RowModel<TData> {
  const data = useTableState(table, (state) => state.data);
  const sorting = useTableState(table, (state) => state.sorting);
  const filtering = useTableState(table, (state) => state.filtering);
  const rowSelection = useTableState(table, (state) => state.rowSelection);
  const expanded = useTableState(table, (state) => state.expanded);
  
  return useMemo(() => {
    return table.getRowModel();
  }, [table, data, sorting, filtering, rowSelection, expanded]);
}

/**
 * Hook to get selected rows.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Array of selected row instances
 * 
 * @example
 * ```tsx
 * const selectedRows = useSelectedRows(table);
 * ```
 */
export function useSelectedRows<TData extends RowData>(
  table: Table<TData>
): Row<TData>[] {
  const rowSelection = useTableState(table, (state) => state.rowSelection);
  const rows = useRows(table);
  
  return useMemo(() => {
    const selectedRows: Row<TData>[] = [];
    for (const [rowId, isSelected] of Object.entries(rowSelection || {})) {
      if (isSelected) {
        const row = rows.find(r => r.id === rowId);
        if (row) {
          selectedRows.push(row);
        }
      }
    }
    return selectedRows;
  }, [rows, rowSelection]);
}

/**
 * Hook to get the number of selected rows.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Number of selected rows
 * 
 * @example
 * ```tsx
 * const selectedCount = useSelectedRowCount(table);
 * ```
 */
export function useSelectedRowCount<TData extends RowData>(
  table: Table<TData>
): number {
  const rowSelection = useTableState(table, (state) => state.rowSelection);
  
  return useMemo(() => {
    return Object.keys(rowSelection || {}).filter(k => rowSelection?.[k]).length;
  }, [rowSelection]);
}

/**
 * Hook to check if a specific row is selected.
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param rowId - The row identifier
 * @returns true if row is selected
 * 
 * @example
 * ```tsx
 * const isSelected = useIsRowSelected(table, 'user-123');
 * ```
 */
export function useIsRowSelected<TData extends RowData>(
  table: Table<TData>,
  rowId: string
): boolean {
  const rowSelection = useTableState(table, (state) => state.rowSelection);
  
  return useMemo(() => {
    return !!rowSelection?.[rowId];
  }, [rowSelection, rowId]);
}