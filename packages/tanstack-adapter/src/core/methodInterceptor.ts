/**
 * Method Interceptor for TanStack Table
 * Wraps methods to emit events and track performance
 */

import type { Table as TanStackTable, RowData } from '@tanstack/react-table'

/**
 * Interceptor for TanStack Table methods
 * Wraps methods to emit events and track performance
 */
export class MethodInterceptor<TData> {
  private table: TanStackTable<TData>
  private eventBus?: any
  private performanceMonitor?: any

  constructor(
    table: TanStackTable<TData>,
    eventBus?: any,
    performanceMonitor?: any
  ) {
    this.table = table
    this.eventBus = eventBus
    this.performanceMonitor = performanceMonitor
  }

  /**
   * Wrap a method to add event emission and performance tracking
   */
  intercept<K extends keyof TanStackTable<TData>>(
    methodName: K,
    options?: MethodInterceptorOptions<TData, K>
  ): TanStackTable<TData>[K] {
    const original = (this.table as any)[methodName]

    return ((...args: any[]) => {
      // Before hook
      options?.before?.(args)

      // Emit start event if configured
      if (options?.emitStart && this.eventBus) {
        this.eventBus.emit(`${String(methodName)}:start`, { args })
      }

      // Performance tracking
      const result = this.performanceMonitor
        ? this.performanceMonitor.track(String(methodName), () => original(...args))
        : original(...args)

      // After hook
      options?.after?.(result)

      // Emit complete event if configured
      if (options?.emitComplete && this.eventBus) {
        this.eventBus.emit(`${String(methodName)}:complete`, { result })
      }

      return result
    }) as TanStackTable<TData>[K]
  }
}

/**
 * Options for method interception
 */
export interface MethodInterceptorOptions<TData, K extends keyof TanStackTable<TData>> {
  /**
   * Hook before method execution
   */
  before?: (args: any[]) => void

  /**
   * Hook after method execution
   */
  after?: (result: any) => void

  /**
   * Emit 'method:start' event before execution
   */
  emitStart?: boolean

  /**
   * Emit 'method:complete' event after execution
   */
  emitComplete?: boolean
}

/**
 * Helper function to create a method interceptor
 */
export function createMethodInterceptor<TData>(
  table: TanStackTable<TData>,
  eventBus?: any,
  performanceMonitor?: any
): MethodInterceptor<TData> {
  return new MethodInterceptor(table, eventBus, performanceMonitor)
}

/**
 * Pre-defined method interceptors for common TanStack Table operations
 */
export const PREDEFINED_METHODS = {
  // State setters
  setSorting: 'sorting:change',
  setFiltering: 'filtering:change',
  setPagination: 'pagination:change',
  setGrouping: 'grouping:change',
  setColumnVisibility: 'columnVisibility:change',
  setColumnPinning: 'columnPinning:change',
  setRowSelection: 'rowSelection:change',
  setExpanded: 'expanded:change',

  // Data operations
  getRowModel: 'getRowModel',
  getSortedRowModel: 'getSortedRowModel',
  getFilteredRowModel: 'getFilteredRowModel',
  getGroupedRowModel: 'getGroupedRowModel',
  getFilteredFlatRows: 'getFilteredFlatRows',
  getGroupedFlatRows: 'getGroupedFlatRows',

  // Selection
  toggleRowSelected: 'row:select',
  toggleRowExpanded: 'row:expand',
  toggleAllRowsSelected: 'all:select',
  toggleAllRowsExpanded: 'all:expand',
} as const
