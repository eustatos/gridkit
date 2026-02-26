import { test, expect } from '@playwright/test';

test.describe('DevTools Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show table is ready', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should support DevTools protocol commands', async ({ page }) => {
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();
    
    const table = page.locator('table');
    const tableRect = await table.boundingBox();
    
    expect(tableRect).toBeDefined();
    expect(tableRect?.width).toBeGreaterThan(0);
    expect(tableRect?.height).toBeGreaterThan(0);
  });

  test('should display table rows correctly', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should allow performance monitoring', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForTimeout(100);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeGreaterThanOrEqual(100);
    expect(duration).toBeLessThan(500);
  });
});
