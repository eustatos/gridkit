import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have notifications ON by default', async ({ page }) => {
    const notificationButton = page.locator('button:has-text("Notifications: ON")');
    await expect(notificationButton).toBeVisible();
  });

  test('should toggle notifications OFF', async ({ page }) => {
    const notificationButton = page.locator('button:has-text("Notifications: ON")');
    
    await notificationButton.click();
    
    // Should now show OFF
    await expect(page.locator('button:has-text("Notifications: OFF")')).toBeVisible();
  });

  test('should toggle notifications back ON', async ({ page }) => {
    const notificationButton = page.locator('button:has-text("Notifications: ON")');
    
    // Toggle OFF
    await notificationButton.click();
    
    // Toggle back ON
    const offButton = page.locator('button:has-text("Notifications: OFF")');
    await offButton.click();
    
    // Should show ON again
    await expect(notificationButton).toBeVisible();
  });
});
