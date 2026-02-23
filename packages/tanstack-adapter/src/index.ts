// React hooks entry point for @gridkit/tanstack-adapter
import { useMemo } from 'react'
import type { TableOptions, RowData } from '@tanstack/react-table'
import { useReactTable } from '@tanstack/react-table'
import type { EnhancedTable, EnhancedTableFeatures } from './types/enhanced'
import { createEnhancedTable, createEnhancedTableFromOptions, createDefaultEnhancedTable } from './core/createEnhancedTable'
import { withEvents } from './enhancers/withEvents'
import { withPerformanceMonitoring } from './enhancers/withPerformanceMonitoring'
import { withValidation } from './enhancers/withValidation'
import { withPlugins } from './enhancers/withPlugins'

/**
 * Enhanced useTable hook that adds GridKit features to TanStack Table
 */
export function useGridEnhancedTable<TData extends RowData>(
  options: TableOptions<TData> & {
    features?: EnhancedTableFeatures
  }
): EnhancedTable<TData> {
  // Get TanStack table options (excluding GridKit features)
  const { features, ...tanstackOptions } = options

  // Create TanStack table instance
  const tanstackTable = useReactTable(tanstackOptions)

  // Create enhanced table with GridKit features
  const enhancedTable = useMemo(() => {
    return createEnhancedTable(tanstackTable, features)
  }, [tanstackTable, features])

  return enhancedTable
}

/**
 * Use table metrics hook for accessing performance metrics
 */
export function useTableMetrics<TData extends RowData>(
  table: EnhancedTable<TData>
) {
  return useMemo(() => {
    return {
      getOperationStats: (operation: string) => {
        return table.metrics?.getOperationStats(operation)
      },
      getMemoryMetrics: () => {
        return table.metrics?.getMemoryMetrics()
      },
    }
  }, [table.metrics])
}

/**
 * Use validation hook for accessing validation methods
 */
export function useValidation<TData extends RowData>(
  table: EnhancedTable<TData>
) {
  return useMemo(() => {
    return {
      validateRow: async (row: TData, index: number) => {
        if (!table.validateRow) {
          throw new Error('Validation not enabled')
        }
        return table.validateRow(row, index)
      },
      validateAll: async () => {
        if (!table.validateAll) {
          throw new Error('Validation not enabled')
        }
        return table.validateAll()
      },
      validator: table.validator,
    }
  }, [table.validateRow, table.validateAll, table.validator])
}

/**
 * Use table events hook for accessing event methods
 */
export function useTableEvents<TData extends RowData>(
  table: EnhancedTable<TData>
) {
  return useMemo(() => {
    return {
      on: table.on,
      off: table.off,
      emit: table.emit,
      use: table.use,
    }
  }, [table.on, table.off, table.emit, table.use])
}

// Re-export main exports
export {
  createEnhancedTable,
  createEnhancedTableFromOptions,
  createDefaultEnhancedTable,
  withEvents,
  withPerformanceMonitoring,
  withValidation,
  withPlugins,
}

export type { EnhancedTable, EnhancedTableFeatures }
