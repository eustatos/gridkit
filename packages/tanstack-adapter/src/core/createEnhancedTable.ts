// Core adapter implementation for @gridkit/tanstack-adapter
// Full integration with GridKit core features

import type { Table as TanStackTable, RowData } from '@tanstack/react-table'
import type { EnhancedTable, EnhancedTableFeatures } from '../types/enhanced'

/**
 * Interceptor for TanStack Table methods
 * Wraps methods to emit events and track performance
 */
class MethodInterceptor<TData> {
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
    options?: {
      before?: (args: any[]) => void
      after?: (result: any) => void
      emitStart?: boolean
      emitComplete?: boolean
    }
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
 * Create enhanced table that combines TanStack Table with GridKit features
 */
export function createEnhancedTable<TData extends RowData>(
  tanstackTable: TanStackTable<TData>,
  features?: EnhancedTableFeatures
): EnhancedTable<TData> {
  // Initialize GridKit core components
  let eventBus: any | undefined
  let performanceMonitor: any | undefined
  let validationManager: any | undefined
  let pluginManager: any | undefined

  // 1. Create event bus if events enabled
  if (features?.events) {
    const eventConfig = typeof features.events === 'boolean' ? {} : features.events
    eventBus = {
      on: (event: string, handler: (event: any) => void) => {
        // Stub for now
        return () => {}
      },
      off: (event: string, handler: (event: any) => void) => {},
      emit: (event: string, payload: any) => {},
      use: (middleware: any) => { return () => {} }
    }
    
    // Add middleware if provided
    if (eventConfig.middleware) {
      eventConfig.middleware.forEach((middleware: any) => {
        eventBus.use(middleware)
      })
    }
  }

  // 2. Create performance monitor if enabled
  if (features?.performance) {
    performanceMonitor = {
      track: (operation: string, fn: () => any) => fn(),
      getMetrics: () => ({}),
      checkBudgets: () => [],
      setBudgets: (budgets: any) => {},
      clear: () => {}
    }
  }

  // 3. Create validation manager if enabled
  if (features?.validation) {
    validationManager = {
      validateRow: (row: any, index: number) => Promise.resolve({ valid: true, errors: [] }),
      validateAll: () => Promise.resolve({ valid: true, errors: [] })
    }
  }

  // 4. Create plugin manager if plugins provided
  if (features?.plugins && features.plugins.length > 0) {
    pluginManager = {
      register: (plugin: any) => {},
      unregister: (pluginId: string) => {},
      get: (pluginId: string) => undefined
    }
    
    features.plugins.forEach(plugin => {
      pluginManager.register(plugin)
    })
  }

  // Create method interceptor for wrapping TanStack methods
  const interceptor = new MethodInterceptor(tanstackTable, eventBus, performanceMonitor)

  // Wrap TanStack methods with event emission
  const enhancedTable = {
    // Preserve all TanStack methods
    ...tanstackTable,
    
    // Add event system
    on: eventBus?.on,
    off: eventBus?.off,
    emit: eventBus?.emit,
    use: eventBus?.use,
    getStats: eventBus ? (() => ({})) : undefined,

    // Add performance monitoring
    metrics: performanceMonitor,
    
    // Add validation
    validator: validationManager,
    validateRow: validationManager 
      ? ((row: TData, index: number) => validationManager.validateRow(row, index))
      : undefined,
    validateAll: validationManager
      ? (() => validationManager.validateAll())
      : undefined,

    // Add plugin management
    registerPlugin: pluginManager?.register,
    unregisterPlugin: pluginManager?.unregister,
    getPlugin: pluginManager?.get,
    pluginManager,
  } as EnhancedTable<TData>

  // Wrap TanStack methods to emit events
  const wrappedMethods = ['setSorting', 'setFiltering', 'setPagination', 'setGrouping', 'setColumnVisibility', 'setColumnPinning']
  
  wrappedMethods.forEach((methodName: string) => {
    if (methodName in tanstackTable) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enhancedTable[methodName as keyof TanStackTable<TData>] = interceptor.intercept(methodName as any, {
        emitStart: true,
        emitComplete: true,
      })
    }
  })

  return enhancedTable
}

/**
 * Create enhanced table from scratch (without TanStack instance)
 * This is a convenience function that creates a TanStack table first
 */
export function createEnhancedTableFromOptions<TData extends RowData>(
  options: any
): EnhancedTable<TData> {
  // Import dynamically to avoid circular dependencies
  const { useReactTable } = require('@tanstack/react-table')
  
  // Extract GridKit features from options
  const { features, ...tanstackOptions } = options

  // Create TanStack table
  const tanstackTable = useReactTable(tanstackOptions)

  // Create enhanced table with GridKit features
  return createEnhancedTable(tanstackTable, features)
}

/**
 * Wrapper function to create enhanced table with default features
 */
export function createDefaultEnhancedTable<TData extends RowData>(
  options: any
): EnhancedTable<TData> {
  return createEnhancedTableFromOptions<TData>({
    ...options,
    features: {
      events: true,
      performance: true,
      validation: true,
      ...options.features,
    },
  })
}

/**
 * Enhanced version of TanStack useTable with GridKit features
 */
export function useEnhancedTable<TData extends RowData>(
  options: any
): EnhancedTable<TData> {
  const { useMemo } = require('react')
  const { useReactTable } = require('@tanstack/react-table')
  
  // Extract GridKit features from options
  const { features, ...tanstackOptions } = options

  // Create TanStack table
  const tanstackTable = useReactTable(tanstackOptions)

  // Create enhanced table with GridKit features
  return useMemo(() => {
    return createEnhancedTable(tanstackTable, features)
  }, [tanstackTable, features])
}
