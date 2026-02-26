/**
 * GridKit DevTools Extension Helper
 * 
 * Provides utilities for testing the GridKit DevTools browser extension
 * using Playwright. Handles extension ID detection, communication,
 * and content script interaction.
 */

import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Get the GridKit DevTools extension ID from chrome://extensions/
 * @param page Playwright page instance
 * @returns Promise resolving to extension ID string
 */
export async function getExtensionId(page: Page): Promise<string> {
  // Navigate to chrome://extensions/
  await page.goto('chrome://extensions/');
  
  // Wait for extensions list to load
  await page.waitForSelector('extensions-item');
  
  // Try to find GridKit DevTools extension
  const extensionId = await page.evaluate(() => {
    // Alternative approach: search by extension name in DOM
    const items = document.querySelectorAll('extensions-item');
    for (const item of items) {
      const name = item.querySelector('.extension-name');
      if (name && name.textContent?.includes('GridKit')) {
        return item.getAttribute('id');
      }
    }
    return null;
  });
  
  if (!extensionId) {
    throw new Error('GridKit DevTools extension not found. Make sure it\'s loaded.');
  }
  
  return extensionId;
}

/**
 * Open the extension popup page
 * @param page Playwright page instance
 * @param extensionId The extension ID
 * @returns Promise resolving to the popup page
 */
export async function openExtensionPopup(page: Page, extensionId: string): Promise<Page> {
  // Navigate to the extension's popup URL
  const popupUrl = `chrome-extension://${extensionId}/devtools.html`;
  
  // Open in a new tab
  const popupPage = await page.context().newPage();
  await popupPage.goto(popupUrl);
  
  // Wait for popup to load
  await popupPage.waitForLoadState('domcontentloaded');
  
  return popupPage;
}

/**
 * Send a message to the extension's background script
 * @param page Playwright page instance
 * @param extensionId The extension ID
 * @param message Message object to send
 * @returns Promise resolving to the response
 */
export async function sendMessageToExtension(
  page: Page, 
  extensionId: string, 
  message: any
): Promise<any> {
  // Use chrome.runtime.sendMessage API through evaluation
  const response = await page.evaluate(async ({ extensionId, message }) => {
    return new Promise((resolve, reject) => {
      // Check if chrome.runtime is available
      if (!chrome?.runtime) {
        resolve({ error: 'chrome.runtime not available' });
        return;
      }
      
      chrome.runtime.sendMessage(extensionId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }, { extensionId, message });
  
  return response;
}

/**
 * Check if content script is injected in the page
 * @param page Playwright page instance
 * @returns Promise resolving to boolean
 */
export async function hasContentScript(page: Page): Promise<boolean> {
  const hasContentScript = await page.evaluate(() => {
    return typeof window.__GRIDKIT_DEVTOOLS_CONTENT__ !== 'undefined';
  });
  
  return hasContentScript;
}

/**
 * Get data from content script
 * @param page Playwright page instance
 * @param key Data key to retrieve
 * @returns Promise resolving to the data value
 */
export async function getContentScriptData(page: Page, key: string): Promise<any> {
  const data = await page.evaluate((key) => {
    const content = window.__GRIDKIT_DEVTOOLS_CONTENT__;
    if (!content) return null;
    
    // Try to get data based on key
    if (key === 'tables') {
      return content.detectTables ? content.detectTables() : null;
    } else if (key === 'connection') {
      return content.isConnected ? content.isConnected() : null;
    } else if (key === 'messageHandlers') {
      return Array.from(content.addMessageHandler ? ['tables', 'state', 'events'] : []);
    }
    
    return null;
  }, key);
  
  return data;
}

/**
 * Get extension API instance from window object
 * @param page Playwright page instance
 * @returns Promise resolving to API object or null
 */
export async function getExtensionAPI(page: Page): Promise<any> {
  const api = await page.evaluate(() => {
    if (window.__GRIDKIT_DEVTOOLS_CONTENT__) {
      return window.__GRIDKIT_DEVTOOLS_CONTENT__;
    }
    return null;
  });
  
  return api;
}

/**
 * Check if GridKit tables are detected on the page
 * @param page Playwright page instance
 * @returns Promise resolving to array of table IDs
 */
export async function getDetectedTables(page: Page): Promise<string[]> {
  const tables = await page.evaluate(() => {
    // Check for window.__GRIDKIT_TABLES__
    if (window.__GRIDKIT_TABLES__ instanceof Map) {
      return Array.from(window.__GRIDKIT_TABLES__.keys());
    }
    
    // Check for window.gridkitTables array
    if (window.gridkitTables instanceof Array) {
      return window.gridkitTables.map((t: any) => t.id);
    }
    
    return [];
  });
  
  return tables;
}

/**
 * Wait for content script to be fully initialized
 * @param page Playwright page instance
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves when content script is ready
 */
export async function waitForContentScript(
  page: Page, 
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    () => {
      return window.__GRIDKIT_DEVTOOLS_CONTENT__?.isConnected?.() === true ||
             window.__GRIDKIT_DEVTOOLS_CONTENT__?.detectTables !== undefined;
    },
    { timeout }
  );
}

/**
 * Wait for table registration
 * @param page Playwright page instance
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves when tables are registered
 */
export async function waitForTableRegistration(
  page: Page, 
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    () => {
      // Check for registered tables
      if (window.__GRIDKIT_TABLES__ instanceof Map) {
        return window.__GRIDKIT_TABLES__.size > 0;
      }
      if (window.gridkitTables instanceof Array) {
        return window.gridkitTables.length > 0;
      }
      return false;
    },
    { timeout }
  );
}

/**
 * Simulate user interaction that would trigger extension monitoring
 * @param page Playwright page instance
 * @param element Element to interact with
 * @param type Interaction type (click, hover, etc.)
 */
export async function simulateUserInteraction(
  page: Page, 
  element: Locator, 
  type: 'click' | 'hover' | 'scroll' = 'click'
): Promise<void> {
  switch (type) {
    case 'click':
      await element.click();
      break;
    case 'hover':
      await element.hover();
      break;
    case 'scroll':
      await element.evaluate((el) => el.scrollIntoView());
      break;
  }
  
  // Wait for extension to process the interaction
  await page.waitForTimeout(100);
}
