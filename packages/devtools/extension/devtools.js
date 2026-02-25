// devtools.js
console.log('[GridKit DevTools] DevTools page loaded');

// Создаем панель DevTools
chrome.devtools.panels.create(
  'GridKit',
  'icons/icon-16.svg',
  'panel/index.html',
  (panel) => {
    console.log('[GridKit DevTools] Panel created');

    panel.onShown.addListener((panelWindow) => {
      console.log('[GridKit DevTools] Panel shown');
    });

    panel.onHidden.addListener(() => {
      console.log('[GridKit DevTools] Panel hidden');
    });
  }
);

// Handle messages from DevTools panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[GridKit DevTools] Received message:', message);

  if (message.source === 'devtools-panel') {
    switch (message.type) {
      case 'GET_TABLES':
      case 'GET_STATE':
      case 'GET_EVENTS':
      case 'TIME_TRAVEL':
        sendMessageToContent(message, sendResponse);
        return true;
      default:
        console.warn('[GridKit DevTools] Unknown message type:', message.type);
    }
  }
});

// Helper function to send message to content script
function sendMessageToContent(message, sendResponse) {
  // Получаем ID текущей вкладки из DevTools
  const tabId = chrome.devtools.inspectedWindow.tabId;

  if (!tabId) {
    sendResponse({ error: 'No tab ID' });
    return;
  }

  chrome.tabs.sendMessage(
    tabId,
    {
      ...message,
      source: 'gridkit-devtools-background',
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          '[GridKit DevTools] Error:',
          chrome.runtime.lastError.message
        );
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response);
      }
    }
  );
}
