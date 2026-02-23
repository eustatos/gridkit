/**
 * GridKit Column Enhancement System
 *
 * Enhances TanStack Table column definitions with GridKit features
 * while maintaining full backward compatibility.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

import type { ColumnDef, CellContext } from '@tanstack/react-table'
import type { ValidationSchema, ValidationResult } from '@gridkit/core'

/**
 * Extended metadata for column enhancement
 */
export interface ColumnEnhancementOptions<TData, TValue = unknown> {
  // Validation
  validation?: ValidationSchema
  validateCell?: (value: TValue, row: TData) => Promise<ValidationResult>

  // Formatting
  format?: (value: TValue) => string
  parse?: (input: string) => TValue

  // Events
  onCellEdit?: (value: TValue, row: TData, rowIndex: number) => void
  onCellClick?: (value: TValue, row: TData, rowIndex: number) => void
  onCellFocus?: (value: TValue, row: TData, rowIndex: number) => void

  // Metadata
  meta?: {
    label?: string
    description?: string
    category?: string
    editable?: boolean
    tooltip?: string
    icon?: string
    [key: string]: any
  }

  // Performance
  cacheable?: boolean
  memoize?: boolean

  // Export
  exportable?: boolean
  exportFormat?: (value: TValue) => string
}

/**
 * Enhanced column definition type
 */
export interface EnhancedColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  // Validation
  validation?: ValidationSchema
  validateCell?: (value: TValue, row: TData) => Promise<ValidationResult>

  // Formatting
  format?: (value: TValue) => string
  parse?: (input: string) => TValue

  // Events
  onCellEdit?: (value: TValue, row: TData, rowIndex: number) => void
  onCellClick?: (value: TValue, row: TData, rowIndex: number) => void
  onCellFocus?: (value: TValue, row: TData, rowIndex: number) => void

  // Metadata
  meta?: {
    label?: string
    description?: string
    category?: string
    editable?: boolean
    tooltip?: string
    icon?: string
    [key: string]: any
  }

  // Performance
  cacheable?: boolean
  memoize?: boolean

  // Export
  exportable?: boolean
  exportFormat?: (value: TValue) => string
}

/**
 * Enhance a column definition with GridKit features
 *
 * @param column - Base column definition
 * @param enhancements - Enhancement options
 * @returns Enhanced column definition
 *
 * @example
 * ```typescript
 * const column = enhanceColumn(
 *   {
 *     accessorKey: 'price',
 *     header: 'Price'
 *   },
 *   {
 *     validation: {
 *       type: 'number',
 *       min: 0
 *     },
 *     format: (value) => `$${value.toFixed(2)}`,
 *     meta: {
 *       label: 'Product Price',
 *       editable: true
 *     }
 *   }
 * )
 * ```
 */
export function enhanceColumn<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  enhancements?: Partial<ColumnEnhancementOptions<TData, TValue>>
): EnhancedColumnDef<TData, TValue> {
  return {
    ...column,
    ...enhancements,

    // Enhance cell accessor if validation or formatting is present
    cell: (info) => {
      const baseCell = typeof column.cell === 'function'
        ? column.cell(info)
        : info.getValue()

      // Apply validation if present
      if (enhancements?.validation && enhancements.validateCell) {
        const value = info.getValue() as TValue
        enhancements.validateCell(value, info.row.original)
      }

      // Apply format if present
      if (enhancements?.format) {
        return enhancements.format(info.getValue() as TValue)
      }

      return baseCell
    },

    // Merge metadata
    meta: {
      ...column.meta,
      ...enhancements?.meta
    }
  } as EnhancedColumnDef<TData, TValue>
}
