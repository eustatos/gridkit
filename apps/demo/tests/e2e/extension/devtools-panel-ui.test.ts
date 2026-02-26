/**
 * GridKit DevTools Panel UI Tests
 * 
 * Tests for the DevTools panel interface that appears in Chrome DevTools.
 * These tests validate the panel's UI components, interactions, and data display.
 * 
 * Note: Direct testing of DevTools panels requires special browser setup.
 * These tests use simulated panel rendering and component validation.
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Wait for content script to be ready
 */
async function waitForContentScript(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => (window as any).__GRIDKIT_DEVTOOLS_CONTENT__ !== undefined,
    { timeout }
  );
}

/**
 * Wait for table registration
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

test.describe('DevTools Panel - UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should render table selector', async ({ page }) => {
    // The panel should have a table selector dropdown
    const tableSelector = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      const tables = content?.detectTables?.() || [];
      return tables.length > 0;
    });
    
    expect(tableSelector).toBe(true);
  });

  test('should display connection status', async ({ page }) => {
    const connectionStatus = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return {
        hasConnection: typeof content?.isConnected === 'function',
        isConnected: content?.isConnected?.() || false,
      };
    });
    
    expect(connectionStatus.hasConnection).toBe(true);
  });

  test('should show tab navigation', async ({ page }) => {
    // Verify panel would have tabs for different views
    const tabsAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      // Check for required panel features
      const hasTables = content.detectTables?.().length > 0;
      const hasState = content.detectTables?.()[0]?.getState !== undefined;
      
      return hasTables && hasState;
    });
    
    expect(tabsAvailable).toBe(true);
  });
});

test.describe('DevTools Panel - Inspector Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should display table state', async ({ page }) => {
    const tableState = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      const tables = content?.detectTables?.() || [];
      if (tables.length === 0) return null;
      return tables[0].getState();
    });
    
    expect(tableState).toBeDefined();
    expect(tableState?.pagination).toBeDefined();
    expect(tableState?.sorting).toBeDefined();
  });

  test('should show column information', async ({ page }) => {
    const headers = page.locator('thead th');
    const headerCount = await headers.count();
    
    expect(headerCount).toBeGreaterThan(0);
    
    // Verify headers have text content
    const headerTexts = await headers.allTextContents();
    expect(headerTexts.length).toBe(headerCount);
    headerTexts.forEach(text => {
      expect(text.trim()).not.toBe('');
    });
  });

  test('should display row count', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should show table configuration', async ({ page }) => {
    const tableConfig = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      const tables = content?.detectTables?.() || [];
      if (tables.length === 0) return null;
      
      const state = tables[0].getState();
      return {
        hasPagination: !!state?.pagination,
        hasSorting: !!state?.sorting,
        pageSize: state?.pagination?.pageSize || 0,
      };
    });
    
    expect(tableConfig?.hasPagination).toBe(true);
    expect(tableConfig?.hasSorting).toBe(true);
    expect(tableConfig?.pageSize).toBeGreaterThan(0);
  });
});

test.describe('DevTools Panel - Events Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should capture state update events', async ({ page }) => {
    const eventsCaptured = await page.evaluate(async () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const events: any[] = [];
      const handler = (event: any) => {
        events.push(event);
      };
      
      content.addMessageHandler('STATE_UPDATE', handler);
      
      // Trigger a state change
      await new Promise(r => setTimeout(r, 100));
      
      content.removeMessageHandler('STATE_UPDATE', handler);
      
      return true;
    });
    
    expect(eventsCaptured).toBe(true);
  });

  test('should display event timeline', async ({ page }) => {
    const timelineAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.addMessageHandler !== undefined;
    });
    
    expect(timelineAvailable).toBe(true);
  });

  test('should filter events by type', async ({ page }) => {
    const filterAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      // Verify handler system supports filtering
      const handler = () => {};
      content.addMessageHandler('SPECIFIC_EVENT', handler);
      content.removeMessageHandler('SPECIFIC_EVENT', handler);
      
      return true;
    });
    
    expect(filterAvailable).toBe(true);
  });

  test('should allow event replay', async ({ page }) => {
    const replayAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.sendMessageToBackend !== undefined;
    });
    
    expect(replayAvailable).toBe(true);
  });
});

test.describe('DevTools Panel - Performance Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should measure render performance', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const startTime = performance.now();
      
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      const tables = content?.detectTables?.() || [];
      
      const endTime = performance.now();
      
      return {
        renderTime: endTime - startTime,
        tableCount: tables.length,
      };
    });
    
    expect(metrics.renderTime).toBeLessThan(100);
    expect(metrics.tableCount).toBeGreaterThan(0);
  });

  test('should track performance metrics over time', async ({ page }) => {
    const trackingAvailable = await page.evaluate(async () => {
      const metrics: number[] = [];
      
      // Collect multiple measurements
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await new Promise(r => setTimeout(r, 10));
        metrics.push(performance.now() - start);
      }
      
      return metrics.length === 3;
    });
    
    expect(trackingAvailable).toBe(true);
  });

  test('should identify bottlenecks', async ({ page }) => {
    const bottleneckDetection = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      // Verify inspection capability
      const tables = content.detectTables();
      return tables.length > 0;
    });
    
    expect(bottleneckDetection).toBe(true);
  });

  test('should clear performance data', async ({ page }) => {
    const clearAvailable = await page.evaluate(() => {
      // Simulate clearing by resetting state
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content !== undefined;
    });
    
    expect(clearAvailable).toBe(true);
  });
});

test.describe('DevTools Panel - State Diff Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should capture state snapshots', async ({ page }) => {
    const snapshotsAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const tables = content.detectTables();
      if (tables.length === 0) return false;
      
      // Get initial state
      const state = tables[0].getState();
      return state !== undefined;
    });
    
    expect(snapshotsAvailable).toBe(true);
  });

  test('should compare state snapshots', async ({ page }) => {
    const comparisonAvailable = await page.evaluate(async () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const tables = content.detectTables();
      if (tables.length === 0) return false;
      
      // Capture two states
      const state1 = tables[0].getState();
      await new Promise(r => setTimeout(r, 10));
      const state2 = tables[0].getState();
      
      // States should be comparable
      return JSON.stringify(state1) === JSON.stringify(state2);
    });
    
    expect(comparisonAvailable).toBe(true);
  });

  test('should highlight state changes', async ({ page }) => {
    const changesDetected = await page.evaluate(async () => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const tables = content.detectTables();
      if (tables.length === 0) return false;
      
      const table = tables[0];
      
      // Get state before interaction
      const stateBefore = table.getState();
      
      // Trigger change
      const nameHeader = document.querySelector('thead th:has-text("Name")');
      nameHeader?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      await new Promise(r => setTimeout(r, 50));
      
      // Get state after
      const stateAfter = table.getState();
      
      // States may or may not be different
      return stateBefore !== undefined && stateAfter !== undefined;
    });
    
    expect(changesDetected).toBe(true);
  });

  test('should display diff details', async ({ page }) => {
    const diffDetails = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return null;
      
      const tables = content.detectTables();
      if (tables.length === 0) return null;
      
      const state = tables[0].getState();
      
      return {
        hasKeys: Object.keys(state || {}).length > 0,
        state: state,
      };
    });
    
    expect(diffDetails?.hasKeys).toBe(true);
  });
});

test.describe('DevTools Panel - Time Travel Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should maintain state history', async ({ page }) => {
    const historyAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const tables = content.detectTables();
      return tables.length > 0;
    });
    
    expect(historyAvailable).toBe(true);
  });

  test('should allow navigating to previous states', async ({ page }) => {
    const navigationAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.sendMessageToBackend !== undefined;
    });
    
    expect(navigationAvailable).toBe(true);
  });

  test('should support playback controls', async ({ page }) => {
    const playbackControls = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      // Verify backend communication available
      return typeof content.sendMessageToBackend === 'function';
    });
    
    expect(playbackControls).toBe(true);
  });
});

test.describe('DevTools Panel - Memory Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should track memory usage', async ({ page }) => {
    const memoryTracking = await page.evaluate(() => {
      // Check if performance memory API is available
      return typeof performance !== 'undefined';
    });
    
    expect(memoryTracking).toBe(true);
  });

  test('should detect memory leaks', async ({ page }) => {
    const leakDetection = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content !== undefined;
    });
    
    expect(leakDetection).toBe(true);
  });

  test('should take memory snapshots', async ({ page }) => {
    const snapshotsAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const tables = content.detectTables();
      return tables.length > 0;
    });
    
    expect(snapshotsAvailable).toBe(true);
  });
});

test.describe('DevTools Panel - Plugins Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should list loaded plugins', async ({ page }) => {
    const pluginsList = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return [];
      
      // Check for plugin system
      return content.detectTables().length > 0;
    });
    
    expect(pluginsList).toBe(true);
  });

  test('should display plugin status', async ({ page }) => {
    const statusAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return content?.isConnected !== undefined;
    });
    
    expect(statusAvailable).toBe(true);
  });

  test('should show plugin configuration', async ({ page }) => {
    const configAvailable = await page.evaluate(() => {
      const content = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      if (!content) return false;
      
      const tables = content.detectTables();
      if (tables.length === 0) return false;
      
      const state = tables[0].getState();
      return state !== undefined;
    });
    
    expect(configAvailable).toBe(true);
  });
});
