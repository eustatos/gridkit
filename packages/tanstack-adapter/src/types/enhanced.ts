// Enhanced types for TanStack Table adapter

import type { Table as TanStackTable } from '@tanstack/react-table'

// Simpler local types to avoid circular dependencies

export interface EnhancedTable<TData> extends TanStackTable<TData> {
  on?: (event: string, handler: (event: any) => void | Promise<void>) => (() => void)
  off?: (event: string, handler: (event: any) => void) => void
  emit?: (event: string, payload: any) => void
  use?: (middleware: any) => (() => void)
  getStats?: () => any
  metrics?: {
    getMetrics?: () => any
    checkBudgets?: () => any[]
    setBudgets?: (budgets: any) => void
    clear?: () => void
  }
  validator?: {
    validateRow?: (row: TData, index: number) => Promise<any>
    validateAll?: () => Promise<any>
  }
  validateRow?: (row: TData, index: number) => Promise<any>
  validateAll?: () => Promise<any>
  registerPlugin?: (plugin: any) => void
  unregisterPlugin?: (pluginId: string) => void
  getPlugin?: (pluginId: string) => any
  pluginManager?: any
}

export interface EnhancedTableFeatures {
  events?: any | boolean
  performance?: any | boolean
  validation?: any | boolean
  plugins?: any[]
  debug?: any | boolean
}

// Event configuration for table-level event enhancement
export interface EventConfig {
  devMode?: boolean
  middleware?: any[]
}

// Performance configuration for table-level performance monitoring
export interface PerformanceConfig {
  budgets?: {
    tableCreation?: number
    rowRendering?: number
    cellRendering?: number
  }
  enabled?: boolean
}
