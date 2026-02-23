// Event enhancer for TanStack Table adapter
// Simplified - creates basic event bus without core dependencies

import type { Table as TanStackTable } from '@tanstack/react-table'
import type { EnhancedTable, EventConfig } from '../types/enhanced'

// Minimal event bus implementation
interface EventBus {
  on<T extends string>(event: T, handler: (event: any) => void): () => void
  off<T extends string>(event: T, handler: (event: any) => void): void
  emit<T extends string>(event: T, payload: any, options?: any): void
  use(middleware: any): () => void
}

class SimpleEventBus implements EventBus {
  private handlers: Map<string, Set<(event: any) => void>> = new Map()

  on<T extends string>(event: T, handler: (event: any) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off<T extends string>(event: T, handler: (event: any) => void): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  emit<T extends string>(event: T, payload: any, options?: any): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler({ type: event, payload, ...options }))
    }
  }

  use(_middleware: any): () => void {
    // Middleware not implemented in simplified version
    return () => {}
  }
}

/**
 * High-order function to add event features to TanStack Table
 */
export function withEvents<TData>(
  table: TanStackTable<TData>,
  _config?: EventConfig | boolean
): EnhancedTable<TData> {
  // Create event bus
  const eventBus = new SimpleEventBus()

  // Wrap table with event methods
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
  } as EnhancedTable<TData>

  return enhancedTable
}

/**
 * Enhanced version of TanStack useTable with events
 */
export function useTableWithEvents(options: any) {
  // First create TanStack table
  const table = options.useTable(options)

  // Add events
  const enhanced = withEvents(table, options.features?.events)

  // Track table for cleanup
  return enhanced
}
