/**
 * GridKit DevTools Extension Testing Helper
 * 
 * Provides utilities for testing the GridKit DevTools browser extension
 * using Playwright. Handles extension ID detection, communication,
 * and content script interaction.
 * 
 * @packageDocumentation
 * @example
 * ```typescript
 * import { 
 *   getExtensionId,
 *   waitForContentScript,
 *   getDetectedTables 
 * } from './helpers/extension-helper';
 * 
 * test('should detect tables', async ({ page, browser }) => {
 *   const context = await browser.newContext();
 *   const extensionId = await getExtensionId(context);
 *   
 *   await page.goto('/');
 *   await waitForContentScript(page);
 *   
 *   const tables = await getDetectedTables(page);
 *   expect(tables.length).toBeGreaterThan(0);
 * });
 * ```
 */

import { type Page, type Locator, type BrowserContext } from '@playwright/test';

/**
 * Get the GridKit DevTools extension ID from chrome://extensions/
 * 
 * @param context - Playwright browser context instance
 * @returns Promise resolving to extension ID string
 * 
 * @throws Error if GridKit DevTools extension is not found
 * 
 * @example
 * ```typescript
 * const extensionId = await getExtensionId(context);
 * console.log('Extension ID:', extensionId);
 * ```
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  
  try {
    // Navigate to chrome://extensions/
    await page.goto('chrome://extensions/');
    
    // Wait for extensions list to load
    await page.waitForSelector('extensions-item', { timeout: 5000 });
    
    // Find GridKit DevTools extension
    const extensionId = await page.evaluate(() => {
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
  } finally {
    await page.close();
  }
}

/**
 * Open the extension popup page
 * 
 * @param page - Playwright page instance
 * @param extensionId - The extension ID
 * @returns Promise resolving to the popup page
 * 
 * @example
 * ```typescript
 * const popup = await openExtensionPopup(page, extensionId);
 * await popup.waitForSelector('.devtools-panel');
 * ```
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
 * 
 * @param page - Playwright page instance
 * @param extensionId - The extension ID
 * @param message - Message object to send
 * @returns Promise resolving to the response
 * 
 * @example
 * ```typescript
 * const response = await sendMessageToExtension(
 *   page, 
 *   extensionId, 
 *   { type: 'GET_STATE', tableId: 'table-1' }
 * );
 * ```
 */
