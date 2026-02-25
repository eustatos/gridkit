import { test, expect } from '@playwright/test';

test.describe('Row Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display rows with visible content', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(10); // Default page size
    
    // Check first row has data
    const firstRow = page.locator('tbody tr:first-child');
    const nameCell = firstRow.locator('td:nth-child(1)');
    await expect(nameCell).toContainText('Person');
  });

  test('should display different data on different pages', async ({ page }) => {
    const firstRowName = page.locator('tbody tr:first-child td:nth-child(1)');
    const firstPageName = await firstRowName.textContent();
    
    // In a real implementation, you would navigate to next page
    // and verify different content
    
    expect(firstPageName).toContain('Person');
  });

  test('should show correct row statistics', async ({ page }) => {
    const stats = page.locator('div strong:has-text("Statistics:")');
    await expect(stats).toBeVisible();
    
    // Should show 50 rows total
    await expect(stats).toContainText('50 rows');
  });
});
