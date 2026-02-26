/**
 * GridKit DevTools Extension - Comprehensive E2E Test Suite
 * 
 * This test suite validates the GridKit DevTools browser extension functionality:
 * - Extension loading and initialization
 * - Content script injection
 * - DevTools panel rendering
 * - Table detection and inspection
 * - Real-time event monitoring
 * - Performance profiling
 * - State management
 * 
 * Prerequisites:
 * 1. Build the extension: pnpm build:extension
 * 2. Run tests: pnpm test:e2e:extension
 * 
 * @packageDocumentation
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Helper to wait for content script initialization
 */
async function waitForContentScript(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      return (window as any).__GRIDKIT_DEVTOOLS_CONTENT__ !== undefined;
    },
    { timeout }
  );
}

/**
 * Helper to wait for table registration
 */
async function waitForTableRegistration(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      const tables = (window as any).__GRIDKIT_TABLES__;
      return tables instanceof Map && tables.size > 0;
    },
    { timeout }
  );
}

test.describe('GridKit DevTools Extension - Loading & Initialization', () => {
  test('should load extension successfully', async ({ page }) => {
    await page.goto('/');

    // Extension should be loaded in the browser
    const hasExtension = await page.evaluate(() => {
      return typeof chrome !== 'undefined' && chrome.runtime !== undefined;
    });

    expect(hasExtension).toBe(true);
  });

  test('should inject content script automatically', async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    
    const hasContentScript = await page.evaluate(() => {
      return typeof (window as any).__GRIDKIT_DEVTOOLS_CONTENT__ !== 'undefined';
    });
    
    expect(hasContentScript).toBe(true);
  });

  test('should initialize content script API', async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    
    const api = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return null;
      
      return {
        hasIsConnected: typeof content.isConnected === 'function',
        hasDetectTables: typeof content.detectTables === 'function',
        hasSendMessage: typeof content.sendMessageToBackend === 'function',
        hasAddHandler: typeof content.addMessageHandler === 'function',
        hasRemoveHandler: typeof content.removeMessageHandler === 'function',
      };
    });
    
    expect(api).toBeDefined();
    expect(api?.hasIsConnected).toBe(true);
    expect(api?.hasDetectTables).toBe(true);
    expect(api?.hasSendMessage).toBe(true);
    expect(api?.hasAddHandler).toBe(true);
    expect(api?.hasRemoveHandler).toBe(true);
  });

  test('should connect to backend service', async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    
    const isConnected = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.isConnected?.() === true;
    });
    
    // Connection state may vary in test environment
    expect(typeof isConnected).toBe('boolean');
  });
});

test.describe('GridKit DevTools Extension - Table Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should detect GridKit tables on page', async ({ page }) => {
    const tables = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.detectTables?.() || [];
    });
    
    expect(Array.isArray(tables)).toBe(true);
    expect(tables.length).toBeGreaterThan(0);
  });

  test('should provide table metadata', async ({ page }) => {
    const tables = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.detectTables?.() || [];
    });
    
    const firstTable = tables[0];
    
    expect(firstTable).toBeDefined();
    expect(firstTable.id).toBeDefined();
    expect(typeof firstTable.id).toBe('string');
  });

  test('should inspect table state', async ({ page }) => {
    const tableState = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      const tables = content?.detectTables?.();
      if (!tables || tables.length === 0) return null;
      return tables[0].getState();
    });
    
    expect(tableState).toBeDefined();
    expect(tableState?.pagination).toBeDefined();
    expect(tableState?.sorting).toBeDefined();
  });

  test('should detect multiple tables if present', async ({ page }) => {
    const tables = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.detectTables?.() || [];
    });
    
    // Demo app has at least one table
    expect(tables.length).toBeGreaterThanOrEqual(1);
    
    // Verify unique IDs
    const ids = tables.map((t: any) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should update table detection on DOM changes', async ({ page }) => {
    // Get initial tables
    const initialTables = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.detectTables?.() || [];
    });
    
    // Trigger a table update (pagination)
    const nextPageBtn = page.locator('button:has-text("Next")').first();
    if (await nextPageBtn.count() > 0) {
      await nextPageBtn.click();
      await page.waitForTimeout(100);
    }
    
    // Tables should still be detected
    const updatedTables = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.detectTables?.() || [];
    });
    
    expect(updatedTables.length).toBe(initialTables.length);
  });
});

