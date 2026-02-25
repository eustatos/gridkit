// Performance monitoring enhancer for TanStack Table adapter
// Uses GridKit core PerformanceMonitor for accurate tracking and budget checking

import type { Table as TanStackTable, RowData } from '@tanstack/react-table'
import type { EnhancedTable, PerformanceConfig } from '../types/enhanced'
import { createPerformanceMonitor, type PerformanceMonitor as CorePerformanceMonitor } from '@gridkit/core/performance'
import { useMemo } from 'react'
import { useReactTable } from '@tanstack/react-table'

/**
 * High-order function to add performance monitoring to TanStack Table
 */
export function withPerformanceMonitoring<TData extends RowData>(
  table: TanStackTable<TData>,
  config?: PerformanceConfig | boolean
): EnhancedTable<TData> {
  // Create performance monitor from core
  const perfConfig = typeof config === 'boolean' ? {} : config
  const performanceConfig: any = {
    enabled: true,
    budgets: {
      tableCreation: 100,
      stateUpdate: 50,
      renderCycle: 16,
      rowModelBuild: 30,
      eventProcessing: 10,
      ...perfConfig.budgets,
    },
    onViolation: perfConfig.onViolation,
  }
  const monitor = createPerformanceMonitor(performanceConfig)

  // Track operations - wrap key methods
  const trackedMethods = ['getRowModel', 'getSortedRowModel', 'getFilteredRowModel']
  const enhancedTable = { ...table } as EnhancedTable<TData>

  trackedMethods.forEach(method => {
    // @ts-ignore - dynamically add methods
    enhancedTable[method] = ((...args: any[]) => {
      return monitor.track(String(method), () => (table as any)[method](...args))
    }) as any
  })

  // Add metrics access with core performance monitor methods
  enhancedTable.metrics = {
    ...monitor,
    getMetrics: () => monitor.getMetrics(),
    checkBudgets: () => monitor.checkBudgets(),
    setBudgets: (budgets: any) => monitor.setBudgets(budgets),
  }

  return enhancedTable
}

/**
 * Create enhanced table with performance monitoring from options
 */
export function createEnhancedTableWithPerformance<TData extends RowData>(
  options: any,
  config?: PerformanceConfig | boolean
): EnhancedTable<TData> {
  // First create TanStack table
  const tanstackTable = useReactTable(options)

  // Add performance monitoring
  return withPerformanceMonitoring(tanstackTable, config)
}

/**
 * Enhanced version of TanStack useTable with performance monitoring
 */
export function useTableWithPerformance<TData extends RowData>(
  options: any,
  config?: PerformanceConfig | boolean
): EnhancedTable<TData> {
  // First create TanStack table
  const tanstackTable = useReactTable(options)

  // Add performance monitoring using useMemo for stability
  return useMemo(() => {
    return withPerformanceMonitoring(tanstackTable, config)
  }, [tanstackTable, config])
}
