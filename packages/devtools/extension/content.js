// GridKit DevTools Content Script
// Handles communication between the page, backend, and DevTools panel

;(function() {
  'use strict'

  console.log('[GridKit DevTools] Content script loaded')

  // Check if DevTools is already connected
  if (window.__GRIDKIT_DEVTOOLS_CONTENT__) {
    console.log('[GridKit DevTools] Content script already loaded')
    return
  }

  // Connection state
  let isConnected = false
  let bridgePort = null
  let backendPort = null

  // Message handlers
  const messageHandlers = new Map()

  // Registered tables registry
  const registeredTables = new Map()

  /**
   * Inject backend script into page context
   * The backend runs in the page context to access React/Redux state
   * 
   * Note: We use a Blob URL to avoid CSP restrictions on inline scripts
   */
  function injectBackend() {
    console.log('[GridKit DevTools] Injecting backend script')

    // Backend code as a string
    const backendCode = `
      (function() {
        console.log('[GridKit DevTools] Backend script injected')

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

        console.log('[GridKit DevTools] Backend initialized')
      })()
    `

    try {
      // Create a Blob URL to avoid CSP restrictions
      const blob = new Blob([backendCode], { type: 'application/javascript' })
      const scriptUrl = URL.createObjectURL(blob)
      
      const script = document.createElement('script')
      script.src = scriptUrl
      script.onload = () => {
        URL.revokeObjectURL(scriptUrl)
        console.log('[GridKit DevTools] Backend script loaded via Blob URL')
      }
      script.onerror = (error) => {
        console.error('[GridKit DevTools] Failed to load backend script:', error)
        // Fallback: try inline injection (may be blocked by CSP)
        script.parentNode?.removeChild(script)
        const inlineScript = document.createElement('script')
        inlineScript.textContent = backendCode
        document.documentElement.appendChild(inlineScript)
        inlineScript.parentNode?.removeChild(inlineScript)
      }
      
      document.documentElement.appendChild(script)
    } catch (error) {
      console.error('[GridKit DevTools] Failed to inject backend via Blob:', error)
      // Fallback to inline script
      const inlineScript = document.createElement('script')
      inlineScript.textContent = backendCode
      document.documentElement.appendChild(inlineScript)
      inlineScript.parentNode?.removeChild(inlineScript)
    }

    console.log('[GridKit DevTools] Backend script injected successfully')
  }

  /**
   * Connect to backend in page context
   */
  function connectToBackend() {
    if (isConnected) return

    // Notify backend we're ready
    window.postMessage({
      source: 'gridkit-devtools-content',
      type: 'CONTENT_READY',
      timestamp: Date.now()
    }, '*')

    isConnected = true
    console.log('[GridKit DevTools] Connected to backend')
  }

  /**
   * Send message to backend and wait for response
   */
  function sendMessageToBackend(message) {
    return new Promise((resolve, reject) => {
      const messageId = Date.now() + Math.random()
      const timeout = setTimeout(() => {
        reject(new Error('Backend message timeout'))
      }, 5000)

      const responseHandler = (event) => {
        if (event.source !== window) return
        if (!event.data || typeof event.data !== 'object') return
        if (event.data.source !== 'gridkit-devtools-backend') return

        // Check for RESPONSE from backend
        if (event.data.type === 'RESPONSE' && event.data.commandType === message.type) {
          clearTimeout(timeout)
          window.removeEventListener('message', responseHandler)
          resolve(event.data.payload)
          return
        }
      }

      window.addEventListener('message', responseHandler)

      // Send message
      window.postMessage({
        ...message,
        source: 'gridkit-devtools-content',
        messageId,
        timestamp: Date.now()
      }, '*')
    })
  }

  /**
   * Connect to DevTools panel via Chrome runtime
   */
  function connectToDevTools() {
    if (bridgePort) return

    try {
      bridgePort = chrome.runtime.connect({
        name: 'gridkit-devtools-content'
      })

      bridgePort.onMessage.addListener((message) => {
        console.log('[GridKit DevTools] Received from DevTools:', message.type)

        switch (message.type) {
          case 'GET_TABLES':
          case 'GET_STATE':
          case 'GET_EVENTS':
          case 'GET_PERFORMANCE':
            sendMessageToBackend(message)
              .then((response) => {
                bridgePort.postMessage(response)
              })
              .catch((error) => {
                bridgePort.postMessage({
                  type: 'ERROR',
                  error: error.message
                })
              })
            break

          default:
            bridgePort.postMessage({
              type: 'ERROR',
              error: 'Unknown command: ' + message.type
            })
        }
      })

      bridgePort.onDisconnect.addListener(() => {
        console.log('[GridKit DevTools] DevTools disconnected')
        bridgePort = null
      })

      console.log('[GridKit DevTools] Connected to DevTools panel')
    } catch (error) {
      console.warn('[GridKit DevTools] Could not connect to DevTools:', error.message)
    }
  }

  /**
   * Detect GridKit tables on the page
   */
  function detectGridKitTables() {
    const tables = []

    // Check for global tables registry
    if (window.__GRIDKIT_TABLES__ instanceof Map) {
      for (const [id, table] of window.__GRIDKIT_TABLES__.entries()) {
        if (table && typeof table.getState === 'function') {
          tables.push({ id, table })
        }
      }
    }

    // Check window for direct table references
    if (window.gridkitTables instanceof Array) {
      for (const table of window.gridkitTables) {
        if (table && typeof table.getState === 'function') {
          tables.push({ id: table.options?.meta?.tableId || 'unknown', table })
        }
      }
    }

    return tables
  }

  /**
   * Register table with backend
   */
  function registerTableWithBackend(tableId, table) {
    window.postMessage({
      source: 'gridkit-devtools-content',
      type: 'REGISTER_TABLE',
      payload: { tableId, table },
      timestamp: Date.now()
    }, '*')
  }

  /**
   * Unregister table from backend
   */
  function unregisterTableFromBackend(tableId) {
    window.postMessage({
      source: 'gridkit-devtools-content',
      type: 'UNREGISTER_TABLE',
      payload: { tableId },
      timestamp: Date.now()
    }, '*')
  }

  /**
   * Setup auto-detection for GridKit tables
   */
  function setupAutoDetection() {
    // Register existing tables
    const tables = detectGridKitTables()
    console.log('[GridKit DevTools] Found', tables.length, 'GridKit tables')

    tables.forEach(({ id, table }) => {
      registerTableWithBackend(id, table)
      registeredTables.set(id, table)
    })

    // Poll for new tables every 2 seconds
    const intervalId = setInterval(() => {
      const newTables = detectGridKitTables()
      console.log('[GridKit DevTools] Poll: Found', newTables.length, 'GridKit tables')

      newTables.forEach(({ id, table }) => {
        if (!registeredTables.has(id)) {
          registerTableWithBackend(id, table)
          registeredTables.set(id, table)
        }
      })
    }, 2000)

    return intervalId
  }

  /**
   * Listen for messages from backend (via window.postMessage)
   */
  window.addEventListener('message', (event) => {
    if (event.source !== window) return
    if (!event.data || typeof event.data !== 'object') return
    if (event.data.source !== 'gridkit-devtools-backend') return

    const message = event.data

    console.log('[GridKit DevTools] Content received from backend:', message.type)

    switch (message.type) {
      case 'BACKEND_READY':
        connectToBackend()
        break

      case 'TABLE_REGISTERED':
        console.log('[GridKit DevTools] Table registered:', message.payload?.table?.id)
        break

      case 'TABLE_UNREGISTERED':
        console.log('[GridKit DevTools] Table unregistered:', message.payload?.tableId)
        break

      case 'STATE_UPDATE':
      case 'EVENT_LOGGED':
      case 'PERFORMANCE_UPDATE':
      case 'MEMORY_UPDATE':
        // Call registered handlers
        if (messageHandlers.has(message.type)) {
          messageHandlers.get(message.type).forEach((handler) => {
            try {
              handler(message)
            } catch (error) {
              console.error('[GridKit DevTools] Error in message handler:', error)
            }
          })
        }
        break
    }
  })

  /**
   * Listen for messages from background script
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.source !== 'gridkit-devtools-background') return

    console.log('[GridKit DevTools] Content received from background:', message.type)

    switch (message.type) {
      case 'BACKEND_READY':
        connectToBackend()
        sendResponse({ type: 'CONTENT_READY' })
        break

      case 'COMMAND':
        sendMessageToBackend(message.payload)
          .then((response) => {
            sendResponse({
              type: 'RESPONSE',
              payload: response
            })
          })
          .catch((error) => {
            sendResponse({
              type: 'RESPONSE',
              payload: {
                success: false,
                error: error.message
              }
            })
          })
        return true

      default:
        console.warn('[GridKit DevTools] Unknown message type:', message.type)
    }
  })

  // Initialize
  console.log('[GridKit DevTools] Initializing content script')

  // Inject backend into page context
  injectBackend()

  // Connect to DevTools panel
  connectToDevTools()

  // Setup auto-detection
  const detectionInterval = setupAutoDetection()

  // Expose API for external use
  window.__GRIDKIT_DEVTOOLS_CONTENT__ = {
    isConnected: () => isConnected,
    detectTables: () => Array.from(registeredTables.keys()),
    sendMessageToBackend: sendMessageToBackend,
    addMessageHandler: (type, handler) => {
      if (!messageHandlers.has(type)) {
        messageHandlers.set(type, new Set())
      }
      messageHandlers.get(type).add(handler)
    },
    removeMessageHandler: (type, handler) => {
      if (messageHandlers.has(type)) {
        messageHandlers.get(type).delete(handler)
      }
    },
    registerTable: registerTableWithBackend,
    unregisterTable: unregisterTableFromBackend
  }

  // Cleanup on page unload
  window.addEventListener('unload', () => {
    if (detectionInterval) {
      clearInterval(detectionInterval)
    }
    if (bridgePort) {
      bridgePort.disconnect()
    }
  })
})()