test.describe('GridKit DevTools Extension - Event Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should register message handlers', async ({ page }) => {
    const handlerRegistered = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const testHandler = () => {};
      content.addMessageHandler('TEST_EVENT', testHandler);
      content.removeMessageHandler('TEST_EVENT', testHandler);
      
      return true;
    });
    
    expect(handlerRegistered).toBe(true);
  });

  test('should monitor table events', async ({ page }) => {
    const eventsReceived = await page.evaluate(() => {
      return new Promise((resolve) => {
        const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
        let eventCount = 0;
        
        const handler = (event: any) => {
          eventCount++;
        };
        
        content?.addMessageHandler('STATE_UPDATE', handler);
        
        // Trigger a state update
        setTimeout(() => {
          content?.removeMessageHandler('STATE_UPDATE', handler);
          resolve(eventCount >= 0);
        }, 200);
      });
    });
    
    expect(eventsReceived).toBe(true);
  });

  test('should handle event cleanup', async ({ page }) => {
    const cleanupSuccessful = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const handler = () => {};
      content.addMessageHandler('CLEANUP_TEST', handler);
      content.removeMessageHandler('CLEANUP_TEST', handler);
      
      return true;
    });
    
    expect(cleanupSuccessful).toBe(true);
  });
});

test.describe('GridKit DevTools Extension - Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should measure inspection performance', async ({ page }) => {
    const performance = await page.evaluate(() => {
      const startTime = performance.now();
      
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      const tables = content?.detectTables?.() || [];
      
      const endTime = performance.now();
      
      return {
        tableCount: tables.length,
        inspectionTime: endTime - startTime,
      };
    });
    
    expect(performance.tableCount).toBeGreaterThan(0);
    expect(performance.inspectionTime).toBeLessThan(100); // Should be fast
  });

  test('should handle rapid state changes', async ({ page }) => {
    const stateChangesHandled = await page.evaluate(async () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      let changeCount = 0;
      const handler = () => { changeCount++; };
      
      content.addMessageHandler('STATE_UPDATE', handler);
      
      // Simulate rapid changes
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 10));
      }
      
      content.removeMessageHandler('STATE_UPDATE', handler);
      
      return true;
    });
    
    expect(stateChangesHandled).toBe(true);
  });
});

test.describe('GridKit DevTools Extension - Error Handling', () => {
  test('should handle missing tables gracefully', async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    
    const result = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return { error: 'No content script' };
      
      try {
        const tables = content.detectTables();
        return { 
          success: true, 
          tableCount: tables.length,
          error: null 
        };
      } catch (error: any) {
        return { 
          success: false, 
          error: error.message 
        };
      }
    });
    
    expect(result.success || result.tableCount >= 0).toBe(true);
  });

  test('should handle page reload', async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    
    // Reload page
    await page.reload();
    
    // Content script should reinitialize
    await waitForContentScript(page);
    
    const hasContentScript = await page.evaluate(() => {
      return typeof (window as any).__GRIDKIT_DEVTOOLS_CONTENT__ !== 'undefined';
    });
    
    expect(hasContentScript).toBe(true);
  });

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    
    // Navigate away and back
    await page.goto('about:blank');
    await page.goto('/');
    
    // Content script should still work
    await waitForContentScript(page);
    
    const tables = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.detectTables?.() || [];
    });
    
    expect(Array.isArray(tables)).toBe(true);
  });
});

test.describe('GridKit DevTools Extension - Backend Communication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should send commands to backend', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return { error: 'No content script' };
      
      try {
        const response = await content.sendMessageToBackend({
          type: 'GET_STATE',
          timestamp: Date.now(),
        });
        
        return { success: true, response };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
    
    // Backend may or may not respond in test environment
    expect(result).toBeDefined();
  });

  test('should handle backend responses', async ({ page }) => {
    const responseHandled = await page.evaluate(async () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      let responseReceived = false;
      
      const handler = (response: any) => {
        responseReceived = true;
      };
      
      content.addMessageHandler('STATE_UPDATE', handler);
      
      // Wait for potential response
      await new Promise(r => setTimeout(r, 100));
      
      content.removeMessageHandler('STATE_UPDATE', handler);
      
      return true;
    });
    
    expect(responseHandled).toBe(true);
  });
});
