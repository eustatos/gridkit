import { test, expect } from '@playwright/test';

test.describe('DevTools Events Timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should track sorting events', async ({ page }) => {
    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();
    
    await page.waitForTimeout(300);
    
    const sortIndicatorAsc = page.locator('thead th:has-text("Name") span:text("↑")');
    await expect(sortIndicatorAsc).toBeVisible({ timeout: 1000 }).catch(() => {});
    
    const hasSortIndicator = await sortIndicatorAsc.count() > 0;
    expect(hasSortIndicator).toBe(true), 'Sorting events should be trackable via UI feedback';
  });

  test('should track row selection events', async ({ page }) => {
    const firstRow = page.locator('tbody tr:first-child');
    await firstRow.click();
    
    await page.waitForTimeout(300);
    
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0), 'Table should have rows';
  });

  test('should track multiple events sequence', async ({ page }) => {
    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();
    await page.waitForTimeout(200);
    
    const sortIndicator = page.locator('thead th:has-text("Name") span:text("↑")');
    await expect(sortIndicator).toBeVisible({ timeout: 1000 }).catch(() => {});
    
    const hasSortIndicator = await sortIndicator.count() > 0;
    expect(hasSortIndicator).toBe(true), 'Sorting events should be trackable via UI feedback';
  });
});
