import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have light mode by default', async ({ page }) => {
    const demoApp = page.locator('.demo-app');
    await expect(demoApp).toBeVisible();
    
    // Default background should be light
    const contentBox = page.locator('div[style*="background-color: rgb(255, 255, 255)"]');
    await expect(contentBox.first()).toBeVisible();
  });

  test('should toggle to dark mode', async ({ page }) => {
    const darkModeButton = page.locator('button:has-text("Light Mode")');
    await expect(darkModeButton).toBeVisible();
    
    await darkModeButton.click();
    
    // Should now show "Dark Mode" button
    await expect(page.locator('button:has-text("Dark Mode")')).toBeVisible();
    
    // Content should be dark
    const contentBox = page.locator('div[style*="background-color: rgb(30, 30, 30)"]');
    await expect(contentBox.first()).toBeVisible();
  });

  test('should toggle back to light mode', async ({ page }) => {
    const darkModeButton = page.locator('button:has-text("Light Mode")');
    
    // Toggle to dark
    await darkModeButton.click();
    
    // Toggle back to light
    const lightModeButton = page.locator('button:has-text("Dark Mode")');
    await lightModeButton.click();
    
    // Should show "Light Mode" again
    await expect(darkModeButton).toBeVisible();
  });
});
