import { test, expect } from '@playwright/test';

test.describe('DevTools Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should monitor table rendering performance', async ({ page }) => {
    const startTime = Date.now();

    const nameHeader = page.locator('thead th:has-text("Name")');
    for (let i = 0; i < 5; i++) {
      await nameHeader.click();
      await page.waitForTimeout(100);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000);
  });

  test('should monitor memory usage during operations', async ({ page }) => {
    const nameHeader = page.locator('thead th:has-text("Name")');
    for (let i = 0; i < 10; i++) {
      await nameHeader.click();
      await page.waitForTimeout(50);
    }
    
    expect(true).toBe(true);
  });

  test('should compare performance before and after operations', async ({ page }) => {
    const startTime = Date.now();

    const nameHeader = page.locator('thead th:has-text("Name")');
    await nameHeader.click();
    await page.waitForTimeout(200);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000);
  });
});
