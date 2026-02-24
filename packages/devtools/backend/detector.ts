// GridKit Table Auto-Detection

import { devToolsBackend } from './DevToolsBackend'

// Detect if a table is a GridKit Enhanced Table
export function isGridKitTable(table: any): boolean {
  if (!table) return false

  // Check for GridKit-specific properties
  return (
    typeof table.getState === 'function' &&
    typeof table.subscribe === 'function' &&
    typeof table.on === 'function' &&
    typeof table.off === 'function' &&
    typeof table.getRowModel === 'function' &&
    typeof table.getAllColumns === 'function' &&
    table.options?.tableId !== undefined
  )
}

// Detect all GridKit tables on the page
export function detectGridKitTables(): any[] {
  const tables: any[] = []

  // Check window for __GRIDKIT_TABLES__ (if tables are registered globally)
  if (typeof window !== 'undefined' && window.__GRIDKIT_TABLES__ instanceof Map) {
    for (const table of window.__GRIDKIT_TABLES__.values()) {
      if (isGridKitTable(table)) {
        tables.push(table)
      }
    }
  }

  // Check for common GridKit hook patterns
  if (typeof window !== 'undefined') {
    // Look for tables in React component state
    const reactTables = findReactGridKitTables(window)
    tables.push(...reactTables)
  }

  return tables
}

// Find GridKit tables in React components
function findReactGridKitTables(root: Window): any[] {
  const tables: any[] = []

  // Try to find via React DevTools global (if available)
  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
    
    // Iterate through mounted roots
    if (hook.rendererIDToRenderer) {
      for (const renderer of Object.values(hook.rendererIDToRenderer)) {
        if (renderer.findFiberByHostInstance) {
          // Traverse React component tree
          traverseReactRoots(renderer, tables)
        }
      }
    }
  }

  return tables
}

// Traverse React component tree to find GridKit tables
function traverseReactRoots(renderer: any, tables: any[]): void {
  // This is a simplified version - in production, you might use React DevTools
  // API to traverse the component tree more reliably

  // For now, we'll rely on tables being registered in window.__GRIDKIT_TABLES__
  // or being passed to devToolsBackend.registerTable()
}

// Auto-register all detected tables
export function autoRegisterTables(): void {
  const tables = detectGridKitTables()

  tables.forEach((table) => {
    if (isGridKitTable(table)) {
      devToolsBackend.registerTable(table)
    }
  })

  return tables.length
}

// Setup auto-detection with polling
export function setupAutoDetection(pollInterval: number = 1000): void {
  // Register existing tables
  autoRegisterTables()

  // Poll for new tables
  const intervalId = setInterval(() => {
    autoRegisterTables()
  }, pollInterval)

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
  }
}

// Listen for table creation events
export function listenForTableEvents(callback: (table: any) => void): () => void {
  // Monitor window.__GRIDKIT_TABLES__ for changes
  if (typeof window !== 'undefined' && window.__GRIDKIT_TABLES__ instanceof Map) {
    const tables = window.__GRIDKIT_TABLES__

    // Create a proxy to monitor changes
    const proxy = new Proxy(tables, {
      set(target: Map<any, any>, prop: string | symbol, value: any): boolean {
        if (prop === 'size') return true
        if (isGridKitTable(value)) {
          callback(value)
        }
        return Reflect.set(target, prop, value)
      },
      deleteProperty(target: Map<any, any>, prop: string | symbol): boolean {
        return Reflect.deleteProperty(target, prop)
      }
    })

    // Replace the original with the proxy
    window.__GRIDKIT_TABLES__ = proxy

    return () => {
      window.__GRIDKIT_TABLES__ = tables
    }
  }

  // Fallback: no monitoring available
  return () => {}
}
