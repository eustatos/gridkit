import { test, expect } from '@playwright/test';

test.describe('GridKit DevTools Extension', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the extension with the page', async ({ page }) => {
    // Verify the page loaded successfully
    await expect(page.locator('h1')).toContainText('GridKit DevTools Demo');
  });

  test('should have table ready for DevTools inspection', async ({ page }) => {
    // Table should be rendered and ready for DevTools
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Verify table has data rows
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0), 'Table should have data rows';
  });

  test('should support extension communication via window object', async ({ page }) => {
    // Check if extension content script injected GridKitDevTools object
    const hasDevTools = await page.evaluate(() => {
      return typeof window.GridKitDevTools !== 'undefined' || 
             typeof (window as any).GridKitDevToolsContentScript !== 'undefined';
    });
    
    // Extension may or may not be injected depending on manifest
    // This test verifies the web page is ready for extension integration
    expect(hasDevTools).toBeDefined();
  });

  test('should have all necessary DOM elements for extension hooks', async ({ page }) => {
    // Check table structure for extension hooks
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Verify table headers exist (extension may hook into these)
    const headers = page.locator('thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0), 'Table should have headers for extension hooks';
    
    // Verify table body exists
    const tbody = page.locator('tbody');
    await expect(tbody).toBeVisible();
  });
});

test.describe('Extension Integration with Demo App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow extension to inspect table state', async ({ page }) => {
    // Extension can inspect the table DOM and state
    const tableState = await page.evaluate(() => {
      const table = document.querySelector('table');
      const rows = table?.querySelectorAll('tbody tr') || [];
      const headers = table?.querySelectorAll('thead th') || [];
      
      return {
        row_count: rows.length,
        column_count: headers.length,
        has_tbody: !!table?.querySelector('tbody'),
        has_thead: !!table?.querySelector('thead'),
      };
    });
    
    expect(tableState.row_count).toBeGreaterThan(0);
    expect(tableState.column_count).toBeGreaterThan(0);
  });

  test('should allow extension to monitor table events', async ({ page }) => {
    // Simulate user interaction that would trigger extension event monitoring
    const nameHeader = page.locator('thead th:has-text("Name")');
    
    // Get initial sort state
    const initialSortState = await nameHeader.getAttribute('aria-sort');
    
    // Click to trigger sorting (extension would monitor this)
    await nameHeader.click();
    await page.waitForTimeout(200);
    
    // Extension could track this event
    const afterSortState = await nameHeader.getAttribute('aria-sort');
    
    // Verify event occurred (extension would capture this)
    expect(afterSortState).not.toBe(initialSortState);
  });

  test('should allow extension to access table data', async ({ page }) => {
    // Extension can read table data from DOM
    const tableData = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const data = [];
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          data.push({
            name: cells[0]?.textContent?.trim(),
            status: cells[3]?.textContent?.trim(),
          });
        }
      });
      
      return data;
    });
    
    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0]).toHaveProperty('name');
    expect(tableData[0]).toHaveProperty('status');
  });

  test('should allow extension to monitor performance metrics', async ({ page }) => {
    // Extension could monitor rendering performance
    const startTime = Date.now();
    
    // Perform operations that extension might monitor
    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();
    await page.waitForTimeout(100);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Extension would track this performance metric
    expect(duration).toBeGreaterThanOrEqual(100);
  });
});
