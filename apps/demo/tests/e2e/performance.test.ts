import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForSelector('table', { timeout: 5000 });
    const loadTime = Date.now() - startTime;
    
    // Table should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should render rows efficiently', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(10);
    
    // Each row should have 6 cells
    const cells = page.locator('tbody td');
    await expect(cells).toHaveCount(60); // 10 rows × 6 columns
  });

  test('should handle rapid interactions', async ({ page }) => {
    const nameHeader = page.locator('thead th:has-text("Name")');
    
    // Click rapidly
    for (let i = 0; i < 5; i++) {
      await nameHeader.click({ delay: 10 });
    }
    
    // Should still be functional
    await expect(nameHeader).toBeVisible();
  });

  test('should maintain performance during theme toggle', async ({ page }) => {
    const darkModeButton = page.locator('button:has-text("Light Mode")');
    
    // Toggle multiple times
    for (let i = 0; i < 5; i++) {
      await darkModeButton.click({ delay: 20 });
    }
    
    // Should still work
    await expect(darkModeButton).toBeVisible();
  });

  test('should have responsive interactions', async ({ page }) => {
    const startTime = Date.now();
    
    // Simulate user interaction
    await page.locator('thead th:has-text("Name")').click();
    await page.waitForTimeout(50);
    await page.locator('thead th:has-text("Salary")').click();
    await page.waitForTimeout(50);
    
    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(500);
  });
});
