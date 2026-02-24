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
    const tableId = this.generateTableId(table)
    
    if (this.tables.has(tableId)) {
      console.warn(`Table ${tableId} is already registered`)
      return
    }

    this.tables.set(tableId, table)
    this.setupTableListeners(tableId, table)

    const metadata = this.getTableMetadata(table)
    this.tableMetadata.set(tableId, metadata)

    // Send registration event
    this.bridge.send({
      type: TABLE_REGISTERED,
      payload: {
        table: metadata,
        timestamp: Date.now()
      }
    })
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

  // Command handlers
  private setupMessageHandlers(): void {
    // GET_TABLES
    this.bridge.onCommand('GET_TABLES', () => {
      return Array.from(this.tableMetadata.entries()).map(([id, metadata]) => ({
        id,
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
    // State changes
    const unsubscribeState = table.subscribe((state: any) => {
      this.bridge.send({
        type: 'STATE_UPDATE',
        tableId,
        payload: {
          state,
          timestamp: Date.now()
        }
      })
    })

    // Events
    const unsubscribeEvents = table.on('*', (event: any) => {
      this.bridge.send({
        type: 'EVENT_LOGGED',
        tableId,
        payload: {
          event,
          timestamp: Date.now()
        }
      })
    })

    // Performance updates
    const unsubscribePerformance = table.on('performance:measured', (metrics: any) => {
      this.bridge.send({
        type: 'PERFORMANCE_UPDATE',
        tableId,
        payload: {
          metrics,
          timestamp: Date.now()
        }
      })
    })

    // Memory updates
    const unsubscribeMemory = table.on('memory:measured', (snapshot: any) => {
      this.bridge.send({
        type: 'MEMORY_UPDATE',
        tableId,
        payload: {
          snapshot,
          timestamp: Date.now()
        }
      })
    })

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

    return {
      id: table.options?.tableId || this.generateTableId(table),
      rowCount,
      columnCount,
      state: table.getState?.() || {},
      performance: table.debug?.getPerformanceMetrics?.(),
      memory: table.debug?.getMemoryUsage?.(),
      options: table.options
    }
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
  window.__GRIDKIT_DEVTOOLS__ = devToolsBackend
}
