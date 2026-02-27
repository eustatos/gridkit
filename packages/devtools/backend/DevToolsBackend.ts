// DevTools Backend - Table Integration

import { devToolsBridge } from '../bridge/DevToolsBridge'
import type {
  DevToolsCommand,
  TableMetadata
} from '../bridge/protocol'

import { TABLE_REGISTERED, TABLE_UNREGISTERED } from '../bridge/messages'

type TableHandler<T = any> = (payload: any) => T | Promise<T>

export class DevToolsBackend {
  private bridge = devToolsBridge
  private tables: Map<string, any> = new Map()
  private tableMetadata: Map<string, TableMetadata> = new Map()

  constructor() {
    this.setupMessageHandlers()
  }

  // Table registration
  registerTable(table: any): void {
    if (!table) {
      console.warn('[GridKit DevTools] Cannot register null/undefined table')
      return
    }
    
    const tableId = this.generateTableId(table)
    
    if (this.tables.has(tableId)) {
      console.warn(`Table ${tableId} is already registered`)
      return
    }

    this.tables.set(tableId, table)
    this.setupTableListeners(tableId, table)

    const metadata = this.getTableMetadata(table)
    this.tableMetadata.set(tableId, metadata)
    console.log('[GridKit DevTools] Registered table:', tableId, metadata)

    // Send registration event
    this.bridge.send({
      type: TABLE_REGISTERED,
      payload: {
        table: metadata,
        timestamp: Date.now()
      }
    })
    console.log('[GridKit DevTools] Sent TABLE_REGISTERED event')
  }

  unregisterTable(table: any): void {
    const tableId = this.findTableId(table)
    if (!tableId) return

    const metadata = this.tableMetadata.get(tableId)
    if (metadata) {
      this.bridge.send({
        type: TABLE_UNREGISTERED,
        payload: {
          tableId,
          timestamp: Date.now()
        }
      })
    }

    this.tables.delete(tableId)
    this.tableMetadata.delete(tableId)
  }

  // Get all registered tables
  getTables(): TableMetadata[] {
    return Array.from(this.tableMetadata.values())
  }

  // Get table by ID
  getTable(tableId: string): any | undefined {
    return this.tables.get(tableId)
  }

  // Send performance update (for direct calls from adapters)
  sendPerformanceUpdate(tableId: string, metrics: any): void {
    this.bridge.send({
      type: 'PERFORMANCE_UPDATE',
      tableId,
      payload: {
        metrics,
        timestamp: Date.now()
      }
    })
  }

  // Command handlers
  private setupMessageHandlers(): void {
    // GET_TABLES
    this.bridge.onCommand('GET_TABLES', () => {
      return Array.from(this.tableMetadata.entries()).map(([id, metadata]) => ({
        ...metadata
      }))
    })

    // GET_STATE
    this.bridge.onCommand('GET_STATE', ({ tableId }: { tableId: string }) => {
      const table = this.tables.get(tableId)
      return table ? table.getState() : null
    })

    // GET_EVENTS
    this.bridge.onCommand('GET_EVENTS', ({ tableId, filter }: { tableId: string, filter?: any }) => {
      const table = this.tables.get(tableId)
      return table?.debug?.getEventHistory?.(filter) ?? []
    })

    // GET_PERFORMANCE
    this.bridge.onCommand('GET_PERFORMANCE', ({ tableId }: { tableId: string }) => {
      const table = this.tables.get(tableId)
      return table?.debug?.getPerformanceMetrics?.() ?? null
    })

    // TIME_TRAVEL
    this.bridge.onCommand('TIME_TRAVEL', ({ tableId, timestamp }: { tableId: string, timestamp: number }) => {
      const table = this.tables.get(tableId)
      return table?.debug?.timeTravel?.({ to: timestamp }) ?? null
    })

    // GET_MEMORY
    this.bridge.onCommand('GET_MEMORY', ({ tableId }: { tableId: string }) => {
      const table = this.tables.get(tableId)
      return table?.debug?.getMemoryUsage?.() ?? null
    })

    // GET_PLUGINS
    this.bridge.onCommand('GET_PLUGINS', ({ tableId }: { tableId: string }) => {
      const table = this.tables.get(tableId)
      return table?.debug?.getPlugins?.() ?? []
    })

    // GET_SNAPSHOTS
    this.bridge.onCommand('GET_SNAPSHOTS', ({ tableId }: { tableId: string }) => {
      const table = this.tables.get(tableId)
      return table?.debug?.getSnapshots?.() ?? []
    })
  }

