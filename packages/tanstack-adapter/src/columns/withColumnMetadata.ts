/**
 * Metadata Column Enhancer for TanStack Table
 *
 * Adds metadata to column definitions for UI and configuration purposes.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

import type { ColumnDef } from '@tanstack/react-table'

/**
 * Column metadata interface
 */
export interface ColumnMetadata {
  label?: string
  description?: string
  category?: string
  editable?: boolean
  sortable?: boolean
  filterable?: boolean
  tooltip?: string
  icon?: string
  width?: number | string
  minWidth?: number
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  visible?: boolean
  [key: string]: any
}

/**
 * Metadata column definition type
 */
export interface MetadataColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  meta: ColumnMetadata
}

/**
 * Create a column definition with metadata
 *
 * @param column - Base column definition
 * @param metadata - Column metadata
 * @returns Column definition with metadata
 *
 * @example
 * ```typescript
 * const column = withColumnMetadata(
 *   { accessorKey: 'price', header: 'Price' },
 *   {
 *     label: 'Product Price',
 *     description: 'Price in USD',
 *     editable: true,
 *     icon: 'dollar-sign',
 *     width: 150
 *   }
 * )
 * ```
 */
export function withColumnMetadata<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  metadata: ColumnMetadata
): MetadataColumnDef<TData, TValue> {
  return {
    ...column,
    meta: {
      ...column.meta,
      ...metadata
    }
  } as MetadataColumnDef<TData, TValue>
}
