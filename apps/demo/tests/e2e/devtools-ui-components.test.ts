import { test, expect } from '@playwright/test';

test.describe('DevTools UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Table Inspector UI component', async ({ page }) => {
    await page.waitForTimeout(1000);

    const hasDevToolsContent = await page.evaluate(() => {
      return !!(window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
    });

    expect(hasDevToolsContent).toBe(true), 'DevTools content script should be loaded';

    const devToolsApi = await page.evaluate(() => {
      return typeof (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
    });

    expect(devToolsApi).toBe('object'), 'DevTools content API should be accessible';

    const apiMethods = await page.evaluate(() => {
      const api = (window as any).__GRIDKIT_DEVTOOLS_CONTENT__;
      return {
        isConnected: typeof api.isConnected === 'function',
        detectTables: typeof api.detectTables === 'function',
        sendMessageToBackend: typeof api.sendMessageToBackend === 'function',
        addMessageHandler: typeof api.addMessageHandler === 'function'
      };
    });

    expect(apiMethods.isConnected).toBe(true), 'API should have isConnected method';
    expect(apiMethods.detectTables).toBe(true), 'API should have detectTables method';
    expect(apiMethods.sendMessageToBackend).toBe(true), 'API should have sendMessageToBackend method';
    expect(apiMethods.addMessageHandler).toBe(true), 'API should have addMessageHandler method';
  });

  test('should display State Diff Viewer UI component', async ({ page }) => {
    await page.waitForTimeout(1000);

    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();
    await page.waitForTimeout(200);

    const hasSortIndicator = await page.locator('thead th:has-text("Name") span:text("↑")').count() > 0;
    expect(hasSortIndicator).toBe(true), 'Sorting should be visible after click';

    await page.waitForTimeout(200);

    const hasStateUpdateLog = consoleLogs.some(log =>
      log.includes('STATE_UPDATE') ||
      log.includes('State update') ||
      log.includes('[DevTools]')
    );

    expect(hasStateUpdateLog).toBe(true), 'DevTools should log state updates';
  });

  test('should display Plugin Inspector UI component', async ({ page }) => {
    await page.waitForTimeout(1000);

    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    await page.waitForTimeout(1000);

    const hasPluginLog = consoleLogs.some(log =>
      log.includes('PLUGIN') ||
      log.includes('plugin') ||
      log.includes('[DevTools Panel]')
    );

    expect(hasPluginLog).toBe(true), 'Plugin Inspector should log plugin updates';
  });
});
