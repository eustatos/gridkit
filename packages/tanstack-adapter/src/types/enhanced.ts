// Enhanced types for TanStack Table adapter

import type { Table as TanStackTable } from '@tanstack/react-table'
import type {
  EventBus,
  EventBusStats,
} from '@gridkit/core/events'
import type {
  PerformanceMonitor,
  PerformanceMetrics,
  PerformanceBudgets,
} from '@gridkit/core/performance'
import type {
  ValidationManager,
  ValidationResult,
  ValidationReport,
  ValidationMode,
} from '@gridkit/core/validation'
import type {
  Plugin,
  PluginManager,
} from '@gridkit/core/plugin'

export type {
  EventBus,
  PerformanceMonitor,
  ValidationManager,
  Plugin,
  PluginManager,
}

// Enhanced table interface that extends TanStack Table
export interface EnhancedTable<TData> extends TanStackTable<TData> {
  // Event features
  on: EventBus['on']
  off: EventBus['off']
  emit: EventBus['emit']
  use: EventBus['use']
  getStats?: () => EventBusStats

  // Performance features
  metrics?: PerformanceMonitor & {
    getMetrics: () => PerformanceMetrics
    checkBudgets: () => any[]
    setBudgets: (budgets: PerformanceBudgets) => void
  }

  // Validation features
  validator?: ValidationManager & {
    validateRow: (row: TData, index: number) => Promise<ValidationResult>
    validateAll: () => Promise<ValidationReport>
  }
  validateRow?: (row: TData, index: number) => Promise<ValidationResult>
  validateAll?: () => Promise<ValidationReport>

  // Plugin features
  registerPlugin?: (plugin: Plugin) => void
  unregisterPlugin?: (pluginId: string) => void
  getPlugin?: (pluginId: string) => Plugin | undefined
  pluginManager?: PluginManager
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
  devMode?: boolean
}

export interface PerformanceConfig {
  budgets?: PerformanceBudgets
  alerts?: {
    enabled: boolean
    destinations?: string[]
  }
  enabled?: boolean
  onViolation?: (violation: any) => void
}

export interface ValidationConfig {
  mode?: ValidationMode
  autoFix?: boolean
  cache?: boolean
  throwOnError?: boolean
}

export interface DebugConfig {
  events?: boolean
  performance?: boolean
  validation?: boolean
  memory?: boolean
  timeTravel?: boolean
}