export async function sendMessageToExtension(
  page: Page,
  extensionId: string,
  message: any
): Promise<any> {
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
 * 
 * @param page - Playwright page instance
 * @returns Promise resolving to boolean indicating if content script exists
 * 
 * @example
 * ```typescript
 * const hasScript = await hasContentScript(page);
 * if (hasScript) {
 *   console.log('Content script is active');
 * }
 * ```
 */
export async function hasContentScript(page: Page): Promise<boolean> {
  const hasContentScript = await page.evaluate(() => {
    return typeof (window as any).__GRIDKIT_DEVTOOLS_CONTENT__ !== 'undefined';
  });
  
  return hasContentScript;
}

/**
 * Get data from content script
 * 
 * @param page - Playwright page instance
 * @param key - Data key to retrieve ('tables', 'connection', 'messageHandlers')
 * @returns Promise resolving to the data value
 * 
 * @example
 * ```typescript
 * const tables = await getContentScriptData(page, 'tables');
 * console.log('Detected tables:', tables);
 * ```
 */
export async function getContentScriptData(page: Page, key: string): Promise<any> {
  const data = await page.evaluate((key) => {
    const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
    if (!content) return null;
    
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
 * 
 * @param page - Playwright page instance
 * @returns Promise resolving to API object or null
 * 
 * @example
 * ```typescript
 * const api = await getExtensionAPI(page);
 * if (api) {
 *   const tables = api.detectTables();
 * }
 * ```
 */
export async function getExtensionAPI(page: Page): Promise<any> {
  const api = await page.evaluate(() => {
    if ((window as any).__GRIDKIT_DEVTOOLS_CONTENT__) {
      return (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
    }
    return null;
  });
  
  return api;
}

/**
 * Check if GridKit tables are detected on the page
 * 
 * @param page - Playwright page instance
 * @returns Promise resolving to array of table IDs
 * 
 * @example
 * ```typescript
 * const tableIds = await getDetectedTables(page);
 * expect(tableIds.length).toBeGreaterThan(0);
 * ```
 */
export async function getDetectedTables(page: Page): Promise<string[]> {
  const tables = await page.evaluate(() => {
    // Check for window.__GRIDKIT_TABLES__
    if ((window as any).__GRIDKIT_TABLES__ instanceof Map) {
      return Array.from((window as any).__GRIDKIT_TABLES__.keys());
    }
    
    // Check for window.gridkitTables array
    if ((window as any).gridkitTables instanceof Array) {
      return (window as any).gridkitTables.map((t: any) => t.id);
    }
    
    return [];
  });
  
  return tables;
}

/**
 * Wait for content script to be fully initialized
 * 
 * @param page - Playwright page instance
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves when content script is ready
 * 
 * @example
 * ```typescript
 * await page.goto('/');
 * await waitForContentScript(page);
 * // Content script is now ready
 * ```
 */
export async function waitForContentScript(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.isConnected?.() === true ||
             content?.detectTables !== undefined;
    },
    { timeout }
  );
}

/**
 * Wait for table registration
 * 
 * @param page - Playwright page instance
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves when tables are registered
 * 
 * @example
 * ```typescript
 * await page.goto('/');
 * await waitForTableRegistration(page);
 * // Tables are now registered and ready for inspection
 * ```
 */
export async function waitForTableRegistration(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    () => {
      // Check for registered tables
      if ((window as any).__GRIDKIT_TABLES__ instanceof Map) {
        return (window as any).__GRIDKIT_TABLES__.size > 0;
      }
      if ((window as any).gridkitTables instanceof Array) {
        return (window as any).gridkitTables.length > 0;
      }
      return false;
    },
    { timeout }
  );
}

/**
 * Simulate user interaction that would trigger extension monitoring
 * 
 * @param page - Playwright page instance
 * @param element - Element to interact with
 * @param type - Interaction type (click, hover, scroll)
 * 
 * @example
 * ```typescript
 * const sortButton = page.locator('th:has-text("Name")');
 * await simulateUserInteraction(page, sortButton, 'click');
 * ```
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

/**
 * Get table state through content script
 * 
 * @param page - Playwright page instance
 * @param tableId - Table ID to inspect (optional, uses first table if not provided)
 * @returns Promise resolving to table state object
 * 
 * @example
 * ```typescript
 * const state = await getTableState(page);
 * console.log('Pagination:', state.pagination);
 * ```
 */
export async function getTableState(page: Page, tableId?: string): Promise<any> {
  const state = await page.evaluate((id) => {
    const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
    if (!content) return null;
    
    const tables = content.detectTables();
    if (!tables || tables.length === 0) return null;
    
    const table = id 
      ? tables.find((t: any) => t.id === id)
      : tables[0];
    
    return table?.getState?.();
  }, tableId);
  
  return state;
}

/**
 * Trigger a state update and wait for extension to detect it
 * 
 * @param page - Playwright page instance
 * @param action - Action to trigger state change
 * @param timeout - Timeout to wait for update
 * 
 * @example
 * ```typescript
 * await triggerStateUpdate(page, async () => {
 *   await page.click('button:has-text("Next")');
 * });
 * ```
 */
export async function triggerStateUpdate(
  page: Page,
  action: () => Promise<void>,
  timeout: number = 1000
): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) {
        resolve();
        return;
      }
      
      let resolved = false;
      const handler = () => {
        if (!resolved) {
          resolved = true;
          content.removeMessageHandler('STATE_UPDATE', handler);
          resolve();
        }
      };
      
      content.addMessageHandler('STATE_UPDATE', handler);
      
      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          content.removeMessageHandler('STATE_UPDATE', handler);
          resolve();
        }
      }, timeout);
    });
  });
  
  await action();
}
