import React from 'react';
import type { ReactNode } from 'react';
import type { RowData, ColumnDef, CellContext } from '@gridkit/core';

export const COLUMN_TYPE_SYMBOL = '@gridkit/react/Column';

export interface ColumnProps<TData extends RowData, TValue = any> {
  /**
   * Column ID (optional, auto-generated from accessorKey if not provided)
   */
  id?: string;
  
  /**
   * Accessor key for data access (string or string[] for nested paths)
   */
  accessorKey?: keyof TData | string;
  
  /**
   * Header content (string or React node)
   */
  header?: string | ReactNode;
  
  /**
   * Cell renderer function.
   * Receives a context object with `value` and `row` properties.
   * Note: The core expects CellContext, but this simplified API is provided for convenience.
   */
  cell?: (props: { value: TValue; row: TData }) => ReactNode;
  
  /**
   * Footer content (string or React node)
   */
  footer?: string | ReactNode;
  
  /**
   * Enable sorting for this column
   * @default true
   */
  enableSorting?: boolean;
  
  /**
   * Enable filtering for this column
   * @default true
   */
  enableFiltering?: boolean;
  
  /**
   * Column width in pixels
   */
  width?: number;
  
  /**
   * Minimum width constraint
   */
  minWidth?: number;
  
  /**
   * Maximum width constraint
   */
  maxWidth?: number;
  
  /**
   * Enable column resizing
   * @default true
   */
  enableResizing?: boolean;
  
  /**
   * Enable column visibility toggling
   * @default true
   */
  enableHiding?: boolean;
  
  /**
   * Enable column reordering
   * @default true
   */
  enableReordering?: boolean;
  
  /**
   * Enable column pinning (freeze)
   * @default false
   */
  enablePinning?: boolean;
}

/**
 * Declarative Column component for JSX-based column definitions.
 * This is a helper component that doesn't render anything to the DOM.
 * It's used to define column metadata in a React-friendly way.
 * 
 * @template TData - The row data type
 * @template TValue - The cell value type (inferred from accessor)
 * 
 * @example
 * ```tsx
 * <Table data={users}>
 *   <Column
 *     accessorKey="name"
 *     header="Name"
 *     enableSorting
 *   />
 *   <Column
 *     accessorKey="email"
 *     header="Email"
 *     cell={({ value }) => <a href={`mailto:${value}`}>{value}</a>}
 *   />
 * </Table>
 * ```
 */
export function Column<TData extends RowData, TValue = any>(
  _props: ColumnProps<TData, TValue>
): null {
  return null;
}

// Add display name for React DevTools
Column.displayName = 'Column';

/**
 * Wrap a simplified cell function to make it compatible with core's CellContext
 */
function wrapCellRenderer<TData extends RowData, TValue = any>(
  cellRenderer?: (props: { value: TValue; row: TData }) => ReactNode
) {
  if (!cellRenderer) return undefined;
  
  // Return a function that accepts CellContext and calls the wrapped renderer
  return (context: CellContext<TData, TValue>) => {
    const value = context.getValue();
    const row = context.getRow();
    return cellRenderer({ value, row });
  };
}

/**
 * Check if an element is a Column component
 */
function isColumnElement<TData extends RowData>(
  element: React.ReactElement
): boolean {
  return element.type === Column || (element.type as any).displayName === 'Column';
}

/**
 * Recursively extract column definitions from React children
 */
function extractColumnsRecursive<TData extends RowData>(
  children: ReactNode,
  columns: ColumnDef<TData>[] = []
): ColumnDef<TData>[] {
  if (children == null) {
    return columns;
  }

  // Handle single element
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement;
    
    // Check if this is a Column component
    if (isColumnElement<TData>(element)) {
      const props = element.props as ColumnProps<TData>;
      
      // Use accessorKey as default id for better core compatibility
      const id = props.id || (props.accessorKey as string | undefined);
      
      // Wrap the cell renderer to convert from simplified API to CellContext
      const wrappedCell = wrapCellRenderer(props.cell);
      
      const columnDef: ColumnDef<TData> = {
        id,
        accessorKey: props.accessorKey,
        header: props.header,
        cell: wrappedCell,
        footer: props.footer,
        enableSorting: props.enableSorting,
        enableFiltering: props.enableFiltering,
        size: props.width,
        minSize: props.minWidth,
        maxSize: props.maxWidth,
        enableResizing: props.enableResizing,
        enableHiding: props.enableHiding,
        enableReordering: props.enableReordering,
        enablePinning: props.enablePinning,
      };
      
      columns.push(columnDef);
    } else {
      // Recursively process children of non-Column elements
      const childChildren = element.props?.children;
      if (childChildren) {
        extractColumnsRecursive<TData>(childChildren, columns);
      }
    }
  } else if (Array.isArray(children)) {
    // Handle array of children
    children.forEach((child) => {
      extractColumnsRecursive<TData>(child, columns);
    });
  }

  return columns;
}

/**
 * Extract column definitions from Column components
 * 
 * @template TData - The row data type
 * @param children - React children containing Column components
 * @returns Array of column definitions
 * 
 * @example
 * ```tsx
 * const columns = extractColumns(children);
 * // Use columns with table factory
 * ```
 */
export function extractColumns<TData extends RowData>(
  children: ReactNode
): ColumnDef<TData>[] {
  return extractColumnsRecursive<TData>(children);
}

/**
 * Check if children contain Column components
 * 
 * @param children - React children to check
 * @returns true if children contain Column components
 */
export function hasColumnChildren<TData extends RowData>(
  children: ReactNode
): boolean {
  const columns = extractColumns<TData>(children);
  return columns.length > 0;
}
