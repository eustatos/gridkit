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
   * Note: We load from an external file to avoid CSP restrictions
   */
  function injectBackend() {
    console.log('[GridKit DevTools] Injecting backend script')

    try {
      // Get the extension URL for the backend script
      const backendUrl = chrome.runtime.getURL('backend.js')
      
      const script = document.createElement('script')
      script.src = backendUrl
      script.onload = () => {
        console.log('[GridKit DevTools] Backend script loaded from:', backendUrl)
      }
      script.onerror = (error) => {
        console.error('[GridKit DevTools] Failed to load backend script:', error)
      }
      
      document.documentElement.appendChild(script)
      script.parentNode?.removeChild(script)
      
      console.log('[GridKit DevTools] Backend script injected successfully')
    } catch (error) {
      console.error('[GridKit DevTools] Failed to inject backend:', error)
    }
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
