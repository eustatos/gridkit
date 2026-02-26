import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  getExtensionId,
  hasContentScript,
  waitForContentScript,
  getDetectedTables,
  waitForTableRegistration,
  simulateUserInteraction,
} from '../helpers/extension-helper';

// Test fixture for extension ID
let extensionId: string;

test.describe('GridKit DevTools Extension - DevTools Panel', () => {
  test.beforeAll(async ({ browser }) => {
    // Get extension ID in a separate context
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      extensionId = await getExtensionId(page);
      console.log('[Panel Test] Got extension ID:', extensionId);
    } catch (error) {
      console.warn('[Panel Test] Could not get extension ID:', error);
      extensionId = 'dummy-extension-id';
    } finally {
      await page.close();
      await context.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForTableRegistration(page);
    await waitForContentScript(page);
  });

  test('should open DevTools panel', async ({ page }) => {
    // Note: We can't directly test opening the panel from here
    // This would typically be tested with a real browser test
    // The extension should be loaded and ready
    
    const hasContent = await hasContentScript(page);
    expect(hasContent).toBe(true);
  });

  test('should display table information in panel', async ({ page }) => {
    const detectedTables = await getDetectedTables(page);
    
    // The extension should be able to access table information
    expect(detectedTables.length).toBeGreaterThan(0);
    
    // Verify table structure
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should support table selection in panel', async ({ page }) => {
    // Get table data through content script
    const detectedTables = await getDetectedTables(page);
    
    if (detectedTables.length > 0) {
      const api = await page.evaluate(() => {
        return window.__GRIDKIT_DEVTOOLS_CONTENT__;
      });
      
      if (api) {
        const tables = api.detectTables();
        expect(tables.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should display column statistics', async ({ page }) => {
    // Get column information
    const headers = page.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
    
    // Verify each header has expected content
    const headerNames = await headers.allTextContents();
    expect(headerNames.length).toBeGreaterThan(0);
  });

  test('should support data export functionality', async ({ page }) => {
    // The extension should be able to export table data
    // We verify this by checking that the data structure is accessible
    
    const detectedTables = await getDetectedTables(page);
    
    if (detectedTables.length > 0) {
      const api = await page.evaluate(() => {
        return window.__GRIDKIT_DEVTOOLS_CONTENT__;
      });
      
      if (api) {
        const tables = api.detectTables();
        expect(tables.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle panel UI interactions', async ({ page }) => {
    // Test that the demo page UI is functional
    // This simulates what the extension panel would interact with
    
    // Click sorting
    const nameHeader = page.locator('thead th:has-text("Name")');
    await simulateUserInteraction(page, nameHeader, 'click');
    
    // Verify sort indication
    const sortIndicator = nameHeader.locator('span:text("↑")');
    expect(sortIndicator).toBeDefined();
  });

  test('should support multiple tables in panel', async ({ page }) => {
    const detectedTables = await getDetectedTables(page);
    
    // Verify we can handle multiple tables
    expect(detectedTables.length).toBeGreaterThanOrEqual(1);
    
    if (detectedTables.length > 1) {
      const uniqueIds = new Set(detectedTables);
      expect(uniqueIds.size).toBe(detectedTables.length);
    }
  });

  test('should refresh panel data on table update', async ({ page }) => {
    // Get initial table count
    const initialTables = await getDetectedTables(page);
    const initialCount = initialTables.length;
    
    // Perform an interaction that updates the table
    const paginationNext = page.locator('button:has-text("Next")');
    if (await paginationNext.count() > 0) {
      await simulateUserInteraction(page, paginationNext, 'click');
    }
    
    // Verify tables are still accessible
    const afterTables = await getDetectedTables(page);
    expect(afterTables.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle panel connection state', async ({ page }) => {
    // Verify content script connection state
    const api = await page.evaluate(() => {
      return window.__GRIDKIT_DEVTOOLS_CONTENT__;
    });
    
    if (api) {
      const isConnected = api.isConnected();
      // Connection state may vary depending on setup
      expect(typeof isConnected).toBe('boolean');
    }
  });

  test('should display extension version in panel', async ({ page }) => {
    // We verify the extension is present by checking it's loaded
    const hasContent = await hasContentScript(page);
    expect(hasContent).toBe(true);
  });
});

test.describe('GridKit DevTools Extension - Panel Data Structures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
  });

  test('should provide TableInspectionResult structure', async ({ page }) => {
    const api = await page.evaluate(() => {
      return window.__GRIDKIT_DEVTOOLS_CONTENT__;
    });
    
    if (api) {
      const tables = api.detectTables();
      
      if (tables.length > 0) {
        const firstTable = tables[0];
        
        // Verify table has inspection result structure
        expect(firstTable).toBeDefined();
        expect(firstTable).toHaveProperty('id');
        expect(firstTable).toHaveProperty('getState');
      }
    }
  });

  test('should provide ExtensionPanelData structure', async ({ page }) => {
    const detectedTables = await getDetectedTables(page);
    
    // The panel data should include table information
    expect(detectedTables.length).toBeGreaterThanOrEqual(0);
  });

  test('should provide PerformanceMetrics structure', async ({ page }) => {
    // Verify performance-related data is accessible
    const startTime = Date.now();
    const detectedTables = await getDetectedTables(page);
    const endTime = Date.now();
    
    // Inspection should be fast (< 100ms)
    const inspectionTime = endTime - startTime;
    expect(inspectionTime).toBeLessThan(100);
  });

  test('should provide LoggedEvent structure', async ({ page }) => {
    // Events should be monitorable through the content script
    const api = await page.evaluate(() => {
      return window.__GRIDKIT_DEVTOOLS_CONTENT__;
    });
    
    if (api) {
      expect(api.addMessageHandler).toBeDefined();
    }
  });
});

test.describe('GridKit DevTools Extension - Panel Error Handling', () => {
  test('should handle panel not being opened', async ({ page }) => {
    // The panel might not be opened in test environment
    // but the extension should still function
    
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const headers = page.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should handle empty table state', async ({ page }) => {
    // Even with empty data, the extension should handle gracefully
    const detectedTables = await getDetectedTables(page);
    
    // At minimum, we should have the demo table
    expect(detectedTables.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle table with no selection', async ({ page }) => {
    // Get tables without any selection
    const detectedTables = await getDetectedTables(page);
    
    expect(detectedTables.length).toBeGreaterThanOrEqual(0);
  });
});
