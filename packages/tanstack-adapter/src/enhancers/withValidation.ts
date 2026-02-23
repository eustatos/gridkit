// Validation enhancer for TanStack Table adapter
// Uses GridKit core ValidationManager for schema-based validation

import type { Table as TanStackTable, RowData } from '@tanstack/react-table'
import type { EnhancedTable, ValidationConfig } from '../types/enhanced'
import { ValidationManager } from '@gridkit/core/validation'

/**
 * High-order function to add validation to TanStack Table
 */
export function withValidation<TData extends RowData>(
  table: TanStackTable<TData>,
  config?: ValidationConfig
): EnhancedTable<TData> {
  // Create validation manager from core
  const validationManager = new ValidationManager({
    defaultMode: config?.mode || 'normal',
    cacheEnabled: config?.cache ?? true,
    throwOnError: config?.throwOnError ?? false,
  })

  // Add validation methods
  const enhancedTable = {
    ...table,
    validator: validationManager,
    validateRow: async (row: TData, index: number) => {
      return validationManager.validateRow(row, index)
    },
    validateAll: async () => {
      const rows = (table as any).getRowModel?.().rows || []
      return validationManager.validateArray(rows)
    },
  } as EnhancedTable<TData>

  return enhancedTable
}

/**
 * Create enhanced table with validation from options
 */
export function createEnhancedTableWithValidation<TData extends RowData>(
  options: any,
  config?: ValidationConfig
): EnhancedTable<TData> {
  // First create TanStack table
  const { useReactTable } = require('@tanstack/react-table')
  const tanstackTable = useReactTable(options)

  // Add validation
  return withValidation(tanstackTable, config)
}

/**
 * Enhanced version of TanStack useTable with validation
 */
export function useTableWithValidation<TData extends RowData>(
  options: any,
  config?: ValidationConfig
): EnhancedTable<TData> {
  const { useMemo } = require('react')
  const { useReactTable } = require('@tanstack/react-table')
  
  // First create TanStack table
  const tanstackTable = useReactTable(options)

  // Add validation using useMemo for stability
  return useMemo(() => {
    return withValidation(tanstackTable, config)
  }, [tanstackTable, config])
}
