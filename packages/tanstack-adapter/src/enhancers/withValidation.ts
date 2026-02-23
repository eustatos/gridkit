// Validation enhancer for TanStack Table adapter
// Simplified - self-contained without core dependencies

import type { Table as TanStackTable } from '@tanstack/react-table'
import type { EnhancedTable, ValidationConfig, ValidationManager } from '../types/enhanced'

// Basic validation result type
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  code: string
}

// Simplified validation manager
class SimpleValidationManager implements ValidationManager {
  private mode: 'strict' | 'normal' | 'minimal' | 'none'

  constructor(config?: ValidationConfig) {
    this.mode = config?.mode || 'normal'
  }

  async validateRow(_row: any, _index: number): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Check required fields (simple example)
    if (this.mode !== 'none') {
      // Simplified validation logic
    }

    const isValid = errors.length === 0

    return {
      isValid,
      errors,
      warnings
    }
  }

  async validateAll(_rows: any[]): Promise<ValidationResult[]> {
    // Simplified - would validate all rows
    return []
  }
}

/**
 * High-order function to add validation to TanStack Table
 */
export function withValidation<TData>(
  table: TanStackTable<TData>,
  config?: ValidationConfig
): EnhancedTable<TData> {
  // Create validation manager
  const validator = new SimpleValidationManager(config)

  // Add validation methods
  // @ts-ignore - adding new methods to table
  const enhancedTable = {
    ...table,
    validator,
    validateRow: async (row: TData, index: number) => {
      return validator.validateRow(row, index)
    },
    validateAll: async () => {
      const rows = (table as any).getRowModel?.().rows || []
      return validator.validateAll(rows)
    },
  } as EnhancedTable<TData>

  return enhancedTable
}

/**
 * Create enhanced table with validation
 */
export function createEnhancedTableWithValidation<TData>(
  options: any,
  validationConfig?: ValidationConfig
): EnhancedTable<TData> {
  // Create TanStack table
  const tanstackTable = options.useTable(options)

  // Add validation
  return withValidation(tanstackTable, validationConfig)
}
