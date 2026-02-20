import React from 'react';
import type { ReactNode } from 'react';
import type { RowData, ColumnDef } from '@gridkit/core';
import { useTable } from '../hooks/useTable';
import type { UseTableOptions } from '../types';
import { Column, extractColumns, hasColumnChildren } from './Column';

/**
 * Table component for rendering data in a table format.
 * Provides a quick start for basic tables with optional customization.
 * 
 * @template TData - The row data type
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Table data={users} columns={columns} />
 * 
 * // With JSX columns
 * <Table data={users}>
 *   <Column accessorKey="name" header="Name" />
 *   <Column accessorKey="email" header="Email" />
 * </Table>
 * 
 * // With custom classes
 * <Table 
 *   data={users} 
 *   columns={columns}
 *   className="my-custom-table"
 *   headerClassName="table-header"
 * />
 * 
 * // With dynamic row classes
 * <Table 
 *   data={users}
 *   columns={columns}
 *   rowClassName={(row) => row.active ? 'active-row' : 'inactive-row'}
 * />
 * ```
 */
export interface TableProps<TData extends RowData> extends UseTableOptions<TData> {
  /**
   * CSS class for the table element
   */
  className?: string;
  
  /**
   * CSS class for the table header (thead element)
   */
  headerClassName?: string;
  
  /**
   * CSS class for table rows (tr elements).
   * Can be a function that receives the row data and returns a class name.
   */
  rowClassName?: string | ((row: TData) => string);
  
  /**
   * CSS class for table cells (td elements)
   */
  cellClassName?: string;
  
  /**
   * JSX children containing Column components for declarative column definitions
   */
  children?: ReactNode;
}

/**
 * React Table component that provides a quick start for basic tables.
 * Uses the useTable hook internally and provides a component-based API.
 * Supports both prop-based and JSX-based column definitions.
 * 
 * @template TData - The row data type
 * @param props - Table props including data, columns, and styling options
 * @returns React element with the rendered table
 */
export function Table<TData extends RowData>({
  className,
  headerClassName,
  rowClassName,
  cellClassName,
  children,
  ...props
}: TableProps<TData>) {
  // Extract columns from Column children if provided, otherwise use columns prop
  const columns = hasColumnChildren(children)
    ? extractColumns<TData>(children)
    : (props as any).columns;

  const { table } = useTable({ 
    ...props,
    columns,
  } as any);

  // Don't render anything if table is not created yet
  if (!table) {
    return null;
  }

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  return (
    <table className={className}>
      <thead className={headerClassName}>
        {headerGroups.map((headerGroup, groupIndex) => (
          <tr key={`header-group-${groupIndex}`}>
            {headerGroup.map((header) => (
              <th key={header.id}>
                {header.renderHeader?.()}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className={
              typeof rowClassName === 'function'
                ? rowClassName(row.original)
                : rowClassName
            }
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={cellClassName}>
                {cell.renderCell?.()}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Add display name for React DevTools
Table.displayName = 'Table';

export default Table;
