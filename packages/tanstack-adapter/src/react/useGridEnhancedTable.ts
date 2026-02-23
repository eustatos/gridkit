// React hooks for GridKit TanStack Adapter
// Implements ADAPTER-002: React Hooks Integration

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TableOptions as TanStackTableOptions, RowData } from '@tanstack/react-table'
import { useReactTable } from '@tanstack/react-table'
import type { EnhancedTable, EnhancedTableFeatures } from '../types/enhanced'
import { createEnhancedTable } from '../core/createEnhancedTable'

// Type for enhanced table options with GridKit features
export interface UseGridEnhancedTableOptions<TData extends RowData>
  extends TanStackTableOptions<TData> {
  features?: EnhancedTableFeatures
}

/**
 * Main hook for creating an enhanced GridKit table with TanStack Table
 */
export function useGridEnhancedTable<TData extends RowData>(
  options: UseGridEnhancedTableOptions<TData>
): EnhancedTable<TData> {
  const { features, ...tanstackOptions } = options

  // Create TanStack table instance
  const tanstackTable = useReactTable(tanstackOptions)

  // Create enhanced table with GridKit features
  const enhancedTable = useMemo(() => {
    return createEnhancedTable(tanstackTable, features)
  }, [tanstackTable, features])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      enhancedTable.emit?.('table:destroy', { tableId: 'unknown' })
      enhancedTable.metrics?.clear?.()
    }
  }, [enhancedTable, tanstackTable.options.meta, features])

  return enhancedTable
}

/**
 * Hook for managing table events
 */
