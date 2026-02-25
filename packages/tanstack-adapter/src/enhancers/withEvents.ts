// Event enhancer for TanStack Table adapter
// Uses GridKit core EventBus for full event system features

import type { Table as TanStackTable, RowData } from '@tanstack/react-table'
import type { EnhancedTable } from '../types/enhanced'
import { EventBus, createEventBus } from '@gridkit/core/events'
import { useMemo } from 'react'
import { useReactTable } from '@tanstack/react-table'

/**
 * High-order function to add event features to TanStack Table
 */
export function withEvents<TData extends RowData>(
  table: TanStackTable<TData>,
  config?: { devMode?: boolean } | boolean
): EnhancedTable<TData> {
  // Create event bus from core
  const eventConfig = typeof config === 'boolean' ? {} : config ?? {}
  const eventBus = createEventBus({
    devMode: eventConfig.devMode ?? true,
  })

  // Wrap table with event methods from GridKit core
  const enhancedTable = {
    ...table,
    on: (event: string, handler: (event: any) => void) => {
      return eventBus.on(event, handler)
    },
    off: (event: string, handler: (event: any) => void) => {
      eventBus.off(event, handler)
    },
    emit: (event: string, payload: any, options?: any) => {
      eventBus.emit(event, payload, options)
    },
    use: (middleware: any) => {
      return eventBus.use(middleware)
    },
    getStats: () => eventBus.getStats(),
  } as EnhancedTable<TData>

  return enhancedTable
}

/**
 * Create enhanced table with events from options
 */
export function createEnhancedTableWithEvents<TData extends RowData>(
  options: any,
  config?: { devMode?: boolean } | boolean
): EnhancedTable<TData> {
  // First create TanStack table
  const tanstackTable = useReactTable(options)

  // Add events
  return withEvents(tanstackTable, config)
}

/**
 * Enhanced version of TanStack useTable with events
 */
export function useTableWithEvents<TData extends RowData>(
  options: any,
  config?: { devMode?: boolean } | boolean
): EnhancedTable<TData> {
  // First create TanStack table
  const tanstackTable = useReactTable(options)

  // Add events using useMemo for stability
  return useMemo(() => {
    return withEvents(tanstackTable, config)
  }, [tanstackTable, config])
}
