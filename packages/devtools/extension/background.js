// background.js
console.log('[GridKit DevTools] Background script loaded');

// Удалите вызов chrome.devtools.panels.create отсюда!
// DevTools API доступен ТОЛЬКО в devtools.html, не в background.js

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
