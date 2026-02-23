/**
 * Validation Column Enhancer for TanStack Table
 *
 * Adds validation capabilities to column definitions using GridKit's validation system.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { Schema, ValidationResult } from '@gridkit/core'

/**
 * Validation options for column
 */
export interface ColumnValidationOptions {
  mode?: 'strict' | 'normal' | 'minimal' | 'none'
  cache?: boolean
  throwOnError?: boolean
}

/**
 * Validated column definition type
 */
export interface ValidatedColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  validation: Schema<TData>
  validateCell: (value: TValue, row: TData) => Promise<ValidationResult>
}

/**
 * Create a validated column definition
 *
 * @param column - Base column definition
 * @param schema - Validation schema (use createSchema() to create)
 * @param options - Validation options
 * @returns Validated column definition
 *
 * @example
 * ```typescript
 * import { createSchema, field } from '@gridkit/core'
 * 
 * const schema = createSchema({
 *   email: field('string', {
 *     required: true,
 *     constraints: {
 *       pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 *     }
 *   })
 * })
 * 
 * const validatedColumn = withColumnValidation(
 *   { accessorKey: 'email', header: 'Email' },
 *   schema
 * )
 * ```
 */
export function withColumnValidation<TData extends unknown, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  schema: Schema<TData>,
  options?: ColumnValidationOptions
): ValidatedColumnDef<TData, TValue> {
  return {
    ...column,
    validation: schema,

    validateCell: async (value: TValue, row: TData) => {
      // Create field name from column id
      const fieldName = column.id || 'field'
      const data = { [fieldName]: value } as TData
      
      return schema.validate(data)
    },

    // Enhance cell rendering with validation feedback
    cell: (info) => {
      const baseCell = typeof column.cell === 'function'
        ? column.cell(info)
        : info.getValue()

      // Validate on render
      const value = info.getValue() as TValue
      const fieldName = column.id || 'field'
      const data = { [fieldName]: value } as TData
      
      try {
        const result = schema.validate(data)
        
        // Return result with validation info if cell is a simple value
        if (typeof baseCell !== 'object' || baseCell === null) {
          return {
            content: baseCell,
            isValid: result.valid,
            errorMessage: result.valid ? undefined : result.errors[0]?.message,
          }
        }
        
        return baseCell
      } catch (error) {
        // If validation throws, return base cell with error
        return {
          content: baseCell,
          isValid: false,
          errorMessage: error instanceof Error ? error.message : 'Validation failed',
        }
      }
    },
  } as ValidatedColumnDef<TData, TValue>
}
