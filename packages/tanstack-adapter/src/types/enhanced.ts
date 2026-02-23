// Enhanced types for TanStack Table adapter

import type { Table as TanStackTable } from '@tanstack/react-table'

// GridKit types (will be imported from @gridkit/core)
export interface EventBus {
  on<T extends string>(event: T, handler: (event: any) => void): () => void
  off<T extends string>(event: T, handler: (event: any) => void): void
  emit<T extends string>(event: T, payload: any, options?: any): void
  use(middleware: any): () => void
}

export interface PerformanceMonitor {
  getOperationStats(operation: string): any
  getMemoryMetrics(): any
}

export interface ValidationManager {
  validateRow(row: any, index: number): Promise<any>
  validateAll(rows?: any[]): Promise<any>
}

export interface Plugin {
  id: string
  initialize(context: any): Promise<void>
  destroy?(): Promise<void>
}

export interface PluginManager {
  register(plugin: Plugin): void
  unregister(pluginId: string): void
  get(pluginId: string): Plugin | undefined
}

// Enhanced table interface that extends TanStack Table
export interface EnhancedTable<TData> extends TanStackTable<TData> {
  // Event features
  on: EventBus['on']
  off: EventBus['off']
  emit: EventBus['emit']
  use: EventBus['use']

  // Performance features
  metrics?: PerformanceMonitor

  // Validation features
  validator?: ValidationManager
  validateRow?: (row: TData, index: number) => Promise<any>
  validateAll?: () => Promise<any>

  // Plugin features
  registerPlugin?: (plugin: Plugin) => void
  unregisterPlugin?: (pluginId: string) => void
  getPlugin?: (pluginId: string) => Plugin | undefined
}

// Configuration interfaces
export interface EnhancedTableFeatures {
  events?: EventConfig | boolean
  performance?: PerformanceConfig | boolean
  validation?: ValidationConfig | boolean
  plugins?: Plugin[]
  debug?: DebugConfig | boolean
}

export interface EventConfig {
  middleware?: any[]
}

export interface PerformanceConfig {
  budgets?: Record<string, number>
  alerts?: {
    enabled: boolean
    destinations?: string[]
  }
}

export interface ValidationConfig {
  mode?: 'strict' | 'normal' | 'minimal' | 'none'
  autoFix?: boolean
  cache?: boolean
}

export interface DebugConfig {
  events?: boolean
  performance?: boolean
  validation?: boolean
  memory?: boolean
  timeTravel?: boolean
}
