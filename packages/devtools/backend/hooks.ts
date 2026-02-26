// Integration Hooks for DevTools

import { useEffect, useRef } from 'react'
import { isGridKitTable } from './detector'

// Hook to register table with DevTools
export function useDevToolsTable(table: any, enabled: boolean = true): void {
  const tableRef = useRef(table)
  const enabledRef = useRef(enabled)
  const tableIdRef = useRef<string | null>(null)
  const registeredRef = useRef(false)
  const attemptRef = useRef(0)

  // Update refs without triggering re-renders
  useEffect(() => {
    tableRef.current = table
    enabledRef.current = enabled

    // Generate or preserve table ID only once
    if (table && !tableIdRef.current) {
      tableIdRef.current = (table.options?.meta?.tableId as string) ||
                          `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    // Run only on mount and when enabled changes
  }, [enabled])

  useEffect(() => {
    if (!enabledRef.current) {
      console.log('[GridKit DevTools] useDevToolsTable: disabled')
      return
    }
    if (registeredRef.current) {
      console.log('[GridKit DevTools] useDevToolsTable: already registered')
      return
    }

    const tableInstance = tableRef.current
    const tableId = tableIdRef.current

    console.log('[GridKit DevTools] useDevToolsTable: starting registration for table:', tableId)

    if (!tableInstance) {
      console.warn('[GridKit DevTools] useDevToolsTable: No table instance provided')
      return
    }

    if (!isGridKitTable(tableInstance)) {
      console.warn('[GridKit DevTools] useDevToolsTable: Table is not a GridKit Enhanced Table')
      console.log('[GridKit DevTools] useDevToolsTable: Table methods:', {
        getState: typeof tableInstance.getState,
        getRowModel: typeof tableInstance.getRowModel,
        getAllColumns: typeof tableInstance.getAllColumns,
        getAllFlatColumns: typeof tableInstance.getAllFlatColumns,
        tableId: tableInstance.options?.tableId || tableInstance.options?.meta?.tableId
      })
      return
    }

    console.log('[GridKit DevTools] useDevToolsTable: Table is valid, checking backend...')

    // Wait for backend to be ready (with timeout)
    const waitForBackend = (attempts = 0, maxAttempts = 20) => {
      attemptRef.current = attempts
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__

      console.log(`[GridKit DevTools] useDevToolsTable: Attempt ${attempts}/${maxAttempts}`)
      console.log('[GridKit DevTools] useDevToolsTable: Backend exists:', !!backend)
      console.log('[GridKit DevTools] useDevToolsTable: Backend.registerTable:', typeof backend?.registerTable)
      console.log('[GridKit DevTools] useDevToolsTable: Content exists:', !!content)
      console.log('[GridKit DevTools] useDevToolsTable: Content.registerTable:', typeof content?.registerTable)

      if (backend && typeof backend.registerTable === 'function') {
        console.log('[GridKit DevTools] useDevToolsTable: Registering with backend...')
        backend.registerTable(tableId, tableInstance)
        console.log('[GridKit DevTools] useDevToolsTable: Registered table with backend:', tableId)
        registeredRef.current = true
        return
      }

      // Also try via content script
      if (content && typeof content.registerTable === 'function') {
        console.log('[GridKit DevTools] useDevToolsTable: Registering via content script...')
        content.registerTable(tableId, tableInstance)
        console.log('[GridKit DevTools] useDevToolsTable: Registered table via content script:', tableId)
        registeredRef.current = true
        return
      }

      if (attempts < maxAttempts) {
        console.log('[GridKit DevTools] useDevToolsTable: Backend not ready, waiting 100ms...')
        setTimeout(() => waitForBackend(attempts + 1, maxAttempts), 100)
      } else {
        console.error('[GridKit DevTools] useDevToolsTable: Backend not available after', maxAttempts, 'attempts')
        console.error('[GridKit DevTools] useDevToolsTable: window keys with GRIDKIT:', Object.keys(window).filter(k => k.includes('GRIDKIT')))
        console.error('[GridKit DevTools] useDevToolsTable: Backend object:', backend)
        console.error('[GridKit DevTools] useDevToolsTable: Content object:', content)
      }
    }

    waitForBackend()

    // Cleanup - only run on unmount, not on re-render
    return () => {
      console.log('[GridKit DevTools] useDevToolsTable: cleanup for table:', tableId)
      const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__
      if (backend && typeof backend.unregisterTable === 'function') {
        backend.unregisterTable(tableId)
        console.log('[GridKit DevTools] useDevToolsTable: Unregistered table from backend:', tableId)
      }

      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__
      if (content && typeof content.unregisterTable === 'function') {
        content.unregisterTable(tableId)
      }

      registeredRef.current = false
    }
  }, []) // Empty dependency array - run only on mount
}

// Hook to auto-detect and register all GridKit tables
// Note: Auto-detection is now handled by content script injection
export function useAutoDetectDevTools(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return

    console.log('[GridKit DevTools] Auto-detection enabled - content script will inject backend')

    return () => {
      console.log('[GridKit DevTools] Auto-detection disabled')
    }
  }, [enabled])
}

// Helper to get DevTools backend from page context
export function getDevToolsBackend(): any {
  return (window as any).__GRIDKIT_DEVTOOLS_BACKEND__
}

// Helper to check if DevTools is connected
export function isDevToolsConnected(): boolean {
  const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__
  return !!backend
}

// Helper to send a command to DevTools
export async function sendDevToolsCommand<T = any>(command: any): Promise<T> {
  const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__
  if (!backend) {
    throw new Error('[GridKit DevTools] Backend not available. Extension may not be loaded.')
  }
  return backend.send(command)
}

// Setup function for non-React environments
export function setupDevTools(table: any, enabled: boolean = true): () => void {
  if (!enabled) return () => {}

  if (!isGridKitTable(table)) {
    console.warn('[GridKit DevTools] Cannot setup: table is not a GridKit Enhanced Table')
    return () => {}
  }

  const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__
  if (backend && backend.registerTable) {
    backend.registerTable(table)
    console.log('[GridKit DevTools] Registered table with backend')
  } else {
    console.warn('[GridKit DevTools] Backend not available for registration')
  }

  return () => {
    if (backend && backend.unregisterTable) {
      backend.unregisterTable(table)
      console.log('[GridKit DevTools] Unregistered table from backend')
    }
  }
}

// Interface for enhanced table options with DevTools support
export interface DevToolsTableOptions {
  debug?: {
    devtools?: boolean
    devtoolsEnabled?: boolean
  }
}