export function useTableEvents<TData extends RowData>(
  table: EnhancedTable<TData>,
  eventHandlers: Record<string, (event: any) => void | Promise<void>>
): void {
  useEffect(() => {
    if (!table.on || !table.off) return

    const unsubscribers: Array<() => void> = []
    Object.entries(eventHandlers).forEach(([eventType, handler]) => {
      if (!table.on) return
      const unsub = table.on(eventType, handler as any)
      if (unsub) {
        unsubscribers.push(unsub)
      }
    })

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [table, eventHandlers])
}

/**
 * Hook for accessing performance metrics
 */
export function useTableMetrics<TData extends RowData>(
  table: EnhancedTable<TData>,
  refreshInterval?: number
): any {
  const [stats, setStats] = useStateMetrics(table.metrics)

  useEffect(() => {
    if (!refreshInterval || !table.metrics) return

    const interval = setInterval(() => {
      if (!table.metrics) return
      const metrics = table.metrics.getMetrics?.()
      setStats(metrics)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, table.metrics])

  return stats
}

function useStateMetrics(metrics: any) {
  const [stats, setStats] = useState(metrics?.getMetrics?.() ?? undefined)

  useEffect(() => {
    if (metrics) {
      setStats(metrics.getMetrics?.())
    }
  }, [metrics])

  return stats
}

/**
 * Hook for accessing validation status
 */
export function useTableValidation<TData extends RowData>(
  table: EnhancedTable<TData>,
  autoValidate: boolean = false
): {
  report: any | undefined
  validate: () => Promise<any>
  isValidating: boolean
} {
  const [report, setReport] = useState<any>()
  const [isValidating, setIsValidating] = useState(false)

  const validate = useCallback(async () => {
    if (!table.validateAll && !table.validator?.validateAll) {
      throw new Error('Validation not enabled')
    }

    setIsValidating(true)
    try {
      const result = await table.validateAll?.()
      setReport(result)
      return result
    } finally {
      setIsValidating(false)
    }
  }, [table.validateAll, table.validator])

  useEffect(() => {
    if (autoValidate) {
      validate()
    }
  }, [table.options.data, autoValidate, validate])

  return { report, validate, isValidating }
}

/**
 * Hook for accessing a registered plugin
 */
export function useTablePlugin<TData extends RowData, TPlugin = any>(
  table: EnhancedTable<TData>,
  pluginId: string
): TPlugin | undefined {
  const [plugin, setPlugin] = useState<TPlugin>()

  useEffect(() => {
    if (!table.getPlugin) return
    const found = table.getPlugin(pluginId) as TPlugin | undefined
    setPlugin(found)
  }, [table, pluginId])

  return plugin
}

/**
 * Hook for setting up enhanced features at once
 */
export function useEnhancedFeatures<TData extends RowData>(
  table: EnhancedTable<TData>,
  config?: {
    events?: Record<string, (event: any) => void | Promise<void>>
    metricsInterval?: number
    autoValidate?: boolean
  }
): {
  metrics?: any
  validation?: {
    report: any | undefined
    validate: () => Promise<any>
    isValidating: boolean
  }
} {
  useTableEvents(table, config?.events || {})
  const metrics = useTableMetrics(table, config?.metricsInterval)
  const validation = useTableValidation(table, config?.autoValidate)

  return useMemo(
    () => ({
      metrics,
      validation,
    }),
    [metrics, validation]
  )
}

/**
 * Hook for monitoring performance budgets
 */
export function useTablePerformance<TData extends RowData>(
  table: EnhancedTable<TData>,
  budgets?: Record<string, { maxTime: number; alert?: boolean }>
): void {
  useEffect(() => {
    if (!table.metrics || !budgets) return

    Object.entries(budgets).forEach(([operation, budget]) => {
      if (!table.metrics) return
      table.metrics.setBudgets?.({
        operations: { [operation]: budget.maxTime }
      })
    })

    const handleViolation = (event: any) => {
      console.warn('Performance budget exceeded:', event.payload)
    }

    const unsub = table.on && table.on('performance:budget:exceeded', handleViolation)

    return () => unsub?.()
  }, [table, budgets])
}

/**
 * Hook for subscribing to table state changes
 */
export function useTableState<TData extends RowData>(
  table: EnhancedTable<TData>,
  callback: (state: any) => void | Promise<void>
): void {
  useEffect(() => {
    if (!table.on) return

    const handler = (event: any) => {
      if (event.type === 'table:state' || event.type === 'table:update') {
        callback(event.payload)
      }
    }

    table.on?.('table:state', handler)
    table.on?.('table:update', handler)

    return () => {
      table.off?.('table:state', handler)
      table.off?.('table:update', handler)
    }
  }, [table, callback])
}

/**
 * Hook for managing selection state
 */
export function useTableSelection<TData extends RowData>(
  table: EnhancedTable<TData>
): [string[], (rowId: string, checked: boolean) => void] {
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])

  useEffect(() => {
    const state = table.getState?.() as any
    const rowSelection = state?.rowSelection ?? {}
    const selectedIds = Array.isArray(rowSelection) 
      ? rowSelection 
      : Object.keys(rowSelection)
    setSelectedRowIds(selectedIds)
  }, [table])

  const selectRow = useCallback(
    (rowId: string, checked: boolean) => {
      if (!table.setRowSelection) {
        console.warn('Selection not supported')
        return
      }

      setSelectedRowIds((prev) => {
        if (checked) {
          return Array.from(new Set([...prev, rowId]))
        } else {
          return prev.filter((id) => id !== rowId)
        }
      })

      table.setRowSelection((prev: any = {}) => {
        if (checked) {
          return { ...prev, [rowId]: true }
        } else {
          const { [rowId]: _, ...rest } = prev
          return rest
        }
      })
    },
    [table]
  )

  return [selectedRowIds, selectRow]
}

/**
 * Hook for accessing table metrics statistics
 */
export function useTableStats<TData extends RowData>(
  table: EnhancedTable<TData>
): {
  totalOperations: number
  avgTime?: number
  peakTime?: number
  operations: Record<string, number>
} {
  const [stats, setStats] = useState({
    totalOperations: 0,
    avgTime: undefined as number | undefined,
    peakTime: undefined as number | undefined,
    operations: {} as Record<string, number>,
  })

  useEffect(() => {
    if (!table.metrics) {
      setStats({ totalOperations: 0, avgTime: undefined, peakTime: undefined, operations: {} })
      return
    }

    const currentMetrics = table.metrics.getMetrics?.()
    if (currentMetrics && currentMetrics.operations) {
      let totalOps = 0
      let totalDuration = 0
      let peakTime = 0
      const ops: Record<string, number> = {}

      Object.entries(currentMetrics.operations).forEach(([key, val]: any) => {
        totalOps += val.count || 0
        totalDuration += val.totalTime || 0
        const maxTime = val.maxTime || 0
        if (maxTime > peakTime) peakTime = maxTime
        ops[key] = val.count || 0
      })

      setStats({
        totalOperations: totalOps,
        avgTime: totalOps > 0 ? totalDuration / totalOps : undefined,
        peakTime: peakTime > 0 ? peakTime : undefined,
        operations: ops,
      })
    }
  }, [table.metrics])

  return stats
}

/**
 * Hook for table performance budgets check
 */
export function useTableBudgets<TData extends RowData>(
  table: EnhancedTable<TData>
): {
  budgets: Record<string, number>
  violations: any[]
  check: () => any[]
} {
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [violations, setViolations] = useState<any[]>([])

  useEffect(() => {
    if (!table.metrics) return

    const currentMetrics = table.metrics.getMetrics?.()
    const currentBudgets = currentMetrics?.budgets ?? {}
    setBudgets(currentBudgets)

    const currentViolations = table.metrics.checkBudgets?.() ?? []
    setViolations(currentViolations)

    const handleViolation = (event: any) => {
      setViolations((prev) => [...prev, event.payload])
    }

    table.on?.('performance:budget:exceeded', handleViolation)

    return () => {
      table.off?.('performance:budget:exceeded', handleViolation)
    }
  }, [table.metrics])

  const check = useCallback(() => {
    if (!table.metrics) return []
    const violations = table.metrics.checkBudgets?.() ?? []
    setViolations(violations)
    return violations
  }, [table.metrics])

  return { budgets, violations, check }
}
