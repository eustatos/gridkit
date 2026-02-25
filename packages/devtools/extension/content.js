// Content Script

console.log('[GridKit DevTools] Content script loaded')

;(() => {
  // Check if DevTools is already connected
  if (window.__GRIDKIT_DEVTOOLS_CONTENT__) {
    console.log('[GridKit DevTools] Content script already loaded')
    return
  }

  window.__GRIDKIT_DEVTOOLS_CONTENT__ = true

// Connection state
let isConnected = false
let bridgePort = null

// Message handlers
const messageHandlers = new Map()

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source !== 'gridkit-devtools-background') return

  console.log('[GridKit DevTools] Content received:', message.type)

  switch (message.type) {
    case 'BACKEND_READY':
      // Backend is ready, establish connection
      connectToBackend()
      sendResponse({ type: 'CONTENT_READY' })
      break

    case 'COMMAND':
      // Forward to backend
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

// Listen for messages from backend (via window.postMessage)
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  if (!event.data || typeof event.data !== 'object') return
  const source = event.data.source
  if (source !== 'gridkit-devtools-backend' && source !== 'backend') return

  console.log('[GridKit DevTools] Content received from backend:', event.data.type)

  const message = event.data

  switch (message.type) {
    case 'TABLE_REGISTERED':
      console.log('[GridKit DevTools] Table registered:', message.payload?.table?.id)
      break

    case 'TABLE_UNREGISTERED':
      console.log('[GridKit DevTools] Table unregistered:', message.payload?.tableId)
      break

    case 'STATE_UPDATE':
      console.log('[GridKit DevTools] State update for table:', message.tableId)
      break

    case 'EVENT_LOGGED':
      console.log('[GridKit DevTools] Event logged for table:', message.tableId)
      break

    case 'PERFORMANCE_UPDATE':
      console.log('[GridKit DevTools] Performance update for table:', message.tableId)
      break

    case 'MEMORY_UPDATE':
      console.log('[GridKit DevTools] Memory update for table:', message.tableId)
      break

    default:
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
  }
})

// Connect to backend
function connectToBackend() {
  if (isConnected) return

  // Notify backend we're ready
  window.postMessage(
    {
      source: 'gridkit-devtools-content',
      type: 'CONTENT_READY',
      timestamp: Date.now()
    },
    '*'
  )

  isConnected = true
  console.log('[GridKit DevTools] Connected to backend')
}

// Send message to backend
function sendMessageToBackend(message) {
  return new Promise((resolve, reject) => {
    // Store callback
    const messageId = Date.now() + Math.random()
    const timeout = setTimeout(() => {
      reject(new Error('Backend message timeout'))
    }, 5000)

    const responseHandler = (event) => {
      if (event.source !== window) return
      if (!event.data || event.data.type !== 'RESPONSE') return
      if (event.data.messageId !== messageId) return

      clearTimeout(timeout)
      window.removeEventListener('message', responseHandler)
      resolve(event.data.payload)
    }

    window.addEventListener('message', responseHandler)

    // Send message
    window.postMessage(
      {
        ...message,
        source: 'gridkit-devtools-content',
        messageId,
        timestamp: Date.now()
      },
      '*'
    )
  })
}

// Listen for DevTools panel connection
function connectToDevTools() {
  if (bridgePort) return

  bridgePort = chrome.runtime.connect({
    name: 'gridkit-devtools-content'
  })

  bridgePort.onMessage.addListener((message) => {
    console.log('[GridKit DevTools] Received from DevTools:', message)

    switch (message.type) {
      case 'GET_TABLES':
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

      case 'GET_STATE':
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
}

// Detect GridKit tables on the page
function detectGridKitTables() {
  const tables = []

  // Check for global tables registry
  if (window.__GRIDKIT_TABLES__ instanceof Map) {
    for (const table of window.__GRIDKIT_TABLES__.values()) {
      if (table && typeof table.getState === 'function') {
        tables.push(table)
      }
    }
  }

  // Check window for direct table references
  if (window.gridkitTables instanceof Array) {
    tables.push(...window.gridkitTables)
  }

  // Try to find via React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    if (hook.rendererIDToRenderer) {
      // Find GridKit tables in React components
      findGridKitTablesInReact(hook, tables)
    }
  }

  return tables
}

// Find GridKit tables in React components
function findGridKitTablesInReact(hook, tables) {
  // This is a simplified detection
  // In production, you'd use the full React DevTools API
}

// Setup auto-detection
function setupAutoDetection() {
  // Register existing tables
  const tables = detectGridKitTables()
  console.log('[GridKit DevTools] Found', tables.length, 'GridKit tables')

  // Poll for new tables
  const intervalId = setInterval(() => {
    const tables = detectGridKitTables()
    console.log('[GridKit DevTools] Found', tables.length, 'GridKit tables (poll)')
  }, 2000)

  return intervalId
}

// Initialize
console.log('[GridKit DevTools] Initializing content script')
connectToDevTools()

// Setup auto-detection
setupAutoDetection()

// Expose API for external use
  window.__GRIDKIT_DEVTOOLS_CONTENT__ = {
    isConnected: () => isConnected,
    detectTables: detectGridKitTables,
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
    }
  }
})()
