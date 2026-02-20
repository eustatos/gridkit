import { useMemo } from 'react';
import type { Table, Column, RowData } from '@gridkit/core';
import { useTableState } from './useTableState';

/**
 * Hook to get visible columns (filtered by column visibility state)
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Array of visible columns
 * 
 * @example
 * ```tsx
 * const { table } = useTable({ data, columns });
 * const visibleColumns = useColumns(table);
 * 
 * // Render visible columns
 * {visibleColumns.map(column => (
 *   <th key={column.id}>{column.renderHeader()}</th>
 * ))}
 * ```
 */
export function useColumns<TData extends RowData>(
  table: Table<TData>
): Column<TData>[] {
  const columnVisibility = useTableState(
    table,
    (state) => state.columnVisibility
  );
  
  return useMemo(() => {
    return table.getAllColumns().filter((col) => {
      if (!columnVisibility) return true;
      return columnVisibility[col.id] !== false;
    });
  }, [table, columnVisibility]);
}

/**
 * Hook to get all columns including hidden ones
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @returns Array of all columns
 * 
 * @example
 * ```tsx
 * const { table } = useTable({ data, columns });
 * const allColumns = useAllColumns(table);
 * 
 * // Get specific column
 * const nameColumn = allColumns.find(col => col.id === 'name');
 * ```
 */
export function useAllColumns<TData extends RowData>(
  table: Table<TData>
): Column<TData>[] {
  return useMemo(() => table.getAllColumns(), [table]);
}

/**
 * Hook to get a specific column by ID
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param columnId - Column ID to look up
 * @returns Column if found, undefined otherwise
 * 
 * @example
 * ```tsx
 * const { table } = useTable({ data, columns });
 * const nameColumn = useColumn(table, 'name');
 * 
 * if (nameColumn) {
 *   const header = nameColumn.renderHeader();
 * }
 * ```
 */
export function useColumn<TData extends RowData>(
  table: Table<TData>,
  columnId: string
): Column<TData> | undefined {
  return useMemo(
    () => table.getColumn(columnId),
    [table, columnId]
  );
}

/**
 * Hook to check if a column is visible
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param columnId - Column ID to check
 * @returns true if column is visible, false otherwise
 * 
 * @example
 * ```tsx
 * const { table } = useTable({ data, columns });
 * const isNameVisible = useColumnVisibility(table, 'name');
 * 
 * if (!isNameVisible) {
 *   // Handle hidden column logic
 * }
 * ```
 */
export function useColumnVisibility<TData extends RowData>(
  table: Table<TData>,
  columnId: string
): boolean {
  const columnVisibility = useTableState(
    table,
    (state) => state.columnVisibility
  );
  
  return useMemo(() => {
    if (!columnVisibility) return true;
    return columnVisibility[columnId] !== false;
  }, [table, columnId, columnVisibility]);
}
