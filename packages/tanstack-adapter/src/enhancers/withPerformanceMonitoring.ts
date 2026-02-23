// Performance monitoring enhancer for TanStack Table adapter
// Simplified - creates basic performance tracking without core dependencies

import type { Table as TanStackTable } from '@tanstack/react-table'
import type { EnhancedTable, PerformanceConfig } from '../types/enhanced'

// Basic performance monitor
interface PerformanceMonitor {
  getOperationStats(operation: string): any
  getMemoryMetrics(): any
  track<T>(operation: string, fn: () => T): T
}

class SimplePerformanceMonitor implements PerformanceMonitor {
  private stats: Map<string, { count: number; totalTime: number }> = new Map()

  track<T>(operation: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    const stats = this.stats.get(operation) || { count: 0, totalTime: 0 }
    this.stats.set(operation, {
      count: stats.count + 1,
      totalTime: stats.totalTime + duration
    })

    return result
  }

  getOperationStats(operation: string): any {
    const stats = this.stats.get(operation)
    if (!stats) return null

    return {
      operation,
      count: stats.count,
      avgTime: stats.totalTime / stats.count,
      totalTime: stats.totalTime
    }
  }

  getMemoryMetrics(): any {
    // Simplified - would use performance.memory in browser
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    }
  }
}

/**
 * High-order function to add performance monitoring to TanStack Table
 */
export function withPerformanceMonitoring<TData>(
  table: TanStackTable<TData>,
  _config?: PerformanceConfig | boolean
): EnhancedTable<TData> {
  // Create performance monitor
  const monitor = new SimplePerformanceMonitor()

  // Track operations
  const trackedMethods = ['getRowModel', 'getSortedRowModel', 'getFilteredRowModel']
  const enhancedTable = { ...table } as EnhancedTable<TData>

  trackedMethods.forEach(method => {
    // @ts-ignore - dynamically add methods
    enhancedTable[method] = ((...args: any[]) => {
      return monitor.track(String(method), () => (table as any)[method](...args))
    }) as any
  })

  // Add metrics access
  enhancedTable.metrics = monitor

  return enhancedTable
}

/**
 * Create enhanced table with performance monitoring
 */
export function createEnhancedTableWithPerformance<TData>(
  options: any,
  _performanceConfig?: PerformanceConfig | boolean
): EnhancedTable<TData> {
  // Create TanStack table
  const tanstackTable = options.useTable(options)

  // Add performance monitoring
  return withPerformanceMonitoring(tanstackTable, _performanceConfig)
}
