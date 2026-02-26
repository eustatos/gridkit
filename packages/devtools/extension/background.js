// background.js
console.log('[GridKit DevTools] Background script loaded');

// Store ports for each tab
const tabPorts = new Map();

// Handle connections from DevTools panel
chrome.runtime.onConnect.addListener((port) => {
  console.log('[GridKit DevTools] Background received connection:', port.name);

  if (port.name === 'gridkit-devtools-panel') {
    // For DevTools panels, sender.tab is undefined
    // We need to get tabId from chrome.devtools.inspectedWindow
    // But that's only available in devtools.js context
    
    console.log('[GridKit DevTools] Waiting for tabId from panel...');
    
    // Wait for panel to send tabId
    port.onMessage.addListener((message) => {
      console.log('[GridKit DevTools] Panel message:', message.type);
      
      if (message.type === 'INIT' && message.tabId) {
        const tabId = message.tabId;
        console.log('[GridKit DevTools] Got tabId from panel:', tabId);
        
        // Store port for this tab
        tabPorts.set(tabId, port);

        // Send initial tables list
        console.log('[GridKit DevTools] Requesting tables from content script...')
        chrome.tabs.sendMessage(
          tabId,
          {
            type: 'GET_TABLES',
            source: 'gridkit-devtools-background',
          },
          (response) => {
            console.log('[GridKit DevTools] Response from content:', response)
            if (chrome.runtime.lastError) {
              console.error('[GridKit DevTools] Error getting tables:', chrome.runtime.lastError.message)
              port.postMessage({
                type: 'TABLES_LIST',
                payload: { tables: [] }
              })
              return
            }
            
            if (response && response.success && response.data) {
              console.log('[GridKit DevTools] Initial tables:', response.data)
              port.postMessage({
                type: 'TABLES_LIST',
                payload: {
                  tables: response.data.map((table) => ({
                    id: table.id,
                    rowCount: table.rowCount,
                    columnCount: table.columnCount,
                    state: table.state
                  }))
                }
              })
            } else {
              console.warn('[GridKit DevTools] Invalid response format:', response)
              port.postMessage({
                type: 'TABLES_LIST',
                payload: { tables: [] }
              })
            }
          }
        );
      } else {
        // Handle other messages after INIT
        const tabId = Array.from(tabPorts.entries()).find(([_, p]) => p === port)?.[0];
        if (tabId) {
          chrome.tabs.sendMessage(
            tabId,
            {
              ...message,
              source: 'gridkit-devtools-background',
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error('[GridKit DevTools] Error sending to content:', chrome.runtime.lastError.message);
                port.postMessage({
                  type: 'ERROR',
                  error: chrome.runtime.lastError.message
                });
              } else {
                console.log('[GridKit DevTools] Forwarding response to panel:', response);
                port.postMessage(response);
              }
            }
          );
        }
      }
    });

    port.onDisconnect.addListener(() => {
      console.log('[GridKit DevTools] Panel disconnected');
      for (const [tabId, p] of tabPorts.entries()) {
        if (p === port) {
          tabPorts.delete(tabId);
          break;
        }
      }
    });
  }
});

// Handle messages from DevTools panel (non-port messages)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[GridKit DevTools] Background received message:', message);

  if (message.source === 'devtools-panel') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ error: 'No tab ID' });
      return true;
    }

    chrome.tabs.sendMessage(
      tabId,
      {
        ...message,
        source: 'gridkit-devtools-background',
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[GridKit DevTools] Error sending to content:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('[GridKit DevTools] Response from content:', response);
          sendResponse(response);
        }
      }
    );

    return true;
  }
});

// Listen for messages from content script (table registered/unregistered)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.source === 'gridkit-content') {
    console.log('[GridKit DevTools] Message from content:', message.type);

    if (message.type === 'TABLE_REGISTERED' || message.type === 'TABLE_UNREGISTERED') {
      const tabId = sender.tab?.id;
      if (tabId) {
        const port = tabPorts.get(tabId);
        if (port) {
          console.log('[GridKit DevTools] Forwarding to panel:', message.type);
          port.postMessage({
            type: message.type,
            payload: message.payload
          });
        }
      }
    }
    
    // Forward events and updates to panel
    if (message.type === 'EVENT_LOGGED' || 
        message.type === 'STATE_UPDATE' || 
        message.type === 'PERFORMANCE_UPDATE' ||
        message.type === 'MEMORY_UPDATE') {
      const tabId = sender.tab?.id;
      if (tabId) {
        const port = tabPorts.get(tabId);
        if (port) {
          console.log('[GridKit DevTools] Forwarding event to panel:', message.type);
          port.postMessage({
            type: message.type,
            tableId: message.tableId,
            payload: message.payload,
            timestamp: message.timestamp
          });
        }
      }
    }
  }
});

console.log('[GridKit DevTools] Background script initialized');
