// background.js
console.log('[GridKit DevTools] Background script loaded');

// Handle messages from DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[GridKit DevTools] Background received message:', message);

  if (message.source === 'devtools-panel') {
    chrome.tabs.sendMessage(
      sender.tab.id,
      {
        ...message,
        source: 'gridkit-devtools-background',
      },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      }
    );
    return true;
  }
});

// Handle connections from DevTools panel
chrome.runtime.onConnect.addListener((port) => {
  console.log('[GridKit DevTools] Background received connection:', port.name);

  // Get tab ID from port
  const tabId = port.sender?.tab?.id;
  
  if (!tabId) {
    console.error('[GridKit DevTools] No tab ID in connection');
    port.disconnect();
    return;
  }

  // Create a bridge between DevTools panel and content script
  port.onMessage.addListener((message) => {
    console.log('[GridKit DevTools] Background forwarding message to content:', message.type);

    chrome.tabs.sendMessage(
      tabId,
      {
        ...message,
        source: 'gridkit-devtools-background',
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[GridKit DevTools] Error forwarding to content:', chrome.runtime.lastError.message);
          port.postMessage({
            type: 'ERROR',
            error: chrome.runtime.lastError.message
          });
        } else {
          port.postMessage(response);
        }
      }
    );
  });

  port.onDisconnect.addListener(() => {
    console.log('[GridKit DevTools] DevTools port disconnected in background');
  });
});
