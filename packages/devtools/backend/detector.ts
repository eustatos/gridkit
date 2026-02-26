// GridKit Table Auto-Detection

// Detect if a table is a GridKit Enhanced Table
export function isGridKitTable(table: any): boolean {
  if (!table) return false

  // Check for GridKit-specific properties
  const hasGetState = typeof table.getState === 'function'
  const hasGetRowModel = typeof table.getRowModel === 'function'
  const hasGetColumns = typeof table.getAllColumns === 'function' || typeof table.getAllFlatColumns === 'function'
  const hasTableId = table.options?.tableId !== undefined || table.options?.meta?.tableId !== undefined

  // on/off are optional - they may be stubs or full implementations
  const hasOn = typeof table.on === 'function'
  const hasOff = typeof table.off === 'function'

  // Log for debugging
  if (!hasGetState) console.log('[GridKit DevTools] Missing getState')
  if (!hasGetRowModel) console.log('[GridKit DevTools] Missing getRowModel')
  if (!hasGetColumns) console.log('[GridKit DevTools] Missing getAllColumns/getAllFlatColumns')
  if (!hasTableId) console.log('[GridKit DevTools] Missing tableId in options')

  // Core requirements (on/off are optional)
  const isValid = (
    hasGetState &&
    hasGetRowModel &&
    hasGetColumns &&
    hasTableId
  )

  return isValid
}

// Detect all GridKit tables on the page
export function detectGridKitTables(): any[] {
  const tables: any[] = []

  // Check window for __GRIDKIT_TABLES__ (if tables are registered globally)
  if (typeof window !== 'undefined') {
    const gridKitTables = (window as any).__GRIDKIT_TABLES__
    if (gridKitTables instanceof Map) {
      for (const table of gridKitTables.values()) {
        if (isGridKitTable(table)) {
          tables.push(table)
        }
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
      const renderers = Object.values(hook.rendererIDToRenderer) as any[]
      for (const renderer of renderers) {
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
  // or being passed to backend.registerTable()
}

// Auto-register all detected tables
// Note: This function is deprecated - use content script injection instead
export function autoRegisterTables(): void {
  console.log('[GridKit DevTools] autoRegisterTables is deprecated - use content script injection')
}

// Setup auto-detection with polling
// Note: This function is deprecated - use content script injection instead
export function setupAutoDetection(pollInterval: number = 1000): () => void {
  console.log('[GridKit DevTools] setupAutoDetection is deprecated - use content script injection')
  return () => {}
}

// Listen for table creation events
export function listenForTableEvents(callback: (table: any) => void): () => void {
  // Monitor window.__GRIDKIT_TABLES__ for changes
  if (typeof window !== 'undefined') {
    const tables = (window as any).__GRIDKIT_TABLES__

    if (tables instanceof Map) {
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
      }) as Map<any, any>

      // Replace the original with the proxy
      (window as any).__GRIDKIT_TABLES__ = proxy

      return () => {
        (window as any).__GRIDKIT_TABLES__ = tables
      }
    }
  }

  // Fallback: no monitoring available
  return () => {}
}
