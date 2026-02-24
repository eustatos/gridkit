// Integration Hooks for DevTools

import { useEffect, useRef } from 'react'
import { devToolsBackend } from './DevToolsBackend'
import { isGridKitTable } from './detector'

// Hook to register table with DevTools
export function useDevToolsTable(table: any, enabled: boolean = true): void {
  const tableRef = useRef(table)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    tableRef.current = table
    enabledRef.current = enabled
  }, [table, enabled])

  useEffect(() => {
    if (!enabledRef.current) return

    const tableInstance = tableRef.current

    if (!tableInstance) {
      console.warn('[GridKit DevTools] No table instance provided')
      return
    }

    if (!isGridKitTable(tableInstance)) {
      console.warn('[GridKit DevTools] Table is not a GridKit Enhanced Table')
      return
    }

    // Register table
    devToolsBackend.registerTable(tableInstance)

    // Cleanup
    return () => {
      devToolsBackend.unregisterTable(tableInstance)
    }
  }, [table, enabled])
}

// Hook to auto-detect and register all GridKit tables
export function useAutoDetectDevTools(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return

    const { setupAutoDetection } = require('./detector')
    const cleanupAutoDetection = setupAutoDetection()

    return () => {
      cleanupAutoDetection?.()
    }
  }, [enabled])
}

// Helper to get DevTools backend
export function getDevToolsBackend(): typeof devToolsBackend {
  return devToolsBackend
}

// Helper to check if DevTools is connected
export function isDevToolsConnected(): boolean {
  const backend = devToolsBackend as any
  return backend.bridge.isConnected()
}

// Helper to send a command to DevTools
export async function sendDevToolsCommand<T = any>(command: any): Promise<T> {
  const backend = devToolsBackend as any
  return backend.bridge.sendCommand(command)
}

// Setup function for non-React environments
export function setupDevTools(table: any, enabled: boolean = true): () => void {
  if (!enabled) return () => {}

  if (!isGridKitTable(table)) {
    console.warn('[GridKit DevTools] Cannot setup: table is not a GridKit Enhanced Table')
    return () => {}
  }

  devToolsBackend.registerTable(table)

  return () => {
    devToolsBackend.unregisterTable(table)
  }
}

// Interface for enhanced table options with DevTools support
export interface DevToolsTableOptions {
  debug?: {
    devtools?: boolean
    devtoolsEnabled?: boolean
  }
}
