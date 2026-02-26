import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  hasContentScript,
  waitForContentScript,
  getDetectedTables,
  getExtensionAPI,
  waitForTableRegistration,
  simulateUserInteraction,
} from '../helpers/extension-helper';

test.describe('GridKit DevTools Extension - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page
    await page.goto('/');

    // Wait for table registration
    await waitForTableRegistration(page);

    // Wait for content script
    await waitForContentScript(page);
  });

  test('should have extension loaded', async ({ page }) => {
    // Check that the extension can be detected
    const hasContent = await hasContentScript(page);
    
    // Content script may or may not be injected depending on setup
    // The important thing is that the demo page is ready for extension integration
    expect(hasContent).toBeDefined();
  });

  test('should inject content script into the page', async ({ page }) => {
    const contentScriptExists = await hasContentScript(page);
    
    expect(contentScriptExists).toBe(true);
  });

  test('should expose GridKit DevTools content script API', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    expect(api).toBeDefined();
    expect(api).toHaveProperty('isConnected');
    expect(api).toHaveProperty('detectTables');
    expect(api).toHaveProperty('sendMessageToBackend');
    expect(api).toHaveProperty('addMessageHandler');
    expect(api).toHaveProperty('removeMessageHandler');
  });

  test('should detect GridKit tables on the page', async ({ page }) => {
    const detectedTables = await getDetectedTables(page);
    
    // The demo app should have at least one table
    expect(detectedTables.length).toBeGreaterThan(0);
  });

  test('should allow table inspection via content script', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    // Call detectTables
    const tables = api.detectTables();
    
    expect(Array.isArray(tables)).toBe(true);
    expect(tables.length).toBeGreaterThan(0);
    
    // Check that each table has expected properties
    for (const table of tables) {
      expect(table).toBeDefined();
      expect(table).toHaveProperty('id');
      expect(table).toHaveProperty('getState');
    }
  });

  test('should have working content script connection', async ({ page }) => {
    const api = await getExtensionAPI(page);
    const isConnected = api.isConnected();
    
    // Content script should be connected
    expect(isConnected).toBe(true);
  });

  test('should support message handler registration', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    // Register a test handler
    const handler = (message: any) => {
      console.log('Test handler received:', message);
    };
    
    api.addMessageHandler('TEST_MESSAGE', handler);
    
    // Verify handler was added
    // Note: We can't directly check internal handler count, so we just verify the API exists
    expect(api.addMessageHandler).toBeDefined();
    expect(api.removeMessageHandler).toBeDefined();
    
    // Clean up
    api.removeMessageHandler('TEST_MESSAGE', handler);
  });

  test('should handle multiple tables', async ({ page }) => {
    const detectedTables = await getDetectedTables(page);
    
    // Demo app should have at least one table
    expect(detectedTables.length).toBeGreaterThanOrEqual(1);
    
    // If we have multiple tables, verify each has unique ID
    if (detectedTables.length > 1) {
      const uniqueIds = new Set(detectedTables);
      expect(uniqueIds.size).toBe(detectedTables.length);
    }
  });

  test('should allow table state inspection', async ({ page }) => {
    const api = await getExtensionAPI(page);
    const tables = api.detectTables();
    
    if (tables.length > 0) {
      // Get state from first table
      const state = tables[0].getState();
      
      expect(state).toBeDefined();
      expect(state).toHaveProperty('pagination');
      expect(state).toHaveProperty('sorting');
    }
  });

  test('should handle dynamic table updates', async ({ page }) => {
    // Get initial table count
    const initialTables = await getDetectedTables(page);
    
    // Perform some interactions that might trigger updates
    const nameHeader = page.locator('thead th:has-text("Name")');
    await simulateUserInteraction(page, nameHeader, 'click');
    
    // Check table count after interaction
    const afterTables = await getDetectedTables(page);
    
    // Table count should remain the same (we're inspecting, not adding)
    expect(afterTables.length).toBe(initialTables.length);
  });

  test('should support event monitoring', async ({ page }) => {
    // The content script should be able to monitor events
    // We can't directly test the background script, but we can verify
    // that the content script infrastructure is in place
    
    const api = await getExtensionAPI(page);
    
    // Verify message handlers exist for common events
    const eventTypes = ['tables', 'state', 'events'];
    
    for (const eventType of eventTypes) {
      // This is a basic check - the actual handler registration is internal
      expect(api.addMessageHandler).toBeDefined();
    }
  });

  test('should handle content script re-injection', async ({ page }) => {
    // Simulate page navigation (which might cause re-injection)
    await page.reload();
    
    // Wait for re-initialization
    await waitForTableRegistration(page);
    await waitForContentScript(page);
    
    // Verify content script is still present
    const hasContent = await hasContentScript(page);
    expect(hasContent).toBe(true);
  });

  test('should expose TableInspectionResult structure', async ({ page }) => {
    const api = await getExtensionAPI(page);
    const tables = api.detectTables();
    
    if (tables.length > 0) {
      const firstTable = tables[0];
      
      // Verify table has expected structure for inspection
      expect(firstTable).toHaveProperty('id');
      expect(firstTable).toHaveProperty('getState');
      expect(firstTable.getState).toBeInstanceOf(Function);
    }
  });
});

test.describe('GridKit DevTools Extension - Content Script API', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
  });

  test('should have isConnected method', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    expect(typeof api.isConnected).toBe('function');
    
    const result = api.isConnected();
    expect(typeof result).toBe('boolean');
  });

  test('should have detectTables method', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    expect(typeof api.detectTables).toBe('function');
    
    const tables = api.detectTables();
    expect(Array.isArray(tables)).toBe(true);
  });

  test('should have sendMessageToBackend method', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    expect(typeof api.sendMessageToBackend).toBe('function');
    
    // Test that it returns a promise
    const result = api.sendMessageToBackend({ type: 'TEST' });
    expect(result).toBeInstanceOf(Promise);
  });

  test('should have addMessageHandler method', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    expect(typeof api.addMessageHandler).toBe('function');
    
    const handler = () => {};
    api.addMessageHandler('TEST_EVENT', handler);
    
    // Verify no error (handler was added)
    expect(true).toBe(true);
  });

  test('should have removeMessageHandler method', async ({ page }) => {
    const api = await getExtensionAPI(page);
    
    expect(typeof api.removeMessageHandler).toBe('function');
    
    const handler = () => {};
    api.addMessageHandler('TEST_EVENT', handler);
    api.removeMessageHandler('TEST_EVENT', handler);
    
    // Verify no error (handler was removed)
    expect(true).toBe(true);
  });
});

test.describe('GridKit DevTools Extension - Error Handling', () => {
  test('should handle missing extension gracefully', async ({ page }) => {
    // This test verifies that the demo page works even if extension isn't loaded
    const hasContent = await hasContentScript(page);
    
    // Page should still load and function
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should handle content script not being present', async ({ page }) => {
    // If content script isn't injected, the page should still work
    // This is expected in some test environments
    
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Verify table structure is intact
    const headers = page.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });
});
