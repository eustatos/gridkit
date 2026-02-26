/**
 * GridKit DevTools Backend Script
 * 
 * This script runs in the page context and provides the backend API
 * for the DevTools extension. It handles table registration and
 * communication with the content script.
 */

(function() {
  'use strict'

  console.log('[GridKit DevTools] Backend script executing')

  // Check if backend is already initialized
  if (window.__GRIDKIT_DEVTOOLS_BACKEND__) {
    console.log('[GridKit DevTools] Backend already initialized')
    return
  }

  // Registered tables registry
  const registeredTables = new Map()

  // Command handlers
  const commandHandlers = new Map()

  // Listen for messages from content script
  window.addEventListener('message', function(event) {
    if (event.source !== window) return
    if (!event.data || typeof event.data !== 'object') return
    if (event.data.source !== 'gridkit-devtools-content') return

    const message = event.data

    switch (message.type) {
      case 'CONTENT_READY':
        // Notify content script that backend is ready
        window.postMessage({
          source: 'gridkit-devtools-backend',
          type: 'BACKEND_READY',
          timestamp: Date.now()
        }, '*')
        break

      case 'GET_TABLES_REQUEST':
        // Send tables list to content script
        // Only send serializable data (no functions or React components)
        const tables = Array.from(registeredTables.entries()).map(([id, table]) => {
          // Get basic table info only
          return {
            id,
            rowCount: table.getRowModel?.().rows?.length || 0,
            columnCount: table.getAllColumns?.().length || 0,
            // Get simple state (pagination, sorting, etc.)
            state: {
              pagination: table.getState?.()?.pagination || null,
              sorting: table.getState?.()?.sorting || null,
              columnVisibility: table.getState?.()?.columnVisibility || null,
              rowSelection: table.getState?.()?.rowSelection || null
            }
            // Don't send options - contains React components
          }
        })
        console.log('[GridKit DevTools] Backend sending TABLES_LIST:', tables.length, 'tables')
        window.postMessage({
          source: 'gridkit-devtools-backend',
          type: 'TABLES_LIST',
          payload: { tables }
        }, '*')
        break

      case 'COMMAND':
        // Handle command and send response
        const response = handleCommand(message.payload)
        window.postMessage({
          source: 'gridkit-devtools-backend',
          type: 'RESPONSE',
          payload: response,
          commandType: message.payload.type,
          timestamp: Date.now()
        }, '*')
        break

      case 'REGISTER_TABLE':
        // Register a table from the page
        if (message.payload && message.payload.tableId && message.payload.table) {
          registerTable(message.payload.tableId, message.payload.table)
        }
        break

      case 'UNREGISTER_TABLE':
        // Unregister a table
        if (message.payload && message.payload.tableId) {
          unregisterTable(message.payload.tableId)
        }
        break
    }
  })

  // Handle commands from DevTools
  function handleCommand(payload) {
    if (!payload || !payload.type) {
      return { success: false, error: 'Invalid command' }
    }

    // Check for custom handler
    const handler = commandHandlers.get(payload.type)
    if (handler) {
      try {
        const result = handler(payload)
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }

    // Default handlers for standard commands
    switch (payload.type) {
      case 'GET_TABLES':
        return {
          success: true,
          data: Array.from(registeredTables.entries()).map(([id, table]) => ({
            id,
            rowCount: table.getRowModel?.().rows?.length || 0,
            columnCount: table.getAllColumns?.().length || 0,
            state: table.getState?.() || {},
            options: table.options || {}
          }))
        }

      case 'GET_STATE':
        if (!payload.tableId) {
          return { success: false, error: 'Missing tableId' }
        }
        const table = registeredTables.get(payload.tableId)
        if (!table) {
          return { success: false, error: 'Table not found: ' + payload.tableId }
        }
        return { success: true, data: table.getState?.() || null }

      case 'GET_EVENTS':
        return { success: true, data: { events: [] } }

      case 'GET_PERFORMANCE':
        return { success: true, data: { metrics: [] } }

      default:
        return { success: false, error: 'Unknown command: ' + payload.type }
    }
  }

  // Register a table
  function registerTable(tableId, table) {
    if (!tableId || !table) {
      console.error('[GridKit DevTools] Invalid table registration')
      return
    }
    
    registeredTables.set(tableId, table)
    console.log('[GridKit DevTools] Backend registered table:', tableId)

    // Notify content script
    window.postMessage({
      source: 'gridkit-devtools-backend',
      type: 'TABLE_REGISTERED',
      payload: {
        table: {
          id: tableId,
          rowCount: table.getRowModel?.().rows?.length || 0,
          columnCount: table.getAllColumns?.().length || 0
        },
        timestamp: Date.now()
      }
    }, '*')
  }

  // Unregister a table
  function unregisterTable(tableId) {
    registeredTables.delete(tableId)
    console.log('[GridKit DevTools] Backend unregistered table:', tableId)

    window.postMessage({
      source: 'gridkit-devtools-backend',
      type: 'TABLE_UNREGISTERED',
      payload: { tableId },
      timestamp: Date.now()
    }, '*')
  }

  // Expose backend API
  window.__GRIDKIT_DEVTOOLS_BACKEND__ = {
    registerTable: registerTable,
    unregisterTable: unregisterTable,
    onCommand: function(type, handler) {
      commandHandlers.set(type, handler)
      return function() {
        commandHandlers.delete(type)
      }
    },
    send: function(message) {
      window.postMessage({
        ...message,
        source: 'gridkit-devtools-backend',
        timestamp: Date.now()
      }, '*')
    },
    getTables: function() {
      return Array.from(registeredTables.keys())
    }
  }

  console.log('[GridKit DevTools] Backend initialized successfully')
})()
