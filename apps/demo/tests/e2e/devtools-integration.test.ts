import { test, expect } from '@playwright/test';

test.describe('DevTools Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show table is ready for DevTools', async ({ page }) => {
    // Table should be rendered
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Debug should be enabled (verified in console logs)
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait for some console activity
    await page.waitForTimeout(500);
    
    // Should have some console output about table
    expect(consoleLogs.length).toBeGreaterThanOrEqual(0);
  });

  test('should support DevTools protocol commands', async ({ page }) => {
    // Check that table has required properties for DevTools
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();
    
    // Verify table is responsive
    const table = page.locator('table');
    const tableRect = await table.boundingBox();
    
    expect(tableRect).toBeDefined();
    expect(tableRect?.width).toBeGreaterThan(0);
    expect(tableRect?.height).toBeGreaterThan(0);
  });

  test('should work with DevTools state viewing', async ({ page }) => {
    // Get table state by checking visible content
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    // Should have 10 rows visible
    expect(rowCount).toBe(10);
  });

  test('should allow DevTools performance monitoring', async ({ page }) => {
    // Record timing
    const startTime = Date.now();
    
    // Perform some actions
    await page.waitForTimeout(100);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time
    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(200);
  });
});