  // Table monitoring setup
  private setupTableListeners(tableId: string, table: any): void {
    // State changes (optional - only if table.subscribe exists)
    let unsubscribeState: (() => void) | undefined
    if (typeof table.subscribe === 'function') {
      unsubscribeState = table.subscribe((state: any) => {
        this.bridge.send({
          type: 'STATE_UPDATE',
          tableId,
          payload: {
            state,
            timestamp: Date.now()
          }
        })
      })
    } else {
      console.log('[GridKit DevTools] table.subscribe not available - using polling for state updates')
      // Fallback: poll for state changes
      const pollInterval = setInterval(() => {
        const currentState = table.getState?.()
        if (currentState) {
          this.bridge.send({
            type: 'STATE_UPDATE',
            tableId,
            payload: {
              state: currentState,
              timestamp: Date.now()
            }
          })
        }
      }, 500)
      unsubscribeState = () => clearInterval(pollInterval)
    }

    // Events (optional - only if table.on exists)
    let unsubscribeEvents: (() => void) | undefined
    if (typeof table.on === 'function') {
      unsubscribeEvents = table.on('*', (event: any) => {
        this.bridge.send({
          type: 'EVENT_LOGGED',
          tableId,
          payload: {
            event,
            timestamp: Date.now()
          }
        })
      })
    }

    // Performance updates (optional)
    let unsubscribePerformance: (() => void) | undefined
    if (typeof table.on === 'function') {
      unsubscribePerformance = table.on('performance:measured', (metrics: any) => {
        this.bridge.send({
          type: 'PERFORMANCE_UPDATE',
          tableId,
          payload: {
            metrics,
            timestamp: Date.now()
          }
        })
      })
    }

    // Memory updates (optional)
    let unsubscribeMemory: (() => void) | undefined
    if (typeof table.on === 'function') {
      unsubscribeMemory = table.on('memory:measured', (snapshot: any) => {
        this.bridge.send({
          type: 'MEMORY_UPDATE',
          tableId,
          payload: {
            snapshot,
            timestamp: Date.now()
          }
        })
      })
    }

    // Store unsubscribe functions
    const tableData = this.tables.get(tableId)
    if (tableData) {
      tableData.unsubscribeState = unsubscribeState
      tableData.unsubscribeEvents = unsubscribeEvents
      tableData.unsubscribePerformance = unsubscribePerformance
      tableData.unsubscribeMemory = unsubscribeMemory
    }
  }

  private getTableMetadata(table: any): TableMetadata {
    const rowCount = table.getRowModel?.().rows?.length || 0
    const columnCount = table.getAllColumns?.().length || 0

    // Safely get state - clone to remove functions that can't be serialized
    let safeState: any = {}
    try {
      const rawState = table.getState?.()
      if (rawState && typeof rawState === 'object') {
        // Clone state to remove non-serializable properties
        safeState = this.cloneState(rawState)
      }
    } catch (e) {
      console.warn('[GridKit DevTools] Failed to get table state:', e)
    }

    return {
      id: table.options?.tableId || this.generateTableId(table),
      rowCount,
      columnCount,
      state: safeState,
      performance: table.debug?.getPerformanceMetrics?.(),
      memory: table.debug?.getMemoryUsage?.(),
      options: this.cloneState(table.options) // Clone options to remove non-serializable properties
    }
  }

  // Deep clone state object, removing non-serializable properties (functions, etc.)
  private cloneState(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return obj.toISOString()
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cloneState(item))
    }

    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip functions, symbols, and other non-serializable types
      if (typeof value !== 'function' && typeof value !== 'symbol') {
        result[key] = this.cloneState(value)
      }
    }

    return result
  }

  private generateTableId(table: any): string {
    return table.options?.tableId || `table-${Math.random().toString(36).substr(2, 9)}`
  }

  private findTableId(table: any): string | undefined {
    for (const [id, t] of this.tables.entries()) {
      if (t === table) return id
    }
    return undefined
  }

  // Cleanup
  cleanup(): void {
    this.tables.forEach((table, tableId) => {
      if (table.unsubscribeState) table.unsubscribeState()
      if (table.unsubscribeEvents) table.unsubscribeEvents()
      if (table.unsubscribePerformance) table.unsubscribePerformance()
      if (table.unsubscribeMemory) table.unsubscribeMemory()
    })

    this.tables.clear()
    this.tableMetadata.clear()
    this.bridge.disconnect()
  }
}

// Global instance
export const devToolsBackend = new DevToolsBackend()

// Auto-register tables if DevTools is enabled
if (typeof window !== 'undefined') {
  (window as any).__GRIDKIT_DEVTOOLS__ = devToolsBackend
}
