// Background Script

console.log('[GridKit DevTools] Background script loaded')

// Handle messages from DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[GridKit DevTools] Received message:', message)

  if (message.source === 'devtools-panel') {
    switch (message.type) {
      case 'GET_TABLES':
        // Forward to content script
        sendMessageToContent(message, sendResponse)
        return true

      case 'GET_STATE':
        sendMessageToContent(message, sendResponse)
        return true

      case 'GET_EVENTS':
        sendMessageToContent(message, sendResponse)
        return true

      case 'TIME_TRAVEL':
        sendMessageToContent(message, sendResponse)
        return true

      default:
        console.warn('[GridKit DevTools] Unknown message type:', message.type)
    }
  }
})

// Helper function to send message to content script
function sendMessageToContent(message, sendResponse) {
  if (!sender.tab || !sender.tab.id) {
    sendResponse({ error: 'No tab ID' })
    return
  }

  chrome.tabs.sendMessage(
    sender.tab.id,
    {
      ...message,
      source: 'gridkit-devtools-background'
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('[GridKit DevTools] Error sending message:', chrome.runtime.lastError.message)
        sendResponse({ error: chrome.runtime.lastError.message })
      } else {
        sendResponse(response)
      }
    }
  )
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('[GridKit DevTools] Tab updated:', tabId, tab.url)
  }
})

// Listen for connection from content script
chrome.runtime.onConnect.addListener((port) => {
  console.log('[GridKit DevTools] Connected from:', port.name)

  port.onMessage.addListener((message) => {
    console.log('[GridKit DevTools] Received from port:', message)
  })

  port.onDisconnect.addListener(() => {
    console.log('[GridKit DevTools] Port disconnected')
  })
})
